"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralTypeOrdinalVDXFObject = exports.OrdinalVDXFObject = exports.getOrdinalVDXFObjectClassForType = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../../utils/varuint");
const address_1 = require("../../../utils/address");
const varint_1 = require("../../../utils/varint");
const vdxf_1 = require("../../../constants/vdxf");
const OrdinalVDXFObjectOrdinalMap_1 = require("./OrdinalVDXFObjectOrdinalMap");
const pbaas_1 = require("../../../constants/pbaas");
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const getOrdinalVDXFObjectClassForType = (type) => {
    if (OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.isRecognizedOrdinal(type.toNumber())) {
        const key = OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(type.toNumber());
        if (OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.hasClassForVdxfKey(key)) {
            return OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.getClassForVdxfKey(OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(type.toNumber()));
        }
        else {
            throw new Error("No class found for " + key);
        }
    }
    else if (type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_I_ADDR) ||
        type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING) ||
        type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY))
        return GeneralTypeOrdinalVDXFObject;
    else
        throw new Error("Unrecognized vdxf ordinal object type " + type.toNumber());
};
exports.getOrdinalVDXFObjectClassForType = getOrdinalVDXFObjectClassForType;
class OrdinalVDXFObject extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(request = {
        type: ordinals_1.DATA_DESCRIPTOR_VDXF_ORDINAL
    }) {
        super();
        if (request.key) {
            this.type = request.type ? request.type : ordinals_1.VDXF_OBJECT_RESERVED_BYTE_I_ADDR;
            this.key = request.key;
            if (request.data) {
                this.data = request.data;
            }
            else
                this.data = Buffer.alloc(0);
        }
        else if (request.type == null) {
            this.type = ordinals_1.DATA_DESCRIPTOR_VDXF_ORDINAL;
        }
        else {
            this.type = request.type;
        }
        if (request.version)
            this.version = request.version;
        else
            this.version = OrdinalVDXFObject.VERSION_CURRENT;
    }
    isDefinedByVdxfKey() {
        return this.type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_I_ADDR);
    }
    isDefinedByTextVdxfKey() {
        return this.type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING);
    }
    isDefinedByIDOrCurrencyFQN() {
        return this.type.eq(ordinals_1.VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY);
    }
    isDefinedByCustomKey() {
        return this.isDefinedByIDOrCurrencyFQN() || this.isDefinedByTextVdxfKey() || this.isDefinedByVdxfKey();
    }
    // Returns the I address vdxf key of this vdxf object
    getIAddressKey() {
        if (this.isDefinedByVdxfKey()) {
            return this.key;
        }
        else if (this.isDefinedByTextVdxfKey()) {
            return (0, address_1.getDataKey)(this.key).id;
        }
        else if (this.isDefinedByIDOrCurrencyFQN()) {
            return (0, address_1.toIAddress)(this.key);
        }
        else if (OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.isRecognizedOrdinal(this.type.toNumber())) {
            return OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(this.type.toNumber());
        }
        else
            throw new Error("Could not get I address for ordinal VDXF object");
    }
    getDataByteLength() {
        return 0;
    }
    toDataBuffer() {
        return Buffer.alloc(0);
    }
    fromDataBuffer(buffer, rootSystemName) { }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.type.toNumber());
        if (this.isDefinedByVdxfKey()) {
            length += (0, address_1.fromBase58Check)(this.key).hash.length;
        }
        else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
            const utf8Key = Buffer.from(this.key, 'utf8');
            length += varuint_1.default.encodingLength(utf8Key.length);
            length += utf8Key.length;
        }
        length += varint_1.default.encodingLength(this.version);
        const dataLength = this.getDataByteLength();
        length += varuint_1.default.encodingLength(dataLength);
        length += dataLength;
        return length;
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.type.toNumber());
        if (this.isDefinedByVdxfKey()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.key).hash);
        }
        else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
            writer.writeVarSlice(Buffer.from(this.key, 'utf8'));
        }
        writer.writeVarInt(this.version);
        writer.writeVarSlice(this.toDataBuffer());
        return writer.buffer;
    }
    fromBufferOptionalType(buffer, offset, type, key, rootSystemName) {
        if (buffer.length == 0)
            throw new Error("Cannot create request from empty buffer");
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        if (!type) {
            this.type = new bn_js_1.BN(reader.readCompactSize());
        }
        else
            this.type = type;
        if (!key) {
            if (this.isDefinedByVdxfKey()) {
                this.key = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            }
            else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
                this.key = reader.readVarSlice().toString('utf8');
            }
        }
        else {
            this.key = key;
        }
        this.version = reader.readVarInt();
        const dataBuf = reader.readVarSlice();
        this.fromDataBuffer(dataBuf, rootSystemName);
        return reader.offset;
    }
    fromBuffer(buffer, offset) {
        return this.fromBufferOptionalType(buffer, offset);
    }
    toJson() {
        return {
            type: this.type ? this.type.toString() : undefined,
            version: this.version ? this.version.toString() : undefined,
            vdxfkey: this.key,
            data: this.data ? this.isDefinedByCustomKey() ? this.data.toString('hex') : this.data.toJson() : undefined
        };
    }
    static createFromBuffer(buffer, offset, optimizeWithOrdinal = false, rootSystemName = pbaas_1.DEFAULT_VERUS_CHAINNAME) {
        if (buffer.length == 0)
            throw new Error("Cannot create request from empty buffer");
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        let type = new bn_js_1.BN(reader.readCompactSize());
        const rootSystemId = (0, address_1.toIAddress)(rootSystemName);
        let Entity = (0, exports.getOrdinalVDXFObjectClassForType)(type);
        let ord = new Entity({ type });
        let key;
        if (optimizeWithOrdinal) {
            let vdxfKey;
            if (ord.isDefinedByVdxfKey()) {
                key = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
                vdxfKey = key;
            }
            else if (ord.isDefinedByTextVdxfKey() || ord.isDefinedByIDOrCurrencyFQN()) {
                key = reader.readVarSlice().toString('utf8');
                if (ord.isDefinedByTextVdxfKey()) {
                    vdxfKey = (0, address_1.getDataKey)(key, undefined, rootSystemId).id;
                }
                else {
                    vdxfKey = (0, address_1.toIAddress)(key, rootSystemName);
                }
            }
            if (OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.vdxfKeyHasOrdinal(vdxfKey)) {
                type = new bn_js_1.BN(OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.getOrdinalForVdxfKey(vdxfKey));
                Entity = (0, exports.getOrdinalVDXFObjectClassForType)(type);
                ord = new Entity({ type });
            }
        }
        reader.offset = ord.fromBufferOptionalType(buffer, reader.offset, type, key, rootSystemName);
        return { offset: reader.offset, obj: ord };
    }
}
exports.OrdinalVDXFObject = OrdinalVDXFObject;
OrdinalVDXFObject.VERSION_INVALID = new bn_js_1.BN(0, 10);
OrdinalVDXFObject.VERSION_FIRST = new bn_js_1.BN(1, 10);
OrdinalVDXFObject.VERSION_LAST = new bn_js_1.BN(1, 10);
OrdinalVDXFObject.VERSION_CURRENT = new bn_js_1.BN(1, 10);
class GeneralTypeOrdinalVDXFObject extends OrdinalVDXFObject {
    constructor(request = {
        type: ordinals_1.VDXF_OBJECT_RESERVED_BYTE_I_ADDR,
        data: Buffer.alloc(0),
        key: vdxf_1.NULL_ADDRESS
    }) {
        super({
            type: request.type,
            data: request.data,
            key: request.key
        });
    }
    getDataByteLength() {
        return this.data.length;
    }
    toDataBuffer() {
        return this.data;
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = Buffer.from(buffer);
    }
    static fromJson(details) {
        return new GeneralTypeOrdinalVDXFObject({
            key: details.vdxfkey,
            data: details.data ? Buffer.from(details.data, 'hex') : undefined,
            type: details.type ? new bn_js_1.BN(details.type) : ordinals_1.VDXF_OBJECT_RESERVED_BYTE_I_ADDR
        });
    }
}
exports.GeneralTypeOrdinalVDXFObject = GeneralTypeOrdinalVDXFObject;
