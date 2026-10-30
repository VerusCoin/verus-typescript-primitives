"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegistrationDestination = validateRegistrationDestination;
exports.registrationParams = registrationParams;
exports.validateRegistrationParams = validateRegistrationParams;
const bn_js_1 = require("bn.js");
const IdentityID_1 = require("../IdentityID");
const KeyID_1 = require("../KeyID");
const OptCCParams_1 = require("../OptCCParams");
const PubKey_1 = require("../PubKey");
const TxDestination_1 = require("../TxDestination");
const evals_1 = require("../../utils/evals");
const vdxf_1 = require("../../constants/vdxf");
/** Destination forms supported by version-3 identity registration conditions. */
function validateRegistrationDestination(destination, identityOnly = false) {
    if (destination == null || !bn_js_1.BN.isBN(destination.type)) {
        throw new Error('registration script requires a valid destination');
    }
    const isIdentity = destination.type.eq(TxDestination_1.TxDestination.TYPE_ID) && destination.data instanceof IdentityID_1.IdentityID;
    const isKey = destination.type.eq(TxDestination_1.TxDestination.TYPE_PKH) && destination.data instanceof KeyID_1.KeyID;
    const isPubKey = destination.type.eq(TxDestination_1.TxDestination.TYPE_PK) && destination.data instanceof PubKey_1.PubKey;
    if (identityOnly && !isIdentity) {
        throw new Error('registration authorization and reservation destinations must be identities');
    }
    if (isIdentity || isKey) {
        const data = destination.data;
        const hash = data.hash;
        if (data.version !== (isIdentity ? vdxf_1.I_ADDR_VERSION : vdxf_1.R_ADDR_VERSION) || data.varlength !== false ||
            !Buffer.isBuffer(hash) || hash.length !== 20 || hash.equals(Buffer.alloc(20))) {
            throw new Error('registration script requires a canonical nonzero 20-byte destination');
        }
    }
    else if (isPubKey) {
        const publicKey = destination.data;
        if (!publicKey.compressed || publicKey.bytes.length !== 33 ||
            (publicKey.bytes[0] !== 2 && publicKey.bytes[0] !== 3)) {
            throw new Error('registration script requires a compressed public-key destination');
        }
    }
    else {
        throw new Error('unsupported registration script destination');
    }
}
function registrationParams(evalCode, destinations, vData) {
    return new OptCCParams_1.OptCCParams({
        version: new bn_js_1.BN(3),
        evalCode: new bn_js_1.BN(evalCode),
        m: new bn_js_1.BN(destinations.length),
        n: new bn_js_1.BN(destinations.length),
        destinations,
        vData
    });
}
/** Validate the single-object MakeMofNCCScript envelope, keeping master data separate. */
function validateRegistrationParams(master, params, evalCodes) {
    if (master == null || params == null) {
        throw new Error('registration script is missing its optional parameters');
    }
    for (const part of [master, params]) {
        if (![part.version, part.evalCode, part.m, part.n].every(bn_js_1.BN.isBN) ||
            !part.version.eqn(3) || !part.n.eqn(part.destinations.length) || !part.m.eq(part.n)) {
            throw new Error('invalid registration script header or threshold');
        }
    }
    if (!master.evalCode.eqn(evals_1.EVALS.EVAL_NONE) || !master.m.eqn(1) || master.vData.length !== 0 ||
        evalCodes.indexOf(params.evalCode.toNumber()) === -1 || params.vData.length !== 1) {
        throw new Error('invalid registration script eval, index, or payload count');
    }
    validateRegistrationDestination(master.destinations[0]);
    if (params.destinations.length < 1 || params.destinations.length > 2) {
        throw new Error('invalid registration script destination count');
    }
    params.destinations.forEach(destination => validateRegistrationDestination(destination));
    if (!master.destinations[0].toChunk().equals(params.destinations[0].toChunk())) {
        throw new Error('registration script index must match its first condition destination');
    }
}
