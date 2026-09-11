import { SignatureData } from "../../pbaas/SignatureData";

describe('Serializes and deserializes SignatureData', () => {
    test('(de)serialize SignatureData', () => {

        const data = {
            "version": 1,
            "systemid": "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
            "hashtype": 1,
            "signaturehash": "dfd3e3d82783360dfc675a09e6a226fd43119ef4e8d7cf553af96ea5883b51da",
            "identityid": "iKjrTCwoPFRk44fAi2nYNbPG16ZUQjv1NB",
            "signaturetype": 1,
            "signature": "AgXOCgAAAUEfCiSukK9tg46cYOpHmxzKjNquWDyNc8H58+uLSOYmqlUcNUxWB8j3nzT1RHKeJGygdAwrUj5iZ/A9H3+qYV9H9g=="
          }

        const s = SignatureData.fromJson(data);

        const sFromBuf = new SignatureData();

        sFromBuf.fromBuffer(s.toBuffer())

        expect(sFromBuf.toBuffer().toString('hex')).toBe(s.toBuffer().toString('hex'))
    });
});

describe('Hashes SignatureData identity context', () => {
    const daemonSignatureData = {
        version: 1,
        systemid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        hashtype: 5,
        signaturehash: "f8220bacb0bf5bd8ca33a890184b66b35fb64647274b4b9fb4ff90e68f77a5a7",
        identityid: "i4M7ar436N7wKHgZodjGAWdsBSNjG7cz8s",
        signaturetype: 1,
        signature: "AgVgngwAAUEg4QYvX2zJJUZLa4YdtwoxehCQ9T3U6xGw08SmonRSv1xofR1264j5/bdXmq6Qc2YgzlCt3DqVKM9c9DLuCU4bbQ==",
        vdxfkeys: [
            "iQRWB2Ay9rEbzStXDjMFpveh4oEmD6YWXa",
            "i5cVmwQQZfWz1AYp9AwKakPQxTjQfK2Mrk",
            "iKqjqcXE15KPNuCvm2evZUnwiYEZ2CLnV2",
            "iRrCKQqLQrWczeNotMgqJkoUW5ZzF182Ax"
        ],
        vdxfkeynames: ["examplename1", "examplename2"],
        boundhashes: [
            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        ]
    };
    const identitySignature = { version: 2, hash_type: 5, height: 826976 };

    test('matches the daemon version 2 identity hash with binding metadata', () => {
        const identityHash = SignatureData.fromJson(daemonSignatureData).getIdentityHash(identitySignature);

        expect(identityHash.toString('hex')).toBe('0257bae2177b2dcbd843f28ed1dd5cc18f92ddbcd06a93819406cfce54b64f59');
    });

    test('version 2 identity hash changes when binding metadata is removed', () => {
        const bound = SignatureData.fromJson(daemonSignatureData).getIdentityHash(identitySignature).toString('hex');
        const unbound = SignatureData.fromJson({
            ...daemonSignatureData,
            vdxfkeys: [],
            vdxfkeynames: [],
            boundhashes: []
        }).getIdentityHash(identitySignature).toString('hex');

        expect(bound).not.toBe(unbound);
    });

    test('version 2 identity hash changes when any binding metadata changes', () => {
        const original = SignatureData.fromJson(daemonSignatureData).getIdentityHash(identitySignature).toString('hex');
        const mutations = [
            { ...daemonSignatureData, vdxfkeys: ["iCCSCFbq9n7ftEQCQT94t8CcVV5NdxnTvL"] },
            { ...daemonSignatureData, vdxfkeynames: ["different.name"] },
            { ...daemonSignatureData, boundhashes: ["cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"] }
        ];
        const mutated = mutations.map(data => SignatureData.fromJson(data).getIdentityHash(identitySignature).toString('hex'));

        expect(new Set([original, ...mutated]).size).toBe(4);
    });
});
