"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityReservationScript = void 0;
const AdvancedNameReservation_1 = require("../AdvancedNameReservation");
const IdentityID_1 = require("../IdentityID");
const NameReservation_1 = require("../NameReservation");
const TxDestination_1 = require("../TxDestination");
const evals_1 = require("../../utils/evals");
const identityRegistrationSerialization_1 = require("../identityRegistrationSerialization");
const SmartTransactionScript_1 = require("./SmartTransactionScript");
const IdentityRegistrationScriptUtils_1 = require("./IdentityRegistrationScriptUtils");
/** Identity-addressed reveal output. Consensus makes reservation outputs unspendable. */
class IdentityReservationScript extends SmartTransactionScript_1.SmartTransactionScript {
    constructor(master, params) {
        super(master, params);
    }
    /** Legacy payloads omit their parent, so callers must explicitly supply it (null for root). */
    static fromReservation(reservation, legacyParent) {
        reservation.validateForCreation();
        const advanced = reservation instanceof AdvancedNameReservation_1.AdvancedNameReservation;
        if (!advanced && legacyParent === undefined) {
            throw new Error('legacy reservation scripts require an explicit parent identity or null');
        }
        const identityAddress = advanced ? reservation.getIdentityAddress() : reservation.getIdentityAddress(legacyParent);
        const destination = new TxDestination_1.TxDestination(IdentityID_1.IdentityID.fromAddress(identityAddress));
        const script = new IdentityReservationScript((0, IdentityRegistrationScriptUtils_1.registrationParams)(evals_1.EVALS.EVAL_NONE, [destination], []), (0, IdentityRegistrationScriptUtils_1.registrationParams)(advanced ? evals_1.EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION : evals_1.EVALS.EVAL_IDENTITY_RESERVATION, [destination], [reservation.toBuffer()]));
        script.validate();
        return script;
    }
    validate() {
        (0, IdentityRegistrationScriptUtils_1.validateRegistrationParams)(this.master, this.params, [
            evals_1.EVALS.EVAL_IDENTITY_RESERVATION,
            evals_1.EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION
        ]);
        if (!this.params.n.eqn(1))
            throw new Error('reservation script requires exactly one destination');
        (0, IdentityRegistrationScriptUtils_1.validateRegistrationDestination)(this.params.destinations[0], true);
        const advanced = this.params.evalCode.eqn(evals_1.EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION);
        const reservation = advanced ? new AdvancedNameReservation_1.AdvancedNameReservation() : new NameReservation_1.NameReservation();
        const payload = this.params.vData[0];
        if (reservation.fromBuffer(payload) !== payload.length || !reservation.toBuffer().equals(payload)) {
            throw new Error('invalid or noncanonical reservation payload');
        }
        // Null-parent advanced payloads depend on the daemon's root context, which
        // is not encoded in the script. Preserve them structurally like legacy
        // payloads; callers can verify their destination with explicit root context.
        if (advanced && !reservation.parent.hash.equals(Buffer.alloc(20)) &&
            reservation.getIdentityAddress() !== this.params.destinations[0].toAddress()) {
            throw new Error('advanced reservation destination does not match its name and parent');
        }
        return reservation;
    }
    getReservation() {
        return this.validate();
    }
    /**
     * Return the encoded destination. Verify legacy payloads with explicit parent
     * context, or null-parent advanced payloads with explicit root system context.
     */
    getIdentityAddress(legacyParent, rootSystemName) {
        const reservation = this.validate();
        const address = this.params.destinations[0].toAddress();
        if (reservation instanceof AdvancedNameReservation_1.AdvancedNameReservation && rootSystemName !== undefined &&
            reservation.getIdentityAddress(rootSystemName) !== address) {
            throw new Error('advanced reservation destination does not match its name and supplied root system');
        }
        if (!(reservation instanceof AdvancedNameReservation_1.AdvancedNameReservation) && legacyParent !== undefined &&
            reservation.getIdentityAddress(legacyParent) !== address) {
            throw new Error('legacy reservation destination does not match its name and supplied parent');
        }
        return address;
    }
    fromBuffer(buffer, offset = 0, length) {
        (0, identityRegistrationSerialization_1.boundedReader)(buffer, offset, length);
        const end = super.fromBuffer(buffer, offset, length);
        this.validate();
        if (!super.toBuffer().equals(buffer.subarray(offset, end))) {
            throw new Error('noncanonical identity reservation script');
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
exports.IdentityReservationScript = IdentityReservationScript;
