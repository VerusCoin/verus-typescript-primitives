import { AdvancedNameReservation } from '../AdvancedNameReservation';
import { IdentityID } from '../IdentityID';
import { NameReservation } from '../NameReservation';
import { OptCCParams } from '../OptCCParams';
import { TxDestination } from '../TxDestination';
import { EVALS } from '../../utils/evals';
import { boundedReader } from '../identityRegistrationSerialization';
import { SmartTransactionScript } from './SmartTransactionScript';
import { registrationParams, validateRegistrationDestination, validateRegistrationParams } from './IdentityRegistrationScriptUtils';

export type IdentityReservation = NameReservation | AdvancedNameReservation;

/** Identity-addressed reveal output. Consensus makes reservation outputs unspendable. */
export class IdentityReservationScript extends SmartTransactionScript {
  constructor(master?: OptCCParams, params?: OptCCParams) {
    super(master, params);
  }

  /** Legacy payloads omit their parent, so callers must explicitly supply it (null for root). */
  static fromReservation(reservation: IdentityReservation, legacyParent?: string | null): IdentityReservationScript {
    reservation.validateForCreation();
    const advanced = reservation instanceof AdvancedNameReservation;
    if (!advanced && legacyParent === undefined) {
      throw new Error('legacy reservation scripts require an explicit parent identity or null');
    }
    const identityAddress = advanced ? reservation.getIdentityAddress() : reservation.getIdentityAddress(legacyParent);
    const destination = new TxDestination(IdentityID.fromAddress(identityAddress));
    const script = new IdentityReservationScript(
      registrationParams(EVALS.EVAL_NONE, [destination], []),
      registrationParams(
        advanced ? EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION : EVALS.EVAL_IDENTITY_RESERVATION,
        [destination],
        [reservation.toBuffer()]
      )
    );
    script.validate();
    return script;
  }

  private validate(): IdentityReservation {
    validateRegistrationParams(this.master, this.params, [
      EVALS.EVAL_IDENTITY_RESERVATION,
      EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION
    ]);
    if (!this.params.n.eqn(1)) throw new Error('reservation script requires exactly one destination');
    validateRegistrationDestination(this.params.destinations[0], true);
    const advanced = this.params.evalCode.eqn(EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION);
    const reservation = advanced ? new AdvancedNameReservation() : new NameReservation();
    const payload = this.params.vData[0];
    if (reservation.fromBuffer(payload) !== payload.length || !reservation.toBuffer().equals(payload)) {
      throw new Error('invalid or noncanonical reservation payload');
    }
    // Null-parent advanced payloads depend on the daemon's root context, which
    // is not encoded in the script. Preserve them structurally like legacy
    // payloads; callers can verify their destination with explicit root context.
    if (advanced && !(reservation as AdvancedNameReservation).parent.hash.equals(Buffer.alloc(20)) &&
        (reservation as AdvancedNameReservation).getIdentityAddress() !== this.params.destinations[0].toAddress()) {
      throw new Error('advanced reservation destination does not match its name and parent');
    }
    return reservation;
  }

  getReservation(): IdentityReservation {
    return this.validate();
  }

  /**
   * Return the encoded destination. Verify legacy payloads with explicit parent
   * context, or null-parent advanced payloads with explicit root system context.
   */
  getIdentityAddress(legacyParent?: string | null, rootSystemName?: string): string {
    const reservation = this.validate();
    const address = this.params.destinations[0].toAddress();
    if (reservation instanceof AdvancedNameReservation && rootSystemName !== undefined &&
        reservation.getIdentityAddress(rootSystemName) !== address) {
      throw new Error('advanced reservation destination does not match its name and supplied root system');
    }
    if (!(reservation instanceof AdvancedNameReservation) && legacyParent !== undefined &&
        reservation.getIdentityAddress(legacyParent) !== address) {
      throw new Error('legacy reservation destination does not match its name and supplied parent');
    }
    return address;
  }

  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    boundedReader(buffer, offset, length);
    const end = super.fromBuffer(buffer, offset, length);
    this.validate();
    if (!super.toBuffer().equals(buffer.subarray(offset, end))) {
      throw new Error('noncanonical identity reservation script');
    }
    return end;
  }

  toBuffer(): Buffer {
    this.validate();
    return super.toBuffer();
  }

  getByteLength(): number {
    return this.toBuffer().length;
  }
}
