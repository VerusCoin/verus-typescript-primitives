import { Identity } from "../../../pbaas/Identity";
import { IdentityScript } from "../../../pbaas/transaction/IdentityScript";

describe('Serializes and deserializes SmartTransactionScripts', () => {
  test('(de)serialize a basic identity registration outscript (v1) from daemon', () => {
    const scriptString = "46040300010314a484f66e98c3d787b2ff8854d3ceeb5b61446978150476a348fd730beb2694f54a7114dbf14aa699f9fa150476a348fd730beb2694f54a7114dbf14aa699f9facc4ce304030e0101150476a348fd730beb2694f54a7114dbf14aa699f9fa4c8e010000000000000001143cdad2d09cbc6e164804af104b1f3f56f0d10d78010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0161000076a348fd730beb2694f54a7114dbf14aa699f9fa76a348fd730beb2694f54a7114dbf14aa699f9fa016931943a1979b5e0308a4da1cb62688e6d6433e4501d2c5a474987deee3137144a48978919d7e6a47670501b04030f0101150476a348fd730beb2694f54a7114dbf14aa699f9fa1b0403100101150476a348fd730beb2694f54a7114dbf14aa699f9fa75";

    const script = new IdentityScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
    expect(script.getIdentity().toJson()).toStrictEqual({
      contentmap: {},
      contentmultimap: {},
      flags: 0,
      minimumsignatures: 1,
      name: 'a',
      parent: 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV',
      primaryaddresses: ['REpxm9bCLMiHRNVPA9unPBWixie7uHFA5C'],
      privateaddress: 'zs1dycegwse0x67qvy2fksukcng3ekkgvly2qwjckj8fxraam33xu2y5jyh3yva0e4ywec9quedcud',
      recoveryauthority: 'iEHpmxiynXmwZKNgMm7BpXWP3EqCJt663q',
      revocationauthority: 'iEHpmxiynXmwZKNgMm7BpXWP3EqCJt663q',
      systemid: 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV',
      timelock: 0,
      version: 1,
      identityaddress: 'iEHpmxiynXmwZKNgMm7BpXWP3EqCJt663q'
    });
    expect(() => IdentityScript.fromIdentity(script.getIdentity())).toThrowError()
  });

  test('(de)serialize a basic identity registration outscript (v3) from daemon with contentmap', () => {
    const scriptString = "470403000103150438411ff17100e15b6df8dd72fecbe4fa4964dfea15043e006293b9e3341262eed040048d3a2260367f47150445a96c0179cbb19221c0e8625a2ed691d762fd37cc4d360104030e0101150438411ff17100e15b6df8dd72fecbe4fa4964dfea4ce103000000000000000114c165bce63e47698278f859ee75c35c78eb23e8df01000000a6ef9ea235635e328124ff3429db9f9e91b64e2d085665727573506179000113a542e2075696772ee9861c9b2a4d55c86cf353c45c3e2987f09e8c48d9e2681288bd455a18ebc73ef977750724a7fc51bd32633e006293b9e3341262eed040048d3a2260367f4745a96c0179cbb19221c0e8625a2ed691d762fd370176041f9ab6ca1d155ce87a7c677e9e0d16c9846e6ee62db670751f8be3ead27cb740aa7595d0be24b741a9a6ef9ea235635e328124ff3429db9f9e91b64e2d000000001b04030f010115043e006293b9e3341262eed040048d3a2260367f471b0403100101150445a96c0179cbb19221c0e8625a2ed691d762fd3775";

    const script = new IdentityScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    const idjson = {
      "contentmap": {
        "53f36cc8554d2a9b1c86e92e77965607e242a513": "6332bd51fca724077577f93ec7eb185a45bd881268e2d9488c9ef087293e5cc4"
      },
      "contentmultimap": {},
      "flags": 0,
      "identityaddress": "i8byHmWFAeFMajYdgrXiQ9qZ1Y9FqxJUx1",
      "minimumsignatures": 1,
      "name": "VerusPay",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "primaryaddresses": [
        "RSunNQqKnSwpNBRd6kcenScuQEFUWgL3bZ"
      ],
      "privateaddress": "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa",
      "recoveryauthority": "i9ps1xDcr7eM66Fko6aTkeuvvBPZFLEXRN",
      "revocationauthority": "i98Mnj1YugaRzoURXt4aRhdqQDu7rML9J5",
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "timelock": 0,
      "version": 3
    }

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
    expect(script.getIdentity().toJson()).toStrictEqual(idjson);
    expect(Identity.fromJson(idjson).toBuffer().toString('hex')).toBe(script.getIdentity().toBuffer().toString('hex'));
    expect(IdentityScript.fromIdentity(script.getIdentity()).toBuffer().toString('hex')).toBe(scriptString);
  });

  test('(de)serialize a basic identity registration outscript (v3) from daemon with contentmultimap', () => {
    const scriptString = "4704030001031504f478f668655e60f6b49e2424053166ba2cf241391504f478f668655e60f6b49e2424053166ba2cf241391504f478f668655e60f6b49e2424053166ba2cf24139cc4d030104030e01011504f478f668655e60f6b49e2424053166ba2cf241394cae0300000000000000021455f51a22c79018a00ced41e758560f5df7d4d35d143e3c1a4f0dc6852eff0b312bec2e4dd382d2939701000000a6ef9ea235635e328124ff3429db9f9e91b64e2d076d6f6e6b696e7301797c0f0128e5d8f2aedd0039a930b1abe12e5be90102040d00f478f668655e60f6b49e2424053166ba2cf24139f478f668655e60f6b49e2424053166ba2cf2413900a6ef9ea235635e328124ff3429db9f9e91b64e2d000000001b04030f01011504f478f668655e60f6b49e2424053166ba2cf241391b04031001011504f478f668655e60f6b49e2424053166ba2cf2413975";

    const script = new IdentityScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    const idjson = {
      "version": 3,
      "flags": 0,
      "primaryaddresses": [
        "RH7h8p9LN2Yb48SkxzNQ29c1Ltfju8Cd5i",
        "RExFyRVftxbW8w9e5Xkcixu3YtYjE2kCKX"
      ],
      "minimumsignatures": 1,
      "name": "monkins",
      "identityaddress": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "parent": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      "contentmap": {},
      "contentmultimap": {
        "iEYsp2njSt1M4EVYi9uuAPBU2wpKmThkkr": [
          "040d"
        ]
      },
      "revocationauthority": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "recoveryauthority": "iRmBDWNs2WahXDAvS2TEsJyJwwHXhwcs7w",
      "timelock": 0
    }

    const scriptId = script.getIdentity(false);
    const scriptJson = scriptId.toJson();

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
    expect(Identity.fromJson(scriptJson).toBuffer().toString('hex')).toBe(script.getIdentity().toBuffer().toString('hex'));

    const jsonId = Identity.fromJson(idjson);
    expect(scriptId.toJson()).toStrictEqual(idjson);

    expect(jsonId.content_multimap.toBuffer().toString("hex")).toBe(scriptId.content_multimap.toBuffer().toString('hex'));
    expect(Identity.fromJson(idjson).toBuffer().toString('hex')).toBe(scriptId.toBuffer().toString('hex'));

    const ownScript = IdentityScript.fromIdentity(script.getIdentity());

    expect(ownScript.toBuffer().toString('hex')).toBe(scriptString);
  });
});