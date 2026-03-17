import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { EHashTypes } from './DataDescriptor';
export interface SignatureJsonDataInterface {
    version: number;
    systemid: string;
    hashtype: number;
    signaturehash: string;
    identityid: string;
    signaturetype: number;
    vdxfkeys?: Array<string>;
    vdxfkeynames?: Array<string>;
    boundhashes?: Array<string>;
    signature: string;
}
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
    constructor(data?: {
        version?: BigNumber;
        systemID?: string;
        hashType?: BigNumber;
        signatureHash?: Buffer;
        identityID?: string;
        sigType?: BigNumber;
        vdxfKeys?: Array<string>;
        vdxfKeyNames?: Array<string>;
        boundHashes?: Array<Buffer>;
        signatureAsVch?: Buffer;
    });
    /** @deprecated Use systemID instead */
    get system_ID(): string;
    /** @deprecated Use hashType instead */
    get hash_type(): BigNumber;
    /** @deprecated Use signatureHash instead */
    get signature_hash(): Buffer;
    /** @deprecated Use identityID instead */
    get identity_ID(): string;
    /** @deprecated Use sigType instead */
    get sig_type(): BigNumber;
    /** @deprecated Use vdxfKeys instead */
    get vdxf_keys(): Array<string>;
    /** @deprecated Use vdxfKeyNames instead */
    get vdxf_key_names(): Array<string>;
    /** @deprecated Use boundHashes instead */
    get bound_hashes(): Array<Buffer>;
    /** @deprecated Use signatureAsVch instead */
    get signature_as_vch(): Buffer;
    static fromJson(data: SignatureJsonDataInterface | any): SignatureData;
    /**
     * Determines the signature hash type based on the input buffer.
     *
     * @param {Buffer} input - The input buffer containing signature data.
     * @returns {number} - The hash type. If the version byte is `2`, the next byte
     *                     in the buffer is returned as the hash type. Otherwise,
     *                     it defaults to `EHashTypes.HASH_SHA256`.
     *
     * The method reads the first byte of the input buffer as the version. If the
     * version is `2`, it reads the next byte as the hash type. This logic is used
     * to support multiple versions of signature data formats, where version `2`
     * introduces a new hash type. For all other versions, the default hash type
     * is `EHashTypes.HASH_SHA256`.
     */
    static getSignatureHashType(input: Buffer): number | EHashTypes.HASH_SHA256;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): SignatureJsonDataInterface;
    getIdentityHash(sigObject: {
        version: number;
        hash_type: number;
        height: number;
    }): Buffer<ArrayBufferLike>;
}
