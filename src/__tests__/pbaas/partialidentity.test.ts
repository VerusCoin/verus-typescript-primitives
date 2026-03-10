import { BN } from "bn.js";
import { ContentMultiMap, FqnContentMultiMap } from "../../pbaas/ContentMultiMap";
import { Identity, IDENTITY_VERSION_PBAAS } from "../../pbaas/Identity";
import { KeyID } from "../../pbaas/KeyID";
import { IdentityID } from "../../pbaas/IdentityID";
import { PartialIdentity, SaplingPaymentAddress } from "../../index";

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