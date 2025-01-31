/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare type PartialMMRDataUnit = {
    type: BigNumber;
    data: Buffer;
};
export declare type PartialMMRDataInitData = {
    flags?: BigNumber;
    data?: Array<PartialMMRDataUnit>;
    salt?: Array<Buffer>;
    hashtype?: BigNumber;
    priormmr?: Array<Buffer>;
};
export declare class PartialMMRData implements SerializableEntity {
    flags: BigNumber;
    data: Array<PartialMMRDataUnit>;
    hashtype?: BigNumber;
    salt?: Array<Buffer>;
    priormmr?: Array<Buffer>;
    static CONTAINS_SALT: import("bn.js");
    static CONTAINS_PRIORMMR: import("bn.js");
    static DATA_TYPE_UNKNOWN: import("bn.js");
    static DATA_TYPE_FILENAME: import("bn.js");
    static DATA_TYPE_MESSAGE: import("bn.js");
    static DATA_TYPE_VDXFDATA: import("bn.js");
    static DATA_TYPE_SERIALIZEDHEX: import("bn.js");
    static DATA_TYPE_SERIALIZEDBASE64: import("bn.js");
    static DATA_TYPE_DATAHASH: import("bn.js");
    static DATA_TYPE_RAWSTRINGDATA: import("bn.js");
    static HASH_TYPE_SHA256: import("bn.js");
    static HASH_TYPE_SHA256D: import("bn.js");
    static HASH_TYPE_BLAKE2B: import("bn.js");
    static HASH_TYPE_KECCAK256: import("bn.js");
    static DEFAULT_HASH_TYPE: import("bn.js");
    constructor(data?: PartialMMRDataInitData);
    protected serializeSalt(): boolean;
    protected serializePriorMMR(): boolean;
    private toggleContainsSalt;
    private toggleContainsPriorMMR;
    private getPartialMMRDataByteLength;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toBuffer(): Buffer;
}
