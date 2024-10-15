"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLRef = void 0;
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class URLRef {
    constructor(data) {
        if (data) {
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.url = data.url || "";
        }
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varuint_1.default.encodingLength(Buffer.from(this.url, 'utf8').length);
        byteLength += Buffer.from(this.url, 'utf8').length;
        if (byteLength > 4096)
            throw new Error("URLRef exceeds maximum length of 4096 bytes");
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.url = reader.readVarSlice().toString('utf8');
        return reader.offset;
    }
    isValid() {
        return this.version.gte(URLRef.FIRST_VERSION) &&
            this.version.lte(URLRef.LAST_VERSION) &&
            !(!this.url || this.url.length === 0);
    }
    toJson() {
        return {
            version: this.version.toString(10),
            url: this.url
        };
    }
    static fromJson(data) {
        return new URLRef({
            version: new bn_js_1.BN(data.version, 10),
            url: data.url
        });
    }
}
exports.URLRef = URLRef;
URLRef.FIRST_VERSION = new bn_js_1.BN(1);
URLRef.LAST_VERSION = new bn_js_1.BN(1);
