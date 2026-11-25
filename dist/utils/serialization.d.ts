import bufferutils from "./bufferutils";
/** Buffer reader with validated offsets and vector counts bounded by remaining bytes. */
export declare class BoundedBufferReader extends bufferutils.BufferReader {
    constructor(buffer: Buffer, offset?: number);
    get remaining(): number;
    /** Reject impossible vector counts before callers allocate or iterate records. */
    count(minimumRecordSize?: number): number;
}
/** Encode an unsigned 32-bit integer in wire byte order. */
export declare function encodeUInt32LE(value: number): Buffer;
