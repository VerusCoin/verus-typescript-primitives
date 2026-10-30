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
  VdxfUniValue,
} from '../../index';

const fixture = require('../fixtures/mmr/daemon-rpc.json').encryptionBoundaries;
const { encryptionBoundarySpecs, localEncryptionBoundaryDescriptor } =
  createRequire(__filename)(
    '../../../scripts/fixtures/mmr-encryption-boundaries'
  );
const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');
const taggedDescriptor = (descriptor: DataDescriptor): Buffer =>
  new VDXFDataDescriptor(descriptor, DataDescriptorKey.vdxfid).toBuffer();
const taggedMMR = (descriptor: MMRDescriptor): Buffer =>
  new VdxfUniValue({
    values: [{ [MMRDescriptorKey.vdxfid]: descriptor }],
  }).toBuffer();

describe('live daemon encrypted payload and hash-vector boundaries', () => {
  test('retains all requested payload, wrapper and vector count boundaries', () => {
    const specs = encryptionBoundarySpecs();
    expect(fixture.payloadCases.map((item: any) => item.spec)).toEqual(
      specs.payloads
    );
    expect(fixture.treeCases.map((item: any) => item.spec)).toEqual(
      specs.trees
    );
  });

  test.each(
    [...fixture.payloadCases, ...fixture.treeCases].map((item: any) => [
      item.spec.name,
      item,
    ]) as Array<[string, any]>
  )(
    'matches authenticated daemon plaintext and commitments: %s',
    (_name, item) => {
      const descriptor: MMRDescriptor = localEncryptionBoundaryDescriptor(
        item.spec,
        primitives
      );
      expect(descriptor.mmrRoot.objectdata.toString('hex')).toBe(item.rootHex);
      expect(sha256(descriptor.mmrHashes.objectdata)).toBe(
        item.hashVectorSha256
      );
      expect(
        sha256(Buffer.concat([taggedMMR(descriptor), Buffer.alloc(32)]))
      ).toBe(item.serializationCommitment);

      const descriptors = [
        descriptor.mmrRoot,
        descriptor.mmrHashes,
        ...descriptor.dataDescriptors,
      ];
      expect(item.records).toHaveLength(descriptors.length);
      const expectedRoundTrips = descriptors
        .map((_, index) => index)
        .filter(
          (index) =>
            descriptors.length <= 5 ||
            [0, 1, 2, 3, 253, 254, 255, descriptors.length - 1].includes(index)
        );
      expect(
        item.records.flatMap((record: any, index: number) =>
          record.roundTrip ? [index] : []
        )
      ).toEqual(expectedRoundTrips);

      for (let index = 0; index < descriptors.length; index++) {
        const record = item.records[index];
        const canonical = taggedDescriptor(descriptors[index]);
        expect(canonical.length).toBe(record.taggedByteLength);
        expect(sha256(canonical)).toBe(record.taggedSha256);
        expect(record.nativePlaintextSha256).toBe(record.taggedSha256);
        expect(record.ciphertextByteLength).toBe(canonical.length + 16);

        if (record.roundTrip) {
          expect(record.roundTrip.localCiphertextByteLength).toBe(
            canonical.length + 16
          );
          // Both encryption directions must recover the expected payload, so
          // matching daemon responses alone cannot hide a shared decode error.
          const expectedPayload = descriptors[index].toDaemonJson().objectdata;
          expect(record.roundTrip.daemonDecryptedSha256).toBe(
            sha256(Buffer.from(JSON.stringify(expectedPayload)))
          );
          expect(record.roundTrip.localDaemonDecryptedSha256).toBe(
            record.roundTrip.daemonDecryptedSha256
          );
        }
      }
    }
  );

  test.each([
    [216, 252],
    [217, 253],
    [218, 254],
    [65497, 65535],
    [65498, 65536],
    [65499, 65537],
  ])(
    'crosses the enclosing VDXF CompactSize at payload length %i',
    (length, wrapperLength) => {
      const item = fixture.payloadCases.find(
        (item: any) => item.spec.length === length
      );
      const descriptor: MMRDescriptor = localEncryptionBoundaryDescriptor(
        item.spec,
        primitives
      );
      const bytes = taggedDescriptor(descriptor.dataDescriptors[0]);
      const wrapper = new BufferDataVdxfObject();
      expect(wrapper.fromBuffer(bytes)).toBe(bytes.length);
      expect(Buffer.from(wrapper.data, 'hex')).toHaveLength(wrapperLength);
    }
  );

  test('encrypts an empty hash-only descriptor and preserves multibyte metadata', () => {
    const empty = localEncryptionBoundaryDescriptor(
      fixture.payloadCases.find((item: any) => item.spec.length === 0).spec,
      primitives
    );
    expect(empty.dataDescriptors[0].objectdata).toHaveLength(0);
    expect(empty.dataDescriptors[0].toBuffer().toString('hex')).toBe('010000');

    const metadata = localEncryptionBoundaryDescriptor(
      fixture.payloadCases.find((item: any) => item.spec.label).spec,
      primitives
    );
    expect(Buffer.byteLength(metadata.dataDescriptors[0].label)).toBe(64);
    expect(Buffer.byteLength(metadata.dataDescriptors[0].mimeType)).toBe(128);
  });

  test('retains all 68 bidirectional component RPC observations', () => {
    const records = [...fixture.payloadCases, ...fixture.treeCases].flatMap(
      (item: any) => item.records
    );
    expect(records).toHaveLength(815);
    expect(records.filter((record: any) => record.roundTrip)).toHaveLength(68);
  });
});

describe('complete MMR wrappers in both encryption directions', () => {
  test('captures all nine object/MMR hash combinations', () => {
    const modes = ['sha256', 'sha256D', 'blake2b'];
    expect(
      fixture.fullWrappers.map((item: any) => [
        item.spec.objectMode,
        item.spec.mmrMode,
      ])
    ).toEqual(
      modes.flatMap((objectMode) =>
        modes.map((mmrMode) => [objectMode, mmrMode])
      )
    );
  });

  test.each(
    fixture.fullWrappers.map((item: any) => [item.spec.name, item]) as Array<
      [string, any]
    >
  )(
    'preserves wire bytes through native and daemon encryption: %s',
    (_name, item) => {
      const descriptor: MMRDescriptor = localEncryptionBoundaryDescriptor(
        item.spec,
        primitives
      );
      const canonicalMMR = taggedMMR(descriptor);
      const canonical = taggedDescriptor(
        new DataDescriptor({ objectdata: canonicalMMR, salt: Buffer.alloc(32) })
      );
      expect(sha256(Buffer.concat([canonicalMMR, Buffer.alloc(32)]))).toBe(
        item.serializationCommitment
      );
      expect(canonical.length).toBe(item.taggedByteLength);
      expect(sha256(canonical)).toBe(item.taggedSha256);
      expect(item.nativePlaintextSha256).toBe(item.taggedSha256);
      expect(item.ciphertextByteLength).toBe(canonical.length + 16);
      expect(item.localCiphertextByteLength).toBe(canonical.length + 16);
      expect(item.localDaemonDecrypted).toEqual(item.daemonDecrypted);

      // The known daemon enum-decoding bug affects JSON after decryption, while
      // the independently authenticated bytes above retain the supplied enums.
      const decoded = item.daemonDecrypted[0][MMRDescriptorKey.vdxfid];
      const expected = descriptor.toDaemonJson();
      expect(decoded.objecthashtype).toBe(5);
      expect(decoded.mmrhashtype).toBe(1);
      expect(decoded.mmrroot).toEqual(expected.mmrroot);
      expect(decoded.mmrhashes).toEqual(expected.mmrhashes);
      expect(decoded.datadescriptors).toEqual(expected.datadescriptors);
    }
  );
});

describe('live daemon authenticated-decryption rejections', () => {
  test.each(['root', 'hashes', 'leaf0', 'full-wrapper'])(
    'captures wrong keys and damaged ciphertext for %s',
    (component) => {
      const cases = fixture.rejections.filter((item: any) =>
        item.name.startsWith(component + '/')
      );
      expect(cases.map((item: any) => item.name.split('/')[1])).toEqual([
        'wrong-viewing-key',
        'authentication-tag',
        'empty-ciphertext',
        'shorter-than-tag',
        'tag-only',
        'truncated-ciphertext',
      ]);
      for (const item of cases) {
        expect(item.method).toBe('decryptdata');
        expect(item.code).toBe(-5);
        expect(item.message).toContain(
          'Invalid data descriptor or cannot decrypt'
        );
      }
    }
  );

  test('records that signdata rejects a raw empty leaf', () => {
    const empty = fixture.rejections.find(
      (item: any) => item.name === 'empty-raw-leaf'
    );
    expect(empty.method).toBe('signdata');
    expect(empty.code).toBe(-8);
    expect(empty.request.mmrdata).toEqual([{ serializedhex: '' }]);
  });
});
