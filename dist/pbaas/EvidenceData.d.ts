import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
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
    TYPE_DATA = 1,// holding a transaction proof of export with finalization referencing finalization of root notarization
    TYPE_MULTIPART_DATA = 2,// this is used to combine multiple outputs that can be used to reconstruct one evidence set
    TYPE_LAST_VALID = 2
}
export declare class MultiPartDescriptor extends SerializableEntityBase implements SerializableEntity {
    index: BigNumber;
    total_length: BigNumber;
    start: BigNumber;
    constructor(data?: {
        index: any;
        total_length: any;
        start: any;
    });
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class EvidenceData extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    type: BigNumber;
    md: MultiPartDescriptor;
    vdxfd: string;
    data_vec: Buffer;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static VERSION_LAST: import("bn.js");
    constructor(data?: {
        version: any;
        type: any;
        md: any;
        vdxfd: any;
        data_vec: any;
    });
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        hex: string;
    };
    static fromJson(data: EvidenceDataJson): EvidenceData;
}
