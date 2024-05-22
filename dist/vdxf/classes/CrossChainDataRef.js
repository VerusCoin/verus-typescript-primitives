"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossChainDataRef = exports.URLRef = exports.IdentityMultimapRef = exports.PBaaSEvidenceRef = exports.CUTXORef = void 0;
const varint_1 = require("../../utils/varint");
const varuint_1 = require("../../utils/varuint");
const address_1 = require("../../utils/address");
const bufferutils_1 = require("../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class CUTXORef {
    constructor(data) {
        this.hash = data.hash || Buffer.alloc(0);
        this.n = data.n || new bn_js_1.BN(0);
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += 32; // hash uint256
        byteLength += 4; // n uint32
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeSlice(this.hash);
        bufferWriter.writeUInt32(this.n.toNumber());
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.hash = reader.readSlice(32);
        this.n = new bn_js_1.BN(reader.readUInt32());
        return reader.offset;
    }
}
exports.CUTXORef = CUTXORef;
class PBaaSEvidenceRef {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
    SetFlags() {
        this.flags = this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE);
        if (this.systemID && this.systemID.length > 0) {
            this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_SYSTEM);
        }
    }
    getByteLength() {
        let byteLength = 0;
        this.SetFlags();
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        byteLength += this.output.getByteLength();
        byteLength += varint_1.default.encodingLength(this.objectNum);
        byteLength += varint_1.default.encodingLength(this.subObject);
        if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            byteLength += 20;
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarInt(this.flags);
        bufferWriter.writeSlice(this.output.toBuffer());
        bufferWriter.writeVarInt(this.objectNum);
        bufferWriter.writeVarInt(this.subObject);
        if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.systemID).hash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.output = new CUTXORef();
        offset = this.output.fromBuffer(reader.buffer, reader.offset);
        this.objectNum = reader.readVarInt();
        this.subObject = reader.readVarInt();
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            this.systemID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        return reader.offset;
    }
}
exports.PBaaSEvidenceRef = PBaaSEvidenceRef;
PBaaSEvidenceRef.FLAG_ISEVIDENCE = new bn_js_1.BN(1);
PBaaSEvidenceRef.FLAG_HAS_SYSTEM = new bn_js_1.BN(2);
class IdentityMultimapRef {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
    SetFlags() {
        this.flags = this.flags.and(IdentityMultimapRef.FLAG_NO_DELETION);
        if (this.dataHash && this.dataHash.length > 0) {
            this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_DATAHASH);
        }
        if (this.systemID && this.systemID.length > 0) {
            this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_SYSTEM);
        }
    }
    getByteLength() {
        let byteLength = 0;
        this.SetFlags();
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        byteLength += 20; // idID uint160
        byteLength += 20; // key uint160
        byteLength += varint_1.default.encodingLength(this.heightStart); // heightStart uint32
        byteLength += varint_1.default.encodingLength(this.heightEnd); // heightEnd uint32
        byteLength += 32; // dataHash uint25
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            byteLength += 32;
        }
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            byteLength += 20;
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarInt(this.flags);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.idID).hash);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.key).hash);
        bufferWriter.writeVarInt(this.heightStart);
        bufferWriter.writeVarInt(this.heightEnd);
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            bufferWriter.writeSlice(this.dataHash);
        }
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.systemID).hash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.idID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.key = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.heightStart = reader.readVarInt();
        this.heightEnd = reader.readVarInt();
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            this.dataHash = reader.readSlice(32);
        }
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            this.systemID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        return reader.offset;
    }
}
exports.IdentityMultimapRef = IdentityMultimapRef;
IdentityMultimapRef.FLAG_NO_DELETION = new bn_js_1.BN(1);
IdentityMultimapRef.FLAG_HAS_DATAHASH = new bn_js_1.BN(2);
IdentityMultimapRef.FLAG_HAS_SYSTEM = new bn_js_1.BN(4);
class URLRef {
    constructor(data) {
        if (data) {
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.url = data.url || "";
        }
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varuint_1.default.encodingLength(Buffer.from(this.url, 'utf8').length);
        byteLength += Buffer.from(this.url, 'utf8').length;
        if (byteLength > 4096)
            throw new Error("URLRef exceeds maximum length of 4096 bytes");
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.url = reader.readVarSlice().toString('utf8');
        return reader.offset;
    }
}
exports.URLRef = URLRef;
class CrossChainDataRef {
    constructor(data) {
        this.ref = data || null;
    }
    which() {
        if (this.ref instanceof PBaaSEvidenceRef) {
            return CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF;
        }
        else if (this.ref instanceof IdentityMultimapRef) {
            return CrossChainDataRef.TYPE_IDENTITY_DATAREF;
        }
        else if (this.ref instanceof URLRef) {
            return CrossChainDataRef.TYPE_URL_REF;
        }
    }
    getByteLength() {
        let byteLength = 1; //type uint8
        byteLength += this.ref.getByteLength();
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeUInt8(this.which());
        bufferWriter.writeSlice(this.ref.toBuffer());
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        const type = reader.readUInt8();
        if (type == CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF) {
            this.ref = new PBaaSEvidenceRef();
        }
        else if (type == CrossChainDataRef.TYPE_IDENTITY_DATAREF) {
            this.ref = new IdentityMultimapRef();
        }
        else if (type == CrossChainDataRef.TYPE_URL_REF) {
            this.ref = new URLRef();
        }
        offset = this.ref.fromBuffer(buffer, reader.offset);
        return reader.offset;
    }
}
exports.CrossChainDataRef = CrossChainDataRef;
CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF = 0;
CrossChainDataRef.TYPE_IDENTITY_DATAREF = 1;
CrossChainDataRef.TYPE_URL_REF = 2;
