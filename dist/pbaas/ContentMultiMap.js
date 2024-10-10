"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentMultiMap = exports.isKvValueArrayItemVdxfUniValueJson = void 0;
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const VdxfUniValue_1 = require("./VdxfUniValue");
const string_1 = require("../utils/string");
const { BufferReader, BufferWriter } = bufferutils_1.default;
function isKvValueArrayItemVdxfUniValueJson(x) {
    return x != null && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).every((key) => {
        const val = x[key];
        try {
            const { version, hash } = (0, address_1.fromBase58Check)(key);
            return version === vdxf_1.I_ADDR_VERSION && (Buffer.isBuffer(val) || typeof val === 'string');
        }
        catch (e) {
            return false;
        }
    });
}
exports.isKvValueArrayItemVdxfUniValueJson = isKvValueArrayItemVdxfUniValueJson;
class ContentMultiMap {
    constructor(data) {
        if (data === null || data === void 0 ? void 0 : data.kv_content)
            this.kv_content = data.kv_content;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.kv_content.size);
        for (const [key, value] of this.kv_content.entries()) {
            length += (0, address_1.fromBase58Check)(key).hash.length;
            if (Array.isArray(value)) {
                const valueArr = value;
                length += varuint_1.default.encodingLength(valueArr.length);
                for (const n of value) {
                    if (n instanceof VdxfUniValue_1.VdxfUniValue) {
                        const nCMMNOLength = n.getByteLength();
                        length += varuint_1.default.encodingLength(nCMMNOLength);
                        length += nCMMNOLength;
                    }
                    else if (Buffer.isBuffer(n)) {
                        const nBuf = n;
                        length += varuint_1.default.encodingLength(nBuf.length);
                        length += nBuf.length;
                    }
                    else
                        throw new Error("Unknown ContentMultiMap data, can't calculate ByteLength");
                }
            }
            else
                throw new Error("Unknown ContentMultiMap data, can't calculate ByteLength");
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.kv_content.size);
        for (const [key, value] of this.kv_content.entries()) {
            writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
            if (Array.isArray(value)) {
                writer.writeCompactSize(value.length);
                for (const n of value) {
                    if (n instanceof VdxfUniValue_1.VdxfUniValue) {
                        const nCMMNOBuf = n.toBuffer();
                        writer.writeVarSlice(nCMMNOBuf);
                    }
                    else if (Buffer.isBuffer(n)) {
                        const nBuf = n;
                        writer.writeVarSlice(nBuf);
                    }
                    else
                        throw new Error("Unknown ContentMultiMap data, can't toBuffer");
                }
            }
            else
                throw new Error("Unknown ContentMultiMap data, can't toBuffer");
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = false) {
        const reader = new BufferReader(buffer, offset);
        const contentMultiMapSize = reader.readCompactSize();
        this.kv_content = new Map();
        for (var i = 0; i < contentMultiMapSize; i++) {
            const contentMapKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            const vector = [];
            const count = reader.readCompactSize();
            for (let j = 0; j < count; j++) {
                if (parseVdxfObjects) {
                    const unival = new VdxfUniValue_1.VdxfUniValue();
                    unival.fromBuffer(reader.readVarSlice(), 0);
                    vector.push(unival);
                }
                else
                    vector.push(reader.readVarSlice());
            }
            this.kv_content.set(contentMapKey, vector);
        }
        return reader.offset;
    }
    static fromJson(obj) {
        const content = new Map();
        for (const key in obj) {
            const keybytes = (0, address_1.fromBase58Check)(key).hash;
            const value = obj[key];
            if (keybytes && value != null) {
                if (Array.isArray(value)) {
                    const items = [];
                    for (const x of value) {
                        if (typeof x === 'string') {
                            items.push(Buffer.from(x, 'hex'));
                        }
                        else if (typeof x === 'object' && x != null) {
                            const uniVal = VdxfUniValue_1.VdxfUniValue.fromJson(x);
                            if (uniVal.toBuffer().length > 0) {
                                items.push(uniVal);
                            }
                        }
                    }
                    content.set(key, items);
                }
                else if (typeof value === 'string' && (0, string_1.isHexString)(value)) {
                    content.set(key, [Buffer.from(value, 'hex')]);
                }
                else if (isKvValueArrayItemVdxfUniValueJson(value)) {
                    content.set(key, [VdxfUniValue_1.VdxfUniValue.fromJson(value)]);
                }
                else {
                    throw new Error("Invalid data in multimap");
                }
            }
        }
        return new ContentMultiMap({ kv_content: content });
    }
    toJson() {
        const ret = {};
        for (const [key, value] of this.kv_content.entries()) {
            if (Array.isArray(value)) {
                const items = [];
                for (const n of value) {
                    if (n instanceof VdxfUniValue_1.VdxfUniValue) {
                        items.push(n.toJson());
                    }
                    else if (Buffer.isBuffer(n)) {
                        items.push(n.toString('hex'));
                    }
                    else
                        throw new Error("Unknown ContentMultiMap data, can't toBuffer");
                }
                ret[key] = items;
            }
            else
                throw new Error("Unknown ContentMultiMap data, can't toBuffer");
        }
        return ret;
    }
}
exports.ContentMultiMap = ContentMultiMap;
