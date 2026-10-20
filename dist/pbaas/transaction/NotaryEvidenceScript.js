"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES = exports.NOTARY_EVIDENCE_MAX_CONDITION_BYTES = exports.NOTARY_EVIDENCE_PUBLIC_KEY_HEX = void 0;
exports.createNotaryEvidenceOutputs = createNotaryEvidenceOutputs;
const bn_js_1 = require("bn.js");
const evals_1 = require("../../utils/evals");
const NotaryEvidence_1 = require("../NotaryEvidence");
const OptCCParams_1 = require("../OptCCParams");
const PubKey_1 = require("../PubKey");
const TxDestination_1 = require("../TxDestination");
const SmartTransactionScript_1 = require("./SmartTransactionScript");
/** Fixed public key used by the daemon's EVAL_NOTARY_EVIDENCE contract. */
exports.NOTARY_EVIDENCE_PUBLIC_KEY_HEX = '03e1894e9d487125be5a8c6657a8ce01bc81ba7816d698dbfcfb0483754eb5a2d9';
/** The condition parameters must be strictly smaller than this PBaaS limit. */
exports.NOTARY_EVIDENCE_MAX_CONDITION_BYTES = 6000;
// updateidentity reserves the empty evidence script (148 bytes) and another
// 128 bytes for multipart overhead: MAX_SCRIPT_ELEMENT_SIZE - 148 - 128.
exports.NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES = 5724;
/** Reproduce the daemon's version-3, 1-of-1 MakeMofNCCScript envelope. */
function evidenceScript(bytes) {
    const destination = new TxDestination_1.TxDestination(new PubKey_1.PubKey(Buffer.from(exports.NOTARY_EVIDENCE_PUBLIC_KEY_HEX, 'hex')));
    const params = (evalCode, vData) => new OptCCParams_1.OptCCParams({
        version: new bn_js_1.BN(3),
        evalCode: new bn_js_1.BN(evalCode),
        m: new bn_js_1.BN(1),
        n: new bn_js_1.BN(1),
        destinations: [destination],
        vData,
    });
    // Both conditions use the contract destination. Only the inner condition
    // carries evidence; the EVAL_NONE master contains no data or reserve value.
    return new SmartTransactionScript_1.SmartTransactionScript(params(evals_1.EVALS.EVAL_NONE, []), params(evals_1.EVALS.EVAL_NOTARY_EVIDENCE, [bytes]));
}
function fits(script) {
    // IsPayToCryptoCondition appends the 39-byte master as another script push.
    // Include its one-byte push prefix; the limit does not measure the whole script.
    return (script.paramsOptCC.toChunk().length +
        1 +
        script.masterOptCC.toChunk().length <
        exports.NOTARY_EVIDENCE_MAX_CONDITION_BYTES);
}
/**
 * Package one complete evidence group as zero-value transparent outputs.
 * Split the serialized evidence only when necessary, after descriptor encryption.
 * Keep these outputs consecutive and preserve their positions when funding.
 * Callers must prevent adjacent multipart groups (a daemon reader limitation).
 */
function createNotaryEvidenceOutputs(evidence) {
    if (!evidence.isValid()) {
        throw new Error('invalid notary evidence');
    }
    if (evidence.type === NotaryEvidence_1.NotaryEvidenceType.MULTIPART_DATA) {
        throw new Error('expected complete notary evidence, not a multipart fragment');
    }
    // Preserve the ordinary encoding whenever it fits. Splitting changes the
    // evidence type and adds a complete wrapper to every physical output.
    const whole = evidenceScript(evidence.toBuffer());
    const scripts = fits(whole)
        ? [whole]
        : evidence
            .breakApart(exports.NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES)
            .map((part) => evidenceScript(part.toBuffer()));
    return scripts.map((script) => {
        // Check the finished wrapper as well as the unsplit input.
        if (!fits(script)) {
            throw new Error('notary evidence condition exceeds the daemon size limit');
        }
        return { value: 0, script: script.toBuffer() };
    });
}
