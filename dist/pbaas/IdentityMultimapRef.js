"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityMultimapRef = void 0;
const varint_1 = require("../utils/varint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class IdentityMultimapRef {
    constructor(data) {
        if (data) {
            const deprecated = ['id_ID', 'height_start', 'height_end', 'data_hash', 'system_id'].filter(k => k in data);
            if (deprecated.length > 0) {
                const map = { id_ID: 'idID', height_start: 'heightStart', height_end: 'heightEnd', data_hash: 'dataHash', system_id: 'systemId' };
                throw new Error(`IdentityMultimapRef: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
            }
            this.version = data.version || IdentityMultimapRef.CURRENT_VERSION;
            this.flags = data.flags || new bn_js_1.BN(0);
            this.idID = data.idID || "";
            this.key = data.key || "";
            this.heightStart = data.heightStart || new bn_js_1.BN(0);
            this.heightEnd = data.heightEnd || new bn_js_1.BN(0);
            this.dataHash = data.dataHash || Buffer.alloc(0);
            this.systemId = data.systemId || "";
        }
    }
    /** @deprecated Use idID instead */
    get id_ID() { return this.idID; }
    /** @deprecated Use heightStart instead */
    get height_start() { return this.heightStart; }
    /** @deprecated Use heightEnd instead */
    get height_end() { return this.heightEnd; }
    /** @deprecated Use dataHash instead */
    get data_hash() { return this.dataHash; }
    /** @deprecated Use systemId instead */
    get system_id() { return this.systemId; }
    setFlags() {
        this.flags = this.flags.and(IdentityMultimapRef.FLAG_NO_DELETION);
        if (this.dataHash && this.dataHash.length > 0) {
            this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_DATAHASH);
        }
        if (this.systemId && this.systemId.length > 0) {
            this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_SYSTEM);
        }
    }
    getByteLength() {
        let byteLength = 0;
        this.setFlags();
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        byteLength += vdxf_1.HASH160_BYTE_LENGTH; // idID
        byteLength += vdxf_1.HASH160_BYTE_LENGTH; // vdxfkey
        byteLength += varint_1.default.encodingLength(this.heightStart); // heightStart uint32
        byteLength += varint_1.default.encodingLength(this.heightEnd); // heightEnd uint32
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            byteLength += vdxf_1.HASH256_BYTE_LENGTH;
        }
        if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
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
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.systemId).hash);
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
            this.systemId = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        return reader.offset;
    }
    isValid() {
        return this.version.gte(IdentityMultimapRef.FIRST_VERSION) &&
            this.version.lte(IdentityMultimapRef.LAST_VERSION) &&
            this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH.add(IdentityMultimapRef.FLAG_HAS_SYSTEM)).eq(IdentityMultimapRef.FLAG_HAS_DATAHASH.add(IdentityMultimapRef.FLAG_HAS_SYSTEM)) &&
            !(!this.idID || this.idID.length === 0) && !(!this.key || this.key.length === 0);
    }
    hasDataHash() {
        return this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0));
    }
    hasSystemID() {
        return this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0));
    }
    toJson() {
        let retval = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            vdxfkey: this.key,
            startheight: this.heightStart.toNumber(),
            endheight: this.heightEnd.toNumber(),
            identityid: this.idID
        };
        if (this.hasDataHash()) {
            retval.datahash = Buffer.from(this.dataHash).reverse().toString('hex');
        }
        if (this.hasSystemID()) {
            retval.systemid = this.systemId;
        }
        return retval;
    }
    static fromJson(data) {
        return new IdentityMultimapRef({
            version: new bn_js_1.BN(data.version),
            flags: new bn_js_1.BN(data.flags),
            key: data.vdxfkey,
            idID: data.identityid,
            heightStart: new bn_js_1.BN(data.startheight),
            heightEnd: new bn_js_1.BN(data.endheight),
            dataHash: Buffer.from(data.datahash, 'hex').reverse(),
            systemId: data.systemid
        });
    }
}
exports.IdentityMultimapRef = IdentityMultimapRef;
IdentityMultimapRef.FLAG_NO_DELETION = new bn_js_1.BN(1);
IdentityMultimapRef.FLAG_HAS_DATAHASH = new bn_js_1.BN(2);
IdentityMultimapRef.FLAG_HAS_SYSTEM = new bn_js_1.BN(4);
IdentityMultimapRef.FIRST_VERSION = new bn_js_1.BN(1);
IdentityMultimapRef.LAST_VERSION = new bn_js_1.BN(1);
IdentityMultimapRef.CURRENT_VERSION = new bn_js_1.BN(1);
