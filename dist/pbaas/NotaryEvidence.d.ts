import { SerializableEntity } from '../utils/types/SerializableEntity';
import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { CrossChainProof } from './CrossChainProof';
import { UTXORef } from './UTXORef';
export declare enum NotaryEvidenceType {
    NOTARY_EVIDENCE = 1,
    MULTIPART_DATA = 2,
    IMPORT_PROOF = 3
}
export declare enum NotaryEvidenceState {
    CONFIRMING = 1,
    SUPPORTING = 2,
    REJECTING = 3,
    PROVINGFALSE = 4,
    PROVINGTRUE = 5,
    CONFIRMED = 6,
    REJECTED = 7
}
export interface NotaryEvidenceData {
    version?: number;
    type?: NotaryEvidenceType;
    /** Chain identity address; serialized as its raw 20-byte ID. */
    systemId?: string;
    /** The transaction hash uses wire byte order, not RPC display order. */
    output?: UTXORef;
    state?: NotaryEvidenceState;
    evidence?: CrossChainProof;
}
/**
 * CNotaryEvidence with the EvidenceData subset of CCrossChainProof.
 *
 * Defaults describe an unsigned upload: import proof, supporting, same-tx output 0.
 * Supply a nonzero systemId before constructing an output. A default instance
 * can still serialize the empty evidence used by the daemon for size estimates.
 *
 * This container does not create or verify notary signatures.
 */
export declare class NotaryEvidence extends SerializableEntityBase implements SerializableEntity {
    static readonly VERSION_CURRENT = 1;
    static readonly HEADER_BYTE_LENGTH = 59;
    version: number;
    type: NotaryEvidenceType;
    systemId: string;
    output: UTXORef;
    state: NotaryEvidenceState;
    evidence: CrossChainProof;
    constructor(data?: NotaryEvidenceData);
    /** Validate the encodable fields; isValid additionally checks daemon validity. */
    private validate;
    isValid(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    /**
     * Parse one evidence object and return its absolute end offset.
     * An explicit length bounds all nested reads and rejects trailing bytes;
     * omitting it allows this object to be read from a larger serialized stream.
     */
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    /**
     * Split the complete serialized object exactly as CNotaryEvidence::BreakApart.
     * The caller chooses capacity from the enclosing script limit and decides
     * whether splitting is necessary. Even a single returned chunk is multipart.
     */
    breakApart(maxChunkSize: number): NotaryEvidence[];
    /** Reassemble one ordered group, rejecting missing, mixed, or corrupt parts. */
    static reassemble(parts: NotaryEvidence[]): NotaryEvidence;
}
