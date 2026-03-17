import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface RatingJson {
    version: number;
    trustlevel: number;
    ratingsmap: {
        [key: string]: string;
    };
}
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
    /** @deprecated Use trustLevel instead */
    get trust_level(): BigNumber;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: number;
        trustlevel: number;
        ratingsmap: {
            [key: string]: string;
        };
    };
    static fromJson(json: RatingJson): Rating;
}
