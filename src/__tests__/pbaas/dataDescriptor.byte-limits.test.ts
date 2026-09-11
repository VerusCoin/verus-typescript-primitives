import { DataDescriptor } from '../../pbaas/DataDescriptor';

describe.each([
  { field: 'label' as const, jsonField: 'label', limit: 64, flags: 0x20 },
  { field: 'mimeType' as const, jsonField: 'mimetype', limit: 128, flags: 0x40 },
])('DataDescriptor $field UTF-8 byte limit', ({ field, jsonField, limit, flags }) => {
  const factories = [
    (text: string) => new DataDescriptor({ [field]: text }),
    (text: string) => DataDescriptor.fromJson({ version: 1, [jsonField]: text }),
  ];

  // Literal daemon layout: version, flags, empty objectdata vector, text length,
  // UTF-8 text. All tested text lengths fit a one-byte CompactSize prefix.
  const wire = (text: string) => {
    const bytes = Buffer.from(text, 'utf8');
    return Buffer.concat([Buffer.from([1, flags, 0, bytes.length]), bytes]);
  };

  test.each([
    ['ASCII', 'a', 1],
    ['two-byte UTF-8', 'é', 2],
    ['supplementary Unicode', '🔑', 4],
  ] as const)('accepts exactly the byte limit for %s', (_name, character, width) => {
    const text = character.repeat(limit / width);
    const canonical = wire(text);

    expect(Buffer.byteLength(text, 'utf8')).toBe(limit);
    for (const create of factories) {
      const value = create(text);
      expect(value[field]).toBe(text);
      expect(value.isValid()).toBe(true);
      expect(value.getByteLength()).toBe(canonical.length);
      expect(value.toBuffer()).toEqual(canonical);
    }

    const prefix = Buffer.from('aabbcc', 'hex');
    const suffix = Buffer.from('deadbeef', 'hex');
    const framed = Buffer.concat([prefix, canonical, suffix]);
    const decoded = new DataDescriptor();
    const end = decoded.fromBuffer(framed, prefix.length);
    expect(end).toBe(prefix.length + canonical.length);
    expect(framed.subarray(end)).toEqual(suffix);
    expect(decoded[field]).toBe(text);
    expect(decoded.isValid()).toBe(true);
    expect(decoded.toBuffer()).toEqual(canonical);
  });

  test.each([
    ['two-byte text plus one byte', 'é', 2, 'a'],
    ['supplementary text plus one byte', '🔑', 4, 'a'],
    ['the original oversized-Unicode repro', 'é', 2, 'é'],
  ] as const)('rejects %s from constructor and JSON input', (_name, character, width, suffix) => {
    const text = character.repeat(limit / width) + suffix;

    expect(text.length).toBeLessThan(limit);
    expect(Buffer.byteLength(text, 'utf8')).toBeGreaterThan(limit);
    for (const create of factories) {
      const value = create(text);
      expect(value[field]).toBe(text);
      expect(value.isValid()).toBe(false);
      expect(() => value.getByteLength()).toThrow(/too long/);
      expect(() => value.toBuffer()).toThrow(/too long/);
    }
  });

  test('checks current field bytes after mutation', () => {
    const value = new DataDescriptor({ [field]: 'a' });
    value[field] = 'é'.repeat(limit / 2) + 'a';

    expect(value.isValid()).toBe(false);
    expect(() => value.toBuffer()).toThrow(/too long/);

    value[field] = 'a'.repeat(limit + 1);
    expect(value.isValid()).toBe(false);
    expect(() => value.toBuffer()).toThrow(/too long/);

    value[field] = 'é'.repeat(limit / 2);
    expect(value.isValid()).toBe(true);
    expect(value.toBuffer()).toEqual(wire(value[field]));
  });

  test.each([
    ['ASCII', 'a', 1],
    ['two-byte UTF-8', 'é', 2],
    ['supplementary Unicode', '🔑', 4],
  ] as const)('rejects a binary field one byte over the limit for %s', (_name, character, width) => {
    const oversized = wire(character.repeat(limit / width) + 'a');
    const prefix = Buffer.from('aabbcc', 'hex');
    const framed = Buffer.concat([prefix, oversized, Buffer.from('deadbeef', 'hex')]);

    expect(() => new DataDescriptor().fromBuffer(framed, prefix.length))
      .toThrow('String length limit exceeded');
  });

  test('retains existing ASCII input truncation', () => {
    for (const create of factories) {
      const value = create('a'.repeat(limit + 1));
      expect(value[field]).toBe('a'.repeat(limit));
      expect(value.isValid()).toBe(true);
      expect(value.toBuffer()).toEqual(wire('a'.repeat(limit)));
    }
  });
});
