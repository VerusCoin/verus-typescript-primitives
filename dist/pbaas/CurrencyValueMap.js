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
const numberConversion_1 = require("../utils/numberConversion");
class CurrencyValueMap {
    constructor(data = {}) {
        if (data != null) {
            if (Object.prototype.hasOwnProperty.call(data, 'value_map')) {
                throw new Error("CurrencyValueMap: snake_case property names are no longer supported. Use 'valueMap' instead of 'value_map'.");
            }
        }
        this.valueMap = new Map(data.valueMap || []);
        this.multivalue = !!(data.multivalue);
    }
    /** @deprecated Use valueMap instead */
    get value_map() { return this.valueMap; }
    getNumValues() {
        return new bn_js_1.BN(this.valueMap.size, 10);
    }
    getByteLength() {
        let byteLength = 0;
        if (this.multivalue) {
            byteLength += varuint_1.default.encodingLength(this.valueMap.size);
        }
        for (const [key, value] of this.valueMap) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
            byteLength += this.multivalue ? 8 : varint_1.default.encodingLength(value);
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        if (this.multivalue) {
            const entries = [];
            bufferWriter.writeCompactSize(this.valueMap.size);
            // Convert entries to array with [Buffer, BigNumber]
            for (const [key, value] of this.valueMap) {
                const { hash } = (0, address_1.fromBase58Check)(key);
                entries.push({ [hash.toString('hex')]: value });
            }
            // Sort by Buffer (vkey) value, smallest first
            entries.sort((a, b) => {
                const aKey = Object.keys(a)[0];
                const bKey = Object.keys(b)[0];
                const aBuf = Buffer.from(aKey, 'hex');
                const bBuf = Buffer.from(bKey, 'hex');
                return aBuf.compare(bBuf);
            });
            for (const value of entries) {
                const key = Object.keys(value)[0];
                const innervalue = value[key];
                bufferWriter.writeSlice(Buffer.from(key, 'hex'));
                bufferWriter.writeInt64(innervalue);
            }
        }
        else {
            for (const [key, value] of this.valueMap) {
                const { hash } = (0, address_1.fromBase58Check)(key);
                bufferWriter.writeSlice(hash);
                bufferWriter.writeVarInt(value);
            }
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
            this.valueMap.set(base58Key, value);
        }
        return reader.offset;
    }
    isValid() {
        for (let [key, value] of this.valueMap) {
            if (!key || (typeof (key) == 'string' && key.length == 0)) {
                return false;
            }
        }
        return true;
    }
    toJson() {
        const value_map = {};
        for (let [key, value] of this.valueMap) {
            value_map[key] = (0, numberConversion_1.bnToDecimal)(value);
        }
        return value_map;
    }
    static fromJson(data, multivalue = false) {
        const valueMap = new Map();
        // Object.entries preserves the insertion order of the object's keys
        // If the input object is created with insertion order in mind, this will preserve it
        for (const key of Object.keys(data)) {
            valueMap.set(key, (0, numberConversion_1.decimalToBn)(data[key]));
        }
        return new CurrencyValueMap({ valueMap, multivalue });
    }
}
exports.CurrencyValueMap = CurrencyValueMap;
