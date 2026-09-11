import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { BufferDataVdxfObject } from '../vdxf/index';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface DataDescriptorJson {
    version: number;
    flags?: number;
    vdxfkey?: string;
    objectdata?: string | {
        ['message']: string;
    } | object;
    label?: string;
    mimetype?: string;
    salt?: string;
    epk?: string;
    ivk?: string;
    ssk?: string;
}
export declare class DataDescriptor extends SerializableEntityBase implements SerializableEntity {
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
    static FLAG_VDXF_KEY_PRESENT: import("bn.js");
    static FLAG_MASK: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    vdxfKey: string;
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
        vdxfKey?: string;
        objectdata?: Buffer;
        label?: string;
        mimeType?: string;
        salt?: Buffer;
        epk?: Buffer;
        ivk?: Buffer;
        ssk?: Buffer;
    });
    static fromJson(data: any): DataDescriptor;
    decodeHashVector(): Array<Buffer>;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    hasEncryptedData(): boolean;
    hasVDXFKey(): boolean;
    hasSalt(): boolean;
    hasEPK(): boolean;
    hasMIME(): boolean;
    hasIVK(): boolean;
    hasSSK(): boolean;
    hasLabel(): boolean;
    calcFlags(): BigNumber;
    setFlags(): void;
    isValid(): boolean;
    toJson(): DataDescriptorJson;
}
export declare class VDXFDataDescriptor extends BufferDataVdxfObject {
    dataDescriptor: DataDescriptor;
    constructor(dataDescriptor?: DataDescriptor, vdxfkey?: string, version?: BigNumber);
    static fromDataVdxfObject(data: BufferDataVdxfObject): VDXFDataDescriptor;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    hasEncryptedData(): boolean;
    hasLabel(): boolean;
    hasSalt(): boolean;
    hasEPK(): boolean;
    hasIVK(): boolean;
    hasSSK(): boolean;
    calcFlags(): BigNumber;
    setFlags(): void;
}
export declare enum EHashTypes {
    HASH_INVALID,
    HASH_BLAKE2BMMR,
    HASH_BLAKE2BMMR2,
    HASH_KECCAK,
    HASH_SHA256D,
    HASH_SHA256,
    HASH_LASTTYPE
}
