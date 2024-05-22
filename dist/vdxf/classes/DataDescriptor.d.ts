/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../../utils/types/BigNumber';
import { BufferDataVdxfObject } from '../index';
export declare class DataDescriptor {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static FLAG_ENCRYPTED_DATA: import("bn.js");
    static FLAG_SALT_PRESENT: import("bn.js");
    static FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT: import("bn.js");
    static FLAG_INCOMING_VIEWING_KEY_PRESENT: import("bn.js");
    static FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT: import("bn.js");
    static FLAG_LABEL_PRESENT: import("bn.js");
    static FLAG_MIME_TYPE_PRESENT: import("bn.js");
    static FLAG_MASK: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    objectdata: Buffer;
    label: string;
    mimeType: string;
    salt: Buffer;
    epk: Buffer;
    ivk: Buffer;
    ssk: Buffer;
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        objectdata?: Buffer;
        label?: string;
        mimeType?: string;
        salt?: Buffer;
        epk?: Buffer;
        ivk?: Buffer;
        ssk?: Buffer;
    });
    static fromJson(data: any): DataDescriptor;
    DecodeHashVector(): Array<Buffer>;
    byteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    HasEncryptedData(): boolean;
    HasSalt(): boolean;
    HasEPK(): boolean;
    HasMIME(): boolean;
    HasIVK(): boolean;
    HasSSK(): boolean;
    HasLabel(): boolean;
    CalcFlags(): BigNumber;
    SetFlags(): void;
    IsValid(): boolean;
    toJson(): {
        version: string;
        flags: string;
    };
}
export declare class VDXFDataDescriptor extends BufferDataVdxfObject {
    dataDescriptor: DataDescriptor;
    constructor(dataDescriptor?: DataDescriptor, vdxfkey?: string, version?: BigNumber);
    static fromDataVdfxObject(data: BufferDataVdxfObject): VDXFDataDescriptor;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    HasEncryptedData(): boolean;
    HasLabel(): boolean;
    HasSalt(): boolean;
    HasEPK(): boolean;
    HasIVK(): boolean;
    HasSSK(): boolean;
    CalcFlags(): BigNumber;
    SetFlags(): void;
}
export declare enum EHashTypes {
    HASH_INVALID = 0,
    HASH_BLAKE2BMMR = 1,
    HASH_BLAKE2BMMR2 = 2,
    HASH_KECCAK = 3,
    HASH_SHA256D = 4,
    HASH_SHA256 = 5,
    HASH_LASTTYPE = 5
}
export declare class MMRDescriptor {
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    version: BigNumber;
    objectHashType: EHashTypes;
    mmrHashType: EHashTypes;
    mmrRoot: DataDescriptor;
    mmrHashes: DataDescriptor;
    dataDescriptors: DataDescriptor[];
    constructor(data?: {
        version?: BigNumber;
        objectHashType?: EHashTypes;
        mmrHashType?: EHashTypes;
        mmrRoot?: DataDescriptor;
        mmrHashes?: DataDescriptor;
        dataDescriptors?: DataDescriptor[];
    });
    static fromJson(data: any): MMRDescriptor;
    byteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    HasData(): boolean;
    IsValid(): boolean;
    toJson(): {
        version: string;
        objecthashtype: EHashTypes;
        mmrhashtype: EHashTypes;
        mmrroot: {
            version: string;
            flags: string;
        };
        mmrhashes: {
            version: string;
            flags: string;
        };
        datadescriptors: {
            version: string;
            flags: string;
        }[];
    };
}
export declare const VectorEncodeVDXFUni: (obj: any) => Buffer;
export declare const VDXFDataToUniValue: (buffer: Buffer, offset?: number, pSuccess?: any) => {
    objectUni: any;
    offset: number;
    pSuccess: any;
};
export declare const VDXFDataToUniValueArray: (buffer: Buffer, offset?: number) => any;
