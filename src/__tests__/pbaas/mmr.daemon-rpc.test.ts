import { createHash } from 'crypto';
import { createRequire } from 'module';
import * as primitives from '../../index';
import {
  BufferDataVdxfObject,
  DataDescriptor,
  DataDescriptorKey,
  MMRDescriptor,
  MMRDescriptorKey,
  VDXFDataDescriptor,
} from '../../index';

const fixture = require('../fixtures/mmr/daemon-rpc.json');
const { createRequest, localDescriptor, taggedMMR } = createRequire(__filename)(
  '../../../scripts/generate-mmr-rpc-fixtures'
);
const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');

describe('independent daemon MMR commitments and canonical serialization', () => {
  test('captures both CompactSize boundaries for every hash combination', () => {
    for (const objectMode of ['sha256', 'sha256D', 'blake2b']) {
      for (const mmrMode of ['sha256', 'sha256D', 'blake2b']) {
        const counts = fixture.cases
          .filter(
            (item: any) =>
              item.objectMode === objectMode &&
              item.mmrMode === mmrMode &&
              item.kind === 'binary'
          )
          .map((item: any) => item.count);

        expect(counts).toEqual(
          expect.arrayContaining([
            252, 253, 254, 16511, 16512, 65535, 65536, 65537,
          ])
        );
      }
    }
  });

  test.each(
    fixture.cases.map((item: any) => [item.name, item]) as Array<[string, any]>
  )('%s', (_name: string, item: any) => {
    const request = createRequest(
      item.objectMode,
      item.mmrMode,
      item.count,
      item.kind
    );
    const descriptor: MMRDescriptor = localDescriptor(request, primitives);
    const canonicalBytes: Buffer = taggedMMR(descriptor, primitives);

    expect(descriptor.objectHashType).toBe(item.objectHashType);
    expect(descriptor.mmrHashType).toBe(item.mmrHashType);
    expect(descriptor.mmrRoot.objectdata.toString('hex')).toBe(item.rootHex);
    expect(sha256(descriptor.mmrHashes.objectdata)).toBe(item.hashVectorSha256);
    expect(canonicalBytes.length).toBe(item.taggedByteLength);

    // This expected commitment is produced by a second daemon signdata call
    // over the daemon's own CMMRDescriptor/VDXF serialization and zero salt.
    expect(sha256(Buffer.concat([canonicalBytes, Buffer.alloc(32)]))).toBe(
      item.serializationCommitment
    );

    const bytes = descriptor.toBuffer();
    const decoded = new MMRDescriptor();
    expect(decoded.fromBuffer(bytes)).toBe(bytes.length);
    expect(decoded.toBuffer().equals(bytes)).toBe(true);
    expect(decoded.objectHashType).toBe(item.objectHashType);
    expect(decoded.mmrHashType).toBe(item.mmrHashType);
  });

  test.each(
    fixture.encryption.map((item: any) => [item.name, item]) as Array<
      [string, any]
    >
  )(
    'preserves authenticated daemon/native plaintext in both directions: %s',
    (_name: string, item: any) => {
      for (const record of item.records) {
        const plaintext = new VDXFDataDescriptor(
          DataDescriptor.fromDaemonJson(record.plaintext),
          DataDescriptorKey.vdxfid
        ).toBuffer();
        expect(plaintext.toString('hex')).toBe(record.taggedPlaintextHex);
        expect(Buffer.from(record.ciphertext.objectdata, 'hex').length).toBe(
          plaintext.length + 16
        );
        expect(
          Buffer.from(record.localEncrypted.objectdata, 'hex').length
        ).toBe(plaintext.length + 16);
        expect(record.localDaemonDecrypted).toEqual(record.daemonDecrypted);
      }

      const canonicalBytes = Buffer.from(item.canonicalMMRHex, 'hex');
      const expectedPlaintext = new VDXFDataDescriptor(
        new DataDescriptor({
          objectdata: canonicalBytes,
          salt: Buffer.alloc(32),
        }),
        DataDescriptorKey.vdxfid
      ).toBuffer();
      expect(expectedPlaintext.toString('hex')).toBe(
        item.daemonWrappedPlaintextHex
      );

      const tagged = new BufferDataVdxfObject();
      expect(tagged.fromBuffer(canonicalBytes)).toBe(canonicalBytes.length);
      expect(tagged.vdxfkey).toBe(MMRDescriptorKey.vdxfid);
      const descriptor = new MMRDescriptor();
      const descriptorBytes = Buffer.from(tagged.data, 'hex');
      expect(descriptor.fromBuffer(descriptorBytes)).toBe(
        descriptorBytes.length
      );
      const expected: MMRDescriptor = localDescriptor(item.request, primitives);
      expect(descriptor.toBuffer()).toEqual(expected.toBuffer());

      // The running daemon's JSON decoder resets enum members to their default
      // values. Its authenticated plaintext still contains the correct enums;
      // TypeScript must preserve those bytes instead of copying that defect.
      const daemonDecoded =
        item.wrappedDaemonDecrypted[0][MMRDescriptorKey.vdxfid];
      expect(daemonDecoded.objecthashtype).toBe(5);
      expect(daemonDecoded.mmrhashtype).toBe(1);
      expect(descriptor.objectHashType).toBe(expected.objectHashType);
      expect(descriptor.mmrHashType).toBe(expected.mmrHashType);
      expect(item.authenticatedRejection).toEqual({
        corruptedCiphertext: true,
        wrongViewingKey: true,
      });
    }
  );
});

// These are observed daemon transformations, explicitly outside lossless RPC JSON.
describe('captured daemon JSON restrictions', () => {
  test.each(fixture.descriptorJsonCases.map((item: any) => [item.name, item]))(
    'matches the daemon JSON serialization commitment: %s',
    (_name: string, item: any) => {
      const value = primitives.VdxfUniValue.fromDaemonJson(item.vdxfdata);
      const bytes = value.toBuffer();
      expect(sha256(Buffer.concat([bytes, Buffer.alloc(32)]))).toBe(
        item.serializationCommitment
      );
      if (
        [
          'empty-text-data',
          'unicode-data',
          'invalid-text-data',
          'text-url-reference',
        ].includes(item.name)
      ) {
        expect(value.toDaemonJson()).toEqual(item.daemonOutput);
      }
    }
  );

  test.each(
    fixture.metadataCases.map((item: any, index: number) => [index, item])
  )(
    'rejects metadata that the daemon changed: %s',
    (_index: number, item: any) => {
      expect(item.daemonOutput.label).not.toBe(item.input.label);
      expect(() => DataDescriptor.fromDaemonJson(item.input)).toThrow();
      expect(() =>
        DataDescriptor.fromJson(item.input).toDaemonJson()
      ).toThrow();
    }
  );

  test('records the RPC rejection of a bare-string leaf', () => {
    expect(fixture.rejectedRequests[0].code).toBe(-8);
    expect(fixture.rejectedRequests[0].request.mmrdata).toEqual(['616263']);
  });

  test.each(['base64-mmr-leaf', 'base64-vdxf-leaf'])(
    'rejects the captured unsupported request: %s',
    (name) => {
      const rejected = fixture.rejectedRequests.find(
        (item: any) => item.name === name
      );
      expect(rejected.code).toBe(-8);
      expect(() =>
        primitives.PartialMMRData.fromCLIJson(rejected.request)
      ).toThrow(/base64/);
    }
  );
});
