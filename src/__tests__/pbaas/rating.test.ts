import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { Rating } from "../../pbaas/Rating";
import { fromBase58Check } from "../../utils/address";
import { KeyID } from "../../pbaas/KeyID";

describe('Serializes and deserializes Rating', () => {
    test('(de)serialize Rating', () => {

        const ratings = new Map<string, Buffer>();

        ratings.set("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV", Buffer.from("aa", "hex"));

        const r = new Rating({
        version: Rating.VERSION_CURRENT,
        trust_level: Rating.TRUST_APPROVED,
        ratings
        });
        const rFromBuf = new Rating();
    
        rFromBuf.fromBuffer(r.toBuffer())
    
        expect(rFromBuf.toBuffer().toString('hex')).toBe(r.toBuffer().toString('hex'))
    });
    });