"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLRef = void 0;
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class URLRef {
    constructor(data) {
        if (data != null) {
            if (Object.prototype.hasOwnProperty.call(data, 'data_hash')) {
                throw new Error("URLRef: snake_case property names are no longer supported. Use 'dataHash' instead of 'data_hash'.");
            }
        }
        if (data) {
            this.version = data.version || new bn_js_1.BN(2, 10);
            this.url = data.url || "";
            this.flags = data.flags || new bn_js_1.BN(0);
            this.dataHash = data.dataHash || Buffer.alloc(0);
        }
    }
    /** @deprecated Use dataHash instead */
    get data_hash() { return this.dataHash; }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        if (this.version.gte(URLRef.HASHDATA_VERSION)) {
            // If the version is at least HASHDATA_VERSION, we include the URL length
            // as a varuint before the URL itself.
            byteLength += varint_1.default.encodingLength(this.flags);
            if (this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH)) {
                // If the FLAG_HAS_HASH is set, we include the data hash
                byteLength += vdxf_1.HASH256_BYTE_LENGTH; // 32 bytes for the hash
            }
        }
        byteLength += varuint_1.default.encodingLength(Buffer.from(this.url, 'utf8').length);
        byteLength += Buffer.from(this.url, 'utf8').length;
        if (byteLength > 4096)
            throw new Error("URLRef exceeds maximum length of 4096 bytes");
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        if (this.version.gte(URLRef.HASHDATA_VERSION)) {
            // If the version is at least HASHDATA_VERSION, we include the URL length
            // as a varuint before the URL itself.
            bufferWriter.writeVarInt(this.flags);
            if (this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH)) {
                // If the FLAG_HAS_HASH is set, we include the data hash
                bufferWriter.writeSlice(this.dataHash);
            }
        }
        bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        if (this.version.gte(URLRef.HASHDATA_VERSION)) {
            // If the version is at least HASHDATA_VERSION, we read the flags
            this.flags = reader.readVarInt();
            if (this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH)) {
                // If the FLAG_HAS_HASH is set, we read the data hash
                this.dataHash = reader.readSlice(32);
            }
        }
        this.url = reader.readVarSlice().toString('utf8');
        return reader.offset;
    }
    isValid() {
        return this.version.gte(URLRef.FIRST_VERSION) &&
            this.version.lte(URLRef.LAST_VERSION) &&
            this.url.length > 0;
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            flags: this.flags ? this.flags.toNumber() : 0,
            datahash: this.dataHash ? this.dataHash.toString('hex') : "",
            url: this.url
        };
    }
    static fromJson(data) {
        return new URLRef({
            version: new bn_js_1.BN(data.version, 10),
            flags: data.flags ? new bn_js_1.BN(data.flags, 10) : new bn_js_1.BN(0, 10),
            dataHash: data.datahash ? Buffer.from(data.datahash, 'hex') : Buffer.alloc(0),
            url: data.url
        });
    }
}
exports.URLRef = URLRef;
URLRef.FIRST_VERSION = new bn_js_1.BN(1);
URLRef.LAST_VERSION = new bn_js_1.BN(2);
URLRef.HASHDATA_VERSION = new bn_js_1.BN(2);
URLRef.DEFAULT_VERSION = new bn_js_1.BN(2);
URLRef.FLAG_HAS_HASH = new bn_js_1.BN(1);
