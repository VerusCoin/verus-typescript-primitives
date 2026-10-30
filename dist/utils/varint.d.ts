import { BigNumber } from './types/BigNumber';
declare function encode(number: BigNumber, buffer: Buffer, offset: number): {
    buffer: Buffer;
    bytes: number;
};
/**
 * Decode a nonnegative daemon VARINT, optionally bounded to 2^maxBits - 1.
 * Use 31/63 bits for nonnegative signed int32/int64 fields. Omitting the bound
 * retains the arbitrary-precision behavior of existing callers.
 */
declare function decode(buffer: Buffer, offset: number, maxBits?: number): {
    decoded: BigNumber;
    bytes: number;
};
declare const _default: {
    encode: typeof encode;
    decode: typeof decode;
    encodingLength: (number: BigNumber) => number;
};
export default _default;
