import { BN } from "bn.js";
import { ContentMultiMap, FqnContentMultiMap } from "../../pbaas/ContentMultiMap";
import { Identity, IDENTITY_VERSION_PBAAS } from "../../pbaas/Identity";
import { KeyID } from "../../pbaas/KeyID";
import { IdentityID } from "../../pbaas/IdentityID";
import { PartialIdentity, SaplingPaymentAddress } from "../../index";
import { FqnVdxfUniValue, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { ContentMultiMapRemove } from "../../pbaas/ContentMultiMapRemove";
import * as VDXF_Data from "../../vdxf/vdxfdatakeys";

import { ID_PARENT_VDXF_KEY } from "../../vdxf/keys";

const FQN_DATA_KEY      = ID_PARENT_VDXF_KEY.qualifiedname.name;  // "vrsc::identity.parent"
const FQN_DATA_KEY_IADDR = ID_PARENT_VDXF_KEY.vdxfid;             // "i6aJSTKfNiDZ4rPxj1pPh4Y8xDmh1GqYm9"
const FQN_DATA_KEY_VALUE = ID_PARENT_VDXF_KEY.hash160result;      // 20-byte hex content
const IADDR_A = "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j";

describe('Serializes and deserializes identity properly', () => {
  test('deserialize/serialize VerusID with zaddr, post pbaas, with multimap and contentmap', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const identities = [{
      flags: new BN("0"),
      version: IDENTITY_VERSION_PBAAS,
      min_sigs: new BN(1),
      primary_addresses: [
        KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"),
        KeyID.fromAddress("RP4Qct9197i5vrS11qHVtdyRRoAHVNJS47")
      ],
      parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      name: "TestID",
      content_map: contentmap,
      content_multimap: ContentMultiMap.fromJson({
        iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j: [
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
        ],
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '6868686868686868686868686868686868686868',
        i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7: [
          '6868686868686868686868686868686868686868',
          '6868686868686868686868686868686868686868',
          '6868686868686868686868686868686868686868'
        ],
        i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz: { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
      }),
      recovery_authority: IdentityID.fromAddress("i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz"),
      revocation_authority: IdentityID.fromAddress("i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7"),
      unlock_after: new BN("123456", 10),
      private_addresses: [SaplingPaymentAddress.fromAddressString("zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa")]
    }]

    const toRemove = [
      'min_sigs',
      'flags',
      'content_map',
      'private_addresses', 
      'unlock_after', 
      'revocation_authority', 
      'recovery_authority',
      'content_multimap',
      'system_id',
      'parent',
      'primary_addresses'
    ]

    for (const key of toRemove) {
      const lastIdParams = identities[identities.length - 1];

      let newIdParams = { ...lastIdParams };
      delete (newIdParams as any)[key];

      identities.push(newIdParams)
    }

    for (const idParams of identities) {
      const identity = new PartialIdentity(idParams);
      const identityFromBuf = new PartialIdentity();

      identityFromBuf.fromBuffer(identity.toBuffer());

      expect(identityFromBuf.toBuffer().toString('hex')).toBe(identity.toBuffer().toString('hex'));
    }
  })
});

describe('PartialIdentity FQN key handling', () => {
  const baseParams = {
    version: IDENTITY_VERSION_PBAAS,
    min_sigs: new BN(1),
    primary_addresses: [KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH")],
    parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    name: "TestID",
    recovery_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    revocation_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    unlock_after: new BN(0),
  };

  test('PartialIdentity constructor auto-converts ContentMultiMap to FqnContentMultiMap', () => {
    const plainCmm = ContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] });
    const identity = new PartialIdentity({ ...baseParams, content_multimap: plainCmm });

    expect(identity.content_multimap).toBeInstanceOf(FqnContentMultiMap);
  });

  test('PartialIdentity constructor preserves FqnContentMultiMap as-is', () => {
    const fqnCmm = FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });
    const identity = new PartialIdentity({ ...baseParams, content_multimap: fqnCmm });

    expect(identity.content_multimap).toBeInstanceOf(FqnContentMultiMap);
  });

  test('PartialIdentity clearContentMultiMap uses FqnContentMultiMap', () => {
    const identity = new PartialIdentity(baseParams);
    identity.clearContentMultiMap();

    expect(identity.content_multimap).toBeInstanceOf(FqnContentMultiMap);
  });

  test('FQN key in PartialIdentity content_multimap survives binary round-trip', () => {
    const fqnCmm = FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });
    const identity = new PartialIdentity({ ...baseParams, content_multimap: fqnCmm });

    const restored = new PartialIdentity();
    restored.fromBuffer(identity.toBuffer());

    const entries = [...restored.content_multimap.kvContent.entries()];
    expect(entries).toHaveLength(1);

    const [key] = entries[0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_DATA_KEY);
    expect(key.toIAddress()).toBe(FQN_DATA_KEY_IADDR);
  });

  test('FQN key in PartialIdentity content_multimap survives JSON round-trip', () => {
    const fqnCmm = FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });
    const identity = new PartialIdentity({ ...baseParams, content_multimap: fqnCmm });

    const json = identity.toJson();
    const restored = PartialIdentity.fromJson(json);

    const entries = [...restored.content_multimap.kvContent.entries()];
    expect(entries).toHaveLength(1);

    const [key] = entries[0];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_DATA_KEY);
  });

  test('Identity (daemon-compatible) with FQN key loses TYPE_FQN after binary round-trip', () => {
    // Plain Identity uses ContentMultiMap (20-byte daemon format), so FQN is
    // resolved to its iaddress on serialization and cannot be recovered.
    const plainCmm = ContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });
    const identity = new Identity({ ...baseParams, content_multimap: plainCmm });

    const restored = new Identity();
    restored.fromBuffer(identity.toBuffer());

    const entries = [...restored.content_multimap.kvContent.entries()];
    expect(entries).toHaveLength(1);

    const [key] = entries[0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(FQN_DATA_KEY_IADDR);
  });

  test('PartialIdentity and Identity produce different binary for same FQN multimap', () => {
    const fqnCmm = FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });
    const plainCmm = ContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] });

    const partial = new PartialIdentity({ ...baseParams, content_multimap: fqnCmm });
    const full = new Identity({ ...baseParams, content_multimap: plainCmm });

    // The buffers differ because PartialIdentity has a contains bitmask prefix
    // AND uses FqnContentMultiMap which serializes the full CompactIAddressObject.
    expect(partial.toBuffer().toString('hex')).not.toBe(full.toBuffer().toString('hex'));
  });

  test('TYPE_I_ADDRESS keys in PartialIdentity also survive binary round-trip', () => {
    const cmm = ContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] });
    const identity = new PartialIdentity({ ...baseParams, content_multimap: cmm });

    const restored = new PartialIdentity();
    restored.fromBuffer(identity.toBuffer());

    const entries = [...restored.content_multimap.kvContent.entries()];
    expect(entries).toHaveLength(1);

    const [key] = entries[0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });
});

describe('PartialIdentity.toContentMultiMap()', () => {
  const CMM_REMOVE_VDXFID = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;
  const CMM_REMOVE_FQN    = VDXF_Data.ContentMultiMapRemoveKeyName;
  const cmmPayload = { version: 1, action: 3, entrykey: "iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH" };

  const baseParams = {
    version: IDENTITY_VERSION_PBAAS,
    min_sigs: new BN(1),
    primary_addresses: [KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH")],
    parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    name: "TestID",
    recovery_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    revocation_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
  };

  test('returns ContentMultiMap, not FqnContentMultiMap', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] }),
    });

    const result = identity.toContentMultiMap();

    expect(result).toBeInstanceOf(ContentMultiMap);
    expect(result).not.toBeInstanceOf(FqnContentMultiMap);
  });

  test('FQN outer key is resolved to iaddress in result', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] }),
    });

    const result = identity.toContentMultiMap();
    const entries = [...result.kvContent.entries()];

    expect(entries).toHaveLength(1);
    const [key] = entries[0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(FQN_DATA_KEY_IADDR);
  });

  test('iaddress outer key remains as iaddress in result', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] }),
    });

    const result = identity.toContentMultiMap();
    const entries = [...result.kvContent.entries()];

    expect(entries).toHaveLength(1);
    const [key] = entries[0];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });

  test('inner FqnVdxfUniValue with FQN key is converted to VdxfUniValue with iaddress key', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });

    const result = identity.toContentMultiMap();
    const [, values] = [...result.kvContent.entries()][0];

    expect(values).toHaveLength(1);
    const uni = values[0];
    expect(uni).toBeInstanceOf(VdxfUniValue);
    expect(uni).not.toBeInstanceOf(FqnVdxfUniValue);
    expect((uni as VdxfUniValue).values[0][CMM_REMOVE_VDXFID]).toBeInstanceOf(ContentMultiMapRemove);
    expect((uni as VdxfUniValue).values[0][CMM_REMOVE_FQN]).toBeUndefined();
  });

  test('inner FqnVdxfUniValue with iaddress key is converted to VdxfUniValue with same iaddress key', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [{ [CMM_REMOVE_VDXFID]: cmmPayload }],
      }),
    });

    const result = identity.toContentMultiMap();
    const [, values] = [...result.kvContent.entries()][0];

    expect(values).toHaveLength(1);
    const uni = values[0];
    expect(uni).toBeInstanceOf(VdxfUniValue);
    expect(uni).not.toBeInstanceOf(FqnVdxfUniValue);
    expect((uni as VdxfUniValue).values[0][CMM_REMOVE_VDXFID]).toBeInstanceOf(ContentMultiMapRemove);
  });

  test('raw Buffer values pass through unchanged', () => {
    const rawHex = FQN_DATA_KEY_VALUE;
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [IADDR_A]: [rawHex] }),
    });

    const result = identity.toContentMultiMap();
    const [, values] = [...result.kvContent.entries()][0];

    expect(values).toHaveLength(1);
    expect(Buffer.isBuffer(values[0])).toBe(true);
    expect((values[0] as Buffer).toString('hex')).toBe(rawHex);
  });

  test('result buffer matches a ContentMultiMap built directly with iaddress keys', () => {
    // Build via PartialIdentity with FQN outer key and FQN inner key
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [FQN_DATA_KEY]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });
    const converted = identity.toContentMultiMap();

    // Build the equivalent directly with iaddress keys
    const direct = ContentMultiMap.fromJson({
      [FQN_DATA_KEY_IADDR]: [{ [CMM_REMOVE_VDXFID]: cmmPayload }],
    });

    expect(converted.toBuffer().toString('hex')).toBe(direct.toBuffer().toString('hex'));
  });

  test('multiple outer keys and multiple inner values all convert correctly', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [FQN_DATA_KEY]: [
          { [CMM_REMOVE_FQN]: cmmPayload },
          { [CMM_REMOVE_VDXFID]: cmmPayload },
        ],
        [IADDR_A]: [FQN_DATA_KEY_VALUE],
      }),
    });

    const result = identity.toContentMultiMap();
    expect(result).not.toBeInstanceOf(FqnContentMultiMap);

    const entries = [...result.kvContent.entries()];
    expect(entries).toHaveLength(2);

    // All outer keys must be TYPE_I_ADDRESS
    for (const [key] of entries) {
      expect(key.isIaddress()).toBe(true);
    }

    // Find the entry that was originally FQN_DATA_KEY
    const fqnEntry = entries.find(([k]) => k.toIAddress() === FQN_DATA_KEY_IADDR);
    expect(fqnEntry).toBeDefined();
    const [, fqnValues] = fqnEntry!;
    expect(fqnValues).toHaveLength(2);

    for (const v of fqnValues) {
      expect(v).toBeInstanceOf(VdxfUniValue);
      expect(v).not.toBeInstanceOf(FqnVdxfUniValue);
      expect((v as VdxfUniValue).values[0][CMM_REMOVE_VDXFID]).toBeInstanceOf(ContentMultiMapRemove);
      expect((v as VdxfUniValue).values[0][CMM_REMOVE_FQN]).toBeUndefined();
    }
  });
});

describe('PartialIdentity.getContentMultiMapKeys()', () => {
  const CMM_REMOVE_VDXFID = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;
  const CMM_REMOVE_FQN    = VDXF_Data.ContentMultiMapRemoveKeyName;
  const cmmPayload = { version: 1, action: 3, entrykey: "iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH" };

  const baseParams = {
    version: IDENTITY_VERSION_PBAAS,
    min_sigs: new BN(1),
    primary_addresses: [KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH")],
    parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    name: "TestID",
    recovery_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
    revocation_authority: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
  };

  test('returns empty array when content_multimap is empty', () => {
    const identity = new PartialIdentity(baseParams);
    expect(identity.getContentMultiMapKeys()).toEqual([]);
  });

  test('returns top-level iaddress key as iaddress string', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toEqual([IADDR_A]);
  });

  test('returns top-level FQN key as its FQN string', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [FQN_DATA_KEY]: [FQN_DATA_KEY_VALUE] }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toEqual([FQN_DATA_KEY]);
  });

  test('returns inner iaddress key from FqnVdxfUniValue', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [{ [CMM_REMOVE_VDXFID]: cmmPayload }],
      }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toEqual([IADDR_A, CMM_REMOVE_VDXFID]);
  });

  test('returns inner FQN key from FqnVdxfUniValue as FQN string', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toEqual([IADDR_A, CMM_REMOVE_FQN]);
  });

  test('skips empty-string inner keys (keyless Buffer values)', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({ [IADDR_A]: [FQN_DATA_KEY_VALUE] }),
    });

    const keys = identity.getContentMultiMapKeys();
    // Only the top-level key; the raw hex buffer has no inner key
    expect(keys).toEqual([IADDR_A]);
  });

  test('Buffer values at top level do not contribute inner keys', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [FQN_DATA_KEY_VALUE, { [CMM_REMOVE_VDXFID]: cmmPayload }],
      }),
    });

    const keys = identity.getContentMultiMapKeys();
    // IADDR_A (outer) + CMM_REMOVE_VDXFID (inner from FqnVdxfUniValue only)
    expect(keys).toEqual([IADDR_A, CMM_REMOVE_VDXFID]);
  });

  test('multiple inner keys from multiple FqnVdxfUniValue entries are all returned', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [
          { [CMM_REMOVE_VDXFID]: cmmPayload },
          { [CMM_REMOVE_FQN]: cmmPayload },
        ],
      }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toEqual([IADDR_A, CMM_REMOVE_VDXFID, CMM_REMOVE_FQN]);
  });

  test('multiple top-level keys produce one entry per key plus their nested keys', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [IADDR_A]: [{ [CMM_REMOVE_VDXFID]: cmmPayload }],
        [FQN_DATA_KEY]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });

    const keys = identity.getContentMultiMapKeys();
    expect(keys).toContain(IADDR_A);
    expect(keys).toContain(FQN_DATA_KEY);
    expect(keys).toContain(CMM_REMOVE_VDXFID);
    expect(keys).toContain(CMM_REMOVE_FQN);
    expect(keys).toHaveLength(4);
  });

  test('top-level keys survive a binary round-trip (without parseVdxfObjects)', () => {
    // Without parseVdxfObjects, inner values are raw Buffers — only outer keys are available.
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [FQN_DATA_KEY]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });

    const restored = new PartialIdentity();
    restored.fromBuffer(identity.toBuffer());

    const keys = restored.getContentMultiMapKeys();
    expect(keys).toEqual([FQN_DATA_KEY]);
  });

  test('all keys survive a binary round-trip when parseVdxfObjects is true', () => {
    const identity = new PartialIdentity({
      ...baseParams,
      content_multimap: FqnContentMultiMap.fromJson({
        [FQN_DATA_KEY]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
      }),
    });

    const restored = new PartialIdentity();
    restored.fromBuffer(identity.toBuffer(), 0, true);

    const keys = restored.getContentMultiMapKeys();
    expect(keys).toEqual([FQN_DATA_KEY, CMM_REMOVE_FQN]);
  });
});

describe('PartialIdentity.withResolvedContentMultiMap()', () => {
  const CMM_REMOVE_VDXFID = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;
  const CMM_REMOVE_FQN    = VDXF_Data.ContentMultiMapRemoveKeyName;
  const cmmPayload = { version: 1, action: 3, entrykey: "iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH" };

  const baseJson = {
    version: 3,
    minimumsignatures: 1,
    primaryaddresses: ["RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"],
    parent: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
    systemid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
    name: "TestID",
    revocationauthority: "i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7",
    recoveryauthority: "i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz",
  };

  const jsonWithIaddr = {
    ...baseJson,
    contentmultimap: {
      [CMM_REMOVE_VDXFID]: [{ [CMM_REMOVE_VDXFID]: cmmPayload }],
    },
  };

  const jsonWithFqn = {
    ...baseJson,
    contentmultimap: {
      [CMM_REMOVE_FQN]: [{ [CMM_REMOVE_FQN]: cmmPayload }],
    },
  };

  test('iaddress and FQN JSON produce different buffers before resolution', () => {
    const idIaddr = PartialIdentity.fromJson(jsonWithIaddr);
    const idFqn   = PartialIdentity.fromJson(jsonWithFqn);

    expect(idIaddr.toBuffer().toString('hex')).not.toBe(idFqn.toBuffer().toString('hex'));
  });

  test('withResolvedContentMultiMap produces identical buffers regardless of original key format', () => {
    const idIaddr = PartialIdentity.fromJson(jsonWithIaddr);
    const idFqn   = PartialIdentity.fromJson(jsonWithFqn);

    const resolvedIaddr = idIaddr.withResolvedContentMultiMap();
    const resolvedFqn   = idFqn.withResolvedContentMultiMap();

    expect(resolvedIaddr.toBuffer().toString('hex')).toBe(resolvedFqn.toBuffer().toString('hex'));
  });

  test('withResolvedContentMultiMap result is still a PartialIdentity', () => {
    const id = PartialIdentity.fromJson(jsonWithFqn);
    const resolved = id.withResolvedContentMultiMap();

    expect(resolved).toBeInstanceOf(PartialIdentity);
  });

  test('withResolvedContentMultiMap result has a plain ContentMultiMap, not FqnContentMultiMap', () => {
    const id = PartialIdentity.fromJson(jsonWithFqn);
    const resolved = id.withResolvedContentMultiMap();

    const { FqnContentMultiMap } = require('../../pbaas/ContentMultiMap');
    expect(resolved.content_multimap).not.toBeInstanceOf(FqnContentMultiMap);
    expect(resolved.content_multimap).toBeInstanceOf(ContentMultiMap);
  });
});