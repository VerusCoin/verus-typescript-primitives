"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceData = exports.MultiPartDescriptor = exports.ETypes = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
var ETypes;
(function (ETypes) {
    ETypes[ETypes["TYPE_INVALID"] = 0] = "TYPE_INVALID";
    ETypes[ETypes["TYPE_FIRST_VALID"] = 1] = "TYPE_FIRST_VALID";
    ETypes[ETypes["TYPE_DATA"] = 1] = "TYPE_DATA";
    ETypes[ETypes["TYPE_MULTIPART_DATA"] = 2] = "TYPE_MULTIPART_DATA";
    ETypes[ETypes["TYPE_LAST_VALID"] = 2] = "TYPE_LAST_VALID";
})(ETypes || (exports.ETypes = ETypes = {}));
;
class MultiPartDescriptor extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.index = (data === null || data === void 0 ? void 0 : data.index) || new bn_js_1.BN(0, 10);
        this.total_length = (data === null || data === void 0 ? void 0 : data.total_length) || new bn_js_1.BN(0, 10);
        this.start = (data === null || data === void 0 ? void 0 : data.start) || new bn_js_1.BN(0, 10);
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.index);
        byteLength += varint_1.default.encodingLength(this.total_length);
        byteLength += varint_1.default.encodingLength(this.start);
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.index);
        bufferWriter.writeVarInt(this.total_length);
        bufferWriter.writeVarInt(this.start);
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.index = reader.readVarInt();
        this.total_length = reader.readVarInt();
        this.start = reader.readVarInt();
        return reader.offset;
    }
}
exports.MultiPartDescriptor = MultiPartDescriptor;
class EvidenceData extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.version = (data === null || data === void 0 ? void 0 : data.version) || new bn_js_1.BN(1, 10);
        this.type = (data === null || data === void 0 ? void 0 : data.type) || new bn_js_1.BN(ETypes.TYPE_DATA); // holding a transaction proof of export with finalization referencing finalization of root notarization
        this.md = data === null || data === void 0 ? void 0 : data.md;
        this.vdxfd = data === null || data === void 0 ? void 0 : data.vdxfd;
        this.data_vec = (data === null || data === void 0 ? void 0 : data.data_vec) || Buffer.alloc(0);
    }
    getByteLength() {
        let byteLength = 0;
        //yes read twice
        byteLength += varint_1.default.encodingLength(new bn_js_1.BN(this.version));
        byteLength += varint_1.default.encodingLength(new bn_js_1.BN(this.version));
        byteLength += varint_1.default.encodingLength(new bn_js_1.BN(this.type));
        if (this.type.eq(new bn_js_1.BN(ETypes.TYPE_MULTIPART_DATA))) {
            byteLength += this.md.getByteLength();
        }
        else {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
        }
        byteLength += varuint_1.default.encodingLength(this.data_vec.length);
        byteLength += this.data_vec.length;
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        //yes read twice
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarInt(this.type);
        if (this.type.eq(new bn_js_1.BN(ETypes.TYPE_MULTIPART_DATA))) {
            bufferWriter.writeSlice(this.md.toBuffer());
        }
        else {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.vdxfd).hash);
        }
        bufferWriter.writeVarSlice(this.data_vec);
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        //yes read twice
        this.version = reader.readVarInt();
        this.version = reader.readVarInt();
        this.type = reader.readVarInt();
        if (this.type.eq(new bn_js_1.BN(ETypes.TYPE_MULTIPART_DATA))) {
            this.md = new MultiPartDescriptor();
            reader.offset = this.md.fromBuffer(buffer, reader.offset);
        }
        else {
            this.vdxfd = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        this.data_vec = reader.readVarSlice();
        return reader.offset;
    }
    isValid() {
        return this.version.gte(EvidenceData.VERSION_FIRST) &&
            this.version.lte(EvidenceData.VERSION_LAST) &&
            this.type.gte(new bn_js_1.BN(ETypes.TYPE_FIRST_VALID)) &&
            this.type.lte(new bn_js_1.BN(ETypes.TYPE_LAST_VALID));
    }
    toJson() {
        return {
            version: this.version.toString(10),
            hex: this.toBuffer().toString('hex')
        };
    }
    static fromJson(data) {
        const newEvidenceData = new EvidenceData();
        newEvidenceData.fromBuffer(Buffer.from(data.hex, 'hex'));
        return newEvidenceData;
    }
}
exports.EvidenceData = EvidenceData;
EvidenceData.VERSION_INVALID = new bn_js_1.BN(0);
EvidenceData.VERSION_FIRST = new bn_js_1.BN(1);
EvidenceData.VERSION_CURRENT = new bn_js_1.BN(1);
EvidenceData.VERSION_LAST = new bn_js_1.BN(1);
