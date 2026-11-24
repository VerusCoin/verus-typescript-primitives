import {
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION,
  IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION_STORAGE_BINDING,
} from "../vdxf/keys";
import { BigNumber } from "../utils/types/BigNumber";
import {
  rejectUnknownFields,
  decodeFixedLengthHex,
  assertUint32,
  normalizeFixedLengthHex,
} from "../utils/validation";
import { encodeUInt32LE } from "../utils/serialization";
import varuint from "../utils/varuint";
import { decodeDestination } from "../utils/address";
import { I_ADDR_VERSION } from "../constants/vdxf";
import {
  DEFAULT_VERUS_CHAINID,
  TESTNET_VERUS_CHAINID,
} from "../constants/pbaas";
import { BN } from "bn.js";
import { hashData } from "../utils/hash";
import { Credential } from "./Credential";

const STORAGE_BINDING_MANIFEST_TYPE = 1;

/** An exact confirmed identity revision used as the approval policy baseline. */
export interface AuthorizationIdentityRevision {
  txid: string;
  vout: number;
}

/** Persistent delegation metadata; the containing user identity supplies the user binding. */
export interface AuthorizationCredentialData {
  version: BigNumber;
  flags: BigNumber;
  grantID: string;
  /** Omitted on the configured VRSC/VRSCTEST root system. */
  signingSystemID?: string;
  delegateRevision: AuthorizationIdentityRevision;
  delegatorRevision: AuthorizationIdentityRevision;
  storageManifestHash?: string;
}

/** One storage identity associated with a grant; control is checked from current state. */
export interface AuthorizationStorageBindingData {
  version: BigNumber;
  grantID: string;
  relationshipIndex: number;
  /** Inherits the associated grant system, or the network root without a grant. */
  storageSystemID?: string;
  storageID: string;
}

function version(value: BigNumber, first: BigNumber, last: BigNumber): number {
  if (!BN.isBN(value) || value.lt(first) || value.gt(last)) {
    throw new Error("Unsupported credential version");
  }

  return value.toNumber();
}

/** Both the delegate and delegator retain an immutable approval-time baseline. */
function revisionToPayload(
  revision: AuthorizationIdentityRevision
): [string, number] {
  rejectUnknownFields(revision, ["txid", "vout"]);

  return [
    normalizeFixedLengthHex(revision.txid, 32),
    assertUint32(revision.vout),
  ];
}

function revisionFromPayload(payload: any): AuthorizationIdentityRevision {
  if (!Array.isArray(payload) || payload.length !== 2) {
    throw new Error("Invalid approval identity revision");
  }

  return { txid: payload[0], vout: payload[1] };
}

/** Decode only from a validated generic record; source U/system remains the caller's binding. */
function credentialPayload(record: Credential, expectedKey: string): object {
  decodeDestination(expectedKey, I_ADDR_VERSION);

  if (
    record.credentialKey !== expectedKey ||
    !record.flags.eq(record.calcFlags()) ||
    !record.isValid()
  ) {
    throw new Error("Invalid authorization credential envelope");
  }

  rejectUnknownFields(record.scopes, []);

  return record.credential;
}

/**
 * Typed records use their registered VDXF credential keys by default.
 * Explicit keys remain supported for callers using a separate namespace.
 */
abstract class AuthorizationRecord<T> {
  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_LAST = new BN(1);
  static VERSION_CURRENT = new BN(1);

  constructor(public data: T, private readonly credentialKey: string) {}

  abstract toPayload(): object;

  toCredential(
    credentialKey: string = this.credentialKey,
    label = ""
  ): Credential {
    decodeDestination(credentialKey, I_ADDR_VERSION);

    // Revalidate mutable data before emitting the compact, Core-compatible payload.
    const payload = this.toPayload();

    const record = new Credential({
      version: new BN(Credential.VERSION_CURRENT),
      credentialKey,
      credential: payload,
      scopes: {},
      label,
    });

    // Credential already enforces Core's text bounds during construction.
    if (!record.isValid()) {
      throw new Error("Invalid authorization credential");
    }

    return record;
  }
}

/** Compact approval metadata with distinct delegate and delegator revision baselines. */
export class AuthorizationCredential extends AuthorizationRecord<AuthorizationCredentialData> {
  static CREDENTIAL_KEY = IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION.vdxfid;

  static FLAGS_NONE = new BN(0);
  static FLAG_CONTAINS_PERMISSIONS = new BN(1);
  static FLAG_CONTAINS_STORAGE_BINDINGS = new BN(2);

  constructor(data: AuthorizationCredentialData) {
    super(data, AuthorizationCredential.CREDENTIAL_KEY);
    this.toPayload();
  }

  /** Resolve an omitted system only from the caller's configured network root. */
  getSystemID(rootSystemID?: string): string {
    if (
      this.data.signingSystemID === undefined &&
      rootSystemID !== DEFAULT_VERUS_CHAINID &&
      rootSystemID !== TESTNET_VERUS_CHAINID
    ) {
      throw new Error("An explicit VRSC or VRSCTEST root system is required");
    }

    const systemID =
      this.data.signingSystemID === undefined
        ? rootSystemID
        : this.data.signingSystemID;
    decodeDestination(systemID, I_ADDR_VERSION);

    return systemID;
  }

  containsPermissions(): boolean {
    return !this.data.flags
      .and(AuthorizationCredential.FLAG_CONTAINS_PERMISSIONS)
      .isZero();
  }

  toPayload(): object {
    const d = this.data;
    rejectUnknownFields(d, [
      "version",
      "flags",
      "grantID",
      "signingSystemID",
      "delegateRevision",
      "delegatorRevision",
      "storageManifestHash",
    ]);
    if (d.signingSystemID !== undefined) {
      decodeDestination(d.signingSystemID, I_ADDR_VERSION);
    }

    if (
      !BN.isBN(d.flags) ||
      (!d.flags.eq(AuthorizationCredential.FLAGS_NONE) &&
        !d.flags.eq(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)) ||
      !d.flags
        .and(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)
        .isZero() !==
        (d.storageManifestHash !== undefined)
    ) {
      throw new Error("Unsupported or inconsistent authorization flags");
    }

    return {
      v: version(
        d.version,
        AuthorizationCredential.VERSION_FIRST,
        AuthorizationCredential.VERSION_LAST
      ),
      f: d.flags.toNumber(),
      g: normalizeFixedLengthHex(d.grantID, 32),
      ...(d.signingSystemID === undefined ? {} : { s: d.signingSystemID }),
      e: revisionToPayload(d.delegateRevision),
      o: revisionToPayload(d.delegatorRevision),
      ...(d.storageManifestHash === undefined
        ? {}
        : { b: normalizeFixedLengthHex(d.storageManifestHash, 32) }),
    };
  }

  static fromCredential(
    record: Credential,
    expectedKey: string = AuthorizationCredential.CREDENTIAL_KEY
  ): AuthorizationCredential {
    return this.fromPayload(credentialPayload(record, expectedKey));
  }

  static fromPayload(payload: any): AuthorizationCredential {
    rejectUnknownFields(payload, ["v", "f", "g", "s", "e", "o", "b"]);

    return new AuthorizationCredential({
      version: new BN(assertUint32(payload.v)),
      flags: new BN(assertUint32(payload.f)),
      grantID: payload.g,
      signingSystemID: payload.s,
      delegateRevision: revisionFromPayload(payload.e),
      delegatorRevision: revisionFromPayload(payload.o),
      storageManifestHash: payload.b,
    });
  }
}

/** One independently manageable storage identity, bound to its authorization grant. */
export class AuthorizationStorageBindingCredential extends AuthorizationRecord<AuthorizationStorageBindingData> {
  static CREDENTIAL_KEY =
    IDENTITY_CREDENTIAL_APPLICATION_AUTHORIZATION_STORAGE_BINDING.vdxfid;

  constructor(data: AuthorizationStorageBindingData) {
    super(data, AuthorizationStorageBindingCredential.CREDENTIAL_KEY);
    this.toPayload();
  }

  /** The caller supplies the resolved grant system, or the network root for an orphan. */
  getSystemID(defaultSystemID?: string): string {
    const systemID =
      this.data.storageSystemID === undefined
        ? defaultSystemID
        : this.data.storageSystemID;

    if (systemID === undefined) {
      throw new Error("A storage system or inherited system is required");
    }

    decodeDestination(systemID, I_ADDR_VERSION);

    return systemID;
  }

  get recordID(): string {
    return `${STORAGE_BINDING_MANIFEST_TYPE}:${this.data.relationshipIndex}`;
  }

  toPayload(): object {
    const d = this.data;
    rejectUnknownFields(d, [
      "version",
      "grantID",
      "relationshipIndex",
      "storageSystemID",
      "storageID",
    ]);

    if (d.storageSystemID !== undefined) {
      decodeDestination(d.storageSystemID, I_ADDR_VERSION);
    }
    decodeDestination(d.storageID, I_ADDR_VERSION);

    return {
      v: version(
        d.version,
        AuthorizationStorageBindingCredential.VERSION_FIRST,
        AuthorizationStorageBindingCredential.VERSION_LAST
      ),
      g: normalizeFixedLengthHex(d.grantID, 32),
      i: assertUint32(d.relationshipIndex),
      ...(d.storageSystemID === undefined ? {} : { s: d.storageSystemID }),
      d: d.storageID,
    };
  }

  static fromCredential(
    record: Credential,
    expectedKey: string = AuthorizationStorageBindingCredential.CREDENTIAL_KEY
  ): AuthorizationStorageBindingCredential {
    return this.fromPayload(credentialPayload(record, expectedKey));
  }

  static fromPayload(p: any): AuthorizationStorageBindingCredential {
    rejectUnknownFields(p, ["v", "g", "i", "s", "d"]);

    return new AuthorizationStorageBindingCredential({
      version: new BN(assertUint32(p.v)),
      grantID: p.g,
      relationshipIndex: p.i,
      storageSystemID: p.s,
      storageID: p.d,
    });
  }
}

export type AuthorizationStorageRecord = AuthorizationStorageBindingCredential;

/** Validate the complete binding set, collapse identical copies, and commit canonical bytes. */
export function deriveAppAuthorizationStorageManifest(
  records: AuthorizationStorageRecord[],
  defaultSystemID?: string
): string {
  const unique = new Map<string, AuthorizationStorageBindingCredential>();
  let grant: string;

  // Copies must agree on their effective systems, regardless of whether s was omitted.
  // Put s first in both comparisons to keep JSON property order deterministic.
  for (const record of records) {
    if (!(record instanceof AuthorizationStorageBindingCredential)) {
      throw new Error("Unknown storage record");
    }

    const payload = {
      s: record.getSystemID(defaultSystemID),
      ...record.toPayload(),
    };
    const currentGrant = normalizeFixedLengthHex(record.data.grantID, 32);

    if (grant !== undefined && grant !== currentGrant) {
      throw new Error("Mixed grant records");
    }

    grant = currentGrant;

    const previous = unique.get(record.recordID);

    if (
      previous &&
      JSON.stringify({
        s: previous.getSystemID(defaultSystemID),
        ...previous.toPayload(),
      }) !== JSON.stringify(payload)
    ) {
      throw new Error("Conflicting storage record");
    }

    unique.set(record.recordID, record);
  }

  // Sort indices numerically; lexical sorting would place relationship 10 before 2.
  const bindings = [...unique.values()].sort(
    (a, b) => a.data.relationshipIndex - b.data.relationshipIndex
  );

  if (!bindings.length) {
    throw new Error("Empty storage manifest");
  }

  const storageIDs = new Set<string>();

  bindings.forEach((binding, index) => {
    const { data } = binding;

    if (data.relationshipIndex !== index) {
      throw new Error("Noncontiguous relationships");
    }

    const identity = `${binding.getSystemID(defaultSystemID)}:${
      data.storageID
    }`;
    if (storageIDs.has(identity)) {
      throw new Error("Duplicate storage identity");
    }
    storageIDs.add(identity);
  });

  // The discriminator identifies the binding format within this commitment.
  // Commit decoded address IDs and little-endian indices, excluding JSON/encryption.
  const encoded = bindings.map((binding) => {
    const { data: d } = binding;

    return Buffer.concat([
      Buffer.from([STORAGE_BINDING_MANIFEST_TYPE]),
      encodeUInt32LE(d.relationshipIndex),
      decodeFixedLengthHex(d.grantID, 32),
      decodeDestination(binding.getSystemID(defaultSystemID), I_ADDR_VERSION),
      decodeDestination(d.storageID, I_ADDR_VERSION),
    ]);
  });

  // Length-prefix each record to preserve unambiguous framing across implementations.
  return hashData(
    Buffer.concat([
      Buffer.from("VerusAppAuthorizationStorage/v1\0"),
      varuint.encode(encoded.length, undefined, 0).buffer,
      ...encoded.flatMap((bytes) => [
        varuint.encode(bytes.length, undefined, 0).buffer,
        bytes,
      ]),
    ])
  ).toString("hex");
}

/** Verify the committed set against this grant, including its grant ID. */
export function verifyAppAuthorizationStorageManifest(
  grant: AuthorizationCredential,
  records: AuthorizationStorageRecord[],
  rootSystemID?: string
): boolean {
  try {
    grant.toPayload();

    if (
      grant.data.flags
        .and(AuthorizationCredential.FLAG_CONTAINS_STORAGE_BINDINGS)
        .isZero()
    ) {
      return records.length === 0;
    }

    if (
      records.some(
        (record) =>
          normalizeFixedLengthHex(record.data.grantID, 32) !==
          normalizeFixedLengthHex(grant.data.grantID, 32)
      )
    ) {
      return false;
    }

    return (
      deriveAppAuthorizationStorageManifest(
        records,
        grant.getSystemID(rootSystemID)
      ) === normalizeFixedLengthHex(grant.data.storageManifestHash, 32)
    );
  } catch {
    return false;
  }
}
