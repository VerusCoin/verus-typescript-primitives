import { BN } from 'bn.js';
import { IdentityID } from '../../pbaas/IdentityID';
import { OptCCParams } from '../../pbaas/OptCCParams';
import { TxDestination } from '../../pbaas/TxDestination';
import { EVALS } from '../../utils/evals';

function makeParams(): OptCCParams {
  return new OptCCParams({
    version: new BN(3),
    evalCode: new BN(EVALS.EVAL_NONE),
    m: new BN(1),
    n: new BN(1),
    destinations: [
      new TxDestination(IdentityID.fromAddress('iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF')),
    ],
  });
}

describe('OptCCParams parsing offsets', () => {
  test('round-trips a valid standalone chunk', () => {
    const original = makeParams();
    const parsed = OptCCParams.fromChunk(original.toChunk());

    expect(original.isValid()).toBe(true);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.toBuffer()).toEqual(original.toBuffer());
  });

  test.each([0, 5])('returns the end of the serialized object starting at offset %i', (offset) => {
    const original = makeParams();
    const encoded = original.toBuffer();
    const prefix = Buffer.alloc(offset, 0x42);
    const suffix = Buffer.from('following field', 'utf8');
    const buffer = Buffer.concat([prefix, encoded, suffix]);
    const parsed = new OptCCParams();

    const end = parsed.fromBuffer(buffer, offset);

    expect(original.isValid()).toBe(true);
    expect(encoded.length).toBe(original.getByteLength());
    expect(parsed.toBuffer()).toEqual(encoded);
    // The returned cursor must stop after this object, before the following field.
    expect(end).toBe(offset + encoded.length);
    expect(buffer.subarray(end)).toEqual(suffix);
  });

  test('uses the returned offset to parse the next of two serialized objects', () => {
    const first = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_NONE),
      m: new BN(0),
      n: new BN(0),
    });
    const second = makeParams();
    const buffer = Buffer.concat([first.toBuffer(), second.toBuffer()]);
    const parsedFirst = new OptCCParams();
    const parsedSecond = new OptCCParams();

    expect(first.isValid()).toBe(true);
    expect(second.isValid()).toBe(true);

    // Exactly two reads keep the regression bounded if the cursor does not advance.
    const firstEnd = parsedFirst.fromBuffer(buffer);
    const secondEnd = parsedSecond.fromBuffer(buffer, firstEnd);

    expect(parsedFirst.toBuffer()).toEqual(first.toBuffer());
    expect(parsedSecond.toBuffer()).toEqual(second.toBuffer());
    expect(firstEnd).toBe(first.getByteLength());
    expect(secondEnd).toBe(buffer.length);
  });
});
