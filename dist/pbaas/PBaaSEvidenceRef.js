"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBaaSEvidenceRef = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const varint_1 = require("../utils/varint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const UTXORef_1 = require("./UTXORef");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PBaaSEvidenceRef extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.dataHash = Buffer.alloc(0);
        if (data) {
            const d = data;
            const deprecated = ['object_num', 'sub_object', 'system_id', 'data_hash'].filter(k => k in d);
            if (deprecated.length > 0) {
                const map = { object_num: 'objectNum', sub_object: 'subObject', system_id: 'systemId', data_hash: 'dataHash' };
                throw new Error(`PBaaSEvidenceRef: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
            }
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.flags = data.flags || new bn_js_1.BN(0);
            this.output = data.output || new UTXORef_1.UTXORef();
            this.objectNum = data.objectNum || new bn_js_1.BN(0);
            this.subObject = data.subObject || new bn_js_1.BN(0);
            this.systemId = data.systemId || "";
            this.dataHash = data.dataHash || this.dataHash;
            this.validateDataHashLength();
        }
    }
    /** @deprecated Use objectNum instead */
    get object_num() { return this.objectNum; }
    /** @deprecated Use subObject instead */
    get sub_object() { return this.subObject; }
    /** @deprecated Use systemId instead */
    get system_id() { return this.systemId; }
    /** @deprecated Use dataHash instead */
    get data_hash() { return this.dataHash; }
    validateDataHashLength() {
        if (this.dataHash && this.dataHash.length !== 0 && this.dataHash.length !== vdxf_1.HASH256_BYTE_LENGTH) {
            throw new Error(`PBaaSEvidenceRef dataHash must be exactly ${vdxf_1.HASH256_BYTE_LENGTH} bytes`);
        }
    }
    hasNonNullDataHash() {
        this.validateDataHashLength();
        return !!this.dataHash && this.dataHash.length === vdxf_1.HASH256_BYTE_LENGTH &&
            !this.dataHash.equals(Buffer.alloc(vdxf_1.HASH256_BYTE_LENGTH));
    }
    hasDataHash() {
        return this.flags.and(PBaaSEvidenceRef.FLAG_HAS_HASH).gt(new bn_js_1.BN(0));
    }
    setFlags() {
        this.flags = this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE);
        if (this.systemId && this.systemId.length > 0) {
            this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_SYSTEM);
        }
        if (this.hasNonNullDataHash()) {
            this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_HASH);
        }
    }
    getByteLength() {
        let byteLength = 0;
        this.setFlags();
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        byteLength += this.output.getByteLength();
        byteLength += varint_1.default.encodingLength(this.objectNum);
        byteLength += varint_1.default.encodingLength(this.subObject);
        if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
        }
        if (this.hasDataHash()) {
            byteLength += vdxf_1.HASH256_BYTE_LENGTH;
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
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.systemId).hash);
        }
        if (this.hasDataHash()) {
            bufferWriter.writeSlice(this.dataHash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.output = new UTXORef_1.UTXORef();
        reader.offset = this.output.fromBuffer(reader.buffer, reader.offset);
        this.objectNum = reader.readVarInt();
        this.subObject = reader.readVarInt();
        if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            this.systemId = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        else {
            this.systemId = "";
        }
        if (this.hasDataHash()) {
            this.dataHash = reader.readSlice(vdxf_1.HASH256_BYTE_LENGTH);
        }
        else {
            this.dataHash = Buffer.alloc(0);
        }
        return reader.offset;
    }
    isValid() {
        return this.output.isValid() && this.version.gte(PBaaSEvidenceRef.FIRST_VERSION) &&
            this.version.lte(PBaaSEvidenceRef.LAST_VERSION) &&
            (this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE).gt(new bn_js_1.BN(0)));
    }
    toJson() {
        this.setFlags();
        let retval = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            output: this.output.toJson(),
            objectnum: this.objectNum.toNumber(),
            subobject: this.subObject.toNumber(),
            systemid: this.systemId || ""
        };
        if (this.hasDataHash()) {
            retval.datahash = Buffer.from(this.dataHash).reverse().toString('hex');
        }
        return retval;
    }
    static fromJson(json) {
        let dataHash = Buffer.alloc(0);
        if (json.datahash != null && json.datahash.length > 0) {
            if (!/^[0-9a-fA-F]{64}$/.test(json.datahash)) {
                throw new Error(`PBaaSEvidenceRef datahash must be exactly ${vdxf_1.HASH256_BYTE_LENGTH} bytes of hexadecimal data`);
            }
            dataHash = Buffer.from(json.datahash, 'hex').reverse();
        }
        return new PBaaSEvidenceRef({
            version: new bn_js_1.BN(json.version),
            flags: new bn_js_1.BN(json.flags),
            output: UTXORef_1.UTXORef.fromJson(json.output),
            objectNum: new bn_js_1.BN(json.objectnum),
            subObject: new bn_js_1.BN(json.subobject),
            systemId: json.systemid,
            dataHash
        });
    }
}
exports.PBaaSEvidenceRef = PBaaSEvidenceRef;
PBaaSEvidenceRef.FLAG_ISEVIDENCE = new bn_js_1.BN(1);
PBaaSEvidenceRef.FLAG_HAS_SYSTEM = new bn_js_1.BN(2);
PBaaSEvidenceRef.FLAG_HAS_HASH = new bn_js_1.BN(4);
PBaaSEvidenceRef.FIRST_VERSION = new bn_js_1.BN(1);
PBaaSEvidenceRef.LAST_VERSION = new bn_js_1.BN(1);
