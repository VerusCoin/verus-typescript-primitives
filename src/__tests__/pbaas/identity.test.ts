import { BN } from "bn.js";
import { ContentMultiMap } from "../../pbaas/ContentMultiMap";
import { IDENTITY_FLAG_TOKENIZED_CONTROL, IDENTITY_VERSION_PBAAS, Identity, IDENTITY_FLAG_ACTIVECURRENCY } from "../../pbaas/Identity";
import { KeyID } from "../../pbaas/KeyID";
import { IdentityID } from "../../pbaas/IdentityID";
import { DATA_TYPE_STRING } from "../../vdxf";

describe('Serializes and deserializes identity properly', () => {
  test('deserialize/serialize VerusID without zaddr, post pbaas, with multimap and contentmap', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const identity = new Identity({
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
      unlock_after: new BN("123456", 10)
    })
    
    const identityFromBuf = new Identity();

    identityFromBuf.fromBuffer(identity.toBuffer());

    expect(identityFromBuf.toBuffer().toString('hex')).toBe(identity.toBuffer().toString('hex'));
  })

  test('deserialize/serialize VerusID after editing addresses', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const identity = new Identity({
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
      unlock_after: new BN("123456", 10)
    })

    identity.setPrimaryAddresses(["RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8", "RP1j8ziHUzgs6THJiAQa2BiqjRLLCWQxAk"])

    identity.setRecovery("iQghVEWZdpCJepn2JbKqkfMSKYR4fxKGGZ");
    identity.setRevocation("iQghVEWZdpCJepn2JbKqkfMSKYR4fxKGGZ");

    identity.setPrivateAddress("zs1e0r2fuxpn6kymwa656trkwk8mpwzj03ucpw6kpvje5gjl6mgtjgdvafcgl54su2uclwgw6v24em");
    
    const identityFromBuf = new Identity();

    identityFromBuf.fromBuffer(identity.toBuffer());

    expect(identityFromBuf.toBuffer().toString('hex')).toBe(identity.toBuffer().toString('hex'));
    
    const idJson = identityFromBuf.toJson();
    expect(idJson.primaryaddresses[0]).toBe("RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8");
    expect(idJson.primaryaddresses[1]).toBe("RP1j8ziHUzgs6THJiAQa2BiqjRLLCWQxAk");
  })

  test('deserialize/serialize VerusID without zaddr, post pbaas, without multimap', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const identity = new Identity({
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
      recovery_authority: IdentityID.fromAddress("i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz"),
      revocation_authority: IdentityID.fromAddress("i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7"),
      unlock_after: new BN("123456", 10)
    })
    
    const identityFromBuf = new Identity();

    identityFromBuf.fromBuffer(identity.toBuffer());

    expect(identityFromBuf.toBuffer().toString('hex')).toBe(identity.toBuffer().toString('hex'));
  })

  test('deserialize a daemon generated VerusID with a contentmultimap without private addr', async () => {
    const serializedIdentity = "0300000000000000021455f51a22c79018a00ced41e758560f5df7d4d35d143e3c1a4f0dc6852eff0b312bec2e4dd382d2939701000000a6ef9ea235635e328124ff3429db9f9e91b64e2d076d6f6e6b696e7301797c0f0128e5d8f2aedd0039a930b1abe12e5be90102040d00f478f668655e60f6b49e2424053166ba2cf24139f478f668655e60f6b49e2424053166ba2cf2413900a6ef9ea235635e328124ff3429db9f9e91b64e2d00000000";

    const identity_frombuf = new Identity();
    identity_frombuf.fromBuffer(Buffer.from(serializedIdentity, 'hex'), 0, true);
    expect(identity_frombuf.toBuffer().toString('hex')).toBe(serializedIdentity);

    const identity_tobuf = new Identity({
      version: IDENTITY_VERSION_PBAAS,
      primary_addresses: [
        KeyID.fromAddress("RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i"),
        KeyID.fromAddress("RExFyRVftxbW8w9e5Xkcixu3YtYjE2kCKX")
      ],
      min_sigs: new BN(1),
      name: "monkins",
      parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      system_id: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      content_multimap: ContentMultiMap.fromJson({
        "iEYsp2njSt1M4EVYi9uuAPBU2wpKmThkkr": [
          "040d"
        ]
      }),
      revocation_authority: IdentityID.fromAddress("iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w"),
      recovery_authority: IdentityID.fromAddress("iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w"),
      unlock_after: new BN(0)
    })

    expect(identity_tobuf.toBuffer().toString('hex')).toBe(serializedIdentity)
  });

  test('deserialize a daemon generated VerusID with a contentmultimap with private addr', async () => {
    const serializedIdentity = "0300000000000000021455f51a22c79018a00ced41e758560f5df7d4d35d143e3c1a4f0dc6852eff0b312bec2e4dd382d2939701000000a6ef9ea235635e328124ff3429db9f9e91b64e2d076d6f6e6b696e7301797c0f0128e5d8f2aedd0039a930b1abe12e5be90102040d00f478f668655e60f6b49e2424053166ba2cf24139f478f668655e60f6b49e2424053166ba2cf2413900a6ef9ea235635e328124ff3429db9f9e91b64e2d00000000";

    const identity_frombuf = new Identity();
    identity_frombuf.fromBuffer(Buffer.from(serializedIdentity, 'hex'));

    expect(identity_frombuf.toBuffer().toString('hex')).toBe(serializedIdentity);
  });

  test('(de)serialize a daemon generated VerusID from a CLI json', async () => {
    const identityJson = {
      "contentmap": {},
      "contentmultimap": {
        "iEYsp2njSt1M4EVYi9uuAPBU2wpKmThkkr": [
          "040d"
        ]
      },
      "flags": 0,
      "identityaddress": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "minimumsignatures": 1,
      "name": "monkins",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "primaryaddresses": [
        "RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i",
        "RExFyRVftxbW8w9e5Xkcixu3YtYjE2kCKX"
      ],
      "recoveryauthority": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "revocationauthority": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "timelock": 0,
      "version": 3
    };

    const identity_frombuf = Identity.fromJson(identityJson);
    
    expect(identity_frombuf.toJson()).toStrictEqual(identityJson);
  });

  test('revoke an ID and handle the lock properly', async () => {
    const identityJson = {
      "contentmap": {},
      "contentmultimap": {
        "iAqxJCbv2veLLHGdantvrzJRupyh3dkT6B": [
          {
            "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "{\"artistName\": \"ivan@\", \"albumName\": \"testAlbum\", \"genre\": \"rock\", \"url\": \"https:///jukebox\", \"networkId\": \"roomful\", \"signature\": \"AgXmEgAAAUEgwLEQjSOMDGvQ9OqXYC6TpmvlSj+lYg17MW3aaIM58cE9ufW7gF4Jyf6M/nJJVM3wFodIm4Irb/TUeFjeKCan5g==\", \"tracks\": [{\"resourceId\": \"1945dc9dqtrg21\", \"name\": \"\В\о\п\л\і \В\і\д\о\п\л\я\с\о\в\а - \В\е\с\н\а (Cover by Grandma\\s Smuzi)\", \"duration\": 240.432}], \"albumCover\": {\"resourceId\": \"91dsp8tq6rsq1v\"}, \"artistLogo\": {\"resourceId\": \"r2f06bgtzhr8bv\"}, \"sleeveDocument\": {\"resourceId\": \"5pc60wsq353zsm\"}, \"copiesSold\": 0, \"releaseTimestamp\": \"1682559212\", \"price\": {\"VALU\": 1, \"USDC\": 200}}"
          }
        ],
        "iChNhyJiQSZ3HumofCBhuASjgupq1m1NgP": [
          {
            "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "{\"albumCover\": {\"resourceId\": \"91dsp8tq6rsq1v\"}, \"albumName\": \"testAlbum11\", \"artistLogo\": {\"resourceId\": \"r2f06bgtzhr8bv\"}, \"artistName\": \"ivan@\", \"genre\": \"rock\", \"networkId\": \"roomful\", \"signature\": \"AgXmEgAAAUEgwLEQjSOMDGvQ9OqXYC6TpmvlSj+lYg17MW3aaIM58cE9ufW7gF4Jyf6M/nJJVM3wFodIm4Irb/TUeFjeKCan5g==\", \"sleeveDocument\": {\"resourceId\": \"5pc60wsq353zsm\"}, \"tracks\": [{\"duration\": 240.432, \"name\": \"\В\о\п\л\і \В\і\д\о\п\л\я\с\о\в\а - \В\е\с\н\а (Cover by Grandma\\s Smuzi)\", \"resourceId\": \"1945dc9dqtrg21\"}], \"url\": \"https:///jukebox\", \"copiesSold\": 0, \"releaseTimestamp\": \"1682536170\", \"price\": {\"VALU\": 1, \"USDC\": 200}}"
          }
        ]
      },
      "flags": (new BN(0).xor(IDENTITY_FLAG_ACTIVECURRENCY)).xor(IDENTITY_FLAG_TOKENIZED_CONTROL).toNumber(),
      "identityaddress": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "minimumsignatures": 1,
      "name": "Chris",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "primaryaddresses": [
        "RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8"
      ],
      "recoveryauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "revocationauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "timelock": 0,
      "version": 3,
      "privateaddress": "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"
    };

    const identity_frombuf = Identity.fromJson(identityJson);
    identity_frombuf.lock(new BN(10000));

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);

    expect(identity_frombuf.isLocked()).toBe(true);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(10000);

    identity_frombuf.unlock();

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(10000);
    expect(identity_frombuf.isRevoked()).toBe(false);

    identity_frombuf.revoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(true);

    identity_frombuf.unrevoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(false);

    identity_frombuf.lock(new BN(15000));

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);
    expect(identity_frombuf.isLocked()).toBe(true);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(15000);

    identity_frombuf.revoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(true);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(true);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(true);
  });

  test('revoke an ID and handle other flags properly', async () => {
    const identityJson = {
      "contentmap": {},
      "contentmultimap": {
        "iAqxJCbv2veLLHGdantvrzJRupyh3dkT6B": [
          {
            "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "{\"artistName\": \"ivan@\", \"albumName\": \"testAlbum\", \"genre\": \"rock\", \"url\": \"https:///jukebox\", \"networkId\": \"roomful\", \"signature\": \"AgXmEgAAAUEgwLEQjSOMDGvQ9OqXYC6TpmvlSj+lYg17MW3aaIM58cE9ufW7gF4Jyf6M/nJJVM3wFodIm4Irb/TUeFjeKCan5g==\", \"tracks\": [{\"resourceId\": \"1945dc9dqtrg21\", \"name\": \"\В\о\п\л\і \В\і\д\о\п\л\я\с\о\в\а - \В\е\с\н\а (Cover by Grandma\\s Smuzi)\", \"duration\": 240.432}], \"albumCover\": {\"resourceId\": \"91dsp8tq6rsq1v\"}, \"artistLogo\": {\"resourceId\": \"r2f06bgtzhr8bv\"}, \"sleeveDocument\": {\"resourceId\": \"5pc60wsq353zsm\"}, \"copiesSold\": 0, \"releaseTimestamp\": \"1682559212\", \"price\": {\"VALU\": 1, \"USDC\": 200}}"
          }
        ],
        "iChNhyJiQSZ3HumofCBhuASjgupq1m1NgP": [
          {
            "iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c": "{\"albumCover\": {\"resourceId\": \"91dsp8tq6rsq1v\"}, \"albumName\": \"testAlbum11\", \"artistLogo\": {\"resourceId\": \"r2f06bgtzhr8bv\"}, \"artistName\": \"ivan@\", \"genre\": \"rock\", \"networkId\": \"roomful\", \"signature\": \"AgXmEgAAAUEgwLEQjSOMDGvQ9OqXYC6TpmvlSj+lYg17MW3aaIM58cE9ufW7gF4Jyf6M/nJJVM3wFodIm4Irb/TUeFjeKCan5g==\", \"sleeveDocument\": {\"resourceId\": \"5pc60wsq353zsm\"}, \"tracks\": [{\"duration\": 240.432, \"name\": \"\В\о\п\л\і \В\і\д\о\п\л\я\с\о\в\а - \В\е\с\н\а (Cover by Grandma\\s Smuzi)\", \"resourceId\": \"1945dc9dqtrg21\"}], \"url\": \"https:///jukebox\", \"copiesSold\": 0, \"releaseTimestamp\": \"1682536170\", \"price\": {\"VALU\": 1, \"USDC\": 200}}"
          }
        ]
      },
      "flags": 0,
      "identityaddress": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "minimumsignatures": 1,
      "name": "Chris",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "primaryaddresses": [
        "RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8"
      ],
      "recoveryauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "revocationauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "timelock": 0,
      "version": 3,
      "privateaddress": "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"
    };

    const identity_frombuf = Identity.fromJson(identityJson);
    identity_frombuf.lock(new BN(10000));

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);

    expect(identity_frombuf.isLocked()).toBe(true);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(10000);

    identity_frombuf.unlock();

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(10000);
    expect(identity_frombuf.isRevoked()).toBe(false);

    identity_frombuf.revoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(true);

    identity_frombuf.unrevoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(false);

    identity_frombuf.lock(new BN(15000));

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);
    expect(identity_frombuf.isLocked()).toBe(true);
    expect(identity_frombuf.unlock_after.toNumber()).toEqual(15000);

    identity_frombuf.revoke();

    expect(identity_frombuf.hasActiveCurrency()).toBe(false);
    expect(identity_frombuf.hasTokenizedIdControl()).toBe(false);
    expect(identity_frombuf.isLocked()).toBe(false);
    expect(identity_frombuf.isRevoked()).toBe(true);
  });

  test('upgrade identity version', async () => {
    const identityJson = {
      "flags": 0,
      "identityaddress": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "minimumsignatures": 1,
      "name": "Chris",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "primaryaddresses": [
        "RKjVHqM4VF2pCfVcwGzKH7CxvfMUE4H6o8"
      ],
      "recoveryauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "revocationauthority": "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
      "timelock": 0,
      "version": Identity.VERSION_VERUSID.toNumber(),
      "privateaddress": "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"
    };

    const identity_frombuf = Identity.fromJson(identityJson);

    expect(identity_frombuf.version.toNumber()).toEqual(Identity.VERSION_VERUSID.toNumber());
    expect(identity_frombuf.system_id).toBe(undefined);

    identity_frombuf.upgradeVersion(Identity.VERSION_PBAAS);

    expect(identity_frombuf.system_id.toAddress()).toBe(identity_frombuf.parent.toAddress());
    expect(() => identity_frombuf.upgradeVersion(Identity.VERSION_VERUSID)).toThrowError();
    expect(() => identity_frombuf.upgradeVersion(new BN(10))).toThrowError();
  });
});