/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface EvidenceDataInChainObjectJson {
    vdxftype?: string;
    value: {
        hex: string;
        version: number;
    };
}
export interface EvidenceDataJson {
    vdxftype?: string;
    hex: string;
}
export declare enum ETypes {
    TYPE_INVALID = 0,
    TYPE_FIRST_VALID = 1,
    TYPE_DATA = 1,
    TYPE_MULTIPART_DATA = 2,
    TYPE_LAST_VALID = 2
}
export declare class MultiPartDescriptor implements SerializableEntity {
    index: BigNumber;
    totalLength: BigNumber;
    start: BigNumber;
    constructor(data?: {
        index: any;
        totalLength: any;
        start: any;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class EvidenceData implements SerializableEntity {
    version: BigNumber;
    type: BigNumber;
    md: MultiPartDescriptor;
    vdxfd: string;
    dataVec: Buffer;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static VERSION_LAST: import("bn.js");
    constructor(data?: {
        version: any;
        type: any;
        md: any;
        vdxfd: any;
        dataVec: any;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        hex: string;
    };
    static fromJson(data: EvidenceDataJson): EvidenceData;
}
