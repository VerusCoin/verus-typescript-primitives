import { Credential } from '../../pbaas/Credential';
import { toBase58Check } from '../../utils/address';

type TextField = 'credential' | 'scopes' | 'label';
type FieldValue = string | { v: string };

const credentialKeyHex = '11'.repeat(20);
const credentialKey = toBase58Check(Buffer.from(credentialKeyHex, 'hex'), 102);
const jsonCases = [
  { name: 'ASCII', text: 'a'.repeat(510), hex: '61'.repeat(510) },
  { name: 'two-byte UTF-8', text: 'é'.repeat(255), hex: 'c3a9'.repeat(255) },
  { name: 'three-byte UTF-8', text: '界'.repeat(170), hex: 'e7958c'.repeat(170) },
  { name: 'supplementary Unicode', text: '🔑'.repeat(127) + 'aa', hex: 'f09f9491'.repeat(127) + '6161' },
  // Each newline takes two bytes in the JSON string, plus the two enclosing quotes.
  { name: 'escaped JSON', text: '\n'.repeat(255), hex: '5c6e'.repeat(255) },
];
const labelCases = [
  { name: 'ASCII', text: 'a'.repeat(512), hex: '61'.repeat(512) },
  { name: 'two-byte UTF-8', text: 'é'.repeat(256), hex: 'c3a9'.repeat(256) },
  { name: 'three-byte UTF-8', text: '界'.repeat(170) + 'aa', hex: 'e7958c'.repeat(170) + '6161' },
  { name: 'supplementary Unicode', text: '🔑'.repeat(128), hex: 'f09f9491'.repeat(128) },
];

const cases: {
  field: TextField;
  name: string;
  value: FieldValue;
  oversized: FieldValue;
  hex: string;
  oversizedHex: string;
}[] = [];

for (const field of ['credential', 'scopes'] as const) {
  for (const { name, text, hex } of jsonCases) {
    cases.push({
      field, name, value: text, oversized: text + 'x',
      hex: '22' + hex + '22', oversizedHex: '22' + hex + '7822',
    });
  }

  // The serialized object contributes eight ASCII bytes for its key and punctuation.
  cases.push({
    field, name: 'JSON object overhead',
    value: { v: 'é'.repeat(252) }, oversized: { v: 'é'.repeat(252) + 'x' },
    hex: '7b2276223a22' + 'c3a9'.repeat(252) + '227d',
    oversizedHex: '7b2276223a22' + 'c3a9'.repeat(252) + '78227d',
  });
}

for (const { name, text, hex } of labelCases) {
  cases.push({ field: 'label', name, value: text, oversized: text + 'x', hex, oversizedHex: hex + '78' });
}

// Independent daemon wire fixtures: version, flags, uint160 key, then LIMITED_STRING
// fields. CompactSize prefixes for 512 and 513 bytes are literal protocol bytes.
function wireFixture(field: TextField, hex: string, oversized = false): Buffer {
  const limitedString = (oversized ? 'fd0102' : 'fd0002') + hex;
  const credential = field === 'credential' ? limitedString : '027b7d';
  const scopes = field === 'scopes' ? limitedString : '027b7d';
  const label = field === 'label' ? limitedString : '';
  return Buffer.from('01' + (field === 'label' ? '01' : '00') + credentialKeyHex + credential + scopes + label, 'hex');
}

describe.each(cases)('Credential $field byte limit: $name', ({ field, value, oversized, hex, oversizedHex }) => {
  const create = (text: FieldValue) => new Credential({
    version: Credential.VERSION_CURRENT, credentialKey, [field]: text,
  });
  const fromJson = (text: FieldValue) => Credential.fromJson({
    version: 1, credentialkey: credentialKey, [field]: text,
  });

  test('accepts and round-trips exactly 512 UTF-8 bytes', () => {
    expect(Buffer.from(hex, 'hex')).toHaveLength(512);
    const expected = wireFixture(field, hex);

    for (const credential of [create(value), fromJson(value)]) {
      expect(credential.isValid()).toBe(true);
      expect(credential.getByteLength()).toBe(expected.length);
      expect(credential.toBuffer()).toEqual(expected);
    }

    const decoded = new Credential();
    expect(decoded.fromBuffer(expected)).toBe(expected.length);
    expect(decoded.isValid()).toBe(true);
    expect(decoded[field]).toEqual(value);
    expect(decoded.toBuffer()).toEqual(expected);
  });

  test('invalidates constructor and JSON input at 513 UTF-8 bytes', () => {
    expect(Buffer.from(oversizedHex, 'hex')).toHaveLength(513);

    for (const credential of [create(oversized), fromJson(oversized)]) {
      expect(credential.version).toEqual(Credential.VERSION_INVALID);
      expect(credential.isValid()).toBe(false);
      expect(() => credential.getByteLength()).toThrow(/512-byte limit/);
      expect(() => credential.toBuffer()).toThrow(/512-byte limit/);
    }
  });

  test('rejects oversized fields assigned after construction', () => {
    const credential = create(value);
    if (field === 'label') credential.label = oversized as string;
    else credential[field] = oversized;

    expect(credential.version).toEqual(Credential.VERSION_CURRENT);
    expect(credential.isValid()).toBe(false);
    expect(() => credential.getByteLength()).toThrow(/512-byte limit/);
    expect(() => credential.toBuffer()).toThrow(/512-byte limit/);
  });

  test('rejects an independent 513-byte binary fixture', () => {
    expect(() => new Credential().fromBuffer(wireFixture(field, oversizedHex, true)))
      .toThrow('String length limit exceeded');
  });
});

test.each(['credential', 'scopes', 'label'] as const)(
  'rejects %s with an entire supplementary character beyond the limit',
  (field) => {
    const text = '🔑'.repeat(129);
    const credential = new Credential({ version: Credential.VERSION_CURRENT, credentialKey, [field]: text });

    expect(text.length).toBeLessThan(512);
    expect(Buffer.byteLength(text, 'utf8')).toBeGreaterThan(512);
    expect(credential.isValid()).toBe(false);
    expect(() => credential.toBuffer()).toThrow(/512-byte limit/);
  }
);
