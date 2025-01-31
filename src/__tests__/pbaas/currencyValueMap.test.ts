import { CurrencyValueMap } from '../../pbaas/CurrencyValueMap';
import { URLRef, URLRefJson } from '../../pbaas/URLRef';
import { DATA_TYPE_STRING } from "../../vdxf";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { BN } from 'bn.js';
import { BigNumber } from '../../utils/types/BigNumber';

describe('Serializes and deserializes CurrencyValueMap', () => {

    function testCurrencyValueMap() {

        const valueMap = new Map<string, BigNumber>();

        valueMap.set("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV", new BN(100000));

        const c = new CurrencyValueMap({
            value_map: valueMap,
        });

        const cFromBuf = new CurrencyValueMap();

        cFromBuf.fromBuffer(c.toBuffer());

        expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
        expect(CurrencyValueMap.fromJson(c.toJson()).toBuffer().toString("hex")).toBe(cFromBuf.toBuffer().toString('hex'));
    }

    test('test CurrencyValueMap with vdxfunivalue content', () => {
        testCurrencyValueMap();
    });
});