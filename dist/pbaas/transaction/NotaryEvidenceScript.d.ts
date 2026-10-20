import { NotaryEvidence } from '../NotaryEvidence';
/** Fixed public key used by the daemon's EVAL_NOTARY_EVIDENCE contract. */
export declare const NOTARY_EVIDENCE_PUBLIC_KEY_HEX = "03e1894e9d487125be5a8c6657a8ce01bc81ba7816d698dbfcfb0483754eb5a2d9";
/** The condition parameters must be strictly smaller than this PBaaS limit. */
export declare const NOTARY_EVIDENCE_MAX_CONDITION_BYTES = 6000;
export declare const NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES = 5724;
/**
 * Package one complete evidence group as zero-value transparent outputs.
 * Split the serialized evidence only when necessary, after descriptor encryption.
 * Keep these outputs consecutive and preserve their positions when funding.
 * Callers must prevent adjacent multipart groups (a daemon reader limitation).
 */
export declare function createNotaryEvidenceOutputs(evidence: NotaryEvidence): Array<{
    value: number;
    script: Buffer;
}>;
