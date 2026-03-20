import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { GenericEnvelope, GenericEnvelopeInterface, GenericEnvelopeJson, GenericRequestHandlerIdentifier } from "../envelope/GenericEnvelope";
import { SaplingPaymentAddress } from '../../../pbaas/SaplingPaymentAddress';
import { ResponseURI, ResponseURIJson } from '../ResponseURI';
export type GenericRequestJson = GenericEnvelopeJson & {
    responseuris?: Array<ResponseURIJson>;
    encryptresponsetoaddress?: string;
    preferredhandler?: number;
};
export type GenericRequestInterface = GenericEnvelopeInterface & {
    responseURIs?: Array<ResponseURI>;
    encryptResponseToAddress?: SaplingPaymentAddress;
    preferredHandler?: GenericRequestHandlerIdentifier;
};
export declare class GenericRequest extends GenericEnvelope implements SerializableEntity {
    responseURIs?: Array<ResponseURI>;
    encryptResponseToAddress?: SaplingPaymentAddress;
    preferredHandler: GenericRequestHandlerIdentifier;
    static VERSION_CURRENT: import("bn.js");
    static VERSION_FIRSTVALID: import("bn.js");
    static VERSION_LASTVALID: import("bn.js");
    static BASE_FLAGS: import("bn.js");
    static FLAG_SIGNED: import("bn.js");
    static FLAG_HAS_CREATED_AT: import("bn.js");
    static FLAG_MULTI_DETAILS: import("bn.js");
    static FLAG_IS_TESTNET: import("bn.js");
    static FLAG_HAS_SALT: import("bn.js");
    static FLAG_HAS_APP_OR_DELEGATED_ID: import("bn.js");
    static FLAG_HAS_RESPONSE_URIS: import("bn.js");
    static FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS: import("bn.js");
    static FLAG_HAS_PREFERRED_HANDLER: import("bn.js");
    constructor(envelope?: GenericRequestInterface);
    hasResponseURIs(): boolean;
    hasEncryptResponseToAddress(): boolean;
    hasPreferredHandler(): boolean;
    setHasResponseURIs(): void;
    setHasEncryptResponseToAddress(): void;
    setHasPreferredHandler(): void;
    setFlags(): void;
    protected getByteLengthOptionalSig(includeSig?: boolean, forHashing?: boolean): number;
    protected toBufferOptionalSig(includeSig?: boolean, forHashing?: boolean): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): GenericRequestJson;
    static fromWalletDeeplinkUri(uri: string): GenericRequest;
    static fromQrString(qrstring: string): GenericRequest;
    toWalletDeeplinkUri(): string;
    toQrString(): string;
}
