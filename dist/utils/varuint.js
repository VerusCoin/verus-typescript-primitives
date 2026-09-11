"use strict";
// The MIT License (MIT)
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodingLength = exports.decode = exports.encode = exports.MAX_COMPACT_SIZE = void 0;
// Copyright (c) 2016 Kirill Fomichev
// Parts of this software are based on https://github.com/mappum/bitcoin-protocol
// Copyright (c) 2016 Matt Bell
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// Number.MAX_SAFE_INTEGER
const MAX_SAFE_INTEGER = 9007199254740991;
// VerusCoin serialize.h: maximum CompactSize used as a length or count.
exports.MAX_COMPACT_SIZE = 0x02000000;
const checkUInt53 = (n) => {
    if (n < 0 || n > MAX_SAFE_INTEGER || n % 1 !== 0)
        throw new RangeError("value out of range");
};
const encode = (number, buffer, offset) => {
    checkUInt53(number);
    if (!buffer)
        buffer = Buffer.alloc((0, exports.encodingLength)(number));
    if (!Buffer.isBuffer(buffer))
        throw new TypeError("buffer must be a Buffer instance");
    if (!offset)
        offset = 0;
    let bytes;
    // 8 bit
    if (number < 0xfd) {
        buffer.writeUInt8(number, offset);
        bytes = 1;
        // 16 bit
    }
    else if (number <= 0xffff) {
        buffer.writeUInt8(0xfd, offset);
        buffer.writeUInt16LE(number, offset + 1);
        bytes = 3;
        // 32 bit
    }
    else if (number <= 0xffffffff) {
        buffer.writeUInt8(0xfe, offset);
        buffer.writeUInt32LE(number, offset + 1);
        bytes = 5;
        // 64 bit
    }
    else {
        buffer.writeUInt8(0xff, offset);
        buffer.writeUInt32LE(number >>> 0, offset + 1);
        buffer.writeUInt32LE((number / 0x100000000) | 0, offset + 5);
        bytes = 9;
    }
    return { buffer, bytes };
};
exports.encode = encode;
// Set rangeCheck to false only when decoding a scalar, never a length or count.
const decode = (buffer, offset, rangeCheck = true) => {
    if (!Buffer.isBuffer(buffer))
        throw new TypeError("buffer must be a Buffer instance");
    if (!offset)
        offset = 0;
    var first = buffer.readUInt8(offset);
    let bytes;
    let decoded;
    // 8 bit
    if (first < 0xfd) {
        bytes = 1;
        decoded = first;
        // 16 bit
    }
    else if (first === 0xfd) {
        bytes = 3;
        decoded = buffer.readUInt16LE(offset + 1);
        // 32 bit
    }
    else if (first === 0xfe) {
        bytes = 5;
        decoded = buffer.readUInt32LE(offset + 1);
        // 64 bit
    }
    else {
        bytes = 9;
        var lo = buffer.readUInt32LE(offset + 1);
        var hi = buffer.readUInt32LE(offset + 5);
        var number = hi * 0x0100000000 + lo;
        checkUInt53(number);
        decoded = number;
    }
    if ((0, exports.encodingLength)(decoded) !== bytes)
        throw new RangeError("Non-canonical CompactSize");
    if (rangeCheck && decoded > exports.MAX_COMPACT_SIZE)
        throw new RangeError("CompactSize exceeds maximum size");
    return { decoded, bytes };
};
exports.decode = decode;
const encodingLength = (number) => {
    checkUInt53(number);
    return number < 0xfd
        ? 1
        : number <= 0xffff
            ? 3
            : number <= 0xffffffff
                ? 5
                : 9;
};
exports.encodingLength = encodingLength;
exports.default = {
    encodingLength: exports.encodingLength,
    encode: exports.encode,
    decode: exports.decode,
};
