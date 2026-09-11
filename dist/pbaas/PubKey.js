"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PubKey = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
class PubKey extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(bytes = Buffer.alloc(0), compressed = true) {
        super();
        this.bytes = bytes;
        this.compressed = compressed;
    }
    getByteLength() {
        return this.compressed ? PubKey.COMPRESSED_PUBLIC_KEY_SIZE : PubKey.PUBLIC_KEY_SIZE;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const header = buffer[offset];
        this.compressed = (header === 2 || header === 3);
        this.bytes = reader.readSlice(this.compressed ? PubKey.COMPRESSED_PUBLIC_KEY_SIZE : PubKey.PUBLIC_KEY_SIZE);
        return reader.offset;
    }
    toBuffer() {
        const buffer = Buffer.alloc(this.getByteLength());
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        writer.writeSlice(this.bytes);
        return writer.buffer;
    }
}
exports.PubKey = PubKey;
PubKey.PUBLIC_KEY_SIZE = 65;
PubKey.COMPRESSED_PUBLIC_KEY_SIZE = 33;
