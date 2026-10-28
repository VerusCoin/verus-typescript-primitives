import { Identity, VerusCLIVerusIDJson } from '../pbaas/Identity';
export declare const IDENTITY_REGISTRATION_MAX_BYTES: number;
/**
 * Validate a leaf for new registrations, without changing its approved bytes.
 * This intentionally rejects overlong names instead of applying the daemon's
 * truncating lookup behavior. It also rejects all C0/DEL controls, including NUL
 * (which can cause C-string name hashing to disagree with the reserved bytes).
 * Historical reservation decoding should use structural validation instead.
 */
export declare function validateIdentityRegistrationName(name: string): void;
export interface IdentityRegistrationNameRequest {
    /** A leaf or a fully qualified name; a final @ is optional. */
    name: string;
    /** Explicit global root, such as VRSC or VRSCTEST. There is no network default. */
    rootSystemName: string;
    /** Registration chain i-address, supplied from the caller's chain context. */
    systemID: string;
    /** Optional selected namespace i-address. Must agree with every supplied name. */
    parent?: string;
    /** Namespace name, required for a leaf plus a non-root parent i-address. */
    parentName?: string;
}
export interface ResolvedIdentityRegistrationName {
    name: string;
    nameBytes: Buffer;
    parent: string;
    fullName: string;
    identityID: string;
    systemID: string;
    rootSystemName: string;
}
/**
 * Resolve names without RPC lookups. Parent derivation is performed once, and
 * explicit parent/name disagreement is rejected. Resolution does not establish
 * that the namespace is a registered currency, permits IDs, or issues on systemID.
 * Those chain-state checks belong to the registration client.
 */
export declare function resolveIdentityRegistrationName(request: IdentityRegistrationNameRequest): ResolvedIdentityRegistrationName;
/**
 * Validate an ordinary current-version identity against the approved reservation.
 * Only KeyID (public-key-hash) primary authorities are currently supported by the
 * Identity/Principal serializers; compressed public-key principals are unsupported.
 * Authorities may be self or external, but existence/revocation, namespace policy,
 * name availability, funding, and signatures require separate chain-state checks.
 * No fields are defaulted or mutated by this function.
 */
export declare function validateIdentityForRegistration(identity: Identity, expected: ResolvedIdentityRegistrationName): void;
/**
 * Parse an approved full daemon-shaped identity definition for registration.
 * All authority, version, flag, threshold and timelock fields must be explicit;
 * optional content may be omitted. Unlike the general historical JSON parser,
 * this checks original address versions before KeyID/IdentityID can coerce them.
 */
export declare function identityFromJSONForRegistration(json: VerusCLIVerusIDJson, expected: ResolvedIdentityRegistrationName): Identity;
