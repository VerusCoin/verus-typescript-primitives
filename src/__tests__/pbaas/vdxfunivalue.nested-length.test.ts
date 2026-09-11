import { Rating } from '../../pbaas/Rating';
import { FqnVdxfUniValue, VdxfUniValue } from '../../pbaas/VdxfUniValue';
import { DataByteVectorKey, DataRatingsKey, DataStringKey } from '../../vdxf/vdxfdatakeys';

describe.each([
  { name: 'VdxfUniValue', Parser: VdxfUniValue },
  { name: 'FqnVdxfUniValue', Parser: FqnVdxfUniValue },
])('$name nested payload boundaries', ({ Parser }) => {
  function makeValues() {
    const rating = Rating.fromJson({ version: 1, trustlevel: 2, ratingsmap: {} });
    const original = Parser.fromJson([
      { [DataByteVectorKey.qualifiedname.name]: '00010203' },
      { [DataRatingsKey.qualifiedname.name]: rating.toJson() },
      { [DataStringKey.qualifiedname.name]: 'after' },
    ]);

    return { rating, original };
  }

  test('round-trips ordinary valid nested values and their siblings', () => {
    const { original } = makeValues();
    const serialized = original.toBuffer();
    const decoded = new Parser();

    expect(decoded.fromBuffer(serialized)).toBe(serialized.length);
    expect(decoded.toJson()).toEqual(original.toJson());
    expect(decoded.toBuffer()).toEqual(serialized);
  });

  test.each([
    {
      name: 'Rating', key: DataRatingsKey.vdxfid,
      value: new Rating().toJson(), body: new Rating().toBuffer(),
    },
    { name: 'string', key: DataStringKey.vdxfid, value: 'a', body: Buffer.from('0161', 'hex') },
    { name: 'byte vector', key: DataByteVectorKey.vdxfid, value: '01ff', body: Buffer.from('0201ff', 'hex') },
  ])('rejects or preserves extra declared $name bytes instead of silently discarding them', ({ key, value, body }) => {
    const canonical = Parser.fromJson({ [key]: value }).toBuffer();
    // This small fixture uses a one-byte CompactSize immediately before the body.
    const lengthOffset = canonical.length - body.length - 1;
    expect(canonical[lengthOffset]).toBe(body.length);
    expect(canonical.subarray(lengthOffset + 1)).toEqual(body);

    const extendedBody = Buffer.concat([body, Buffer.from('deadbeef', 'hex')]);
    const extended = Buffer.concat([
      canonical.subarray(0, lengthOffset),
      Buffer.from([extendedBody.length]),
      extendedBody,
    ]);
    const decoded = new Parser();
    let consumed: number;
    try {
      consumed = decoded.fromBuffer(extended);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      return;
    }

    // An opaque fallback is supported, but successful parsing must not lose bytes.
    expect(consumed).toBe(extended.length);
    expect(decoded.toBuffer()).toEqual(extended);
  });

  test('limits the nested decoder to its declared payload, excluding the following value', () => {
    const { rating, original } = makeValues();
    const payload = rating.toBuffer();
    const serialized = original.toBuffer();
    // Observe the real decoder without replacing its behavior. All frame lengths
    // and bodies come from the normal serializer, including both sibling values.
    const nestedDecoder = jest.spyOn(Rating.prototype, 'fromBuffer');

    try {
      const decoded = new Parser();
      expect(decoded.fromBuffer(serialized)).toBe(serialized.length);
      expect(decoded.toJson()).toEqual(original.toJson());
      expect(nestedDecoder).toHaveBeenCalledTimes(1);

      const [childBuffer, childOffset = 0] = nestedDecoder.mock.calls[0];
      expect(childBuffer.subarray(childOffset, childOffset + payload.length)).toEqual(payload);

      // A child may receive a sliced buffer or a bounded view retaining a prefix;
      // either way, its readable range must stop at the declared payload end.
      expect(childBuffer.length - childOffset).toBe(payload.length);
    } finally {
      nestedDecoder.mockRestore();
    }
  });
});
