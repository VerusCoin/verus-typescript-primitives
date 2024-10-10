"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PBaaSEvidenceRef = void 0;
const varint_1 = require("../utils/varint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const UTXORef_1 = require("./UTXORef");
const IdentityMultimapRef_1 = require("./IdentityMultimapRef");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PBaaSEvidenceRef {
    constructor(data) {
        if (data) {
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.flags = data.flags || new bn_js_1.BN(0);
            this.output = data.output || new UTXORef_1.UTXORef();
            this.object_num = data.object_num || new bn_js_1.BN(0);
            this.sub_object = data.sub_object || new bn_js_1.BN(0);
            this.system_id = data.system_id || "";
        }
    }
    setFlags() {
        this.flags = this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE);
        if (this.system_id && this.system_id.length > 0) {
            this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_SYSTEM);
        }
    }
    getByteLength() {
        let byteLength = 0;
        this.setFlags();
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varint_1.default.encodingLength(this.flags);
        byteLength += this.output.getByteLength();
        byteLength += varint_1.default.encodingLength(this.object_num);
        byteLength += varint_1.default.encodingLength(this.sub_object);
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
        bufferWriter.writeVarInt(this.object_num);
        bufferWriter.writeVarInt(this.sub_object);
        if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new bn_js_1.BN(0))) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.system_id).hash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.output = new UTXORef_1.UTXORef();
        offset = this.output.fromBuffer(reader.buffer, reader.offset);
        this.object_num = reader.readVarInt();
        this.sub_object = reader.readVarInt();
        if (this.flags.and(IdentityMultimapRef_1.IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new bn_js_1.BN(0))) {
            this.system_id = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        return reader.offset;
    }
    isValid() {
        return this.output.isValid() && this.version.gte(PBaaSEvidenceRef.FIRST_VERSION) &&
            this.version.lte(PBaaSEvidenceRef.LAST_VERSION) &&
            (this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE).gt(new bn_js_1.BN(0)));
    }
    toJson() {
        let retval = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            output: this.output.toJson(),
            objectnum: this.object_num.toNumber(),
            subobject: this.sub_object.toNumber(),
            systemid: this.system_id || ""
        };
        return retval;
    }
    static fromJson(json) {
        return new PBaaSEvidenceRef({
            version: new bn_js_1.BN(json.version),
            flags: new bn_js_1.BN(json.flags),
            output: UTXORef_1.UTXORef.fromJson(json.output),
            object_num: new bn_js_1.BN(json.objectnum),
            sub_object: new bn_js_1.BN(json.subobject),
            system_id: json.systemid
        });
    }
}
exports.PBaaSEvidenceRef = PBaaSEvidenceRef;
PBaaSEvidenceRef.FLAG_ISEVIDENCE = new bn_js_1.BN(1);
PBaaSEvidenceRef.FLAG_HAS_SYSTEM = new bn_js_1.BN(2);
PBaaSEvidenceRef.FIRST_VERSION = new bn_js_1.BN(1);
PBaaSEvidenceRef.LAST_VERSION = new bn_js_1.BN(1);
