import { BN } from 'bn.js';
import { EVALS } from '../../utils/evals';
import { NotaryEvidence, NotaryEvidenceType } from '../NotaryEvidence';
import { OptCCParams } from '../OptCCParams';
import { PubKey } from '../PubKey';
import { TxDestination } from '../TxDestination';
import { SmartTransactionScript } from './SmartTransactionScript';

/** Fixed public key used by the daemon's EVAL_NOTARY_EVIDENCE contract. */
export const NOTARY_EVIDENCE_PUBLIC_KEY_HEX =
  '03e1894e9d487125be5a8c6657a8ce01bc81ba7816d698dbfcfb0483754eb5a2d9';

/** The condition parameters must be strictly smaller than this PBaaS limit. */
export const NOTARY_EVIDENCE_MAX_CONDITION_BYTES = 6000;

// updateidentity reserves the empty evidence script (148 bytes) and another
// 128 bytes for multipart overhead: MAX_SCRIPT_ELEMENT_SIZE - 148 - 128.
export const NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES = 5724;

/** Reproduce the daemon's version-3, 1-of-1 MakeMofNCCScript envelope. */
function evidenceScript(bytes: Buffer): SmartTransactionScript {
  const destination = new TxDestination(
    new PubKey(Buffer.from(NOTARY_EVIDENCE_PUBLIC_KEY_HEX, 'hex'))
  );

  const params = (evalCode: number, vData: Buffer[]) =>
    new OptCCParams({
      version: new BN(3),
      evalCode: new BN(evalCode),
      m: new BN(1),
      n: new BN(1),
      destinations: [destination],
      vData,
    });

  // Both conditions use the contract destination. Only the inner condition
  // carries evidence; the EVAL_NONE master contains no data or reserve value.
  return new SmartTransactionScript(
    params(EVALS.EVAL_NONE, []),
    params(EVALS.EVAL_NOTARY_EVIDENCE, [bytes])
  );
}

function fits(script: SmartTransactionScript): boolean {
  // IsPayToCryptoCondition appends the 39-byte master as another script push.
  // Include its one-byte push prefix; the limit does not measure the whole script.
  return (
    script.paramsOptCC.toChunk().length +
      1 +
      script.masterOptCC.toChunk().length <
    NOTARY_EVIDENCE_MAX_CONDITION_BYTES
  );
}

/**
 * Package one complete evidence group as zero-value transparent outputs.
 * Split the serialized evidence only when necessary, after descriptor encryption.
 * Keep these outputs consecutive and preserve their positions when funding.
 * Callers must prevent adjacent multipart groups (a daemon reader limitation).
 */
export function createNotaryEvidenceOutputs(
  evidence: NotaryEvidence
): Array<{ value: number; script: Buffer }> {
  if (!evidence.isValid()) {
    throw new Error('invalid notary evidence');
  }

  if (evidence.type === NotaryEvidenceType.MULTIPART_DATA) {
    throw new Error(
      'expected complete notary evidence, not a multipart fragment'
    );
  }

  // Preserve the ordinary encoding whenever it fits. Splitting changes the
  // evidence type and adds a complete wrapper to every physical output.
  const whole = evidenceScript(evidence.toBuffer());
  const scripts = fits(whole)
    ? [whole]
    : evidence
        .breakApart(NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES)
        .map((part) => evidenceScript(part.toBuffer()));

  return scripts.map((script) => {
    // Check the finished wrapper as well as the unsplit input.
    if (!fits(script)) {
      throw new Error(
        'notary evidence condition exceeds the daemon size limit'
      );
    }

    return { value: 0, script: script.toBuffer() };
  });
}
