import bufferutils from "./bufferutils";
import { assertUint32 } from "./validation";

/** Buffer reader with validated offsets and vector counts bounded by remaining bytes. */
export class BoundedBufferReader extends bufferutils.BufferReader {
  constructor(buffer: Buffer, offset = 0) {
    super(buffer, offset);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset > buffer.length) {
      throw new Error("Invalid offset");
    }
  }

  get remaining(): number {
    return this.buffer.length - this.offset;
  }

  /** Reject impossible vector counts before callers allocate or iterate records. */
  count(minimumRecordSize = 1): number {
    const count = this.readCompactSize();

    if (count > Math.floor(this.remaining / minimumRecordSize)) {
      throw new Error("Invalid vector length");
    }

    return count;
  }
}

/** Encode an unsigned 32-bit integer in wire byte order. */
export function encodeUInt32LE(value: number): Buffer {
  const result = Buffer.alloc(4);
  result.writeUInt32LE(assertUint32(value));

  return result;
}
