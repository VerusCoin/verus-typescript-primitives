import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { BufferDataVdxfObject } from '../../vdxf';
import { DataStringKey, VectorUint256Key } from '../../vdxf/vdxfdatakeys';

function hashBytes(count: number): Buffer {
  const bytes = Buffer.alloc(count * 32);
  for (let i = 0; i < count; i++) {
    bytes.writeUInt32LE(i + 1, i * 32);
    bytes[i * 32 + 31] = (i * 13) & 0xff;
  }
  return bytes;
}

function descriptor(
  body: Buffer,
  key = VectorUint256Key.vdxfid
): DataDescriptor {
  return new DataDescriptor({
    objectdata: new BufferDataVdxfObject(body.toString('hex'), key).toBuffer(),
  });
}

describe('DataDescriptor CompactSize hash vectors', () => {
  test.each([
    [0, '00'],
    [1, '01'],
    [127, '7f'],
    [128, '80'],
    [252, 'fc'],
    [253, 'fdfd00'],
    [254, 'fdfe00'],
    [65535, 'fdffff'],
    [65536, 'fe00000100'],
  ])('decodes every byte of a canonical %i-hash vector', (count, prefix) => {
    const expected = hashBytes(count);
    const body = Buffer.concat([Buffer.from(prefix, 'hex'), expected]);
    const hashes = descriptor(body).decodeHashVector();

    expect(hashes).toHaveLength(count);
    expect(hashes.every((hash) => hash.length === 32)).toBe(true);
    expect(Buffer.concat(hashes).equals(expected)).toBe(true);
  });

  test('returns an empty array for a different VDXF key', () => {
    const body = Buffer.concat([Buffer.from([1]), hashBytes(1)]);

    expect(descriptor(body, DataStringKey.vdxfid).decodeHashVector()).toEqual(
      []
    );
  });

  test.each([
    ['one incomplete hash', '01', hashBytes(1).subarray(0, 31)],
    ['one missing hash after a multi-byte count', 'fdfd00', hashBytes(252)],
  ])('rejects %s', (_description, prefix, payload) => {
    const body = Buffer.concat([Buffer.from(prefix, 'hex'), payload]);

    expect(() => descriptor(body).decodeHashVector()).toThrow();
  });

  test.each(['inside', 'outside'])(
    'continues to allow trailing bytes %s the VDXF wrapper',
    (location) => {
      const expected = hashBytes(1);
      const body = Buffer.concat([Buffer.from([1]), expected]);
      const trailing = Buffer.from('deadbeef', 'hex');
      const value = descriptor(
        location === 'inside' ? Buffer.concat([body, trailing]) : body
      );
      if (location === 'outside')
        value.objectdata = Buffer.concat([value.objectdata, trailing]);

      expect(value.decodeHashVector()).toEqual([expected]);
      expect(() => value.decodeHashVector(true)).toThrow(/Trailing bytes/);
    }
  );

  test('strict mode rejects a different tag', () => {
    expect(() =>
      descriptor(Buffer.from([0]), DataStringKey.vdxfid).decodeHashVector(true)
    ).toThrow(/VectorUint256/);
  });

  test.each(['fd', 'fd0100', 'feffff0000', 'ff0000010000000000', 'fe01000002'])(
    'rejects truncated, noncanonical or oversized count %s',
    (hex) => {
      expect(() =>
        descriptor(Buffer.from(hex, 'hex')).decodeHashVector()
      ).toThrow();
    }
  );

  test('checks wrapper lengths before decoding the count', () => {
    const value = descriptor(Buffer.from([0]));
    value.objectdata = value.objectdata.subarray(
      0,
      value.objectdata.length - 1
    );
    expect(() => value.decodeHashVector()).toThrow();
  });

  test('strict mode accepts an exactly consumed canonical wrapper', () => {
    expect(descriptor(Buffer.from([0])).decodeHashVector(true)).toEqual([]);
  });
});
