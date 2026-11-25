"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundedBufferReader = void 0;
exports.encodeUInt32LE = encodeUInt32LE;
const bufferutils_1 = require("./bufferutils");
const validation_1 = require("./validation");
/** Buffer reader with validated offsets and vector counts bounded by remaining bytes. */
class BoundedBufferReader extends bufferutils_1.default.BufferReader {
    constructor(buffer, offset = 0) {
        super(buffer, offset);
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > buffer.length) {
            throw new Error("Invalid offset");
        }
    }
    get remaining() {
        return this.buffer.length - this.offset;
    }
    /** Reject impossible vector counts before callers allocate or iterate records. */
    count(minimumRecordSize = 1) {
        const count = this.readCompactSize();
        if (count > Math.floor(this.remaining / minimumRecordSize)) {
            throw new Error("Invalid vector length");
        }
        return count;
    }
}
exports.BoundedBufferReader = BoundedBufferReader;
/** Encode an unsigned 32-bit integer in wire byte order. */
function encodeUInt32LE(value) {
    const result = Buffer.alloc(4);
    result.writeUInt32LE((0, validation_1.assertUint32)(value));
    return result;
}
