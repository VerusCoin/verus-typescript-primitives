import { BigNumber } from "../utils/types/BigNumber";
import { Credential } from "./Credential";
/** An exact confirmed identity revision used as the approval policy baseline. */
export interface AuthorizationIdentityRevision {
    txid: string;
    vout: number;
}
/** Persistent delegation metadata; the containing user identity supplies the user binding. */
export interface AuthorizationCredentialData {
    version: BigNumber;
    flags: BigNumber;
    grantID: string;
    /** System of the delegate revision. Defaults to the configured VRSC/VRSCTEST root. */
    delegateSystemID?: string;
    /** System of the delegator revision. Defaults to the delegate's system. */
    delegatorSystemID?: string;
    delegateRevision: AuthorizationIdentityRevision;
    delegatorRevision: AuthorizationIdentityRevision;
    storageManifestHash?: string;
}
/** One storage identity associated with a grant; control is checked from current state. */
export interface AuthorizationStorageBindingData {
    version: BigNumber;
    grantID: string;
    relationshipIndex: number;
    /** Inherits the delegate's request-signing system, or the network root without a grant. */
    storageSystemID?: string;
    storageID: string;
}
/**
 * Typed records use their registered VDXF credential keys by default.
 * Explicit keys remain supported for callers using a separate namespace.
 */
declare abstract class AuthorizationRecord<T> {
    data: T;
    private readonly credentialKey;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_LAST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    constructor(data: T, credentialKey: string);
    abstract toPayload(): object;
    toCredential(credentialKey?: string, label?: string): Credential;
}
/** Compact approval metadata with distinct delegate and delegator revision baselines. */
export declare class AuthorizationCredential extends AuthorizationRecord<AuthorizationCredentialData> {
    static CREDENTIAL_KEY: string;
    static FLAGS_NONE: import("bn.js");
    static FLAG_CONTAINS_PERMISSIONS: import("bn.js");
    static FLAG_CONTAINS_STORAGE_BINDINGS: import("bn.js");
    constructor(data: AuthorizationCredentialData);
    getDelegateSystemID(rootSystemID?: string): string;
    getDelegatorSystemID(rootSystemID?: string): string;
    containsPermissions(): boolean;
    toPayload(): object;
    static fromCredential(record: Credential, expectedKey?: string): AuthorizationCredential;
    static fromPayload(payload: any): AuthorizationCredential;
}
/** One independently manageable storage identity, bound to its authorization grant. */
export declare class AuthorizationStorageBindingCredential extends AuthorizationRecord<AuthorizationStorageBindingData> {
    static CREDENTIAL_KEY: string;
    constructor(data: AuthorizationStorageBindingData);
    /** The caller supplies the resolved delegate system, or the network root for an orphan. */
    getSystemID(defaultSystemID?: string): string;
    get recordID(): string;
    toPayload(): object;
    static fromCredential(record: Credential, expectedKey?: string): AuthorizationStorageBindingCredential;
    static fromPayload(p: any): AuthorizationStorageBindingCredential;
}
export type AuthorizationStorageRecord = AuthorizationStorageBindingCredential;
/** Validate the complete binding set, collapse identical copies, and commit canonical bytes. */
export declare function deriveAppAuthorizationStorageManifest(records: AuthorizationStorageRecord[], defaultSystemID?: string): string;
/** Verify the committed set against this grant, including its grant ID. */
export declare function verifyAppAuthorizationStorageManifest(grant: AuthorizationCredential, records: AuthorizationStorageRecord[], rootSystemID?: string): boolean;
export {};
