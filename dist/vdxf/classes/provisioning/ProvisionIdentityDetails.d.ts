/**
 * ProvisioningIdentity - Class for handling identity provisioning requests
 *
 * This class is used when an application is requesting the provisioning or creation of a new identity
 * within the Verus blockchain ecosystem. The request includes:
 * - System ID (e.g., VRSC@) defining the blockchain system
 * - Parent ID (e.g., Token@) defining the parent namespace
 * - Identity ID (e.g., john.VRSC@) defining the full identity to be provisioned
 * - Flags indicating which components are present and required
 *
 * The user's wallet can use these parameters to understand the complete identity hierarchy
 * and present a clear provisioning request to the user, showing the system context,
 * parent namespace, and the specific identity being created. This enables secure,
 * user-controlled identity provisioning with proper namespace management.
 */
import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { CompactIAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
import { RequestURI, RequestURIJson } from "../RequestURI";
export interface ProvisionIdentityDetailsInterface {
    version?: BigNumber;
    flags?: BigNumber;
    uri?: RequestURI;
    systemID?: CompactIAddressObject;
    parentID?: CompactIAddressObject;
    identityID?: CompactIAddressObject;
}
export interface ProvisionIdentityDetailsJson {
    version?: number;
    flags: number;
    uri?: RequestURIJson;
    systemid?: CompactAddressObjectJson;
    parentid?: CompactAddressObjectJson;
    identityid?: CompactAddressObjectJson;
}
export declare class ProvisionIdentityDetails extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    uri?: RequestURI;
    systemID?: CompactIAddressObject;
    parentID?: CompactIAddressObject;
    identityID?: CompactIAddressObject;
    static DEFAULT_VERSION: import("bn.js");
    static VERSION_FIRSTVALID: import("bn.js");
    static VERSION_LASTVALID: import("bn.js");
    static FLAG_HAS_SYSTEMID: import("bn.js");
    static FLAG_HAS_PARENTID: import("bn.js");
    static FLAG_HAS_IDENTITY_ID: import("bn.js");
    static FLAG_HAS_URI: import("bn.js");
    constructor(data?: ProvisionIdentityDetailsInterface);
    hasSystemId(): boolean;
    hasParentId(): boolean;
    hasIdentityId(): boolean;
    hasUri(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): ProvisionIdentityDetailsJson;
    static fromJson(data: any): ProvisionIdentityDetails;
    calcFlags(): BigNumber;
    setFlags(): void;
    isValid(): boolean;
}
