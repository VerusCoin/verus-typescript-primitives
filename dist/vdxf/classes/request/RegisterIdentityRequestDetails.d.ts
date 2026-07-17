import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { BigNumber } from '../../../utils/types/BigNumber';
export type RegisterIdentityParamsJson = {
    name?: string;
    parent?: string;
    primaryaddresses?: string[];
    revocationauthority?: string;
    recoveryauthority?: string;
    commitmenttxid?: string;
    commitmentvout?: number;
};
export type RegisterIdentityRequestDetailsJson = {
    flags?: string;
    returnTxHex?: string;
    description?: string;
    registerParams?: RegisterIdentityParamsJson;
};
/**
 * Parameters a wallet needs to review / co-sign a registeridentity returntx:
 *   - identity leaf name + parent namespace
 *   - primaryaddresses the new ID will be controlled by
 *   - revocation/recovery authorities
 *   - commitment outpoint being spent
 * The unsigned (or partially signed) returntx hex lives on the outer Details.
 */
export declare class RegisterIdentityParams implements SerializableEntity {
    name?: string;
    parent?: string;
    primaryAddresses: string[];
    revocationAuthority?: string;
    recoveryAuthority?: string;
    commitmentTxid?: string;
    commitmentVout: number;
    constructor(data?: {
        name?: string;
        parent?: string;
        primaryAddresses?: string[];
        revocationAuthority?: string;
        recoveryAuthority?: string;
        commitmentTxid?: string;
        commitmentVout?: number;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): RegisterIdentityParamsJson;
    static fromJson(json: RegisterIdentityParamsJson): RegisterIdentityParams;
}
export declare class RegisterIdentityRequestDetails implements SerializableEntity {
    static REGISTER_IDENTITY_REQUEST_VALID: import("bn.js");
    static REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX: import("bn.js");
    static REGISTER_IDENTITY_REQUEST_CONTAINS_DESC: import("bn.js");
    static REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS: import("bn.js");
    flags: BigNumber;
    returnTxHex?: string;
    description?: string;
    registerParams?: RegisterIdentityParams;
    constructor(data?: {
        flags?: BigNumber;
        returnTxHex?: string;
        description?: string;
        registerParams?: RegisterIdentityParams;
    });
    containsReturnTx(): boolean;
    containsDesc(): boolean;
    containsRegisterParams(): boolean;
    toggleContainsReturnTx(): void;
    toggleContainsDesc(): void;
    toggleContainsRegisterParams(): void;
    isValid(): boolean;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): RegisterIdentityRequestDetailsJson;
    static fromJson(json: RegisterIdentityRequestDetailsJson): RegisterIdentityRequestDetails;
}
