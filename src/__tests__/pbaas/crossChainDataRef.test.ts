import { CrossChainDataRef, CrossChainDataRefJson } from "../../pbaas/CrossChainDataRef";
import { URLRef, URLRefJson } from '../../pbaas/URLRef';
import { DATA_TYPE_STRING } from "../../vdxf";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { BN } from 'bn.js';

describe('Serializes and deserializes CrossChainDataRef', () => {
        
        function testCrossChainDataRef() {

            const url = new URLRef({
                version: new BN(1),
                url: "https://verus.io"
            });

            const c = new CrossChainDataRef(url);
        
            const cFromBuf = new CrossChainDataRef();
        
            cFromBuf.fromBuffer(c.toBuffer());
            
            expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
            expect(CrossChainDataRef.fromJson(c.toJson() as CrossChainDataRefJson).toBuffer().toString("hex")).toBe(cFromBuf.toBuffer().toString('hex'));
        }
        
        test('test CCDR with vdxfunivalue content', () => {
            testCrossChainDataRef();
        });
    });