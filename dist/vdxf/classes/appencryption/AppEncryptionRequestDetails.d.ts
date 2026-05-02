/**
 * AppEncryptionRequestDetails - Class for handling application requests for encrypted derived seeds
 *
 * This class is used when an application is requesting an encrypted derived seed from the user's master seed,
 * using specific parameters passed by the application. The request includes:
 * - App or delegated ID making the request (mandatory)
 * - A target encryption key (zaddress format) for encrypting the reply
 * - Derivation number for seed generation
 * - Optional derivation ID (defaults to Z-address from ID signing if not present)
 * - Optional request ID for tracking
 *
 * The user's wallet can use these parameters to derive a specific seed from their master seed
 * and encrypt it using the provided encryption key, ensuring the application receives only
 * the specific derived seed it needs without exposing the master seed.
 *
 * The FLAG_RETURN_ESK flag can be set to signal that the Extended Spending Key should be returned.
 */
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
import { SaplingPaymentAddress } from '../../../pbaas';
export interface AppEncryptionRequestDetailsInterface {
    version?: BigNumber;
    flags: BigNumber;
    encryptResponseToAddress?: SaplingPaymentAddress;
    derivationNumber: BigNumber;
    derivationID?: CompactIAddressObject;
    requestID?: CompactIAddressObject;
}
export interface AppEncryptionRequestDetailsJson {
    version: number;
    flags: number;
    encryptresponsetoaddress: string;
    derivationnumber: number;
    derivationid?: CompactAddressObjectJson;
    requestid?: CompactAddressObjectJson;
}
export declare class AppEncryptionRequestDetails implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    static FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS: import("bn.js");
    static FLAG_HAS_DERIVATION_ID: import("bn.js");
    static FLAG_RETURN_ESK: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    encryptResponseToAddress?: SaplingPaymentAddress;
    derivationNumber: BigNumber;
    derivationID?: CompactIAddressObject;
    requestID?: CompactIAddressObject;
    constructor(data?: AppEncryptionRequestDetailsInterface);
    setFlags(): void;
    calcFlags(): BigNumber;
    isValid(): boolean;
    hasDerivationID(flags?: BigNumber): boolean;
    hasRequestID(flags?: BigNumber): boolean;
    hasEncryptResponseToAddress(flags?: BigNumber): boolean;
    returnESK(flags?: BigNumber): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AppEncryptionRequestDetailsJson;
    static fromJson(json: AppEncryptionRequestDetailsJson): AppEncryptionRequestDetails;
}
