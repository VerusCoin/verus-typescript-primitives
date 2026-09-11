import { FqnVdxfUniValue, VdxfUniValue } from '../../pbaas/VdxfUniValue';
import { DataByteKey, DataByteKeyName } from '../../vdxf/vdxfdatakeys';

describe.each([
  { name: 'VdxfUniValue', type: VdxfUniValue },
  { name: 'FqnVdxfUniValue', type: FqnVdxfUniValue },
])('$name byte JSON', ({ type }) => {
  describe.each([
    { name: 'i-address key', key: DataByteKey.vdxfid },
    { name: 'FQN key', key: DataByteKeyName },
  ])('$name', ({ key }) => {
    const jsonKey = type === VdxfUniValue ? DataByteKey.vdxfid : key;

    test.each([
      { value: 0, hex: '00' },
      { value: 127, hex: '7f' },
      { value: 128, hex: '80' },
      { value: 255, hex: 'ff' },
    ])('encodes numeric $value as one unsigned byte $hex', ({ value, hex }) => {
      const uni = type.fromJson({ [key]: value });
      const canonical = Buffer.from(hex, 'hex');

      expect(uni.getByteLength()).toBe(1);
      expect(uni.toBuffer()).toEqual(canonical);
      expect(uni.toJson()).toEqual({ [jsonKey]: hex });
      expect(type.fromJson(JSON.parse(JSON.stringify(uni.toJson()))).toBuffer()).toEqual(canonical);
    });

    test.each([-1, 256, 1.5, NaN, Infinity, -Infinity])(
      'rejects numeric value %s outside the unsigned-byte domain',
      value => {
        expect(() => type.fromJson({ [key]: value })).toThrow();
      },
    );

    test.each(['ff', '10'])('preserves hex-string input and output %s', hex => {
      const uni = type.fromJson({ [key]: hex });
      const canonical = Buffer.from(hex, 'hex');

      expect(uni.toBuffer()).toEqual(canonical);
      expect(uni.toJson()).toEqual({ [jsonKey]: hex });
      expect(type.fromJson(JSON.parse(JSON.stringify(uni.toJson()))).toBuffer()).toEqual(canonical);
    });
  });
});
