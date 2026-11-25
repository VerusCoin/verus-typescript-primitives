export interface AppAuthorizationIdentity {
    systemID: string;
    identityID: string;
}
/** A credential without a delegate system uses its configured network root. */
export declare function resolveDelegateSystemID(delegateSystemID?: string, rootSystemID?: string): string;
export declare function resolveDelegatorSystemID(delegatorSystemID?: string, delegateSystemID?: string, rootSystemID?: string): string;
/**
 * Bind an envelope hash to the selected user, request signer and app scope.
 * Signature metadata is not part of the raw envelope hash, so callers must
 * supply identities obtained from the verified request and selected user.
 * Omit delegatorSystemID when the delegator is resolved on the delegate's system.
 */
export declare function deriveAppAuthorizationGrantID(user: AppAuthorizationIdentity, delegate: AppAuthorizationIdentity, appID: string, originalRequestHash: string, delegatorSystemID?: string): string;
