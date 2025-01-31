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
