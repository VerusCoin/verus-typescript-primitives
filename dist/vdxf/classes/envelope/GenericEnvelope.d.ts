import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../../utils/types/BigNumber";
import { OrdinalVDXFObject, OrdinalVDXFObjectJson } from "../ordinals/OrdinalVDXFObject";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { VerifiableSignatureData, VerifiableSignatureDataJson } from "../VerifiableSignatureData";
import { CompactAddressObjectJson, CompactIAddressObject } from "../CompactAddressObject";
import { DataDescriptorOrdinalVDXFObject } from "../ordinals/DataDescriptorOrdinalVDXFObject";
export interface GenericEnvelopeInterface {
    version?: BigNumber;
    flags?: BigNumber;
    signature?: VerifiableSignatureData;
    requestID?: CompactIAddressObject;
    createdAt?: BigNumber;
    salt?: Buffer;
    /**
     * Optional app/delegator identity defining the app encryption scope.
     * When absent, the verified request signer defines that scope. When present,
     * the wallet must authorize the signer before using this identity as toId.
     * Until the delegate handshake is supported, only a signer whose signing
     * authority the user fully controls may specify it.
     */
    appOrDelegatorID?: CompactIAddressObject;
    details: Array<OrdinalVDXFObject>;
}
export type GenericEnvelopeJson = {
    version: string;
    flags?: string;
    signature?: VerifiableSignatureDataJson;
    requestid?: CompactAddressObjectJson;
    createdat?: string;
    salt?: string;
    appOrDelegatorID?: CompactAddressObjectJson;
    details: Array<OrdinalVDXFObjectJson>;
};
export type GenericRequestHandlerIdentifier = 0 | 1;
export declare class GenericEnvelope extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    signature?: VerifiableSignatureData;
    requestID?: CompactIAddressObject;
    createdAt?: BigNumber;
    salt?: Buffer;
    appOrDelegatorID?: CompactIAddressObject;
    details: Array<OrdinalVDXFObject>;
    static VERSION_CURRENT: import("bn.js");
    static VERSION_FIRSTVALID: import("bn.js");
    static VERSION_LASTVALID: import("bn.js");
    static BASE_FLAGS: import("bn.js");
    static FLAG_SIGNED: import("bn.js");
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    static FLAG_HAS_CREATED_AT: import("bn.js");
    static FLAG_MULTI_DETAILS: import("bn.js");
    static FLAG_IS_TESTNET: import("bn.js");
    static FLAG_HAS_SALT: import("bn.js");
    static FLAG_HAS_APP_OR_DELEGATOR_ID: import("bn.js");
    static FLAG_DETAILS_ARE_ENCRYPTED: import("bn.js");
    constructor(envelope?: GenericEnvelopeInterface);
    isValidVersion(): boolean;
    isSigned(): boolean;
    hasRequestID(): boolean;
    hasMultiDetails(): boolean;
    hasCreatedAt(): boolean;
    hasSalt(): boolean;
    hasAppOrDelegatorID(): boolean;
    isTestnet(): boolean;
    detailsAreEncrypted(): boolean;
    setSigned(): void;
    setHasRequestID(): void;
    setHasMultiDetails(): void;
    setHasCreatedAt(): void;
    setHasSalt(): void;
    setHasAppOrDelegatorID(): void;
    setIsTestnet(): void;
    setDetailsAreEncrypted(): void;
    setFlags(): void;
    getRawDataSha256(includeSig?: boolean): Buffer<ArrayBufferLike>;
    getDetailsIdentitySignatureHash(signedBlockheight: number): Buffer<ArrayBufferLike>;
    getDetails(index?: number): OrdinalVDXFObject;
    protected getEncryptedDetailsDescriptor(): DataDescriptorOrdinalVDXFObject;
    getDetailsBufferLength(): number;
    getDetailsBuffer(): Buffer;
    setDetailsFromBuffer(buffer: Buffer, offset?: number): number;
    protected getDataBufferLengthAfterSig(): number;
    protected getDataBufferAfterSig(): Buffer;
    private internalGetByteLength;
    protected getByteLengthOptionalSig(includeSig?: boolean, forHashing?: boolean): number;
    getByteLength(): number;
    protected toBufferOptionalSig(includeSig?: boolean, forHashing?: boolean): Buffer<ArrayBufferLike>;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toString(): string;
    toJson(): GenericEnvelopeJson;
}
