import { BigNumber } from "../../../utils/types/BigNumber";
import { BN } from "bn.js";
import {
  rejectUnknownFields,
  decodeFixedLengthHex,
  assertUint32,
} from "../../../utils/validation";
import { checkPayloadEnd } from "../../../pbaas/identityRegistrationSerialization";
import varuint from "../../../utils/varuint";
import { decodeDestination } from "../../../utils/address";
import { I_ADDR_VERSION } from "../../../constants/vdxf";
import { SerializableEntityBase } from "../../../utils/types/SerializableEntityBase";
import {
  AuthorizationReader,
  STORAGE_BINDING_BYTE_LENGTH,
} from "./AuthorizationSerialization";
import {
  CompactAddressObject,
  CompactIAddressObject,
  CompactAddressObjectJson,
} from "../CompactAddressObject";

export enum AppAuthorizationOutcome {
  SUCCESS = 0,
  REJECTED = 1,
  CANCELLED = 2,
  FAILED = 3,
  EXPIRED = 4,
}

export interface AppAuthorizationStorageBinding {
  storageIdentity: CompactAddressObject;
  revocationIdentity: CompactAddressObject;
  recoveryIdentity: CompactAddressObject;
}

export interface AppAuthorizationResponseDetailsInterface {
  version?: BigNumber;
  flags?: BigNumber;
  outcome: AppAuthorizationOutcome;
  requestSigningSystemID: string;
  delegateID: string;
  grantID?: string;
  storageBindings?: AppAuthorizationStorageBinding[];
  grantTransaction?: { txid: string; vout: number };
}

export interface AppAuthorizationResponseDetailsJson
  extends Omit<
    AppAuthorizationResponseDetailsInterface,
    "storageBindings" | "version" | "flags"
  > {
  version: number;
  flags: number;
  storageBindings?: {
    storageIdentity: CompactAddressObjectJson;
    revocationIdentity: CompactAddressObjectJson;
    recoveryIdentity: CompactAddressObjectJson;
  }[];
}

/** Signed completion metadata; it does not replace fresh authorization-state checks. */
export class AppAuthorizationResponseDetails extends SerializableEntityBase {
  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_LAST = new BN(1);
  static VERSION_CURRENT = new BN(1);

  static FLAGS_NONE = new BN(0);
  static FLAG_CONTAINS_GRANT_ID = new BN(1);
  static FLAG_CONTAINS_STORAGE_BINDINGS = new BN(2);
  static FLAG_CONTAINS_GRANT_TRANSACTION = new BN(4);
  static FLAGS_SUPPORTED =
    AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID.or(
      AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS
    ).or(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION);

  version = AppAuthorizationResponseDetails.VERSION_CURRENT.clone();
  flags = AppAuthorizationResponseDetails.FLAGS_NONE.clone();
  outcome: AppAuthorizationOutcome;
  requestSigningSystemID: string;
  delegateID: string;
  grantID?: string;
  storageBindings?: AppAuthorizationStorageBinding[];
  grantTransaction?: { txid: string; vout: number };

  constructor(data?: AppAuthorizationResponseDetailsInterface) {
    super();

    if (data) {
      rejectUnknownFields(data, [
        "version",
        "flags",
        "outcome",
        "requestSigningSystemID",
        "delegateID",
        "grantID",
        "storageBindings",
        "grantTransaction",
      ]);
      Object.assign(this, data);
      if (
        (data.version !== undefined && !BN.isBN(data.version)) ||
        (data.flags !== undefined && !BN.isBN(data.flags))
      ) {
        throw new Error("Expected BN version and flags");
      }

      this.version = (
        data.version ?? AppAuthorizationResponseDetails.VERSION_CURRENT
      ).clone();
      this.flags = (
        data.flags ?? AppAuthorizationResponseDetails.FLAGS_NONE
      ).clone();

      if (data.flags === undefined) {
        if (data.grantID !== undefined) {
          this.flags = this.flags.or(
            AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID
          );
        }

        if (data.storageBindings !== undefined) {
          this.flags = this.flags.or(
            AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS
          );
        }

        if (data.grantTransaction !== undefined) {
          this.flags = this.flags.or(
            AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION
          );
        }
      }
      this.validate();
      if (this.grantID !== undefined) {
        this.grantID = this.grantID.toLowerCase();
      }
    }
  }

  /** Pass the original request requirement when validating a successful response. */
  validate(requiresSharedStorage = false): void {
    if (
      !BN.isBN(this.version) ||
      this.version.lt(AppAuthorizationResponseDetails.VERSION_FIRST) ||
      this.version.gt(AppAuthorizationResponseDetails.VERSION_LAST) ||
      !BN.isBN(this.flags) ||
      this.flags.lt(AppAuthorizationResponseDetails.FLAGS_NONE) ||
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAGS_SUPPORTED)
        .eq(this.flags) ||
      !Number.isInteger(this.outcome) ||
      this.outcome < AppAuthorizationOutcome.SUCCESS ||
      this.outcome > AppAuthorizationOutcome.EXPIRED
    ) {
      throw new Error("Unsupported response version, flags or outcome");
    }

    decodeDestination(this.requestSigningSystemID, I_ADDR_VERSION);
    decodeDestination(this.delegateID, I_ADDR_VERSION);

    if (
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID)
        .isZero() !==
        (this.grantID !== undefined) ||
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS)
        .isZero() !==
        (this.storageBindings !== undefined) ||
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION)
        .isZero() !==
        (this.grantTransaction !== undefined)
    ) {
      throw new Error("Inconsistent response presence flags");
    }

    // Only completed success may claim a grant or its selected storage arrangement.
    if (
      this.outcome !== AppAuthorizationOutcome.SUCCESS &&
      !this.flags.eq(AppAuthorizationResponseDetails.FLAGS_NONE)
    ) {
      throw new Error("Non-success response contains active grant data");
    }

    if (
      this.outcome === AppAuthorizationOutcome.SUCCESS &&
      (this.grantID === undefined ||
        (requiresSharedStorage && !this.storageBindings?.length))
    ) {
      throw new Error("Incomplete success response");
    }

    if (this.grantID !== undefined) {
      decodeFixedLengthHex(this.grantID, 32);
    }

    if (this.grantTransaction !== undefined) {
      rejectUnknownFields(this.grantTransaction, ["txid", "vout"]);
      decodeFixedLengthHex(this.grantTransaction.txid, 32);
      assertUint32(this.grantTransaction.vout);
    }

    if (this.storageBindings !== undefined) {
      if (
        !Array.isArray(this.storageBindings) ||
        !this.storageBindings.length
      ) {
        throw new Error("Invalid storage binding count");
      }

      const storageIDs = new Set<string>();

      for (const binding of this.storageBindings) {
        rejectUnknownFields(binding, [
          "storageIdentity",
          "revocationIdentity",
          "recoveryIdentity",
        ]);

        // Selected storage and its authorities use the original request-signing system.
        for (const identityAddress of [
          binding.storageIdentity,
          binding.revocationIdentity,
          binding.recoveryIdentity,
        ]) {
          CompactIAddressObject.validateCompactIdentityAddress(identityAddress);
        }

        const id = binding.storageIdentity.address;

        if (storageIDs.has(id)) {
          throw new Error("Duplicate storage binding");
        }

        storageIDs.add(id);
      }

      for (const binding of this.storageBindings) {
        if (
          storageIDs.has(binding.revocationIdentity.address) ||
          storageIDs.has(binding.recoveryIdentity.address)
        ) {
          throw new Error("Shared storage cannot be a revocation or recovery authority");
        }
      }
    }
  }

  isValid(): boolean {
    try {
      this.toBuffer();

      return true;
    } catch {
      return false;
    }
  }

  toBuffer(): Buffer {
    this.validate();

    const parts = [
      varuint.encode(this.version.toNumber(), undefined, 0).buffer,
      varuint.encode(this.flags.toNumber(), undefined, 0).buffer,
      Buffer.from([this.outcome]),
      CompactIAddressObject.fromAddress(this.requestSigningSystemID).toBuffer(),
      CompactIAddressObject.fromAddress(this.delegateID).toBuffer(),
    ];

    if (this.grantID !== undefined) {
      parts.push(decodeFixedLengthHex(this.grantID, 32));
    }

    if (this.storageBindings !== undefined) {
      parts.push(
        varuint.encode(this.storageBindings.length, undefined, 0).buffer
      );

      for (const b of this.storageBindings) {
        parts.push(
          b.storageIdentity.toBuffer(),
          b.revocationIdentity.toBuffer(),
          b.recoveryIdentity.toBuffer()
        );
      }
    }

    if (this.grantTransaction !== undefined) {
      // RPC transaction hashes are displayed opposite to their standard wire order.
      const index = Buffer.alloc(4);
      index.writeUInt32LE(this.grantTransaction.vout);
      parts.push(
        Buffer.from(
          decodeFixedLengthHex(this.grantTransaction.txid, 32)
        ).reverse(),
        index
      );
    }

    return Buffer.concat(parts);
  }

  getByteLength(): number {
    return this.toBuffer().length;
  }

  fromBuffer(buffer: Buffer, offset = 0, rootSystemName?: string): number {
    const reader = new AuthorizationReader(buffer, offset);

    this.version = new BN(reader.readCompactSize());

    if (
      this.version.lt(AppAuthorizationResponseDetails.VERSION_FIRST) ||
      this.version.gt(AppAuthorizationResponseDetails.VERSION_LAST)
    ) {
      throw new Error("Unsupported response payload");
    }

    this.flags = new BN(reader.readCompactSize());

    if (
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAGS_SUPPORTED)
        .eq(this.flags)
    ) {
      throw new Error("Unknown response flags");
    }

    this.outcome = reader.readUInt8();
    this.requestSigningSystemID = reader.address();
    this.delegateID = reader.address();
    this.grantID = !this.flags
      .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_ID)
      .isZero()
      ? reader.readSlice(32).toString("hex")
      : undefined;
    this.storageBindings = undefined;

    if (
      !this.flags
        .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_STORAGE_BINDINGS)
        .isZero()
    ) {
      // A binding is exactly three canonical compact I-addresses: S, R, then C.
      const count = reader.count(STORAGE_BINDING_BYTE_LENGTH);
      this.storageBindings = [];

      for (let i = 0; i < count; i++) {
        this.storageBindings.push({
          storageIdentity: CompactIAddressObject.fromAddress(
            reader.address(),
            rootSystemName
          ),
          revocationIdentity: CompactIAddressObject.fromAddress(
            reader.address(),
            rootSystemName
          ),
          recoveryIdentity: CompactIAddressObject.fromAddress(
            reader.address(),
            rootSystemName
          ),
        });
      }
    }

    this.grantTransaction = !this.flags
      .and(AppAuthorizationResponseDetails.FLAG_CONTAINS_GRANT_TRANSACTION)
      .isZero()
      ? {
          txid: Buffer.from(reader.readSlice(32)).reverse().toString("hex"),
          vout: reader.readUInt32(),
        }
      : undefined;
    checkPayloadEnd(reader.offset, offset, buffer.length - offset);
    this.validate();

    return reader.offset;
  }

  toJson(): AppAuthorizationResponseDetailsJson {
    this.validate();

    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      outcome: this.outcome,
      requestSigningSystemID: this.requestSigningSystemID,
      delegateID: this.delegateID,
      grantID: this.grantID,
      grantTransaction: this.grantTransaction && { ...this.grantTransaction },
      storageBindings: this.storageBindings?.map((b) => ({
        storageIdentity: b.storageIdentity.toJson(),
        revocationIdentity: b.revocationIdentity.toJson(),
        recoveryIdentity: b.recoveryIdentity.toJson(),
      })),
    };
  }

  static fromJson(
    json: AppAuthorizationResponseDetailsJson
  ): AppAuthorizationResponseDetails {
    rejectUnknownFields(json, [
      "version",
      "flags",
      "outcome",
      "requestSigningSystemID",
      "delegateID",
      "grantID",
      "storageBindings",
      "grantTransaction",
    ]);

    if (
      !Number.isSafeInteger(json.version) ||
      !Number.isSafeInteger(json.flags)
    ) {
      throw new Error("Expected integer JSON version and flags");
    }

    return new AppAuthorizationResponseDetails({
      ...json,
      version: new BN(json.version),
      flags: new BN(json.flags),
      storageBindings: json.storageBindings?.map((b) => {
        rejectUnknownFields(b, [
          "storageIdentity",
          "revocationIdentity",
          "recoveryIdentity",
        ]);

        return {
          storageIdentity: CompactIAddressObject.compactIdentityAddressFromJson(
            b.storageIdentity
          ),
          revocationIdentity:
            CompactIAddressObject.compactIdentityAddressFromJson(
              b.revocationIdentity
            ),
          recoveryIdentity:
            CompactIAddressObject.compactIdentityAddressFromJson(
              b.recoveryIdentity
            ),
        };
      }),
    });
  }
}
