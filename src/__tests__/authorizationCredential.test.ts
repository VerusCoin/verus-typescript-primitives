import { BN } from "bn.js";
import {
  AuthorizationCredential,
  AuthorizationStorageBindingCredential as Binding,
  deriveAppAuthorizationStorageManifest as manifest,
  verifyAppAuthorizationStorageManifest,
} from "../pbaas/AuthorizationCredential";
import { Credential } from "../pbaas/Credential";
import { toBase58Check } from "../utils/address";
import { I_ADDR_VERSION } from "../constants/vdxf";
import {
  DEFAULT_VERUS_CHAINID,
  TESTNET_VERUS_CHAINID,
} from "../constants/pbaas";

const address = toBase58Check(Buffer.alloc(20, 1), I_ADDR_VERSION);
const authorization = () =>
  new AuthorizationCredential({
    version: new BN(1),
    flags: new BN(2),
    grantID: "aa".repeat(32),
    signingSystemID: address,
    delegateRevision: { txid: "bb".repeat(32), vout: 0 },
    delegatorRevision: { txid: "dd".repeat(32), vout: 1 },
    storageManifestHash: "cc".repeat(32),
  });
const binding = (relationshipIndex = 0) =>
  new Binding({
    version: new BN(1),
    grantID: "aa".repeat(32),
    relationshipIndex,
    storageSystemID: address,
    storageID: toBase58Check(
      Buffer.alloc(20, relationshipIndex + 1),
      I_ADDR_VERSION
    ),
  });

// Fixed digest vectors were computed independently with Python hashlib.

test("maximum-width payloads match the shared accounting and generic binary codec", () => {
  const grant = authorization();

  for (const revision of [
    grant.data.delegateRevision,
    grant.data.delegatorRevision,
  ]) {
    revision.vout = 0xffffffff;
  }
  const header = binding();
  header.data.relationshipIndex = 0xffffffff;

  for (const [record, size] of [
    [grant, 364],
    [header, 175],
  ] as const) {
    expect(Buffer.byteLength(JSON.stringify(record.toPayload()))).toBe(size);
    expect(size).toBeLessThanOrEqual(Credential.MAX_JSON_STRING_LENGTH);

    const credential = record.toCredential(address);
    const parsed = new Credential();
    parsed.fromBuffer(credential.toBuffer());
    expect(parsed.credential).toEqual(record.toPayload());
    expect(parsed.scopes).toEqual({});
    expect(() => record.toCredential(address, "é".repeat(257))).toThrow();
  }

  delete grant.data.signingSystemID;
  delete header.data.storageSystemID;
  expect(Buffer.byteLength(JSON.stringify(grant.toPayload()))).toBe(323);
  expect(Buffer.byteLength(JSON.stringify(header.toPayload()))).toBe(134);

  expect(
    AuthorizationCredential.fromPayload(grant.toPayload()).toPayload()
  ).toEqual(grant.toPayload());
  expect(Binding.fromPayload(header.toPayload()).toPayload()).toEqual(
    header.toPayload()
  );
});

test("approval preserves distinct delegate and delegator revision baselines", () => {
  const grant = authorization();
  const payload = grant.toPayload() as any;

  expect(payload.e).toEqual(["bb".repeat(32), 0]);
  expect(payload.o).toEqual(["dd".repeat(32), 1]);
  expect(Object.keys(payload)).toEqual(["v", "f", "g", "s", "e", "o", "b"]);
  expect(
    AuthorizationCredential.fromCredential(grant.toCredential()).data
  ).toEqual(grant.data);
});

test.each(
  [
    undefined,
    null,
    [],
    ["dd".repeat(32)],
    ["dd".repeat(32), 1, 0],
    ["dd".repeat(32), -1],
    ["dd".repeat(31), 1],
    ["gg".repeat(32), 1],
    [1, 0],
    ["dd".repeat(32), 1.5],
    ["dd".repeat(32), 0x100000000],
  ].map((revision) => ({ revision }))
)("approval requires valid revision references: $revision", ({ revision }) => {
  for (const field of ["e", "o"]) {
    expect(() =>
      AuthorizationCredential.fromPayload({
        ...authorization().toPayload(),
        [field]: revision,
      })
    ).toThrow();
  }
});

test("mutable revision references are revalidated before serialization", () => {
  for (const field of ["delegateRevision", "delegatorRevision"] as const) {
    for (const extra of ["lookupHeight", "unused"]) {
      const grant = authorization();
      (grant.data[field] as any)[extra] = 1;
      expect(() => grant.toCredential()).toThrow();
    }

    const missing = authorization();
    delete (missing.data as any)[field];
    expect(() => missing.toCredential()).toThrow();
  }
});

test("manifest ignores identical duplicate copies and input order", () => {
  expect(manifest([binding(), binding()])).toBe(
    "7f0914f471babc615cdb9ce1393f5ddb183e3fd86c46f0fa34474bb88aea7fe6"
  );
  expect(manifest([binding(1), binding(), binding(1)])).toBe(
    manifest([binding(), binding(1)])
  );
  expect(manifest([binding(), binding(1)])).toBe(
    "94575f5155017e3f27bf215e91bbca335455af0660b1d655b9e5e324edf5e083"
  );
});

test("manifest rejects empty, conflicting, mixed, noncontiguous and duplicate storage bindings", () => {
  expect(() => manifest([])).toThrow("Empty");
  const changed = binding();
  changed.data.storageID = binding(1).data.storageID;
  expect(() => manifest([binding(), changed])).toThrow("Conflicting");
  const otherGrant = binding(1);
  otherGrant.data.grantID = "dd".repeat(32);
  expect(() => manifest([binding(), otherGrant])).toThrow("Mixed");
  expect(() => manifest([binding(1)])).toThrow("Noncontiguous");
  expect(() => manifest([binding(), binding(2)])).toThrow("Noncontiguous");
  const repeatedStorage = binding(1);
  repeatedStorage.data.storageID = binding().data.storageID;
  expect(() => manifest([binding(), repeatedStorage])).toThrow("Duplicate");
});

test("the grant commitment rejects missing trailing, changed and extra bindings", () => {
  const grant = authorization();
  const bindings = [binding(), binding(1)];
  grant.data.storageManifestHash = manifest(bindings);
  expect(verifyAppAuthorizationStorageManifest(grant, bindings)).toBe(true);
  expect(verifyAppAuthorizationStorageManifest(grant, [binding()])).toBe(false);
  expect(
    verifyAppAuthorizationStorageManifest(grant, [...bindings, binding(2)])
  ).toBe(false);
  bindings[1].data.storageID = binding(2).data.storageID;
  expect(verifyAppAuthorizationStorageManifest(grant, bindings)).toBe(false);
});

test("grants without storage accept no companion bindings", () => {
  const grant = authorization();
  grant.data.flags = AuthorizationCredential.FLAGS_NONE;
  delete grant.data.storageManifestHash;
  expect(verifyAppAuthorizationStorageManifest(grant, [])).toBe(true);
  expect(verifyAppAuthorizationStorageManifest(grant, [binding()])).toBe(false);
});

test("unsupported fields and invalid indices are rejected before serialization", () => {
  expect(() =>
    Binding.fromPayload({ ...binding().toPayload(), permissions: {} })
  ).toThrow();
  expect(() =>
    AuthorizationCredential.fromPayload({
      ...authorization().toPayload(),
      permissions: {},
    })
  ).toThrow();
  const invalid = binding();
  invalid.data.relationshipIndex = 0x100000000;
  expect(() => invalid.toCredential(address)).toThrow();
});

test("storage bindings persist only the grant relationship and storage identity", () => {
  expect(Object.keys(binding().toPayload())).toEqual(["v", "g", "i", "s", "d"]);
});

test.each([
  ["u", "userKeyID", "bb".repeat(20)],
  ["r", "revocationID", address],
  ["c", "recoveryID", address],
])(
  "storage bindings reject extra authority field %s",
  (compact, field, value) => {
    expect(() =>
      Binding.fromPayload({ ...binding().toPayload(), [compact]: value })
    ).toThrow();
    const record = binding();
    (record.data as any)[field] = value;
    expect(() => record.toCredential()).toThrow();
  }
);

test("generic credential decoding enforces key and empty scopes", () => {
  const generic = binding().toCredential(address);
  expect(Binding.fromCredential(generic, address).toPayload()).toEqual(
    binding().toPayload()
  );
  generic.scopes = { wildcard: true };
  expect(() => Binding.fromCredential(generic, address)).toThrow();
});

test("credential records enforce their supported version ranges", () => {
  for (const record of [authorization(), binding()]) {
    for (const version of [0, 2, -1, 1.5, NaN]) {
      record.data.version = Number.isInteger(version)
        ? new BN(version)
        : (version as any);
      expect(() => record.toPayload()).toThrow();
    }
  }

  expect(Binding.VERSION_CURRENT.eq(Binding.VERSION_LAST)).toBe(true);
});

test.each([DEFAULT_VERUS_CHAINID, TESTNET_VERUS_CHAINID])(
  "an omitted grant system resolves to the configured network root %s",
  (rootSystemID) => {
    const grant = authorization();
    delete grant.data.signingSystemID;

    const parsed = AuthorizationCredential.fromCredential(grant.toCredential());
    expect(parsed.getSystemID(rootSystemID)).toBe(rootSystemID);
    expect(parsed.data.signingSystemID).toBeUndefined();
    expect(parsed.toPayload()).not.toHaveProperty("s");
  }
);

test("an explicit grant system is self-contained and overrides network context", () => {
  const grant = authorization();

  expect(grant.getSystemID()).toBe(address);
  expect(grant.getSystemID(TESTNET_VERUS_CHAINID)).toBe(address);
  expect(grant.toPayload()).toHaveProperty("s", address);
});

test.each([undefined, "", address, "invalid"])(
  "an omitted grant system rejects a missing or non-root fallback: %s",
  (rootSystemID) => {
    const grant = authorization();
    delete grant.data.signingSystemID;

    expect(() => grant.getSystemID(rootSystemID)).toThrow("root system");
  }
);

test("an omitted binding system inherits its grant system or its orphan network root", () => {
  const record = binding();
  delete record.data.storageSystemID;

  const parsed = Binding.fromCredential(record.toCredential());
  expect(parsed.getSystemID(address)).toBe(address);
  expect(parsed.getSystemID(TESTNET_VERUS_CHAINID)).toBe(TESTNET_VERUS_CHAINID);
  expect(parsed.getSystemID(DEFAULT_VERUS_CHAINID)).toBe(DEFAULT_VERUS_CHAINID);
  expect(() => parsed.getSystemID()).toThrow("inherited system");
  expect(parsed.data.storageSystemID).toBeUndefined();
  expect(parsed.toPayload()).not.toHaveProperty("s");

  expect(binding().getSystemID()).toBe(address);
  expect(binding().getSystemID(TESTNET_VERUS_CHAINID)).toBe(address);
});

test("decoded grant IDs match across hex casing when a binding inherits a nonroot system", () => {
  const grantRecord = authorization().toCredential();
  const inherited = binding();
  delete inherited.data.storageSystemID;
  const bindingRecord = inherited.toCredential();

  grantRecord.credential = { ...grantRecord.credential, g: "AA".repeat(32) };
  bindingRecord.credential = {
    ...bindingRecord.credential,
    g: "aA".repeat(32),
  };
  const grant = AuthorizationCredential.fromCredential(grantRecord);
  const decodedBinding = Binding.fromCredential(bindingRecord);

  expect(grant.data.grantID).toBe("aa".repeat(32));
  const systems = new Map([[grant.data.grantID, grant.getSystemID()]]);
  const system = systems.get(decodedBinding.data.grantID) ?? DEFAULT_VERUS_CHAINID;
  expect(decodedBinding.getSystemID(system)).toBe(address);
});

test("canonical constructor data stays shared and mixed-case inputs can be frozen", () => {
  const data = authorization().data;
  expect(new AuthorizationCredential(data).data).toBe(data);
  const mixedCase = Object.freeze({ ...data, grantID: "AA".repeat(32) });
  expect(new AuthorizationCredential(mixedCase).data.grantID).toBe(data.grantID);
});

test.each([null, "", false, "invalid"])(
  "optional systems still reject invalid explicit values: %s",
  (systemID) => {
    expect(() =>
      AuthorizationCredential.fromPayload({
        ...authorization().toPayload(),
        s: systemID,
      })
    ).toThrow();
    expect(() =>
      Binding.fromPayload({ ...binding().toPayload(), s: systemID })
    ).toThrow();
  }
);

test("manifests commit effective systems and collapse equivalent explicit and inherited copies", () => {
  const inherited = binding();
  delete inherited.data.storageSystemID;
  const explicit = binding();
  const expected =
    "7f0914f471babc615cdb9ce1393f5ddb183e3fd86c46f0fa34474bb88aea7fe6";

  expect(manifest([inherited], address)).toBe(expected);
  expect(manifest([explicit, inherited], address)).toBe(expected);
  expect(manifest([inherited, explicit], address)).toBe(expected);
  expect(manifest([inherited], TESTNET_VERUS_CHAINID)).not.toBe(expected);
  expect(manifest([explicit], TESTNET_VERUS_CHAINID)).toBe(expected);
  expect(() => manifest([inherited])).toThrow("inherited system");
  expect(() => manifest([explicit, inherited], TESTNET_VERUS_CHAINID)).toThrow(
    "Conflicting"
  );

  const repeatedStorage = binding(1);
  repeatedStorage.data.storageID = inherited.data.storageID;
  expect(() => manifest([inherited, repeatedStorage], address)).toThrow(
    "Duplicate"
  );
});

test("grant verification resolves its root before resolving inherited storage systems", () => {
  const grant = authorization();
  delete grant.data.signingSystemID;
  const record = binding();
  delete record.data.storageSystemID;
  grant.data.storageManifestHash = manifest([record], TESTNET_VERUS_CHAINID);

  expect(
    verifyAppAuthorizationStorageManifest(
      grant,
      [record],
      TESTNET_VERUS_CHAINID
    )
  ).toBe(true);
  expect(
    verifyAppAuthorizationStorageManifest(
      grant,
      [record],
      DEFAULT_VERUS_CHAINID
    )
  ).toBe(false);
  expect(verifyAppAuthorizationStorageManifest(grant, [record], address)).toBe(
    false
  );
  expect(verifyAppAuthorizationStorageManifest(grant, [record])).toBe(false);
});

test("materializing an inherited non-root system preserves the grant commitment", () => {
  const grant = authorization();
  const record = binding();
  delete record.data.storageSystemID;
  grant.data.storageManifestHash = manifest([record], grant.getSystemID());

  expect(verifyAppAuthorizationStorageManifest(grant, [record])).toBe(true);

  // Removing the last grant must preserve the inherited chain before the binding is orphaned.
  record.data.storageSystemID = record.getSystemID(grant.getSystemID());
  expect(manifest([record])).toBe(grant.data.storageManifestHash);
  expect(verifyAppAuthorizationStorageManifest(grant, [record])).toBe(true);
  expect(record.getSystemID(TESTNET_VERUS_CHAINID)).toBe(address);
});
