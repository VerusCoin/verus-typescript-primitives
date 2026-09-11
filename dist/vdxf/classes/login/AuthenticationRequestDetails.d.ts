/**
 * AuthenticationRequestDetails - Class for handling application login and authentication requests
 *
 * This class is used when an application is requesting authentication or login from the user,
 * including specific recipientConstraints and callback information. The request includes:
 * - Request ID for tracking the authentication session
 * - Permission sets defining what access the application is requesting
 * - Optional expiry time for the authentication session
 *
 * The user's wallet can use these parameters to present a clear authentication request
 * to the user, showing exactly what recipientConstraints are being requested and where they will
 * be redirected after successful authentication. This enables secure, user-controlled
 * authentication flows with granular permission management.
 */
import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { CompactIAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
import { RecipientConstraint, RecipientConstraintInterface, RecipientConstraintJson } from "./RecipientConstraint";
export interface AuthenticationRequestDetailsInterface {
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    recipientConstraints?: Array<RecipientConstraint | RecipientConstraintInterface>;
    expiryTime?: BigNumber;
}
export interface AuthenticationRequestDetailsJson {
    requestid?: CompactAddressObjectJson;
    flags: number;
    recipientconstraints?: Array<RecipientConstraintJson>;
    expirytime?: number;
}
export declare class AuthenticationRequestDetails extends SerializableEntityBase implements SerializableEntity {
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    recipientConstraints?: Array<RecipientConstraint>;
    expiryTime?: BigNumber;
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    static FLAG_HAS_RECIPIENT_CONSTRAINTS: import("bn.js");
    static FLAG_HAS_EXPIRY_TIME: import("bn.js");
    constructor(request?: AuthenticationRequestDetailsInterface);
    hasRequestID(): boolean;
    hasRecipentConstraints(): boolean;
    hasExpiryTime(): boolean;
    calcFlags(flags?: BigNumber): BigNumber;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AuthenticationRequestDetailsJson;
    static fromJson(data: AuthenticationRequestDetailsJson): AuthenticationRequestDetails;
    setFlags(): void;
    isValid(): boolean;
}
