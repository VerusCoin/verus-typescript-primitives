/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface URLRefJson {
    version: string;
    url: string;
}
export declare class URLRef implements SerializableEntity {
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    version: BigNumber;
    url: string;
    constructor(data?: {
        version?: BigNumber;
        url?: string;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        url: string;
    };
    static fromJson(data: URLRefJson): URLRef;
}
