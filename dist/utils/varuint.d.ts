export declare const MAX_COMPACT_SIZE = 33554432;
export declare const encode: (number: number, buffer: Buffer, offset: number) => {
    buffer: Buffer;
    bytes: number;
};
export declare const decode: (buffer: Buffer, offset: number, rangeCheck?: boolean) => {
    decoded: number;
    bytes: number;
};
export declare const encodingLength: (number: number) => number;
declare const _default: {
    encodingLength: (number: number) => number;
    encode: (number: number, buffer: Buffer, offset: number) => {
        buffer: Buffer;
        bytes: number;
    };
    decode: (buffer: Buffer, offset: number, rangeCheck?: boolean) => {
        decoded: number;
        bytes: number;
    };
};
export default _default;
