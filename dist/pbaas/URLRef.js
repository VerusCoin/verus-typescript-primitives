"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URLRef = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class URLRef extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        if (data != null) {
            if (Object.prototype.hasOwnProperty.call(data, 'data_hash')) {
                throw new Error("URLRef: snake_case property names are no longer supported. Use 'dataHash' instead of 'data_hash'.");
            }
        }
        this.version = (data === null || data === void 0 ? void 0 : data.version) || new bn_js_1.BN(2, 10);
        this.url = (data === null || data === void 0 ? void 0 : data.url) || "";
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0);
        this.dataHash = (data === null || data === void 0 ? void 0 : data.dataHash) || Buffer.alloc(vdxf_1.HASH256_BYTE_LENGTH);
        this.validateDataHashLength();
    }
    /** @deprecated Use dataHash instead */
    get data_hash() { return this.dataHash; }
    validateDataHashLength() {
        if (!Buffer.isBuffer(this.dataHash) || this.dataHash.length !== vdxf_1.HASH256_BYTE_LENGTH) {
            throw new Error(`URLRef dataHash must be exactly ${vdxf_1.HASH256_BYTE_LENGTH} bytes`);
        }
    }
    getByteLength() {
        this.validateDataHashLength();
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        if (this.version.gte(URLRef.HASHDATA_VERSION)) {
            // Version 2 adds flags and an optional hash before the URL string.
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
        this.flags = new bn_js_1.BN(0);
        this.dataHash = Buffer.alloc(vdxf_1.HASH256_BYTE_LENGTH);
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
        this.validateDataHashLength();
        return {
            version: this.version.toNumber(),
            flags: this.flags ? this.flags.toNumber() : 0,
            datahash: Buffer.from(this.dataHash).reverse().toString('hex'),
            url: this.url
        };
    }
    static fromJson(data) {
        let dataHash = Buffer.alloc(vdxf_1.HASH256_BYTE_LENGTH);
        if (data.datahash != null && data.datahash !== '') {
            if (!/^[0-9a-fA-F]{64}$/.test(data.datahash)) {
                throw new Error(`URLRef datahash must be exactly ${vdxf_1.HASH256_BYTE_LENGTH} bytes of hexadecimal data`);
            }
            // uint256 JSON is display order; the serialized value uses wire order.
            dataHash = Buffer.from(data.datahash, 'hex').reverse();
        }
        return new URLRef({
            version: new bn_js_1.BN(data.version, 10),
            flags: data.flags ? new bn_js_1.BN(data.flags, 10) : new bn_js_1.BN(0, 10),
            dataHash,
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
