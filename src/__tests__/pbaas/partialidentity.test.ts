import { BN } from "bn.js";
import { ContentMultiMap } from "../../pbaas/ContentMultiMap";
import { IDENTITY_FLAG_TOKENIZED_CONTROL, IDENTITY_VERSION_PBAAS, Identity, IDENTITY_FLAG_ACTIVECURRENCY, VerusIDInitData } from "../../pbaas/Identity";
import { KeyID } from "../../pbaas/KeyID";
import { IdentityID } from "../../pbaas/IdentityID";
import { DATA_TYPE_STRING } from "../../vdxf";
import { PartialIdentity, SaplingPaymentAddress } from "../../index";

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
      delete newIdParams[key];

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