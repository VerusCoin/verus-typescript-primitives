import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface URLRefJson {
    version: string;
    flags?: string;
    datahash?: string;
    url: string;
}
export declare class URLRef implements SerializableEntity {
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static HASHDATA_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static FLAG_HAS_HASH: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    dataHash: Buffer;
    url: string;
    constructor(data?: {
        version?: BigNumber;
        url?: string;
        flags?: BigNumber;
        dataHash?: Buffer;
    });
    /** @deprecated Use dataHash instead */
    get data_hash(): Buffer;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: number;
        flags: number;
        datahash: string;
        url: string;
    };
    static fromJson(data: URLRefJson): URLRef;
}
