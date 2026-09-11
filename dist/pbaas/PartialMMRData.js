"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialMMRData = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const varuint_1 = require("../utils/varuint");
const pbaas_1 = require("../constants/pbaas");
const VdxfUniValue_1 = require("./VdxfUniValue");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PartialMMRData extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0");
        this.data = data && data.data ? data.data : [];
        this.mmrhashtype = data && data.mmrhashtype ? data.mmrhashtype : pbaas_1.DEFAULT_HASH_TYPE_MMR;
        if (data === null || data === void 0 ? void 0 : data.salt) {
            if (!this.containsSalt())
                this.toggleContainsSalt();
            this.salt = data.salt;
        }
        if (data === null || data === void 0 ? void 0 : data.priormmr) {
            if (!this.containsPriorMMR())
                this.toggleContainsPriorMMR();
            this.priormmr = data.priormmr;
        }
    }
    containsSalt() {
        return !!(this.flags.and(PartialMMRData.CONTAINS_SALT).toNumber());
    }
    containsPriorMMR() {
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
            if (unit.type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                const vdxfdatalen = unit.data.getByteLength();
                length += varuint_1.default.encodingLength(vdxfdatalen);
                length += vdxfdatalen;
            }
            else {
                const buf = unit.data;
                length += varuint_1.default.encodingLength(buf.length);
                length += buf.length;
            }
        }
        length += varint_1.default.encodingLength(this.mmrhashtype);
        if (this.containsSalt()) {
            length += varuint_1.default.encodingLength(this.salt.length);
            for (let i = 0; i < this.salt.length; i++) {
                const salt = this.salt[i];
                length += varuint_1.default.encodingLength(salt.length);
                length += salt.length;
            }
        }
        if (this.containsPriorMMR()) {
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
            let data;
            if (type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                const vdxfData = new VdxfUniValue_1.VdxfUniValue();
                const vdxfDataBuf = reader.readVarSlice();
                vdxfData.fromBuffer(vdxfDataBuf);
                data = vdxfData;
            }
            else {
                data = reader.readVarSlice();
            }
            this.data.push({
                type,
                data
            });
        }
        this.mmrhashtype = reader.readVarInt();
        if (this.containsSalt()) {
            this.salt = reader.readVector();
        }
        if (this.containsPriorMMR()) {
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
            if (this.data[i].type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                const vdxfData = this.data[i].data;
                writer.writeVarSlice(vdxfData.toBuffer());
            }
            else {
                writer.writeVarSlice(this.data[i].data);
            }
        }
        writer.writeVarInt(this.mmrhashtype);
        if (this.containsSalt()) {
            writer.writeVector(this.salt);
        }
        if (this.containsPriorMMR()) {
            writer.writeVector(this.priormmr);
        }
        return writer.buffer;
    }
    toJson() {
        return {
            flags: this.flags ? this.flags.toString(10) : undefined,
            data: this.data ? this.data.map(x => {
                if (x.type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                    const uni = x.data.toJson();
                    if (Array.isArray(uni)) {
                        throw new Error("VDXF univalue arrays not supported in partialmmrdata vdxfdata");
                    }
                    else {
                        return {
                            type: x.type.toString(10),
                            data: uni
                        };
                    }
                }
                else {
                    return {
                        type: x.type.toString(10),
                        data: x.data.toString('hex')
                    };
                }
            }) : undefined,
            salt: this.salt ? this.salt.map(x => x.toString('hex')) : undefined,
            mmrhashtype: this.mmrhashtype ? this.mmrhashtype.toString(10) : undefined,
            priormmr: this.priormmr ? this.priormmr.map(x => x.toString('hex')) : undefined
        };
    }
    static fromJson(json) {
        return new PartialMMRData({
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            data: json.data ? json.data.map(x => {
                const type = new bn_js_1.BN(x.type, 10);
                if (type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                    return {
                        type: new bn_js_1.BN(x.type, 10),
                        data: VdxfUniValue_1.VdxfUniValue.fromJson(x.data)
                    };
                }
                else {
                    return {
                        type: new bn_js_1.BN(x.type, 10),
                        data: Buffer.from(x.data, 'hex')
                    };
                }
            }) : undefined,
            salt: json.salt ? json.salt.map(x => Buffer.from(x, 'hex')) : undefined,
            mmrhashtype: json.mmrhashtype ? new bn_js_1.BN(json.mmrhashtype, 10) : undefined,
            priormmr: json.priormmr ? json.priormmr.map(x => Buffer.from(x, 'hex')) : undefined,
        });
    }
    toCLIJson() {
        const mmrdata = [];
        let mmrsalt;
        let priormmr;
        let mmrhashtype;
        for (const unit of this.data) {
            if (unit.type.eq(pbaas_1.DATA_TYPE_RAWSTRINGDATA)) {
                mmrdata.push(unit.data.toString('hex'));
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_FILENAME)) {
                mmrdata.push({
                    "filename": unit.data.toString('utf-8')
                });
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_MESSAGE)) {
                mmrdata.push({
                    "message": unit.data.toString('utf-8')
                });
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_VDXFDATA)) {
                const uni = unit.data.toJson();
                if (Array.isArray(uni)) {
                    throw new Error("VDXF univalue arrays not supported in partialmmrdata vdxfdata");
                }
                else {
                    mmrdata.push({
                        "vdxfdata": uni
                    });
                }
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_HEX)) {
                mmrdata.push({
                    "serializedhex": unit.data.toString('hex')
                });
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_BASE64)) {
                mmrdata.push({
                    "serializedbase64": unit.data.toString('base64')
                });
            }
            else if (unit.type.eq(pbaas_1.DATA_TYPE_DATAHASH)) {
                mmrdata.push({
                    "datahash": unit.data.toString('hex')
                });
            }
        }
        if (this.containsSalt()) {
            mmrsalt = this.salt.map(x => x.toString('hex'));
        }
        if (this.containsPriorMMR()) {
            priormmr = this.priormmr.map(x => x.toString('hex'));
        }
        if (this.mmrhashtype.eq(pbaas_1.HASH_TYPE_SHA256)) {
            mmrhashtype = pbaas_1.HASH_TYPE_SHA256_NAME;
        }
        else if (this.mmrhashtype.eq(pbaas_1.HASH_TYPE_SHA256D)) {
            mmrhashtype = pbaas_1.HASH_TYPE_SHA256D_NAME;
        }
        else if (this.mmrhashtype.eq(pbaas_1.HASH_TYPE_BLAKE2B)) {
            mmrhashtype = pbaas_1.HASH_TYPE_BLAKE2B_NAME;
        }
        else if (this.mmrhashtype.eq(pbaas_1.HASH_TYPE_KECCAK256)) {
            mmrhashtype = pbaas_1.HASH_TYPE_KECCAK256_NAME;
        }
        else
            throw new Error("Unrecognized hash type");
        const ret = {
            mmrdata,
            mmrsalt,
            priormmr,
            mmrhashtype
        };
        for (const key in ret) {
            if (ret[key] === undefined)
                delete ret[key];
        }
        return ret;
    }
    static fromCLIJson(json) {
        const data = [];
        let salt;
        let priormmr;
        let mmrhashtype;
        for (const unit of json.mmrdata) {
            if (typeof unit === 'string') {
                data.push({ type: pbaas_1.DATA_TYPE_RAWSTRINGDATA, data: Buffer.from(unit, 'hex') });
            }
            else {
                const unitMmrData = unit["vdxfdata"] ? unit : unit;
                const dataKey = Object.keys(unitMmrData)[0];
                const dataValue = unitMmrData[dataKey];
                switch (dataKey) {
                    case "filename":
                        data.push({ type: pbaas_1.DATA_TYPE_FILENAME, data: Buffer.from(dataValue, 'utf-8') });
                        break;
                    case "message":
                        data.push({ type: pbaas_1.DATA_TYPE_MESSAGE, data: Buffer.from(dataValue, 'utf-8') });
                        break;
                    case "vdxfdata":
                        data.push({ type: pbaas_1.DATA_TYPE_VDXFDATA, data: VdxfUniValue_1.VdxfUniValue.fromJson(dataValue) });
                        break;
                    case "serializedhex":
                        data.push({ type: pbaas_1.DATA_TYPE_HEX, data: Buffer.from(dataValue, 'hex') });
                        break;
                    case "serializedbase64":
                        data.push({ type: pbaas_1.DATA_TYPE_BASE64, data: Buffer.from(dataValue, 'base64') });
                        break;
                    case "datahash":
                        data.push({ type: pbaas_1.DATA_TYPE_DATAHASH, data: Buffer.from(dataValue, 'hex') });
                        break;
                    default:
                        throw new Error("Unrecognized data key type");
                }
            }
        }
        if (json.mmrsalt) {
            salt = json.mmrsalt.map(x => Buffer.from(x, 'hex'));
        }
        if (json.priormmr) {
            priormmr = json.priormmr.map(x => Buffer.from(x, 'hex'));
        }
        if (json.mmrhashtype) {
            switch (json.mmrhashtype) {
                case pbaas_1.HASH_TYPE_SHA256_NAME:
                    mmrhashtype = pbaas_1.HASH_TYPE_SHA256;
                    break;
                case pbaas_1.HASH_TYPE_SHA256D_NAME:
                    mmrhashtype = pbaas_1.HASH_TYPE_SHA256D;
                    break;
                case pbaas_1.HASH_TYPE_BLAKE2B_NAME:
                    mmrhashtype = pbaas_1.HASH_TYPE_BLAKE2B;
                    break;
                case pbaas_1.HASH_TYPE_KECCAK256_NAME:
                    mmrhashtype = pbaas_1.HASH_TYPE_KECCAK256;
                    break;
                default:
                    throw new Error("Unrecognized hash type");
            }
        }
        return new PartialMMRData({
            data,
            salt,
            priormmr,
            mmrhashtype
        });
    }
}
exports.PartialMMRData = PartialMMRData;
PartialMMRData.CONTAINS_SALT = new bn_js_1.BN("1", 10);
PartialMMRData.CONTAINS_PRIORMMR = new bn_js_1.BN("2", 10);
