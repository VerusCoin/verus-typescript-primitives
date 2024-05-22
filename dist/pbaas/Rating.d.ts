/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class Rating implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static TRUST_UNKNOWN: import("bn.js");
    static TRUST_BLOCKED: import("bn.js");
    static TRUST_APPROVED: import("bn.js");
    static TRUST_FIRST: import("bn.js");
    static TRUST_LAST: import("bn.js");
    version: BigNumber;
    trustLevel: BigNumber;
    ratings: Map<string, Buffer>;
    constructor(data?: {
        version?: BigNumber;
        trustLevel?: BigNumber;
        ratings?: Map<string, Buffer>;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    IsValid(): boolean;
    toJson(): {
        version: string;
        trustlevel: string;
        ratings: Map<string, Buffer>;
    };
}
