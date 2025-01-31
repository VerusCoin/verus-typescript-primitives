/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from "./types/BigNumber";
export declare const readUInt64LE: (buffer: Buffer, offset: number) => number;
export declare const writeUInt64LE: (buffer: Buffer, value: number, offset: number) => number;
export declare const reverseBuffer: (buffer: Buffer) => Buffer;
/**
 * Helper class for serialization of bitcoin data types into a pre-allocated buffer.
 */
declare class BufferWriter {
    buffer: Buffer;
    offset: number;
    constructor(buffer: Buffer, offset?: number);
    writeUInt8(i: number): void;
    writeUInt16(i: number): void;
    writeInt32(i: number): void;
    writeUInt32(i: number): void;
    writeUInt64(i: number): void;
    writeInt64(i: BigNumber): void;
    writeCompactSize(i: number): void;
    writeVarInt(i: BigNumber): void;
    writeSlice(slice: Buffer): void;
    writeVarSlice(slice: Buffer): void;
    writeVector(vector: Array<Buffer>): void;
    writeArray(array: Array<Buffer>): void;
}
/**
 * Helper class for reading of bitcoin data types from a buffer.
 */
declare class BufferReader {
    buffer: Buffer;
    offset: number;
    constructor(buffer: Buffer, offset?: number);
    readUInt8(): number;
    readUInt16(): number;
    readInt32(): number;
    readUInt32(): number;
    readUInt64(): number;
    readInt64(): BigNumber;
    readCompactSize(): number;
    readVarInt(): import("bn.js");
    readSlice(n: number): Buffer;
    readVarSlice(): Buffer;
    readVector(): any[];
    readArray(sliceLength: number): any[];
}
declare const _default: {
    readUInt64LE: (buffer: Buffer, offset: number) => number;
    writeUInt64LE: (buffer: Buffer, value: number, offset: number) => number;
    reverseBuffer: (buffer: Buffer) => Buffer;
    BufferWriter: typeof BufferWriter;
    BufferReader: typeof BufferReader;
};
export default _default;
