"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownID = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
class UnknownID extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(bytes = Buffer.alloc(0)) {
        super();
        this.bytes = bytes;
    }
    getByteLength() {
        return this.bytes.length;
    }
    fromBuffer(buffer, offset, length = 0) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        this.bytes = reader.readSlice(length);
        return reader.offset;
    }
    toBuffer() {
        const buffer = Buffer.alloc(this.getByteLength());
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        writer.writeSlice(this.bytes);
        return writer.buffer;
    }
}
exports.UnknownID = UnknownID;
