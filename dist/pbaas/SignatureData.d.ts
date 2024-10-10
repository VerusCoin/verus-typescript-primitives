/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface SignatureJsonDataInterface {
    version: number;
    systemid: string;
    hashtype: number;
    signaturehash: string;
    identityid: string;
    signaturetype: number;
    vdxfkeys: Array<string>;
    vdxfkeynames: Array<string>;
    boundhashes: Array<string>;
    signature: string;
}
export declare class SignatureData implements SerializableEntity {
    version: BigNumber;
    system_ID: string;
    hash_type: BigNumber;
    signature_hash: Buffer;
    identity_ID: string;
    sig_type: BigNumber;
    vdxf_keys: Array<string>;
    vdxf_key_names: Array<string>;
    bound_hashes: Array<Buffer>;
    signature_as_vch: Buffer;
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static TYPE_VERUSID_DEFAULT: import("bn.js");
    constructor(data?: {
        version?: BigNumber;
        system_ID?: string;
        hash_type?: BigNumber;
        signature_hash?: Buffer;
        identity_ID?: string;
        sig_type?: BigNumber;
        vdxf_keys?: Array<string>;
        vdxf_key_names?: Array<string>;
        bound_hashes?: Array<Buffer>;
        signature_as_vch?: Buffer;
    });
    static fromJson(data: SignatureJsonDataInterface | any): SignatureData;
    static getSignatureHashType(input: Buffer): number;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        systemid: string;
        hashtype: string;
    };
    getIdentityHash(sigObject: {
        version: number;
        hash_type: number;
        height: number;
    }): any;
}
