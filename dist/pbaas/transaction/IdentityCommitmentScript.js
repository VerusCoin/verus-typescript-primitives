"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityCommitmentScript = void 0;
const CommitmentHash_1 = require("../CommitmentHash");
const evals_1 = require("../../utils/evals");
const identityRegistrationSerialization_1 = require("../identityRegistrationSerialization");
const SmartTransactionScript_1 = require("./SmartTransactionScript");
const IdentityRegistrationScriptUtils_1 = require("./IdentityRegistrationScriptUtils");
/** The daemon's controller-indexed, one- or two-party name commitment output. */
class IdentityCommitmentScript extends SmartTransactionScript_1.SmartTransactionScript {
    constructor(master, params) {
        super(master, params);
    }
    /** Authorization is the issuer identity, or required referring identity, resolved by the caller. */
    static fromCommitment(commitment, controller, authorization) {
        if (!commitment.isValid() || commitment.isAdvanced()) {
            throw new Error('name registration requires an ordinary, nonzero commitment hash');
        }
        (0, IdentityRegistrationScriptUtils_1.validateRegistrationDestination)(controller);
        if (authorization != null)
            (0, IdentityRegistrationScriptUtils_1.validateRegistrationDestination)(authorization, true);
        const destinations = authorization == null ? [controller] : [controller, authorization];
        const script = new IdentityCommitmentScript((0, IdentityRegistrationScriptUtils_1.registrationParams)(evals_1.EVALS.EVAL_NONE, [controller], []), (0, IdentityRegistrationScriptUtils_1.registrationParams)(evals_1.EVALS.EVAL_IDENTITY_COMMITMENT, destinations, [commitment.toBuffer()]));
        script.validate();
        return script;
    }
    validate() {
        (0, IdentityRegistrationScriptUtils_1.validateRegistrationParams)(this.master, this.params, [evals_1.EVALS.EVAL_IDENTITY_COMMITMENT]);
        if (this.params.destinations.length === 2) {
            (0, IdentityRegistrationScriptUtils_1.validateRegistrationDestination)(this.params.destinations[1], true);
        }
        const payload = this.params.vData[0];
        const commitment = new CommitmentHash_1.CommitmentHash();
        if (commitment.fromBuffer(payload) !== payload.length || !commitment.isValid() || !commitment.toBuffer().equals(payload)) {
            throw new Error('invalid or noncanonical commitment payload');
        }
        return commitment;
    }
    getCommitment() {
        return this.validate();
    }
    getController() {
        this.validate();
        return this.params.destinations[0];
    }
    getAuthorization() {
        this.validate();
        return this.params.destinations[1];
    }
    fromBuffer(buffer, offset = 0, length) {
        (0, identityRegistrationSerialization_1.boundedReader)(buffer, offset, length);
        const end = super.fromBuffer(buffer, offset, length);
        this.validate();
        if (!super.toBuffer().equals(buffer.subarray(offset, end))) {
            throw new Error('noncanonical identity commitment script');
        }
        return end;
    }
    toBuffer() {
        this.validate();
        return super.toBuffer();
    }
    getByteLength() {
        return this.toBuffer().length;
    }
}
exports.IdentityCommitmentScript = IdentityCommitmentScript;
