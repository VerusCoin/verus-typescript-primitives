import { CommitmentHash } from '../CommitmentHash';
import { OptCCParams } from '../OptCCParams';
import { TxDestination } from '../TxDestination';
import { EVALS } from '../../utils/evals';
import { boundedReader } from '../identityRegistrationSerialization';
import { SmartTransactionScript } from './SmartTransactionScript';
import { registrationParams, validateRegistrationDestination, validateRegistrationParams } from './IdentityRegistrationScriptUtils';

/** The daemon's controller-indexed, one- or two-party name commitment output. */
export class IdentityCommitmentScript extends SmartTransactionScript {
  constructor(master?: OptCCParams, params?: OptCCParams) {
    super(master, params);
  }

  /** Authorization is the issuer identity, or required referring identity, resolved by the caller. */
  static fromCommitment(commitment: CommitmentHash, controller: TxDestination, authorization?: TxDestination): IdentityCommitmentScript {
    if (!commitment.isValid() || commitment.isAdvanced()) {
      throw new Error('name registration requires an ordinary, nonzero commitment hash');
    }
    validateRegistrationDestination(controller);
    if (authorization != null) validateRegistrationDestination(authorization, true);
    const destinations = authorization == null ? [controller] : [controller, authorization];
    const script = new IdentityCommitmentScript(
      registrationParams(EVALS.EVAL_NONE, [controller], []),
      registrationParams(EVALS.EVAL_IDENTITY_COMMITMENT, destinations, [commitment.toBuffer()])
    );
    script.validate();
    return script;
  }

  private validate(): CommitmentHash {
    validateRegistrationParams(this.master, this.params, [EVALS.EVAL_IDENTITY_COMMITMENT]);
    if (this.params.destinations.length === 2) {
      validateRegistrationDestination(this.params.destinations[1], true);
    }
    const payload = this.params.vData[0];
    const commitment = new CommitmentHash();
    if (commitment.fromBuffer(payload) !== payload.length || !commitment.isValid() || !commitment.toBuffer().equals(payload)) {
      throw new Error('invalid or noncanonical commitment payload');
    }
    return commitment;
  }

  getCommitment(): CommitmentHash {
    return this.validate();
  }

  getController(): TxDestination {
    this.validate();
    return this.params.destinations[0];
  }

  getAuthorization(): TxDestination | undefined {
    this.validate();
    return this.params.destinations[1];
  }

  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    boundedReader(buffer, offset, length);
    const end = super.fromBuffer(buffer, offset, length);
    this.validate();
    if (!super.toBuffer().equals(buffer.subarray(offset, end))) {
      throw new Error('noncanonical identity commitment script');
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
