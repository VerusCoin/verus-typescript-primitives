import { ContentMultiMap } from "./ContentMultiMap";
/** A present profile requires authorization support beyond v1. */
export declare class UnsupportedDelegatorProfileError extends Error {
    readonly code = "UNSUPPORTED_DELEGATOR_PROFILE";
    constructor();
}
/**
 * Reject the reserved outer key in a delegator's effective CMM, regardless of
 * the profile values, their encoding, or their version. This is a presence
 * check only; success does not establish authorization.
 *
 * Callers must supply the complete, removal-aware content from a successful
 * current getidentitycontent read for GenericRequest.appOrDelegatorID on the
 * resolved delegator system. Identity/system binding, read freshness, RPC failure
 * handling and cache invalidation remain the caller's responsibility. Never
 * substitute an empty map for missing content or use transaction-local CMM.
 *
 * Prefer the raw RPC contentmultimap before decoding: ContentMultiMap.fromJson
 * can discard entries (for example null values). A ContentMultiMap is accepted
 * only when the caller has preserved every effective outer key. JSON keys may
 * be canonical I-addresses or fully qualified VDXF names; values are not read.
 *
 * Apply this guard before initial authorization side effects, on continuation,
 * and when using existing grants, including immediately before sensitive work.
 */
export declare function assertDelegatorProfileSupportedV1(effectiveCmm: Record<string, unknown> | ContentMultiMap): void;
