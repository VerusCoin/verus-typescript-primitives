"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefinedKey = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../utils/varuint");
const varint_1 = require("../utils/varint");
const address_1 = require("../utils/address");
const pbaas_1 = require("../constants/pbaas");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class DefinedKey {
    constructor(data) {
        this.flags = DefinedKey.DEFINEDKEY_DEFAULT_FLAGS;
        this.version = DefinedKey.DEFINEDKEY_VERSION_INVALID;
        if (data != null) {
            if (data.flags != null)
                this.flags = data.flags;
            if (data.version != null)
                this.version = data.version;
            if (data.vdxfuri)
                this.vdxfuri = data.vdxfuri;
            if (data.combinedVDXFKey || data.combinedHash || data.indexNum) {
                throw new Error("Combining keys not supported yet.");
            }
        }
        if (this.containsSchema())
            throw new Error("Schema not supported yet.");
        if (this.combinesKey() || this.combinesHash() || this.combinesindexNum()) {
            throw new Error("Combining keys not supported yet.");
        }
    }
    containsSchema() {
        return !!(this.flags.and(DefinedKey.DEFINEDKEY_CONTAINS_SCHEMA).toNumber());
    }
    combinesKey() {
        return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_KEY).toNumber());
    }
    combinesHash() {
        return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_HASH).toNumber());
    }
    combinesindexNum() {
        return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_INDEX_NUM).toNumber());
    }
    getFqnBuffer() {
        return Buffer.from(this.vdxfuri, 'utf8');
    }
    getDataKey(testnet = false) {
        if (this.combinedVDXFKey || this.combinedHash || this.indexNum) {
            throw new Error("Combining keys not supported yet.");
        }
        if (this.vdxfuri == null)
            throw new Error("No fully qualified name provided.");
        else if (testnet) {
            return (0, address_1.getDataKey)(this.vdxfuri, null, pbaas_1.TESTNET_VERUS_CHAINID);
        }
        else
            return (0, address_1.getDataKey)(this.vdxfuri);
    }
    getIAddr(testnet = false) {
        return this.getDataKey(testnet).id;
    }
    getNameSpaceID(testnet = false) {
        return this.getDataKey(testnet).namespace;
    }
    getSelfByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        const fqnLen = this.getFqnBuffer().length;
        byteLength += varuint_1.default.encodingLength(fqnLen);
        byteLength += fqnLen;
        return byteLength;
    }
    getByteLength() {
        return this.getSelfByteLength();
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(this.flags);
        writer.writeVarSlice(this.getFqnBuffer());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.vdxfuri = (reader.readVarSlice()).toString('utf8');
        return reader.offset;
    }
}
exports.DefinedKey = DefinedKey;
DefinedKey.DEFINEDKEY_DEFAULT_FLAGS = new bn_js_1.BN(0, 10);
DefinedKey.DEFINEDKEY_COMBINES_KEY = new bn_js_1.BN(1, 10);
DefinedKey.DEFINEDKEY_COMBINES_HASH = new bn_js_1.BN(2, 10);
DefinedKey.DEFINEDKEY_COMBINES_INDEX_NUM = new bn_js_1.BN(4, 10);
DefinedKey.DEFINEDKEY_CONTAINS_SCHEMA = new bn_js_1.BN(8, 10);
DefinedKey.DEFINEDKEY_VERSION_INVALID = new bn_js_1.BN(0, 10);
DefinedKey.DEFINEDKEY_VERSION_CURRENT = new bn_js_1.BN(1, 10);
