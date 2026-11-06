/**
 * Requests a derived Sapling address and channel keys for encrypted communication
 * and data sharing between a user and an app. Identity uploads are one use of
 * the channel, not a requirement.
 *
 * The enclosing GenericRequest must have a verified signature. Its optional
 * appOrDelegatorID defines the app scope; otherwise the signer defines the scope.
 * An explicit appOrDelegatorID requires a signer whose signing authority the user
 * fully controls, or an approved delegate once the delegate handshake is supported.
 * Delegate authorization is currently unsupported and must be rejected by clients.
 * Serialization and isValid() do not establish signature validity or authorization.
 *
 * First derive with fromId = the user's ID, toId = the authorized app scope, and
 * the wallet's key material. Without derivationID, return this address and keys.
 * With derivationID, derive again using the first result's extended spending key,
 * fromId = the same user's ID, and toId = derivationID. Return only the second
 * address and keys. derivationID can be any ID and never replaces the app scope
 * in the first derivation. Clients perform these operations with zGetEncryptionAddress.
 * The first call uses derivationNumber as its encryption index; the second uses
 * secondaryDerivationNumber, which defaults to zero when omitted.
 *
 * encryptResponseToAddress optionally protects the returned channel details;
 * it is distinct from the derived channel address. FLAG_RETURN_ESK requests the
 * final extended spending key, not an intermediate scope key. An intermediate
 * spending key is required internally for double derivation even without this flag.
 */
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
import { SaplingPaymentAddress } from '../../../pbaas';
export interface AppEncryptionRequestDetailsInterface {
    version?: BigNumber;
    flags: BigNumber;
    encryptResponseToAddress?: SaplingPaymentAddress;
    derivationNumber: BigNumber;
    /** Optional second-stage target within the authorized app scope. */
    derivationID?: CompactIAddressObject;
    /** Second-stage encryption index, defaulting to zero. Used only with derivationID. */
    secondaryDerivationNumber?: BigNumber;
    requestID?: CompactIAddressObject;
}
export interface AppEncryptionRequestDetailsJson {
    version: number;
    flags: number;
    encryptresponsetoaddress?: string;
    derivationnumber: number;
    derivationid?: CompactAddressObjectJson;
    secondaryderivationnumber?: number;
    requestid?: CompactAddressObjectJson;
}
export declare class AppEncryptionRequestDetails extends SerializableEntityBase implements SerializableEntity {
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
    secondaryDerivationNumber: BigNumber;
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
