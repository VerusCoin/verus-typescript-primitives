import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { FqnVdxfUniValue, VdxfUniValue } from '../../pbaas/VdxfUniValue';
import {
  DataByteVectorKey,
  DataDescriptorKey,
  DataStringKey,
} from '../../vdxf/vdxfdatakeys';

// Source-derived wire fixtures, independent of the library's length helpers and
// serializers. CDataDescriptor: VARINT(version), VARINT(flags), vector(objectData).
// The complex VDXF frame adds key, VARINT(version), CompactSize(body.length), body.
// See VerusCoin src/pbaas/vdxf.h (CDataDescriptor and CVDXF_Data), and
// src/serialize.h (WriteCompactSize). FQN wrappers use this library's separate
// CompactIAddressObject key format; the body and outer length are the same.
const descriptorHash = '08a2ebb2c55f83a8e2a426a53320ed4d42124f4d';
const stringHash = 'ab8b7b8b4418de66e611921699a328126461c0e5';
const byteVectorHash = 'ae377010192abb2513f705519f62066046e63acc';

const wrappers = [
  { name: 'VdxfUniValue', Parser: VdxfUniValue, compact: false, fqn: false },
  { name: 'FqnVdxfUniValue with i-address', Parser: FqnVdxfUniValue, compact: true, fqn: false },
  { name: 'FqnVdxfUniValue with FQN', Parser: FqnVdxfUniValue, compact: true, fqn: true },
];

function keyBytes(hash: string, name: string, compact: boolean, fqn: boolean): Buffer {
  if (!compact) return Buffer.from(hash, 'hex');
  if (!fqn) return Buffer.from('0102' + hash, 'hex');
  const text = Buffer.from(name, 'utf8');
  // All fixture key names fit a one-byte CompactSize length.
  return Buffer.concat([Buffer.from([1, 1, text.length]), text]);
}

const descriptorCases = [
  { dataLength: 248, dataSize: 'f8', bodyLength: 251, bodySize: 'fb' },
  { dataLength: 249, dataSize: 'f9', bodyLength: 252, bodySize: 'fc' },
  { dataLength: 250, dataSize: 'fa', bodyLength: 253, bodySize: 'fdfd00' },
  { dataLength: 65527, dataSize: 'fdf7ff', bodyLength: 65532, bodySize: 'fdfcff' },
  { dataLength: 65528, dataSize: 'fdf8ff', bodyLength: 65533, bodySize: 'fdfdff' },
  { dataLength: 65529, dataSize: 'fdf9ff', bodyLength: 65534, bodySize: 'fdfeff' },
  { dataLength: 65530, dataSize: 'fdfaff', bodyLength: 65535, bodySize: 'fdffff' },
  { dataLength: 65531, dataSize: 'fdfbff', bodyLength: 65536, bodySize: 'fe00000100' },
];

describe.each(wrappers)('$name canonical complex payloads', ({ Parser, compact, fqn }) => {
  const key = fqn ? DataDescriptorKey.qualifiedname.name : DataDescriptorKey.vdxfid;
  const prefix = keyBytes(descriptorHash, DataDescriptorKey.qualifiedname.name, compact, fqn);

  describe.each(descriptorCases)('$bodyLength-byte descriptor body', (fixture) => {
    const data = Buffer.alloc(fixture.dataLength, 0xa5);
    const body = Buffer.concat([Buffer.from('0100' + fixture.dataSize, 'hex'), data]);
    const canonical = Buffer.concat([prefix, Buffer.from('01' + fixture.bodySize, 'hex'), body]);
    const json = { [key]: { version: 1, flags: 0, objectdata: data.toString('hex') } };

    test('allocates exactly the canonical frame length', () => {
      // Establish that the child is valid and correctly sized; the defect is in
      // the wrapper, not in its already serialized descriptor payload.
      const descriptor = new DataDescriptor({ objectdata: data });
      expect(descriptor.isValid()).toBe(true);
      expect(body.length).toBe(fixture.bodyLength);
      expect(descriptor.getByteLength()).toBe(body.length);
      expect(descriptor.toBuffer().equals(body)).toBe(true);

      expect(Parser.fromJson(json).getByteLength()).toBe(canonical.length);
    });

    test('serializes JSON to exact canonical bytes without padding', () => {
      const actual = Parser.fromJson(json).toBuffer();

      // Avoid dumping a 64 KiB fixture when a two-byte length discrepancy fails.
      expect({ length: actual.length, exactBytes: actual.equals(canonical) }).toEqual({
        length: canonical.length,
        exactBytes: true,
      });
    });

    test('decodes canonical bytes as a typed value and reserializes them unchanged', () => {
      const decoded = new Parser();

      expect(decoded.fromBuffer(canonical)).toBe(canonical.length);
      expect(decoded.values).toHaveLength(1);
      const descriptor = Object.values(decoded.values[0])[0];
      expect(descriptor).toBeInstanceOf(DataDescriptor);
      expect((descriptor as DataDescriptor).objectdata.equals(data)).toBe(true);
      expect(decoded.toJson()).toEqual(json);

      const actual = decoded.toBuffer();
      expect({ length: actual.length, exactBytes: actual.equals(canonical) }).toEqual({
        length: canonical.length,
        exactBytes: true,
      });
    });
  });

  test('preserves a following typed sibling and an opaque suffix without adding bytes', () => {
    const data = Buffer.alloc(249, 0xa5);
    const descriptor = Buffer.concat([prefix, Buffer.from('01fc0100f9', 'hex'), data]);
    const stringPrefix = keyBytes(
      stringHash, DataStringKey.qualifiedname.name, compact, fqn,
    );
    // Version 1, four-byte payload, three-byte string "end".
    const sibling = Buffer.concat([stringPrefix, Buffer.from('010403656e64', 'hex')]);
    const canonical = Buffer.concat([descriptor, sibling, Buffer.from('deadbeef', 'hex')]);
    const decoded = new Parser();

    expect(decoded.fromBuffer(canonical)).toBe(canonical.length);
    expect(decoded.values).toHaveLength(3);
    expect(Object.values(decoded.values[0])[0]).toBeInstanceOf(DataDescriptor);
    expect(Object.values(decoded.values[1])[0]).toBe('end');
    expect(decoded.values[2]['']).toEqual(Buffer.from('deadbeef', 'hex'));
    expect(decoded.toBuffer().equals(canonical)).toBe(true);
  });
});

// Strings and byte vectors actually contain an inner CompactSize length. These
// controls distinguish their two-length framing from the complex-object case.
describe.each(wrappers)('$name nested string/vector length controls', ({ Parser, compact, fqn }) => {
  test.each([
    { length: 251, innerSize: 'fb', outerSize: 'fc' },
    { length: 252, innerSize: 'fc', outerSize: 'fdfd00' },
    { length: 253, innerSize: 'fdfd00', outerSize: 'fd0001' },
  ])('preserves both length prefixes for $length bytes', ({ length, innerSize, outerSize }) => {
    for (const type of [DataStringKey, DataByteVectorKey]) {
      const key = fqn ? type.qualifiedname.name : type.vdxfid;
      const data = Buffer.alloc(length, 0x61);
      const json = { [key]: data.toString(type === DataStringKey ? 'utf8' : 'hex') };
      const hash = type === DataStringKey ? stringHash : byteVectorHash;
      const expected = Buffer.concat([
        keyBytes(hash, type.qualifiedname.name, compact, fqn),
        Buffer.from('01' + outerSize + innerSize, 'hex'),
        data,
      ]);
      const value = Parser.fromJson(json);
      expect(value.getByteLength()).toBe(expected.length);
      expect(value.toBuffer()).toEqual(expected);

      const decoded = new Parser();
      expect(decoded.fromBuffer(expected)).toBe(expected.length);
      expect(decoded.toJson()).toEqual(json);
      expect(decoded.toBuffer()).toEqual(expected);
    }
  });
});
