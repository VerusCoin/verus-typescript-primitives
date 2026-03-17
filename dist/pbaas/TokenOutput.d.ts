import { CurrencyValueMap } from './CurrencyValueMap';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare const TOKEN_OUTPUT_VERSION_INVALID: import("bn.js");
export declare const TOKEN_OUTPUT_VERSION_CURRENT: import("bn.js");
export declare const TOKEN_OUTPUT_VERSION_FIRSTVALID: import("bn.js");
export declare const TOKEN_OUTPUT_VERSION_LASTVALID: import("bn.js");
export declare const TOKEN_OUTPUT_VERSION_MULTIVALUE: import("bn.js");
export declare class TokenOutput implements SerializableEntity {
    version: BigNumber;
    reserveValues: CurrencyValueMap;
    constructor(data?: {
        values?: CurrencyValueMap;
        version?: BigNumber;
    });
    /** @deprecated Use reserveValues instead */
    get reserve_values(): CurrencyValueMap;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    firstCurrency(): any;
    firstValue(): any;
    getVersion(): import("bn.js");
    isValid(): boolean;
}
