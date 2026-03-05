"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentMultiMapRemove = void 0;
const varint_1 = require("../utils/varint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class ContentMultiMapRemove {
    constructor(data) {
        this.version = (data === null || data === void 0 ? void 0 : data.version) || new bn_js_1.BN(1, 10);
        this.action = (data === null || data === void 0 ? void 0 : data.action) || new bn_js_1.BN(0, 10);
        this.entryKey = (data === null || data === void 0 ? void 0 : data.entryKey) || undefined;
        this.valueHash = (data === null || data === void 0 ? void 0 : data.valueHash) || undefined;
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.action);
        if (!this.action.eq(ContentMultiMapRemove.ACTION_CLEAR_MAP)) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
            if (!this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY)) {
                byteLength += vdxf_1.HASH256_BYTE_LENGTH;
            }
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarInt(this.action);
        if (!this.action.eq(ContentMultiMapRemove.ACTION_CLEAR_MAP)) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.entryKey).hash);
            if (!this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY)) {
                bufferWriter.writeSlice(this.valueHash);
            }
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readVarInt());
        this.action = new bn_js_1.BN(reader.readVarInt());
        if (!this.action.eq(ContentMultiMapRemove.ACTION_CLEAR_MAP)) {
            this.entryKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            if (!this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY)) {
                this.valueHash = reader.readSlice(32);
            }
        }
        return reader.offset;
    }
    static fromJson(data) {
        return new ContentMultiMapRemove({
            version: new bn_js_1.BN(data.version),
            action: new bn_js_1.BN(data.action),
            entryKey: data.entrykey,
            valueHash: data.action === ContentMultiMapRemove.ACTION_REMOVE_ONE_KEYVALUE.toNumber() ||
                data.action === ContentMultiMapRemove.ACTION_REMOVE_ALL_KEYVALUE.toNumber() ?
                Buffer.from(data.valuehash, 'hex').reverse() : undefined // Unit256 Reverse to match the original hash order
        });
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            action: this.action.toNumber(),
            entrykey: this.entryKey,
            valuehash: this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEYVALUE) ||
                this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ONE_KEYVALUE) ?
                Buffer.from(this.valueHash).reverse().toString('hex') : undefined
        };
    }
    isValid() {
        if (this.version.gte(ContentMultiMapRemove.VERSION_FIRST) &&
            this.version.lte(ContentMultiMapRemove.VERSION_LAST)) {
            return (this.action.eq(ContentMultiMapRemove.ACTION_CLEAR_MAP) ||
                (this.entryKey && (this.entryKey.length > 0) &&
                    (this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY) || this.valueHash.length > 0)));
        }
        return false;
    }
}
exports.ContentMultiMapRemove = ContentMultiMapRemove;
ContentMultiMapRemove.VERSION_INVALID = new bn_js_1.BN(0);
ContentMultiMapRemove.VERSION_FIRST = new bn_js_1.BN(1);
ContentMultiMapRemove.VERSION_LAST = new bn_js_1.BN(1);
ContentMultiMapRemove.VERSION_CURRENT = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_FIRST = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_REMOVE_ONE_KEYVALUE = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_REMOVE_ALL_KEYVALUE = new bn_js_1.BN(2);
ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY = new bn_js_1.BN(3);
ContentMultiMapRemove.ACTION_CLEAR_MAP = new bn_js_1.BN(4);
ContentMultiMapRemove.ACTION_LAST = new bn_js_1.BN(4);
