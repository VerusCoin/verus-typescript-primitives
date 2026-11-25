import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableEntityBase } from "../../../utils/types/SerializableEntityBase";
import { SpendableKeyDetails, SpendableKeyDetailsJson } from "../backup/SpendableKeyDetails";
import { CompactIAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
export declare enum AppAuthorizationOfferRole {
    STORAGE = 1,
    AUTHORITY = 2,
    REVOCATION = 3,
    RECOVERY = 4
}
export interface AppAuthorizationOffer {
    role: AppAuthorizationOfferRole;
    identity: CompactIAddressObject;
}
export interface AppAuthorizationRequestDetailsInterface {
    version?: BigNumber;
    flags?: BigNumber;
    gift?: SpendableKeyDetails;
    offeredIdentities?: AppAuthorizationOffer[];
}
export interface AppAuthorizationRequestDetailsJson {
    version: number;
    flags: number;
    gift?: SpendableKeyDetailsJson;
    offeredIdentities?: {
        role: AppAuthorizationOfferRole;
        identity: CompactAddressObjectJson;
    }[];
}
/** Payload only: admission must also validate the signed GenericRequest contract. */
export declare class AppAuthorizationRequestDetails extends SerializableEntityBase {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static FLAGS_NONE: import("bn.js");
    static FLAG_REQUIRES_SHARED_STORAGE: import("bn.js");
    static FLAG_CONTAINS_GIFT: import("bn.js");
    static FLAG_CONTAINS_OFFERS: import("bn.js");
    static FLAG_CONTAINS_PERMISSIONS: import("bn.js");
    static FLAGS_SUPPORTED: import("bn.js");
    version: BigNumber;
    flags: BigNumber;
    gift?: SpendableKeyDetails;
    offeredIdentities?: AppAuthorizationOffer[];
    constructor(data?: AppAuthorizationRequestDetailsInterface);
    containsPermissions(): boolean;
    /** Every offered identity is resolved on the enclosing request-signing system. */
    validate(): void;
    isValid(): boolean;
    toBuffer(): Buffer;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AppAuthorizationRequestDetailsJson;
    static fromJson(json: AppAuthorizationRequestDetailsJson): AppAuthorizationRequestDetails;
}
