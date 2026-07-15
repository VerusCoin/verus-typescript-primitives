/**
 * InformationRequest - Class for handling application requests for specific user information/data
 *
 * This class is used when an application is requesting specific information or data from the user's
 * identity or data stores. The request includes:
 * - Search data keys (VDXF keys) to identify the specific data being requested
 * - Optional specific keys within the data object for partial data requests
 * - Signer information to identify wanted signer of the data
 * - Optional statement for boundhashes in the signature
 *
 * The user's wallet can use these parameters to locate the signed object information and present
 * it to the user for approval before sharing with the requesting application. This enables
 * selective disclosure of personal information while maintaining user privacy and control.
 *
 * Request type and data type are encoded as varuints (not flags):
 * - FULL_DATA vs PARTIAL_DATA vs COLLECTION: Whether complete objects, specific fields,
 *   or multiple objects are requested
 * - ATTESTATION/CLAIM/CREDENTIAL: Type of verification being requested
 *
 * Flags are reserved for optional fields only (signer, requested keys, request ID).
 */
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
export interface UserDataRequestInterface {
    version?: BigNumber;
    flags: BigNumber;
    dataType: BigNumber;
    requestType: BigNumber;
    searchDataKeyHashType?: BigNumber;
    searchDataKey: Array<{
        [key: string]: Buffer;
    }>;
    signer?: CompactIAddressObject;
    requestedKeys?: string[];
    requestID?: CompactIAddressObject;
}
export interface UserDataRequestJson {
    version: number;
    flags: number;
    datatype: number;
    requesttype: number;
    searchdatakeyhashtype?: number;
    searchdatakey: Array<{
        [key: string]: Buffer;
    }>;
    signer?: CompactAddressObjectJson;
    requestedkeys?: string[];
    requestid?: CompactAddressObjectJson;
}
export declare class UserDataRequestDetails implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    static FLAG_HAS_SIGNER: import("bn.js");
    static FLAG_HAS_REQUESTED_KEYS: import("bn.js");
    static FULL_DATA: import("bn.js");
    static PARTIAL_DATA: import("bn.js");
    static COLLECTION: import("bn.js");
    static ATTESTATION: import("bn.js");
    static CLAIM: import("bn.js");
    static CREDENTIAL: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    dataType: BigNumber;
    requestType: BigNumber;
    searchDataKeyHashType: BigNumber;
    searchDataKey: Array<{
        [key: string]: Buffer;
    }>;
    signer?: CompactIAddressObject;
    requestedKeys?: string[];
    requestID?: CompactIAddressObject;
    constructor(data?: UserDataRequestInterface);
    calcFlags(): BigNumber;
    setFlags(): void;
    hasSigner(): boolean;
    hasRequestedKeys(): boolean;
    hasRequestID(): boolean;
    /**
     * Checks if dataType is one of the supported values (FULL_DATA, PARTIAL_DATA, COLLECTION)
     * @returns True if dataType is valid
     */
    hasDataTypeSet(): boolean;
    /**
     * Checks if requestType is one of the supported values (ATTESTATION, CLAIM, CREDENTIAL)
     * @returns True if requestType is valid
     */
    hasRequestTypeSet(): boolean;
    hasSearchDataKeyHashTypeSet(): boolean;
    isValid(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): UserDataRequestJson;
    static fromJson(json: UserDataRequestJson): UserDataRequestDetails;
}
