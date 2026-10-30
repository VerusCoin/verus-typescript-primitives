import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';

/** Validate before BN conversion can truncate fractions or flags can be normalized. */
export function descriptorInteger(
  value: unknown,
  bits: number,
  field: string
): BigNumber {
  if (
    !BN.isBN(value) &&
    (typeof value !== 'number' || !Number.isSafeInteger(value))
  ) {
    throw new RangeError(`${field} must be an unsigned ${bits}-bit integer`);
  }

  const integer = new BN(value as number | BigNumber);
  if (integer.isNeg() || integer.bitLength() > bits) {
    throw new RangeError(`${field} must be an unsigned ${bits}-bit integer`);
  }

  return integer;
}

/** A decode/encode round trip detects malformed UTF-8 without replacement bytes. */
export function descriptorUtf8(bytes: Buffer): string {
  const text = bytes.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(bytes)) {
    throw new Error('Descriptor contains invalid UTF-8');
  }
  return text;
}

export function validateDescriptorText(
  text: string,
  limit: number,
  field: string
): void {
  if (
    typeof text !== 'string' ||
    Buffer.from(text, 'utf8').toString('utf8') !== text
  ) {
    throw new Error(
      `${field} must contain valid Unicode without unpaired surrogates`
    );
  }
  if (Buffer.byteLength(text, 'utf8') > limit) {
    throw new Error(`${field} too long`);
  }
}

/** Only accept metadata for which the daemon's TrimSpaces is an identity operation. */
export function validateDaemonMetadata(
  text: string,
  limit: number,
  field: string
): void {
  validateDescriptorText(text, limit, field);

  const spaces =
    '[ \\u00a0\\u1680\\u2000-\\u200a\\u200c\\u200d\\u202f\\u205f\\u3000]';
  if (
    /[\0\n\t\r\b\v\f\x1b]/.test(text) ||
    new RegExp(`^${spaces}|${spaces}$|${spaces}{2}`).test(text)
  ) {
    throw new Error(
      `${field} would be changed by daemon whitespace normalization`
    );
  }
}
