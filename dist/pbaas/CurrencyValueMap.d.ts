/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class CurrencyValueMap implements SerializableEntity {
    value_map: Map<string, BigNumber>;
    multivalue: boolean;
    constructor(data?: {
        value_map?: Map<string, BigNumber>;
        multivalue?: boolean;
    });
    getNumValues(): import("bn.js");
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        [key: string]: string;
    };
    static fromJson(data: {
        [key: string]: string;
    }, multivalue?: boolean): CurrencyValueMap;
}
