"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDelegateSystemID = resolveDelegateSystemID;
exports.resolveDelegatorSystemID = resolveDelegatorSystemID;
exports.deriveAppAuthorizationGrantID = deriveAppAuthorizationGrantID;
const hash_1 = require("../utils/hash");
const pbaas_1 = require("../constants/pbaas");
const string_1 = require("../utils/string");
const vdxf_1 = require("../constants/vdxf");
const address_1 = require("../utils/address");
/** A credential without a delegate system uses its configured network root. */
function resolveDelegateSystemID(delegateSystemID, rootSystemID) {
    if (delegateSystemID !== undefined) {
        (0, address_1.decodeDestination)(delegateSystemID, vdxf_1.I_ADDR_VERSION);
        return delegateSystemID;
    }
    if (rootSystemID !== pbaas_1.DEFAULT_VERUS_CHAINID &&
        rootSystemID !== pbaas_1.TESTNET_VERUS_CHAINID) {
        throw new Error("An explicit VRSC or VRSCTEST root system is required");
    }
    return rootSystemID;
}
function resolveDelegatorSystemID(delegatorSystemID, delegateSystemID, rootSystemID) {
    if (delegatorSystemID === undefined) {
        return resolveDelegateSystemID(delegateSystemID, rootSystemID);
    }
    (0, address_1.decodeDestination)(delegatorSystemID, vdxf_1.I_ADDR_VERSION);
    return delegatorSystemID;
}
/**
 * Bind an envelope hash to the selected user, request signer and app scope.
 * Signature metadata is not part of the raw envelope hash, so callers must
 * supply identities obtained from the verified request and selected user.
 * Omit delegatorSystemID when the delegator is resolved on the delegate's system.
 */
function deriveAppAuthorizationGrantID(user, delegate, appID, originalRequestHash, delegatorSystemID = delegate.systemID) {
    if (!(0, string_1.isHexString)(originalRequestHash) ||
        originalRequestHash.length !== vdxf_1.HASH256_BYTE_LENGTH * 2) {
        throw new Error("Expected a 32-byte request hash");
    }
    // Each identity contributes its resolved system ID followed by its identity ID.
    return (0, hash_1.hashData)(Buffer.concat([
        Buffer.from("VerusAppAuthorizationGrant/v1\0", "utf8"),
        (0, address_1.decodeDestination)(user.systemID, vdxf_1.I_ADDR_VERSION),
        (0, address_1.decodeDestination)(user.identityID, vdxf_1.I_ADDR_VERSION),
        (0, address_1.decodeDestination)(delegate.systemID, vdxf_1.I_ADDR_VERSION),
        (0, address_1.decodeDestination)(delegate.identityID, vdxf_1.I_ADDR_VERSION),
        (0, address_1.decodeDestination)(delegatorSystemID, vdxf_1.I_ADDR_VERSION),
        (0, address_1.decodeDestination)(appID, vdxf_1.I_ADDR_VERSION),
        Buffer.from(originalRequestHash, "hex"),
    ])).toString("hex");
}
