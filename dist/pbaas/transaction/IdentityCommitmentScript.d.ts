import { CommitmentHash } from '../CommitmentHash';
import { OptCCParams } from '../OptCCParams';
import { TxDestination } from '../TxDestination';
import { SmartTransactionScript } from './SmartTransactionScript';
/** The daemon's controller-indexed, one- or two-party name commitment output. */
export declare class IdentityCommitmentScript extends SmartTransactionScript {
    constructor(master?: OptCCParams, params?: OptCCParams);
    /** Authorization is the issuer identity, or required referring identity, resolved by the caller. */
    static fromCommitment(commitment: CommitmentHash, controller: TxDestination, authorization?: TxDestination): IdentityCommitmentScript;
    private validate;
    getCommitment(): CommitmentHash;
    getController(): TxDestination;
    getAuthorization(): TxDestination | undefined;
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    toBuffer(): Buffer;
    getByteLength(): number;
}
