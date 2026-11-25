import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableEntityBase } from "../../../utils/types/SerializableEntityBase";
import { CompactAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
export declare enum AppAuthorizationOutcome {
    SUCCESS = 0,
    REJECTED = 1,
    CANCELLED = 2,
    FAILED = 3,
    EXPIRED = 4
}
export interface AppAuthorizationStorageBinding {
    storageIdentity: CompactAddressObject;
    revocationIdentity: CompactAddressObject;
    recoveryIdentity: CompactAddressObject;
}
export interface AppAuthorizationResponseDetailsInterface {
    version?: BigNumber;
    flags?: BigNumber;
    outcome: AppAuthorizationOutcome;
    requestSigningSystemID: string;
    delegateID: string;
    grantID?: string;
    storageBindings?: AppAuthorizationStorageBinding[];
    grantTransaction?: {
        txid: string;
        vout: number;
    };
}
export interface AppAuthorizationResponseDetailsJson extends Omit<AppAuthorizationResponseDetailsInterface, "storageBindings" | "version" | "flags"> {
    version: number;
    flags: number;
    storageBindings?: {
        storageIdentity: CompactAddressObjectJson;
        revocationIdentity: CompactAddressObjectJson;
        recoveryIdentity: CompactAddressObjectJson;
    }[];
}
/** Signed completion metadata; it does not replace fresh authorization-state checks. */
export declare class AppAuthorizationResponseDetails extends SerializableEntityBase {
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static FLAGS_NONE: import("bn.js");
    static FLAG_CONTAINS_GRANT_ID: import("bn.js");
    static FLAG_CONTAINS_STORAGE_BINDINGS: import("bn.js");
    static FLAG_CONTAINS_GRANT_TRANSACTION: import("bn.js");
    static FLAGS_SUPPORTED: import("bn.js");
    version: import("bn.js");
    flags: import("bn.js");
    outcome: AppAuthorizationOutcome;
    requestSigningSystemID: string;
    delegateID: string;
    grantID?: string;
    storageBindings?: AppAuthorizationStorageBinding[];
    grantTransaction?: {
        txid: string;
        vout: number;
    };
    constructor(data?: AppAuthorizationResponseDetailsInterface);
    /** Pass the original request requirement when validating a successful response. */
    validate(requiresSharedStorage?: boolean): void;
    isValid(): boolean;
    toBuffer(): Buffer;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AppAuthorizationResponseDetailsJson;
    static fromJson(json: AppAuthorizationResponseDetailsJson): AppAuthorizationResponseDetails;
}
