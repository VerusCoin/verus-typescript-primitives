import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class CurrencyValueMap implements SerializableEntity {
    valueMap: Map<string, BigNumber>;
    multivalue: boolean;
    constructor(data?: {
        valueMap?: Map<string, BigNumber>;
        multivalue?: boolean;
    });
    /** @deprecated Use valueMap instead */
    get value_map(): Map<string, BigNumber>;
    getNumValues(): import("bn.js");
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        [key: string]: string;
    };
    static fromJson(data: {
        [key: string]: string;
    }, multivalue?: boolean): CurrencyValueMap;
}
