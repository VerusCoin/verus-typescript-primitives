/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../../utils/types/BigNumber';
import { SerializableEntity } from '../../utils/types/SerializableEntity';
export declare class SignatureData implements SerializableEntity {
    version: BigNumber;
    systemID: string;
    hashType: BigNumber;
    signatureHash: Buffer;
    identityID: string;
    sigType: BigNumber;
    vdxfKeys: Array<string>;
    vdxfKeyNames: Array<string>;
    boundHashes: Array<Buffer>;
    signatureAsVch: Buffer;
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static TYPE_VERUSID_DEFAULT: import("bn.js");
    constructor(data?: any);
    static fromJson(data: any): SignatureData;
    static getSignatureHashType(buffer: any): number;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    IsValid(): boolean;
    toJson(): {
        version: string;
        systemid: string;
        hashtype: string;
    };
    getIdentityHash(sigObject: {
        version: number;
        hashtype: number;
        height: number;
    }): any;
}
