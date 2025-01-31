"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialMMRData = void 0;
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const varuint_1 = require("../utils/varuint");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PartialMMRData {
    constructor(data) {
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0");
        this.data = data && data.data ? data.data : [];
        this.hashtype = data && data.hashtype ? data.hashtype : PartialMMRData.DEFAULT_HASH_TYPE;
        if (data === null || data === void 0 ? void 0 : data.salt) {
            this.toggleContainsSalt();
            this.salt = data.salt;
        }
        if (data === null || data === void 0 ? void 0 : data.priormmr) {
            this.toggleContainsPriorMMR();
            this.priormmr = data.priormmr;
        }
    }
    serializeSalt() {
        return !!(this.flags.and(PartialMMRData.CONTAINS_SALT).toNumber());
    }
    serializePriorMMR() {
        return !!(this.flags.and(PartialMMRData.CONTAINS_PRIORMMR).toNumber());
    }
    toggleContainsSalt() {
        this.flags = this.flags.xor(PartialMMRData.CONTAINS_SALT);
    }
    toggleContainsPriorMMR() {
        this.flags = this.flags.xor(PartialMMRData.CONTAINS_PRIORMMR);
    }
    getPartialMMRDataByteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.flags);
        length += varuint_1.default.encodingLength(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            const unit = this.data[i];
            length += varint_1.default.encodingLength(unit.type);
            length += varuint_1.default.encodingLength(unit.data.length);
            length += unit.data.length;
        }
        length += varint_1.default.encodingLength(this.hashtype);
        if (this.serializeSalt()) {
            length += varuint_1.default.encodingLength(this.salt.length);
            for (let i = 0; i < this.salt.length; i++) {
                const salt = this.salt[i];
                length += varuint_1.default.encodingLength(salt.length);
                length += salt.length;
            }
        }
        if (this.serializePriorMMR()) {
            length += varuint_1.default.encodingLength(this.priormmr.length);
            for (let i = 0; i < this.priormmr.length; i++) {
                const priormmr = this.priormmr[i];
                length += varuint_1.default.encodingLength(priormmr.length);
                length += priormmr.length;
            }
        }
        return length;
    }
    getByteLength() {
        return this.getPartialMMRDataByteLength();
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.flags = reader.readVarInt();
        const numData = reader.readCompactSize();
        for (let i = 0; i < numData; i++) {
            const type = reader.readVarInt();
            const data = reader.readVarSlice();
            this.data.push({
                type,
                data
            });
        }
        this.hashtype = reader.readVarInt();
        if (this.serializeSalt()) {
            this.salt = reader.readVector();
        }
        if (this.serializePriorMMR()) {
            this.priormmr = reader.readVector();
        }
        return reader.offset;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getPartialMMRDataByteLength()));
        // Serialize flags
        writer.writeVarInt(this.flags);
        writer.writeCompactSize(this.data.length);
        for (let i = 0; i < this.data.length; i++) {
            writer.writeVarInt(this.data[i].type);
            writer.writeVarSlice(this.data[i].data);
        }
        writer.writeVarInt(this.hashtype);
        if (this.serializeSalt()) {
            writer.writeVector(this.salt);
        }
        if (this.serializePriorMMR()) {
            writer.writeVector(this.priormmr);
        }
        return writer.buffer;
    }
}
exports.PartialMMRData = PartialMMRData;
PartialMMRData.CONTAINS_SALT = new bn_js_1.BN("1", 10);
PartialMMRData.CONTAINS_PRIORMMR = new bn_js_1.BN("2", 10);
// "1" is omitted to avoid overloading DATA_TYPE_MMRDATA in PartialSignData
PartialMMRData.DATA_TYPE_UNKNOWN = new bn_js_1.BN("0", 10);
PartialMMRData.DATA_TYPE_FILENAME = new bn_js_1.BN("2", 10);
PartialMMRData.DATA_TYPE_MESSAGE = new bn_js_1.BN("3", 10);
PartialMMRData.DATA_TYPE_VDXFDATA = new bn_js_1.BN("4", 10);
PartialMMRData.DATA_TYPE_SERIALIZEDHEX = new bn_js_1.BN("5", 10);
PartialMMRData.DATA_TYPE_SERIALIZEDBASE64 = new bn_js_1.BN("6", 10);
PartialMMRData.DATA_TYPE_DATAHASH = new bn_js_1.BN("7", 10);
PartialMMRData.DATA_TYPE_RAWSTRINGDATA = new bn_js_1.BN("8", 10);
PartialMMRData.HASH_TYPE_SHA256 = new bn_js_1.BN("1", 10);
PartialMMRData.HASH_TYPE_SHA256D = new bn_js_1.BN("2", 10);
PartialMMRData.HASH_TYPE_BLAKE2B = new bn_js_1.BN("3", 10);
PartialMMRData.HASH_TYPE_KECCAK256 = new bn_js_1.BN("4", 10);
PartialMMRData.DEFAULT_HASH_TYPE = PartialMMRData.HASH_TYPE_SHA256;
