import { CurrencyValueMap } from '../../pbaas/CurrencyValueMap';
import { URLRef, URLRefJson } from '../../pbaas/URLRef';
import { DATA_TYPE_STRING } from "../../vdxf";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { BN } from 'bn.js';
import { BigNumber } from '../../utils/types/BigNumber';

const VRSC_CURRENCY_ID = 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV';
const NEGATIVE_ONE_SATOSHI_MAP_HEX =
    '011af5b8015c64d39ab44c60ead8317f9f5a9b6c4cffffffffffffffff';

describe('Serializes and deserializes CurrencyValueMap', () => {

    function testCurrencyValueMap() {

        const valueMap = new Map<string, BigNumber>();

        valueMap.set("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV", new BN(100000));

        const c = new CurrencyValueMap({
            valueMap: valueMap,
        });

        const cFromBuf = new CurrencyValueMap();

        cFromBuf.fromBuffer(c.toBuffer());

        expect(cFromBuf.toBuffer().toString('hex')).toBe(c.toBuffer().toString('hex'));
        expect(CurrencyValueMap.fromJson(c.toJson()).toBuffer().toString("hex")).toBe(cFromBuf.toBuffer().toString('hex'));
    }

    test('test CurrencyValueMap with vdxfunivalue content', () => {
        testCurrencyValueMap();
    });

    test('serializes a negative multivalue entry as a signed int64', () => {
        const currencyMap = CurrencyValueMap.fromJson({
            [VRSC_CURRENCY_ID]: '-0.00000001',
        }, true);

        expect(currencyMap.toBuffer().toString('hex')).toBe(NEGATIVE_ONE_SATOSHI_MAP_HEX);
    });

    test('deserializes a canonical negative signed int64 multivalue entry', () => {
        const currencyMap = new CurrencyValueMap({ multivalue: true });
        const encoded = Buffer.from(NEGATIVE_ONE_SATOSHI_MAP_HEX, 'hex');

        const bytesRead = currencyMap.fromBuffer(encoded);

        expect(bytesRead).toBe(encoded.length);
        expect(currencyMap.valueMap.get(VRSC_CURRENCY_ID)!.toString(10)).toBe('-1');
        expect(currencyMap.toJson()).toStrictEqual({
            [VRSC_CURRENCY_ID]: '-0.00000001',
        });
    });
});
