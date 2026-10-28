import { BN } from 'bn.js';

import varint from '../../utils/varint';
import bufferutils from '../../utils/bufferutils';

// These are the bytes emitted by VerusCoin's VARINT serializer. Unlike
// CompactSize, it is a big-endian base-128 encoding whose continuation step
// subtracts one. MMR branch nIndex and nSize use this encoding in the daemon.
const DAEMON_VARINT_VECTORS: ReadonlyArray<readonly [string, string]> = [
  ['0', '00'],
  ['1', '01'],
  ['126', '7e'],
  ['127', '7f'],
  ['128', '8000'],
  ['129', '8001'],
  ['255', '807f'],
  ['256', '8100'],
  ['16383', 'fe7f'],
  ['16384', 'ff00'],
  ['16511', 'ff7f'],
  ['16512', '808000'],
  ['2113663', 'ffff7f'],
  ['2113664', '80808000'],
  ['2147483647', '86fefefe7f'],
  ['2147483648', '86fefeff00'],
  ['4294967295', '8efefefe7f'],
  ['4294967296', '8efefeff00'],
  ['9007199254740991', '8efefefefefefe7f'],
  ['9007199254740992', '8efefefefefeff00'],
  ['18446744073709551615', '80fefefefefefefefe7f'],
];

describe('Verus daemon VARINT compatibility', () => {
  test.each(DAEMON_VARINT_VECTORS)(
    'encodes and decodes daemon uint64 vector %s as %s',
    (decimal, expectedHex) => {
      const value = new BN(decimal, 10);
      const expected = Buffer.from(expectedHex, 'hex');
      const destination = Buffer.alloc(expected.length + 4, 0xa5);

      const encoded = varint.encode(value, destination, 2);

      expect(encoded.buffer).toBe(destination);
      expect(encoded.bytes).toBe(expected.length);
      expect(varint.encodingLength(value)).toBe(expected.length);
      expect(destination.subarray(0, 2).equals(Buffer.from([0xa5, 0xa5]))).toBe(
        true
      );
      expect(destination.subarray(2, -2).toString('hex')).toBe(expectedHex);
      expect(destination.subarray(-2).equals(Buffer.from([0xa5, 0xa5]))).toBe(
        true
      );

      const decoded = varint.decode(destination, 2);
      expect(decoded.bytes).toBe(expected.length);
      expect(decoded.decoded.toString(10)).toBe(decimal);
    }
  );
});

describe('bounded daemon VARINT reads', () => {
  const limits: Array<[number, string, string]> = [
    [31, '2147483647', '86fefefe7f'],
    [32, '4294967295', '8efefefe7f'],
    [63, '9223372036854775807', 'fefefefefefefefe7f'],
    [64, '18446744073709551615', '80fefefefefefefefe7f'],
  ];

  test.each(limits)(
    'accepts the maximum %i-bit value at a stream offset',
    (bits, decimal, hex) => {
      const encoded = Buffer.from(hex, 'hex');
      const framed = Buffer.concat([
        Buffer.from([0xaa]),
        encoded,
        Buffer.from([0xbb]),
      ]);
      const reader = new bufferutils.BufferReader(framed, 1);

      expect(reader.readVarInt(bits).toString()).toBe(decimal);
      expect(reader.offset).toBe(encoded.length + 1);
      expect(reader.readUInt8()).toBe(0xbb);
    }
  );

  test.each(limits)('rejects one above the %i-bit limit', (bits, decimal) => {
    const value = new BN(decimal).addn(1);
    const encoded = varint.encode(
      value,
      Buffer.alloc(varint.encodingLength(value)),
      0
    ).buffer;
    const reader = new bufferutils.BufferReader(encoded);

    expect(() => reader.readVarInt(bits)).toThrow(
      `VARINT exceeds ${bits}-bit range`
    );
    expect(reader.offset).toBe(0);
  });

  test.each(limits)(
    'checks the %i-bit continuation increment before reading another byte',
    (bits, _decimal, hex) => {
      const encoded = Buffer.from(hex, 'hex');

      // The final low bits form the maximum value. Setting its continuation bit
      // increments that value past the limit, even without another input byte.
      encoded[encoded.length - 1] |= 0x80;
      const read = jest.spyOn(encoded, 'readUInt8');

      try {
        expect(() => varint.decode(encoded, 0, bits)).toThrow(
          `VARINT exceeds ${bits}-bit range`
        );
        expect(read).toHaveBeenCalledTimes(encoded.length);
      } finally {
        read.mockRestore();
      }
    }
  );

  test.each(limits)(
    'stops a long malicious %i-bit VARINT after a bounded number of reads',
    (bits) => {
      const encoded = Buffer.alloc(50000, 0xff);
      const read = jest.spyOn(encoded, 'readUInt8');

      try {
        expect(() => varint.decode(encoded, 0, bits)).toThrow(
          `VARINT exceeds ${bits}-bit range`
        );
        expect(read.mock.calls.length).toBeLessThanOrEqual(Math.ceil(bits / 7));
      } finally {
        read.mockRestore();
      }
    }
  );

  test('retains arbitrary-precision decoding when no bound is requested', () => {
    const value = new BN(1).shln(128);
    const encoded = varint.encode(
      value,
      Buffer.alloc(varint.encodingLength(value)),
      0
    ).buffer;

    expect(varint.decode(encoded, 0).decoded.eq(value)).toBe(true);
    expect(new bufferutils.BufferReader(encoded).readVarInt().eq(value)).toBe(
      true
    );
  });

  test.each([0, -1, 1.5, NaN, Infinity])(
    'rejects an invalid bit limit %s',
    (bits) => {
      expect(() => varint.decode(Buffer.from([0]), 0, bits)).toThrow(
        'positive safe integer'
      );
    }
  );
});
