"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FqnContentMultiMap = exports.ContentMultiMap = exports.KvContent = void 0;
exports.isKvValueArrayItemVdxfUniValueJson = isKvValueArrayItemVdxfUniValueJson;
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const VdxfUniValue_1 = require("./VdxfUniValue");
const string_1 = require("../utils/string");
const CompactAddressObject_1 = require("../vdxf/classes/CompactAddressObject");
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
/**
 * KvContent wraps a Map whose internal keys are hex strings of CompactIAddressObject.toBuffer().
 * External callers always use CompactIAddressObject for keys.
 *
 * Keys whose toIAddress() resolves to the same iaddress are not allowed, because an FQN and a
 * TYPE_I_ADDRESS key can evaluate to the same underlying iaddress and would collide on-chain.
 */
class KvContent {
    constructor() {
        this._map = new Map();
    }
    static toInternalKey(key) {
        return key.toBuffer().toString('hex');
    }
    static keyFromInternalKey(hexKey) {
        const key = new CompactAddressObject_1.CompactIAddressObject();
        key.fromBuffer(Buffer.from(hexKey, 'hex'));
        return key;
    }
    get size() {
        return this._map.size;
    }
    set(key, value) {
        const internalKey = KvContent.toInternalKey(key);
        if (!this._map.has(internalKey)) {
            const newIAddr = key.toIAddress();
            for (const hexKey of this._map.keys()) {
                const existing = KvContent.keyFromInternalKey(hexKey);
                if (existing.toIAddress() === newIAddr) {
                    throw new Error(`KvContent key collision: a different key already resolves to iaddress ${newIAddr}`);
                }
            }
        }
        this._map.set(internalKey, value);
        return this;
    }
    get(key) {
        return this._map.get(KvContent.toInternalKey(key));
    }
    has(key) {
        return this._map.has(KvContent.toInternalKey(key));
    }
    delete(key) {
        return this._map.delete(KvContent.toInternalKey(key));
    }
    entries() {
        const map = this._map;
        function* gen() {
            for (const [hexKey, value] of map.entries()) {
                yield [KvContent.keyFromInternalKey(hexKey), value];
            }
        }
        return gen();
    }
}
exports.KvContent = KvContent;
class ContentMultiMap {
    constructor(data) {
        if (data === null || data === void 0 ? void 0 : data.kvContent)
            this.kvContent = data.kvContent;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.kvContent.size);
        for (const [key, value] of this.kvContent.entries()) {
            length += (0, address_1.fromBase58Check)(key.toIAddress()).hash.length;
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
        writer.writeCompactSize(this.kvContent.size);
        for (const [key, value] of this.kvContent.entries()) {
            writer.writeSlice((0, address_1.fromBase58Check)(key.toIAddress()).hash);
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
        this.kvContent = new KvContent();
        for (var i = 0; i < contentMultiMapSize; i++) {
            const iaddr = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            const contentMapKey = CompactAddressObject_1.CompactIAddressObject.fromAddress(iaddr);
            const vector = [];
            const count = reader.readCompactSize();
            for (let j = 0; j < count; j++) {
                if (parseVdxfObjects) {
                    const unival = new VdxfUniValue_1.VdxfUniValue();
                    unival.fromBuffer(reader.readVarSlice(), 0);
                    vector.push(unival);
                }
                else {
                    vector.push(reader.readVarSlice());
                }
            }
            this.kvContent.set(contentMapKey, vector);
        }
        return reader.offset;
    }
    static fromJson(obj) {
        const content = new KvContent();
        for (const keyStr in obj) {
            const compactKey = keyStr.includes('::')
                ? CompactAddressObject_1.CompactIAddressObject.fromFQN(keyStr)
                : CompactAddressObject_1.CompactIAddressObject.fromAddress(keyStr);
            // Validate that the key resolves to a real iaddress
            const resolvedIAddr = compactKey.toIAddress();
            const keybytes = (0, address_1.fromBase58Check)(resolvedIAddr).hash;
            const value = obj[keyStr];
            if (keybytes && value != null) {
                const valueArray = Array.isArray(value) ? value : [value];
                if (typeof value === 'string' && (0, string_1.isHexString)(value)) {
                    content.set(compactKey, [Buffer.from(value, 'hex')]);
                }
                else if (Array.isArray(value) || typeof value === 'object') {
                    const items = [];
                    for (const x of valueArray) {
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
                    content.set(compactKey, items);
                }
                else {
                    throw new Error("Invalid data in multimap");
                }
            }
        }
        return new ContentMultiMap({ kvContent: content });
    }
    toJson() {
        const ret = {};
        for (const [key, value] of this.kvContent.entries()) {
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
                ret[key.toString()] = items;
            }
            else
                throw new Error("Unknown ContentMultiMap data, can't toBuffer");
        }
        return ret;
    }
}
exports.ContentMultiMap = ContentMultiMap;
/**
 * FqnContentMultiMap is a ContentMultiMap variant used exclusively in PartialIdentity.
 * It serializes keys as full CompactIAddressObjects (preserving TYPE_FQN through binary
 * round-trips) rather than the daemon-compatible 20-byte iaddress hash format used by
 * ContentMultiMap. These two formats are not interchangeable.
 */
class FqnContentMultiMap extends ContentMultiMap {
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.kvContent.size);
        for (const [key, value] of this.kvContent.entries()) {
            length += key.getByteLength();
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
                        throw new Error("Unknown FqnContentMultiMap data, can't calculate ByteLength");
                }
            }
            else
                throw new Error("Unknown FqnContentMultiMap data, can't calculate ByteLength");
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.kvContent.size);
        for (const [key, value] of this.kvContent.entries()) {
            writer.writeSlice(key.toBuffer());
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
                        throw new Error("Unknown FqnContentMultiMap data, can't toBuffer");
                }
            }
            else
                throw new Error("Unknown FqnContentMultiMap data, can't toBuffer");
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, parseVdxfObjects = false) {
        const reader = new BufferReader(buffer, offset);
        const contentMultiMapSize = reader.readCompactSize();
        this.kvContent = new KvContent();
        for (let i = 0; i < contentMultiMapSize; i++) {
            const contentMapKey = new CompactAddressObject_1.CompactIAddressObject();
            reader.offset = contentMapKey.fromBuffer(reader.buffer, reader.offset);
            const vector = [];
            const count = reader.readCompactSize();
            for (let j = 0; j < count; j++) {
                if (parseVdxfObjects) {
                    const unival = new VdxfUniValue_1.FqnVdxfUniValue();
                    unival.fromBuffer(reader.readVarSlice(), 0);
                    vector.push(unival);
                }
                else {
                    vector.push(reader.readVarSlice());
                }
            }
            this.kvContent.set(contentMapKey, vector);
        }
        return reader.offset;
    }
    static fromJson(obj) {
        const content = new KvContent();
        for (const keyStr in obj) {
            const compactKey = keyStr.includes('::')
                ? CompactAddressObject_1.CompactIAddressObject.fromFQN(keyStr)
                : CompactAddressObject_1.CompactIAddressObject.fromAddress(keyStr);
            const resolvedIAddr = compactKey.toIAddress();
            const keybytes = (0, address_1.fromBase58Check)(resolvedIAddr).hash;
            const value = obj[keyStr];
            if (keybytes && value != null) {
                const valueArray = Array.isArray(value) ? value : [value];
                if (typeof value === 'string' && (0, string_1.isHexString)(value)) {
                    content.set(compactKey, [Buffer.from(value, 'hex')]);
                }
                else if (Array.isArray(value) || typeof value === 'object') {
                    const items = [];
                    for (const x of valueArray) {
                        if (typeof x === 'string') {
                            items.push(Buffer.from(x, 'hex'));
                        }
                        else if (typeof x === 'object' && x != null) {
                            const uniVal = VdxfUniValue_1.FqnVdxfUniValue.fromJson(x);
                            if (uniVal.toBuffer().length > 0) {
                                items.push(uniVal);
                            }
                        }
                    }
                    content.set(compactKey, items);
                }
                else {
                    throw new Error("Invalid data in multimap");
                }
            }
        }
        const inst = new FqnContentMultiMap();
        inst.kvContent = content;
        return inst;
    }
}
exports.FqnContentMultiMap = FqnContentMultiMap;
