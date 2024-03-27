/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
export declare class CurrencyValueMap {
    value_map: Map<string, BigNumber>;
    multivalue: boolean;
    constructor(data?: {
        value_map?: Map<string, BigNumber>;
        multivalue?: boolean;
    });
    getNumValues(): import("bn.js");
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: any, offset?: number): number;
}
