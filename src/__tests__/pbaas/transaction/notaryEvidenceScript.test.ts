import { BN } from 'bn.js';
import {
  createNotaryEvidenceOutputs,
  CrossChainProof,
  DataDescriptor,
  ETypes,
  EVALS,
  EvidenceData,
  MMRDescriptor,
  NotaryEvidence,
  NotaryEvidenceState,
  NotaryEvidenceType,
  NOTARY_EVIDENCE_MAX_CONDITION_BYTES,
  NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES,
  NOTARY_EVIDENCE_PUBLIC_KEY_HEX,
  SmartTransactionScript,
  UTXORef,
} from '../../../index';
import {
  DataDescriptorKey,
  MMRDescriptorKey,
} from '../../../vdxf/vdxfdatakeys';
import { fromBase58Check } from '../../../utils/address';
import bufferutils from '../../../utils/bufferutils';

// Captured daemon outputs serve as an independent serialization reference.
// Ciphertext is reused so these tests do not depend on wallet encryption.
const fixtures = require('../../fixtures/local-upload/evidence.json');

function readScript(bytes: Buffer): SmartTransactionScript {
  const script = new SmartTransactionScript();

  expect(script.fromBuffer(bytes)).toBe(bytes.length);

  return script;
}

function readEvidence(bytes: Buffer): NotaryEvidence {
  const evidence = new NotaryEvidence();

  expect(evidence.fromBuffer(bytes, 0, bytes.length)).toBe(bytes.length);
  expect(evidence.toBuffer()).toEqual(bytes);

  return evidence;
}

describe('daemon upload evidence outputs', () => {
  test.each(fixtures.cases)(
    '$name: constructs exact daemon scripts from encrypted payloads',
    (fixture) => {
      const bytes = Buffer.from(fixture.serializedEvidenceHex, 'hex');
      const evidence = readEvidence(bytes);

      expect(evidence.systemId).toBe(fixtures.daemon.chainid);
      expect(evidence.type).toBe(NotaryEvidenceType.IMPORT_PROOF);
      expect(evidence.state).toBe(NotaryEvidenceState.SUPPORTING);
      expect(evidence.output.hash).toEqual(Buffer.alloc(32));
      expect(evidence.output.n.toNumber()).toBe(0);
      expect(evidence.evidence.chainObjects).toHaveLength(1);

      const item = evidence.evidence.chainObjects[0];

      expect(item.type.eqn(ETypes.TYPE_DATA)).toBe(true);

      // Even a tagged MMR is stored under the outer DataDescriptor key.
      expect(item.vdxfd).toBe(DataDescriptorKey.vdxfid);

      const constructed = new NotaryEvidence({
        systemId: fixtures.daemon.chainid,
        evidence: new CrossChainProof({
          chainObjects: [
            new EvidenceData({
              version: new BN(1),
              type: new BN(ETypes.TYPE_DATA),
              md: undefined,
              vdxfd: DataDescriptorKey.vdxfid,
              data_vec: item.data_vec,
            }),
          ],
        }),
      });

      expect(constructed.toBuffer()).toEqual(bytes);

      const outputs = createNotaryEvidenceOutputs(constructed);

      expect(
        outputs.map((output) => ({
          value: output.value,
          scriptHex: output.script.toString('hex'),
        }))
      ).toEqual(
        fixture.outputs.map((output) => ({
          value: output.value,
          scriptHex: output.scriptHex,
        }))
      );

      const parts = outputs.map((output) => {
        expect(output.value).toBe(0);

        const script = readScript(output.script);
        const master = script.masterOptCC;
        const params = script.paramsOptCC;

        expect(params.evalCode.toNumber()).toBe(EVALS.EVAL_NOTARY_EVIDENCE);
        expect(master.evalCode.toNumber()).toBe(EVALS.EVAL_NONE);

        for (const part of [params, master]) {
          expect([
            part.version.toNumber(),
            part.m.toNumber(),
            part.n.toNumber(),
          ]).toEqual([3, 1, 1]);
          expect(part.destinations).toHaveLength(1);
          expect(part.destinations[0].data.toBuffer().toString('hex')).toBe(
            NOTARY_EVIDENCE_PUBLIC_KEY_HEX
          );
        }

        expect(master.vData).toHaveLength(0);
        expect(params.vData).toHaveLength(1);
        expect(
          params.toChunk().length + 1 + master.toChunk().length
        ).toBeLessThan(6000);

        return readEvidence(params.vData[0]);
      });

      if (parts.length > 1) {
        expect(NotaryEvidence.reassemble(parts).toBuffer()).toEqual(bytes);
        expect(
          evidence
            .breakApart(NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES)
            .map((part) => part.toBuffer())
        ).toEqual(parts.map((part) => part.toBuffer()));
      }

      // The encrypted descriptor codecs preserve the actual daemon payload.
      const reader = new bufferutils.BufferReader(item.data_vec);
      const isMMR = fixture.name === 'three-leaf-mmr';

      expect(reader.readSlice(20)).toEqual(
        fromBase58Check(
          isMMR ? MMRDescriptorKey.vdxfid : DataDescriptorKey.vdxfid
        ).hash
      );
      expect(reader.readVarInt().toNumber()).toBe(1);

      const payload = reader.readVarSlice();

      expect(reader.offset).toBe(item.data_vec.length);

      const descriptor = isMMR ? new MMRDescriptor() : new DataDescriptor();

      expect(descriptor.fromBuffer(payload)).toBe(payload.length);
      expect(descriptor.toBuffer()).toEqual(payload);
    }
  );

  test('uses the strict 6000-byte condition boundary, including the appended master', () => {
    const below = fixtures.cases.find(
      (fixture) => fixture.name === 'condition-5999'
    );
    const at = fixtures.cases.find(
      (fixture) => fixture.name === 'condition-6000'
    );
    const belowScript = readScript(
      Buffer.from(below.outputs[0].scriptHex, 'hex')
    );

    expect(
      belowScript.paramsOptCC.toChunk().length +
        1 +
        belowScript.masterOptCC.toChunk().length
    ).toBe(NOTARY_EVIDENCE_MAX_CONDITION_BYTES - 1);

    // A large unsplit script can still be measured with the generic serializer.
    belowScript.paramsOptCC.vData = [
      Buffer.from(at.serializedEvidenceHex, 'hex'),
    ];

    expect(
      belowScript.paramsOptCC.toChunk().length +
        1 +
        belowScript.masterOptCC.toChunk().length
    ).toBe(NOTARY_EVIDENCE_MAX_CONDITION_BYTES);

    // The daemon splits at the limit: only conditions below 6000 bytes fit.
    expect(at.outputs).toHaveLength(2);
  });

  test.each([
    ['two-exact-chunks', [5724, 5724]],
    ['three-chunks', [5724, 5724, 552]],
  ])('%s preserves exact chunk lengths', (name, lengths) => {
    const fixture = fixtures.cases.find((fixture) => fixture.name === name);
    const parts = fixture.outputs.map((output) =>
      readEvidence(
        readScript(Buffer.from(output.scriptHex, 'hex')).paramsOptCC.vData[0]
      )
    );

    expect(
      parts.map((part) => part.evidence.chainObjects[0].data_vec.length)
    ).toEqual(lengths);
  });

  test('derives 5724-byte capacity from the daemon empty script overhead', () => {
    const output = createNotaryEvidenceOutputs(
      new NotaryEvidence({ systemId: fixtures.daemon.chainid })
    )[0];

    // Match the daemon's 128-byte reserve for multipart framing.
    expect(output.script.length).toBe(148);
    expect(
      NOTARY_EVIDENCE_MAX_CONDITION_BYTES - output.script.length - 128
    ).toBe(NOTARY_EVIDENCE_MULTIPART_CHUNK_BYTES);
  });

  test('rejects invalid evidence and already split fragments', () => {
    expect(() => createNotaryEvidenceOutputs(new NotaryEvidence())).toThrow(
      'invalid notary evidence'
    );

    const fixture = fixtures.cases[0];
    const evidence = readEvidence(
      Buffer.from(fixture.serializedEvidenceHex, 'hex')
    );

    expect(() =>
      createNotaryEvidenceOutputs(evidence.breakApart(100)[0])
    ).toThrow('multipart fragment');

    evidence.output = new UTXORef({
      hash: Buffer.alloc(32),
      n: new BN('ffffffff', 16),
    });

    expect(() => createNotaryEvidenceOutputs(evidence)).toThrow(
      'invalid notary evidence'
    );
  });
});
