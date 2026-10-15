import { BN } from 'bn.js';
import { CommitmentHash } from '../../pbaas/CommitmentHash';
import { CurrencyValueMap } from '../../pbaas/CurrencyValueMap';
import { KeyID } from '../../pbaas/KeyID';
import { TokenOutput } from '../../pbaas/TokenOutput';

const RAW = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const DISPLAY = '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';
// Independently derived by SHA256d/HASH160 of CVDXF namespace/name components;
// confirmed by VRSCTEST getvdxfid: i74sHfYTqdfd5ZSmQSLHug4GuX2XHKwA7Y.
const MARKER = '2767181a4f6abe2090a7dca2c689477d163900f6';
const TAGGED_HASH = MARKER + '000102030405060708090a0b';
// CTokenOutput vectors already captured from the daemon (tokenoutput.test.ts).
const SINGLE_TOKEN = '01848374dd2a47335f0252c8caa066b94de4bf800f83e1ac00';
const MULTI_TOKEN = '86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c009008abfbd8080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d0500000000';
const FIRST_CURRENCY = 'iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM';
const SECOND_CURRENCY = 'iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm';

function token(hex: string): TokenOutput {
  const output = new TokenOutput();
  output.fromBuffer(Buffer.from(hex, 'hex'));
  return output;
}

describe('ordinary commitment hashes', () => {
  test('preserves raw uint256 bytes and reverses only daemon JSON display hex', () => {
    const commitment = new CommitmentHash({ hash: Buffer.from(RAW, 'hex') });
    expect(commitment.isValid()).toBe(true);
    expect(commitment.isAdvanced()).toBe(false);
    expect(commitment.getByteLength()).toBe(32);
    expect(commitment.toBuffer().toString('hex')).toBe(RAW);
    expect(commitment.toJSON()).toEqual({ version: 1, currencyvalues: {}, hash: DISPLAY });
    expect(CommitmentHash.fromJSON(DISPLAY).hash.toString('hex')).toBe(RAW);
    expect(CommitmentHash.fromJSON({ hash: DISPLAY }).toBuffer().toString('hex')).toBe(RAW);
    expect(CommitmentHash.fromJSON(commitment.toJSON()).toBuffer().toString('hex')).toBe(RAW);
    expect(CommitmentHash.fromJSON(DISPLAY.toUpperCase()).toJSON().hash).toBe(DISPLAY);
    expect(commitment.hash.toString('hex')).toBe(RAW);
  });

  test('rejects zero hashes, malformed hex, and wrong raw lengths', () => {
    expect(() => new CommitmentHash({ hash: 'a'.repeat(32) as any })).toThrow('Buffer');
    expect(new CommitmentHash().isValid()).toBe(false);
    for (const hash of [Buffer.alloc(32), Buffer.alloc(31, 1), Buffer.alloc(33, 1)]) {
      const commitment = new CommitmentHash({ hash });
      expect(commitment.isValid()).toBe(false);
      expect(() => commitment.toBuffer()).toThrow();
      expect(() => commitment.getByteLength()).toThrow();
    }
    for (const value of ['', '0', 'zz', 'gg'.repeat(32), '0x' + DISPLAY, DISPLAY.slice(2), DISPLAY + '00', '00'.repeat(32)]) {
      expect(() => CommitmentHash.fromJSON(value)).toThrow();
      expect(() => CommitmentHash.fromHex(value)).toThrow();
    }
  });

  test('rejects silently attached reserves on an ordinary name commitment', () => {
    const invalid = new CommitmentHash({ hash: Buffer.from(RAW, 'hex'), tokenOutput: token(SINGLE_TOKEN) });
    expect(invalid.isValid()).toBe(false);
    expect(() => invalid.toBuffer()).toThrow();
    expect(() => CommitmentHash.fromJSON({ hash: DISPLAY, version: 1, currencyvalues: { [SECOND_CURRENCY]: '0.1' } })).toThrow();
  });

  test('does not alias input hash buffers or serializer results', () => {
    const hash = Buffer.from(RAW, 'hex');
    const commitment = new CommitmentHash({ hash });
    hash.fill(0);
    commitment.toBuffer().fill(0);
    commitment.toJSON();
    expect(commitment.hash.toString('hex')).toBe(RAW);
    const input = Buffer.from(RAW, 'hex');
    const parsed = new CommitmentHash();
    parsed.fromBuffer(input);
    input.fill(0);
    expect(parsed.hash.toString('hex')).toBe(RAW);
  });
});

describe('tagged token commitments', () => {
  test('uses the daemon marker in raw order and returns a copy of the marker constant', () => {
    expect(CommitmentHash.getAdvancedCommitmentHashKey().toString('hex')).toBe(MARKER);
    CommitmentHash.getAdvancedCommitmentHashKey().fill(0);
    expect(CommitmentHash.getAdvancedCommitmentHashKey().toString('hex')).toBe(MARKER);
    const commitment = new CommitmentHash({ tokenOutput: token(SINGLE_TOKEN) });
    expect(commitment.hash.toString('hex')).toBe(MARKER + '00'.repeat(12));
    expect(commitment.isAdvanced()).toBe(true);
    expect(commitment.toBuffer().subarray(32).toString('hex')).toBe(SINGLE_TOKEN);
  });

  test.each([SINGLE_TOKEN, MULTI_TOKEN])('preserves all bytes of a tagged token payload %s', tokenHex => {
    const hex = TAGGED_HASH + tokenHex;
    const parsed = CommitmentHash.fromHex(hex);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.isAdvanced()).toBe(true);
    expect(parsed.hash.toString('hex')).toBe(TAGGED_HASH);
    expect(parsed.toBuffer().toString('hex')).toBe(hex);
    expect(parsed.getByteLength()).toBe(hex.length / 2);
    expect(parsed.tokenOutput.toBuffer().toString('hex')).toBe(tokenHex);
    expect(new CommitmentHash({ hash: Buffer.from(TAGGED_HASH, 'hex'), tokenOutput: token(tokenHex) }).toBuffer().toString('hex')).toBe(hex);
    expect(CommitmentHash.fromJSON(parsed.toJSON()).toBuffer().toString('hex')).toBe(hex);
    const expectedValues = tokenHex === SINGLE_TOKEN
      ? { [SECOND_CURRENCY]: '10000000' }
      : { [FIRST_CURRENCY]: '9728028248208', [SECOND_CURRENCY]: '90000000' };
    expect(Object.fromEntries(Array.from(parsed.tokenOutput.reserveValues.valueMap).map(([key, value]) => [key, value.toString()]))).toEqual(expectedValues);
  });

  test('requires the token payload after an exact marker and does not infer it from reversed bytes', () => {
    const incomplete = new CommitmentHash({ hash: Buffer.from(TAGGED_HASH, 'hex') });
    expect(incomplete.isAdvanced()).toBe(true);
    expect(incomplete.isValid()).toBe(false);
    expect(() => incomplete.toBuffer()).toThrow();
    expect(() => CommitmentHash.fromHex(TAGGED_HASH)).toThrow();
    const reversed = new CommitmentHash({ hash: Buffer.from(TAGGED_HASH, 'hex').reverse() });
    expect(reversed.isAdvanced()).toBe(false);
    expect(reversed.getByteLength()).toBe(32);
  });

  test('rejects unsupported token versions and incomplete tagged JSON', () => {
    const json = CommitmentHash.fromHex(TAGGED_HASH + SINGLE_TOKEN).toJSON();
    for (const version of [0, 2]) {
      expect(() => CommitmentHash.fromJSON({ ...json, version })).toThrow();
      expect(() => CommitmentHash.fromHex(TAGGED_HASH + '0' + version + SINGLE_TOKEN.slice(2))).toThrow();
    }
    expect(() => CommitmentHash.fromJSON({ hash: json.hash })).toThrow();
    expect(() => CommitmentHash.fromJSON({ hash: json.hash, version: 1 })).toThrow();
  });

  test('rejects duplicate, unordered, and noncanonical token maps without discarding entries', () => {
    const header = MULTI_TOKEN.slice(0, 12); // VARINT(version|MULTIVALUE), CompactSize(2)
    const firstEntry = MULTI_TOKEN.slice(12, 68); // uint160 + int64
    const secondEntry = MULTI_TOKEN.slice(68);
    const malformed = [
      header + firstEntry + firstEntry,
      header + secondEntry + firstEntry,
      MULTI_TOKEN.slice(0, 10) + 'fd0200' + MULTI_TOKEN.slice(12),
      MULTI_TOKEN.slice(0, 10) + '01' + firstEntry,
      MULTI_TOKEN.slice(0, 10) + '03' + MULTI_TOKEN.slice(12)
    ];
    for (const tokenHex of malformed) {
      expect(() => CommitmentHash.fromHex(TAGGED_HASH + tokenHex)).toThrow();
    }
  });

  test('validates token amount range and identity-address versions before serialization', () => {
    const invalidKeys = ['not an address', new KeyID(Buffer.alloc(20, 1)).toAddress()];
    for (const key of invalidKeys) {
      const commitment = new CommitmentHash({ tokenOutput: new TokenOutput({
        version: new BN(1), values: new CurrencyValueMap({ valueMap: new Map([[key, new BN(1)]]) })
      }) });
      expect(commitment.isValid()).toBe(false);
      expect(() => commitment.toBuffer()).toThrow();
    }
    for (const value of [new BN('9223372036854775808'), new BN('-9223372036854775809')]) {
      const commitment = new CommitmentHash({ tokenOutput: new TokenOutput({
        version: new BN(1), values: new CurrencyValueMap({ valueMap: new Map([[SECOND_CURRENCY, value]]) })
      }) });
      expect(commitment.isValid()).toBe(false);
      expect(() => commitment.toBuffer()).toThrow();
    }
  });

  test('rejects JSON values below atomic precision', () => {
    const json = CommitmentHash.fromHex(TAGGED_HASH + SINGLE_TOKEN).toJSON();
    expect(() => CommitmentHash.fromJSON({ ...json, currencyvalues: { [SECOND_CURRENCY]: '0.000000001' } })).toThrow();
    expect(() => CommitmentHash.fromJSON({ ...json, currencyvalues: { [SECOND_CURRENCY]: 100000000.00000001 } })).toThrow('precision');
    expect(CommitmentHash.fromJSON({ ...json, currencyvalues: { [SECOND_CURRENCY]: '100000000.00000001' } })
      .tokenOutput.firstValue().toString()).toBe('10000000000000001');
  });

  test.each([
    ['92233720368.54775807', '9223372036854775807'],
    ['-92233720368.54775808', '-9223372036854775808'],
    ['9.223372036854775807e10', '9223372036854775807'],
    ['9223372036854775807e-8', '9223372036854775807'],
    ['90071992.54740991', '9007199254740991'],
    ['0.000000010', '1'],
  ])('imports exact signed-int64 daemon amount %s', (decimal, amount) => {
    const json = CommitmentHash.fromHex(TAGGED_HASH + MULTI_TOKEN).toJSON();
    const commitment = CommitmentHash.fromJSON({ ...json, currencyvalues: {
      [FIRST_CURRENCY]: decimal, [SECOND_CURRENCY]: '1'
    } });
    expect(commitment.tokenOutput.reserveValues.valueMap.get(FIRST_CURRENCY).toString()).toBe(amount);
    expect(CommitmentHash.fromHex(commitment.toBuffer().toString('hex')).toBuffer()).toEqual(commitment.toBuffer());
    expect(CommitmentHash.fromJSON(commitment.toJSON()).toBuffer()).toEqual(commitment.toBuffer());
  });

  test.each([
    '92233720368.54775808', '-92233720368.54775809', '100000000000',
    '0.000000001', '1e-1000000000', '1e1000000000', '1e9007199254740992',
    '01', '+1', 'NaN', 'Infinity', '', ' 1', '1 ',
  ])('rejects invalid, overflowing or fractional-atomic tagged JSON %j', decimal => {
    const json = CommitmentHash.fromHex(TAGGED_HASH + MULTI_TOKEN).toJSON();
    expect(() => CommitmentHash.fromJSON({ ...json, currencyvalues: {
      [FIRST_CURRENCY]: decimal, [SECOND_CURRENCY]: '1'
    } })).toThrow();
  });

  test('requires exact decimal strings after binary64 can no longer preserve adjacent atomic values', () => {
    const json = CommitmentHash.fromHex(TAGGED_HASH + SINGLE_TOKEN).toJSON();
    for (const numeric of [90071992.54740991, 90071992.54740992, 92233720368.54775807]) {
      expect(() => CommitmentHash.fromJSON({ ...json, currencyvalues: { [SECOND_CURRENCY]: numeric } })).toThrow();
    }
    expect(CommitmentHash.fromJSON({ ...json, currencyvalues: { [SECOND_CURRENCY]: 0.00000001 } })
      .tokenOutput.firstValue().toString()).toBe('1');
  });
});

describe.each([RAW, TAGGED_HASH + SINGLE_TOKEN, TAGGED_HASH + MULTI_TOKEN])('bounded commitment parsing %s', hex => {
  test('rejects every truncated prefix and trailing complete-payload data', () => {
    const bytes = Buffer.from(hex, 'hex');
    for (let length = 0; length < bytes.length; length++) {
      expect(() => new CommitmentHash().fromBuffer(bytes.subarray(0, length))).toThrow();
    }
    const framed = Buffer.concat([Buffer.from([9, 8]), bytes, Buffer.from([7, 6])]);
    const parsed = new CommitmentHash();
    expect(parsed.fromBuffer(framed, 2, bytes.length)).toBe(2 + bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(new CommitmentHash().fromBuffer(framed, 2)).toBe(2 + bytes.length);
    expect(() => new CommitmentHash().fromBuffer(framed, 2, bytes.length - 1)).toThrow();
    expect(() => new CommitmentHash().fromBuffer(framed, 2, bytes.length + 1)).toThrow('Trailing');
    expect(() => CommitmentHash.fromHex(hex + '00')).toThrow();
    for (const [offset, length] of [[-1, 1], [0.5, 1], [0, -1], [0, 0.5], [0, framed.length + 1], [framed.length + 1, 0]]) {
      expect(() => new CommitmentHash().fromBuffer(framed, offset, length)).toThrow('bounds');
    }
  });

  test('is single-use after a successful or failed deserialization', () => {
    const bytes = Buffer.from(hex, 'hex');
    const parsed = new CommitmentHash();
    parsed.fromBuffer(bytes);
    expect(() => parsed.fromBuffer(bytes)).toThrow('already attempted');
    const failed = new CommitmentHash();
    expect(() => failed.fromBuffer(Buffer.alloc(0))).toThrow();
    expect(() => failed.fromBuffer(bytes)).toThrow('already attempted');
  });
});
