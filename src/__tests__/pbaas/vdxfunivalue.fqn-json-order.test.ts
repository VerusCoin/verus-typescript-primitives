import { FqnVdxfUniValue, VdxfUniValue } from '../../pbaas/VdxfUniValue';
import {
  DataByteKey,
  DataByteKeyName,
  DataUint16Key,
} from '../../vdxf/vdxfdatakeys';

describe('FQN JSON preserves representable entry order', () => {
  test.each([
    {
      name: 'multiple raw strings',
      input: ['aa', 'bb'],
      bytes: 'aabb',
      error: 'one raw byte chunk',
    },
    {
      name: 'multiple explicit encodings',
      input: [{ serializedhex: 'aa' }, { message: 'b' }],
      bytes: 'aa62',
      error: 'one raw byte chunk',
    },
    {
      name: 'an empty raw chunk followed by another chunk',
      input: ['', 'bb'],
      bytes: 'bb',
      error: 'one raw byte chunk',
    },
    {
      name: 'a named entry after raw bytes',
      input: ['aa', { [DataByteKey.vdxfid]: 2 }],
      bytes: 'aa02',
      error: 'raw bytes after all named entries',
    },
    {
      name: 'a repeated i-address key',
      input: [{ [DataByteKey.vdxfid]: 1 }, { [DataByteKey.vdxfid]: 2 }],
      bytes: '0102',
      error: 'duplicate named key',
    },
    {
      name: 'a repeated FQN key',
      input: [{ [DataByteKeyName]: 1 }, { [DataByteKeyName]: 2 }],
      bytes: '0102',
      error: 'duplicate named key',
    },
  ])(
    'rejects $name instead of changing its bytes',
    ({ input, bytes, error }) => {
      // The ordinary sequence codec can retain these inputs. FQN map storage
      // cannot, so both JSON spellings must reject them before returning a value.
      expect(VdxfUniValue.fromJson(input).toBuffer().toString('hex')).toBe(
        bytes
      );
      expect(() => FqnVdxfUniValue.fromJson(input)).toThrow(error);
      expect(() => FqnVdxfUniValue.fromDaemonJson(input)).toThrow(error);
    }
  );

  test.each(['', 'aabb'])(
    'retains distinct named entries and raw suffix %j',
    (raw) => {
      const input = [
        { [DataByteKey.vdxfid]: 1 },
        { [DataUint16Key.vdxfid]: 770 },
        raw,
      ];
      const value = FqnVdxfUniValue.fromJson(input);
      // Fixed-width scalar encoding: byte 01, uint16 0x0302 little-endian, suffix.
      const expected = Buffer.from('010203' + raw, 'hex');

      expect(value.toBuffer()).toEqual(expected);
      expect(FqnVdxfUniValue.fromDaemonJson(input).toBuffer()).toEqual(
        expected
      );
      expect(value.toJson()).toEqual(VdxfUniValue.fromJson(input).toJson());
      expect(FqnVdxfUniValue.fromJson(value.toJson()).toBuffer()).toEqual(
        expected
      );
    }
  );
});
