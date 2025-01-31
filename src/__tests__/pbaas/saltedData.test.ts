import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { Rating } from "../../pbaas/Rating";
import { fromBase58Check } from "../../utils/address";
import { SaltedData } from "../../pbaas/SaltedData";

describe('Serializes and deserializes SaltedData', () => {
    
    test('(de)serialize SaltedData', () => {
        
        const data = Buffer.from("0101010101010101010101010101010101010101010101010101010101010101", "hex");
        const salt = Buffer.from("0202020202020202020202020202020202020202020202020202020202020202", "hex");
        
        const s = new SaltedData(data, salt);
        
        const sFromBuf = new SaltedData();
        
        sFromBuf.fromBuffer(s.toBuffer())
        
        expect(sFromBuf.toBuffer().toString('hex')).toBe(s.toBuffer().toString('hex'))
    });    
});
