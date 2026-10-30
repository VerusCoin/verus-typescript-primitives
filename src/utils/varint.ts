// Signed varints
import { BN } from 'bn.js';
import { BigNumber } from './types/BigNumber';

const writeVarInt = (number: BigNumber): Buffer => {
  let tmp = [];
  let len = 0;

  while (true) {
    tmp[len] = number
      .and(new BN('7f', 16))
      .or(new BN(len ? '80' : '00', 'hex'))
      .toBuffer()[0];
    if (number.lte(new BN('7f', 16))) break;

    number = number.shrn(7).sub(new BN(1, 10));
    len++;
  }

  tmp = tmp.reverse();
  return Buffer.from(tmp);
};

const readVarInt = (
  data: Buffer,
  offset: number,
  maxBits?: number
): { value: BigNumber; length: number } => {
  if (maxBits != null && (!Number.isSafeInteger(maxBits) || maxBits < 1)) {
    throw new RangeError('VARINT bit limit must be a positive safe integer');
  }

  let n = new BN(0, 10);
  let pos = offset;

  while (true) {
    const chData = data.readUInt8(pos);
    pos++;
    n = n.shln(7).or(new BN(chData & 0x7f));

    if (chData & 0x80) {
      n = n.add(new BN(1, 10));
    }

    // Enforce the daemon field width on every byte, including the continuation
    // increment. Never grow a BN across the rest of an overflowing input.
    if (maxBits != null && n.bitLength() > maxBits) {
      throw new RangeError(`VARINT exceeds ${maxBits}-bit range`);
    }

    if (!(chData & 0x80)) {
      return { value: n, length: pos - offset };
    }
  }
};

const encodingLength = (number: BigNumber): number => {
  return writeVarInt(number).length;
};

function encode(
  number: BigNumber,
  buffer: Buffer,
  offset: number
): { buffer: Buffer; bytes: number } {
  if (!buffer) buffer = Buffer.alloc(encodingLength(number));
  if (!Buffer.isBuffer(buffer))
    throw new TypeError('buffer must be a Buffer instance');
  if (!offset) offset = 0;

  const varintBuf = writeVarInt(number);

  if (buffer.length < offset + varintBuf.length) {
    throw new Error('Cannot write slice out of bounds');
  }
  const bytes = varintBuf.copy(buffer, offset);

  return { buffer, bytes };
}

/**
 * Decode a nonnegative daemon VARINT, optionally bounded to 2^maxBits - 1.
 * Use 31/63 bits for nonnegative signed int32/int64 fields. Omitting the bound
 * retains the arbitrary-precision behavior of existing callers.
 */
function decode(
  buffer: Buffer,
  offset: number,
  maxBits?: number
): { decoded: BigNumber; bytes: number } {
  if (!Buffer.isBuffer(buffer))
    throw new TypeError('buffer must be a Buffer instance');
  if (!offset) offset = 0;

  const { value, length } = readVarInt(buffer, offset, maxBits);

  return { decoded: value, bytes: length };
}

export default {
  encode,
  decode,
  encodingLength,
};
