import { createHash } from 'crypto';
import { createRequire } from 'module';
import * as primitives from '../../index';
import {
  DataDescriptor,
  DataDescriptorKey,
  VDXFDataDescriptor,
  MMRDescriptor,
  MMRDescriptorKey,
  VdxfUniValue,
} from '../../index';

const fixture = require('../fixtures/mmr/daemon-rpc.json');
const { descriptorBoundaryCases, captureDescriptorBoundaries } = createRequire(
  __filename
)('../../../scripts/fixtures/mmr-descriptor-boundaries');
const records: any[] = fixture.descriptorBoundaries;

// These captured inputs are now supported by the canonical reference codecs.
// Keep their original inputError annotations unchanged as capture provenance.
const normalizedReferenceCases = new Set([
  'text/reference/evidence/zero-system-id',
  'text/reference/identity/zero-data-hash',
  'text/reference/identity/zero-system-id',
]);
const commitment = (bytes: Buffer): string =>
  createHash('sha256')
    .update(Buffer.concat([bytes, Buffer.alloc(32)]))
    .digest('hex');

// Rejected lossless JSON inputs are intentionally still submitted directly to
// the daemon: their captured output explains why the stricter API is necessary.
describe('live daemon descriptor boundary observations', () => {
  test('captures every declared boundary once', () => {
    const cases = descriptorBoundaryCases(primitives);
    expect(records.map((item) => item.name)).toEqual(
      cases.map((item: any) => item.name)
    );
    expect(new Set(records.map((item) => item.name)).size).toBe(records.length);
    records.forEach((item, index) => {
      const { serializationCommitment, daemonOutput, daemonError, ...input } =
        item;
      expect(input).toEqual(cases[index]);
      expect(item.serializationCommitment || item.daemonError).toBeTruthy();
    });
  });

  test.each(records.map((item) => [item.name, item]))(
    '%s',
    (_name: string, item: any) => {
      if (item.category === 'metadata-unicode') {
        expect(item.daemonError).toEqual({
          code: -32700,
          message: 'Parse error',
        });
      } else {
        expect(item.daemonError).toBeUndefined();
        expect(item.serializationCommitment).toMatch(/^[0-9a-f]{64}$/);
        expect(item).toHaveProperty('daemonOutput');
      }

      let bytes: Buffer;
      if (item.inputKind === 'json') {
        const parse = () => VdxfUniValue.fromJson(item.vdxfdata).toBuffer();
        const parseAlias = () =>
          VdxfUniValue.fromDaemonJson(item.vdxfdata).toBuffer();
        if (item.inputError && !normalizedReferenceCases.has(item.name)) {
          expect(parse).toThrow(new RegExp(item.inputError));
          expect(parseAlias).toThrow(new RegExp(item.inputError));
          return;
        }
        bytes = parse();
        expect(parseAlias()).toEqual(bytes);
      } else {
        bytes = Buffer.from(item.serializedHex, 'hex');
        const descriptor =
          item.descriptorType === 'data'
            ? new DataDescriptor()
            : new MMRDescriptor();
        const payload = Buffer.from(item.payloadHex, 'hex');
        const read = () => descriptor.fromBuffer(payload);
        if (item.binaryError) {
          expect(read).toThrow(new RegExp(item.binaryError));
        } else {
          expect(read()).toBe(payload.length);
          expect(descriptor.toBuffer()).toEqual(payload);
        }
      }

      expect(item.daemonError).toBeUndefined();
      expect(commitment(bytes)).toBe(item.serializationCommitment);
      if (item.binaryError) return;

      const restored = new VdxfUniValue();
      expect(restored.fromBuffer(bytes)).toBe(bytes.length);
      if (item.decodedError) {
        expect(() => restored.toJson()).toThrow(new RegExp(item.decodedError));
        expect(() => restored.toDaemonJson()).toThrow(
          new RegExp(item.decodedError)
        );
        return;
      }
      const json: any = restored.toJson();
      expect(restored.toDaemonJson()).toEqual(json);

      // The daemon deserializes hash tags through temporary enum casts and
      // therefore reports defaults. Keep the actual serialized tags locally.
      if (item.daemonEnumReset && json[MMRDescriptorKey.vdxfid]) {
        expect(item.daemonOutput[MMRDescriptorKey.vdxfid]).toMatchObject({
          objecthashtype: 5,
          mmrhashtype: 1,
        });
        json[MMRDescriptorKey.vdxfid].objecthashtype = 5;
        json[MMRDescriptorKey.vdxfid].mmrhashtype = 1;
      }
      expect(json).toEqual(item.daemonOutput);
    }
  );

  test('records every optional-vector flag combination from the daemon', () => {
    const combinations = records.filter(
      (item) => item.category === 'optional-flags'
    );
    expect(combinations).toHaveLength(32);
    for (const item of combinations) {
      const [, encrypted, mask] = item.name.split('/').map(Number);
      const output = item.daemonOutput[DataDescriptorKey.vdxfid];
      expect(output.flags).toBe(encrypted + mask * 2);
      const input = item.vdxfdata[DataDescriptorKey.vdxfid];
      for (const field of ['salt', 'epk', 'ivk', 'ssk']) {
        expect(output[field]).toBe(input[field]);
      }
    }
  });

  test('captures why nonhex data and nonzero vdxfkey are rejected', () => {
    const droppedKey = records.find(
      (item) => item.name === 'json-loss/vdxfkey'
    );
    expect(
      droppedKey.daemonOutput[DataDescriptorKey.vdxfid]
    ).not.toHaveProperty('vdxfkey');
    for (const item of records.filter((item) =>
      item.name.startsWith('json-loss/objectdata/')
    )) {
      expect(item.daemonOutput[DataDescriptorKey.vdxfid].objectdata).toBeNull();
    }
  });

  test('records the running daemon accepting short and long JSON keys', () => {
    for (const item of records.filter(
      (item) => item.category === 'key-length' && item.inputError
    )) {
      // This running binary predates the current source's JSON key-size guard.
      // Keep that observation separate from the library's deliberate rejection.
      const input = item.vdxfdata[DataDescriptorKey.vdxfid];
      const output = item.daemonOutput[DataDescriptorKey.vdxfid];
      expect(output.version).toBe(1);
      const native = new DataDescriptor({
        objectdata: Buffer.from(input.objectdata, 'hex'),
      });
      for (const field of ['epk', 'ivk', 'ssk'] as const) {
        expect(output[field]).toBe(input[field]);
        if (input[field] != null)
          native[field] = Buffer.from(input[field], 'hex');
      }
      const bytes = new VDXFDataDescriptor(
        native,
        DataDescriptorKey.vdxfid
      ).toBuffer();
      expect(commitment(bytes)).toBe(item.serializationCommitment);
    }
  });

  test('captures RPC parse errors for unpaired metadata surrogates', () => {
    const invalid = records.filter(
      (item) => item.category === 'metadata-unicode'
    );
    expect(invalid).toHaveLength(4);
    for (const item of invalid) {
      expect(item.daemonError).toEqual({
        code: -32700,
        message: 'Parse error',
      });
    }
  });

  test.each([-28, -32700])(
    'does not store unexpected RPC error %s as coverage',
    async (code) => {
      const unavailable = async () => {
        throw new Error(
          `signdata: ${JSON.stringify({ code, message: 'Unavailable' })}`
        );
      };
      await expect(
        captureDescriptorBoundaries(primitives, unavailable)
      ).rejects.toThrow(/Unexpected RPC error/);
    }
  );

  test('omits absent evidence system IDs in canonical JSON', () => {
    const item = records.find(
      (record) => record.name === 'text/reference/evidence/0'
    );
    const value = VdxfUniValue.fromJson(item.vdxfdata);
    const json: any = value.toJson();
    const referenceKey = primitives.CrossChainDataRefKey.vdxfid;

    expect(
      json[DataDescriptorKey.vdxfid].objectdata[referenceKey]
    ).not.toHaveProperty('systemid');
    expect(json).toEqual(item.daemonOutput);
    expect(value.toDaemonJson()).toEqual(json);
  });

  test.each(
    records
      .filter((item) => normalizedReferenceCases.has(item.name))
      .map((item) => [item.name, item])
  )(
    'normalizes null reference fields like the daemon: %s',
    (_name: string, item: any) => {
      const value = VdxfUniValue.fromJson(item.vdxfdata);
      const bytes = value.toBuffer();
      expect(commitment(bytes)).toBe(item.serializationCommitment);
      expect(value.toJson()).toEqual(item.daemonOutput);
      expect(value.toDaemonJson()).toEqual(item.daemonOutput);
      expect(VdxfUniValue.fromJson(value.toJson()).toBuffer()).toEqual(bytes);
    }
  );
});
