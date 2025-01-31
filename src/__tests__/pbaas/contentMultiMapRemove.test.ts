import { ContentMultiMapRemove } from "../../pbaas/ContentMultiMapRemove";
import { DATA_TYPE_STRING } from "../../vdxf";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { BN } from 'bn.js';

describe('Serializes and deserializes ContentMultiMapRemove', () => {
    
    function testContentMultiMapRemove() {
        const c = new ContentMultiMapRemove({
        version: new BN(1),
        action: ContentMultiMapRemove.ACTION_REMOVE_ONE_KEYVALUE,
        entry_key: "iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j",
        value_hash: Buffer.alloc(32).fill("h")
        });
    
        const cFromBuf = new ContentMultiMapRemove();
    
        cFromBuf.fromBuffer(c.toBuffer());
        
        expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
        expect(ContentMultiMapRemove.fromJson(c.toJson()).toBuffer().toString("hex")).toBe(cFromBuf.toBuffer().toString('hex'));
    }
    
    test('test CMMR with vdxfunivalue content', () => {
        testContentMultiMapRemove();
    });
});