"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyValueMap = void 0;
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class CurrencyValueMap {
    constructor(data = {}) {
        this.value_map = new Map(data.value_map || []);
        this.multivalue = !!(data.multivalue);
    }
    getNumValues() {
        return new bn_js_1.BN(this.value_map.size, 10);
    }
    getByteLength() {
        let byteLength = 0;
        if (this.multivalue) {
            byteLength += varuint_1.default.encodingLength(this.value_map.size);
        }
        for (const [key, value] of this.value_map) {
            byteLength += 20;
            byteLength += this.multivalue ? 8 : varint_1.default.encodingLength(value);
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        if (this.multivalue) {
            bufferWriter.writeCompactSize(this.value_map.size);
        }
        for (const [key, value] of this.value_map) {
            const { hash } = (0, address_1.fromBase58Check)(key);
            bufferWriter.writeSlice(hash);
            if (this.multivalue)
                bufferWriter.writeInt64(value);
            else
                bufferWriter.writeVarInt(value);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        let count;
        if (this.multivalue) {
            count = reader.readCompactSize();
        }
        else {
            count = 1;
        }
        for (let i = 0; i < count; i++) {
            const hash = reader.readSlice(20);
            const value = this.multivalue ? reader.readInt64() : reader.readVarInt();
            const base58Key = (0, address_1.toBase58Check)(hash, vdxf_1.I_ADDR_VERSION);
            this.value_map.set(base58Key, value);
        }
        return reader.offset;
    }
    isValid() {
        for (let [key, value] of this.value_map) {
            if (!key || (typeof (key) == 'string' && key.length == 0)) {
                return false;
            }
        }
        return true;
    }
    toJson() {
        const value_map = {};
        for (let [key, value] of this.value_map) {
            value_map[key] = value.toString();
        }
        return value_map;
    }
}
exports.CurrencyValueMap = CurrencyValueMap;
