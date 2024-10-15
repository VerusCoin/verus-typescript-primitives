"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityScript = void 0;
const bn_js_1 = require("bn.js");
const Identity_1 = require("../Identity");
const OptCCParams_1 = require("../OptCCParams");
const SmartTransactionScript_1 = require("./SmartTransactionScript");
const evals_1 = require("../../utils/evals");
const TxDestination_1 = require("../TxDestination");
const IdentityID_1 = require("../IdentityID");
const cccustom_1 = require("../../utils/cccustom");
const KeyID_1 = require("../KeyID");
class IdentityScript extends SmartTransactionScript_1.SmartTransactionScript {
    constructor(master, params) {
        super(master, params);
    }
    static fromIdentity(identity) {
        if (identity.version.lt(Identity_1.Identity.VERSION_CURRENT)) {
            throw new Error("Cannot generate script for outdated identity version");
        }
        const identityAddress = identity.getIdentityAddress();
        const destinationsMaster = identity.isRevoked() ? [
            new TxDestination_1.TxDestination(IdentityID_1.IdentityID.fromAddress(identityAddress)),
            new TxDestination_1.TxDestination(identity.recovery_authority)
        ] : [
            new TxDestination_1.TxDestination(IdentityID_1.IdentityID.fromAddress(identityAddress)),
            new TxDestination_1.TxDestination(identity.revocation_authority),
            new TxDestination_1.TxDestination(identity.recovery_authority)
        ];
        const destinationsRecovery = [
            new TxDestination_1.TxDestination(identity.recovery_authority)
        ];
        if (identity.hasTokenizedIdControl()) {
            const addrDestination = new TxDestination_1.TxDestination(KeyID_1.KeyID.fromAddress(cccustom_1.IDENTITY_RECOVER_ADDR));
            destinationsRecovery.push(addrDestination);
        }
        const master = new OptCCParams_1.OptCCParams({
            version: Identity_1.Identity.VERSION_CURRENT,
            eval_code: new bn_js_1.BN(evals_1.EVALS.EVAL_NONE),
            m: new bn_js_1.BN(1),
            n: new bn_js_1.BN(destinationsMaster.length),
            destinations: destinationsMaster,
            vdata: []
        });
        const params = new OptCCParams_1.OptCCParams({
            version: Identity_1.Identity.VERSION_CURRENT,
            eval_code: new bn_js_1.BN(evals_1.EVALS.EVAL_IDENTITY_PRIMARY),
            m: new bn_js_1.BN(1),
            n: new bn_js_1.BN(1),
            destinations: [
                new TxDestination_1.TxDestination(IdentityID_1.IdentityID.fromAddress(identityAddress))
            ],
            vdata: identity.isRevoked() ? [
                identity.toBuffer(),
                new OptCCParams_1.OptCCParams({
                    version: Identity_1.Identity.VERSION_CURRENT,
                    eval_code: new bn_js_1.BN(evals_1.EVALS.EVAL_IDENTITY_RECOVER),
                    m: new bn_js_1.BN(1),
                    n: new bn_js_1.BN(destinationsRecovery.length),
                    destinations: destinationsRecovery,
                    vdata: []
                }).toChunk()
            ] : [
                identity.toBuffer(),
                new OptCCParams_1.OptCCParams({
                    version: Identity_1.Identity.VERSION_CURRENT,
                    eval_code: new bn_js_1.BN(evals_1.EVALS.EVAL_IDENTITY_REVOKE),
                    m: new bn_js_1.BN(1),
                    n: new bn_js_1.BN(1),
                    destinations: [
                        new TxDestination_1.TxDestination(identity.revocation_authority)
                    ],
                    vdata: []
                }).toChunk(),
                new OptCCParams_1.OptCCParams({
                    version: Identity_1.Identity.VERSION_CURRENT,
                    eval_code: new bn_js_1.BN(evals_1.EVALS.EVAL_IDENTITY_RECOVER),
                    m: new bn_js_1.BN(1),
                    n: new bn_js_1.BN(destinationsRecovery.length),
                    destinations: destinationsRecovery,
                    vdata: []
                }).toChunk()
            ]
        });
        return new IdentityScript(master, params);
    }
    getIdentity(parseVdxfObjects = false) {
        const identity = new Identity_1.Identity();
        identity.fromBuffer(this.params.getParamObject(), 0, parseVdxfObjects);
        return identity;
    }
}
exports.IdentityScript = IdentityScript;
