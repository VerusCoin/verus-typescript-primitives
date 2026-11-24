"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedDelegatorProfileError = void 0;
exports.assertDelegatorProfileSupportedV1 = assertDelegatorProfileSupportedV1;
const vdxf_1 = require("../constants/vdxf");
const address_1 = require("../utils/address");
const KvMap_1 = require("../utils/KvMap");
const keys_1 = require("../vdxf/keys");
const ContentMultiMap_1 = require("./ContentMultiMap");
/** A present profile requires authorization support beyond v1. */
class UnsupportedDelegatorProfileError extends Error {
    constructor() {
        super("DelegatorProfile is unsupported by v1 authorization");
        this.code = "UNSUPPORTED_DELEGATOR_PROFILE";
        this.name = "UnsupportedDelegatorProfileError";
    }
}
exports.UnsupportedDelegatorProfileError = UnsupportedDelegatorProfileError;
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
function assertDelegatorProfileSupportedV1(effectiveCmm) {
    const profileKey = keys_1.DELEGATOR_PROFILE_VDXF_KEY.vdxfid;
    if (effectiveCmm instanceof ContentMultiMap_1.ContentMultiMap) {
        if (!(effectiveCmm.kvContent instanceof KvMap_1.KvMap)) {
            throw new Error("Expected an initialized effective delegator CMM");
        }
        if (effectiveCmm.kvContent.hasAddress(profileKey)) {
            throw new UnsupportedDelegatorProfileError();
        }
        return;
    }
    if (effectiveCmm === null ||
        typeof effectiveCmm !== "object" ||
        (Object.getPrototypeOf(effectiveCmm) !== Object.prototype &&
            Object.getPrototypeOf(effectiveCmm) !== null)) {
        throw new Error("Expected an effective delegator CMM object");
    }
    // Presence must not depend on truthiness, array length, or value decoding.
    if (Object.prototype.hasOwnProperty.call(effectiveCmm, profileKey)) {
        throw new UnsupportedDelegatorProfileError();
    }
    let hasInvalidKey = false;
    for (const key of Object.getOwnPropertyNames(effectiveCmm)) {
        let resolvedKey;
        try {
            resolvedKey = key.includes("::") ? (0, address_1.getDataKey)(key).id : key;
            // Reject malformed keys and accidentally supplied RPC envelopes/results.
            // Do not inspect unrelated values or try to decode a future profile.
            (0, address_1.decodeDestination)(resolvedKey, vdxf_1.I_ADDR_VERSION);
        }
        catch (_a) {
            // Still recognize a later profile key, so unsupported takes precedence
            // independent of key order and address versus qualified-name encoding.
            hasInvalidKey = true;
            continue;
        }
        if (resolvedKey === profileKey) {
            throw new UnsupportedDelegatorProfileError();
        }
    }
    if (hasInvalidKey) {
        throw new Error("Expected canonical I-address or fully qualified VDXF CMM keys");
    }
}
