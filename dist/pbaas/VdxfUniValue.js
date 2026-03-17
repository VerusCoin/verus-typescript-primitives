"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FqnVdxfUniValue = exports.VdxfUniValue = exports.VDXF_UNI_VALUE_VERSION_CURRENT = exports.VDXF_UNI_VALUE_VERSION_INVALID = void 0;
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const string_1 = require("../utils/string");
const CurrencyValueMap_1 = require("./CurrencyValueMap");
const Rating_1 = require("./Rating");
const TransferDestination_1 = require("./TransferDestination");
const ContentMultiMapRemove_1 = require("./ContentMultiMapRemove");
const CrossChainDataRef_1 = require("./CrossChainDataRef");
const SignatureData_1 = require("./SignatureData");
const DataDescriptor_1 = require("./DataDescriptor");
const MMRDescriptor_1 = require("./MMRDescriptor");
const Credential_1 = require("./Credential");
const CompactAddressObject_1 = require("../vdxf/classes/CompactAddressObject");
const VDXF_Data = require("../vdxf/vdxfdatakeys");
const KvMap_1 = require("../utils/KvMap");
exports.VDXF_UNI_VALUE_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.VDXF_UNI_VALUE_VERSION_CURRENT = new bn_js_1.BN(1, 10);
const { BufferWriter, BufferReader } = bufferutils_1.default;
;
class VdxfUniValue {
    get values() { return this._values; }
    set values(arr) { this._values = arr; }
    constructor(data) {
        if (data === null || data === void 0 ? void 0 : data.values)
            this.values = data.values;
        if (data === null || data === void 0 ? void 0 : data.version)
            this.version = data.version;
        else
            this.version = exports.VDXF_UNI_VALUE_VERSION_CURRENT;
    }
    getByteLength() {
        let length = 0;
        const totalStreamLength = (bufLen) => {
            const encodeStreamLen = varuint_1.default.encodingLength(bufLen + varuint_1.default.encodingLength(bufLen));
            return bufLen + encodeStreamLen;
        };
        for (const inner of this.values) {
            const key = Object.keys(inner)[0];
            const value = inner[key];
            if (key === "") {
                length += Buffer.from(value, "hex").length;
                continue;
            }
            // Fixed-size primitive types: no HASH160 prefix, just raw bytes
            switch (key) {
                case VDXF_Data.DataByteKey.vdxfid:
                    length += 1;
                    continue;
                case VDXF_Data.DataUint16Key.vdxfid:
                case VDXF_Data.DataInt16Key.vdxfid:
                    length += 2;
                    continue;
                case VDXF_Data.DataInt32Key.vdxfid:
                case VDXF_Data.DataUint32Key.vdxfid:
                    length += 4;
                    continue;
                case VDXF_Data.DataInt64Key.vdxfid:
                    length += 8;
                    continue;
                case VDXF_Data.DataUint160Key.vdxfid:
                    length += vdxf_1.HASH160_BYTE_LENGTH;
                    continue;
                case VDXF_Data.DataUint256Key.vdxfid:
                    length += vdxf_1.HASH256_BYTE_LENGTH;
                    continue;
            }
            // All remaining types are prefixed with a HASH160 key
            length += vdxf_1.HASH160_BYTE_LENGTH;
            switch (key) {
                case VDXF_Data.DataStringKey.vdxfid: {
                    const valBuf = Buffer.from(value, "utf-8");
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    // NOTE: 3 is from ss type + ver + vdxfIdVersion
                    length += varuint_1.default.encodingLength(valBuf.length);
                    length += totalStreamLength(valBuf.length);
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = Buffer.from(value, "hex");
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += varuint_1.default.encodingLength(valBuf.length);
                    length += totalStreamLength(valBuf.length);
                    break;
                }
                case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                    const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap(Object.assign(Object.assign({}, value), { multivalue: true }));
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += totalStreamLength(oneCurMap.getByteLength());
                    break;
                }
                case VDXF_Data.DataRatingsKey.vdxfid: {
                    const obj = new Rating_1.Rating(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.CredentialKey.vdxfid: {
                    const obj = new Credential_1.Credential(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                    const obj = new TransferDestination_1.TransferDestination(value);
                    length += varint_1.default.encodingLength(obj.typeNoFlags());
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                    const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                    const obj = value;
                    length += varint_1.default.encodingLength(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.DataDescriptorKey.vdxfid: {
                    const obj = new DataDescriptor_1.DataDescriptor(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.MMRDescriptorKey.vdxfid: {
                    const obj = new MMRDescriptor_1.MMRDescriptor(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.SignatureDataKey.vdxfid: {
                    const obj = new SignatureData_1.SignatureData(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                default:
                    throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
            }
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        for (const inner of this.values) {
            const key = Object.keys(inner)[0];
            const value = inner[key];
            if (key === "") {
                writer.writeSlice(value);
                continue;
            }
            switch (key) {
                case VDXF_Data.DataByteKey.vdxfid: {
                    const oneByte = Buffer.from(value, "hex");
                    if (oneByte.length != 1)
                        throw new Error("contentmap: byte data must be exactly one byte");
                    writer.writeSlice(oneByte);
                    break;
                }
                case VDXF_Data.DataInt16Key.vdxfid: {
                    const buf = Buffer.alloc(2);
                    buf.writeInt16LE(value.toNumber());
                    writer.writeSlice(buf);
                    break;
                }
                case VDXF_Data.DataUint16Key.vdxfid: {
                    const buf = Buffer.alloc(2);
                    buf.writeUInt16LE(value.toNumber());
                    writer.writeSlice(buf);
                    break;
                }
                case VDXF_Data.DataInt32Key.vdxfid: {
                    const buf = Buffer.alloc(4);
                    buf.writeInt32LE(value.toNumber());
                    writer.writeSlice(buf);
                    break;
                }
                case VDXF_Data.DataUint32Key.vdxfid: {
                    const buf = Buffer.alloc(4);
                    buf.writeUInt32LE(value.toNumber());
                    writer.writeSlice(buf);
                    break;
                }
                case VDXF_Data.DataInt64Key.vdxfid: {
                    const buf = Buffer.alloc(8);
                    buf.writeBigInt64LE(BigInt(value.toString()));
                    writer.writeSlice(buf);
                    break;
                }
                case VDXF_Data.DataUint160Key.vdxfid:
                    writer.writeSlice((0, address_1.fromBase58Check)(value).hash);
                    break;
                case VDXF_Data.DataUint256Key.vdxfid: {
                    const oneHash = Buffer.from(value, "hex");
                    if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH)
                        throw new Error("contentmap: hash data must be exactly 32 bytes");
                    writer.writeVarSlice(oneHash.reverse());
                    break;
                }
                case VDXF_Data.DataStringKey.vdxfid: {
                    const valBuf = Buffer.from(value, "utf-8");
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
                    writer.writeVarSlice(valBuf);
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = Buffer.from(value, "hex");
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(varuint_1.default.encodingLength(valBuf.length) + valBuf.length);
                    writer.writeVarSlice(valBuf);
                    break;
                }
                case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                    const obj = new CurrencyValueMap_1.CurrencyValueMap(Object.assign(Object.assign({}, value), { multivalue: true }));
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataRatingsKey.vdxfid: {
                    const obj = new Rating_1.Rating(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.CredentialKey.vdxfid: {
                    const obj = value;
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                    const obj = new TransferDestination_1.TransferDestination(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.typeNoFlags());
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                    const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                    const obj = value;
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataDescriptorKey.vdxfid: {
                    const obj = new DataDescriptor_1.DataDescriptor(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.MMRDescriptorKey.vdxfid: {
                    const obj = new MMRDescriptor_1.MMRDescriptor(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.SignatureDataKey.vdxfid: {
                    const obj = new SignatureData_1.SignatureData(value);
                    writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                default:
                    throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
            }
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.values = [];
        let bytesLeft = reader.buffer.length - reader.offset;
        while (bytesLeft > vdxf_1.HASH160_BYTE_LENGTH) {
            let objectUni;
            const initialOffset = reader.offset;
            try {
                const checkVal = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
                switch (checkVal) {
                    case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                        const obj = new CurrencyValueMap_1.CurrencyValueMap({ multivalue: true });
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataRatingsKey.vdxfid: {
                        const obj = new Rating_1.Rating();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.CredentialKey.vdxfid: {
                        const obj = new Credential_1.Credential();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                        const obj = new TransferDestination_1.TransferDestination();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                        const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        reader.readVarInt();
                        reader.readCompactSize();
                        objectUni = { key: checkVal, value: reader.readVarSlice().toString('utf8') };
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        reader.readVarInt();
                        reader.readCompactSize();
                        objectUni = { key: checkVal, value: reader.readVarSlice().toString('hex') };
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                        const obj = new CrossChainDataRef_1.CrossChainDataRef();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataDescriptorKey.vdxfid: {
                        const obj = new DataDescriptor_1.DataDescriptor();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.MMRDescriptorKey.vdxfid: {
                        const obj = new MMRDescriptor_1.MMRDescriptor();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.SignatureDataKey.vdxfid: {
                        const obj = new SignatureData_1.SignatureData();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                }
            }
            catch (e) {
                objectUni = undefined;
            }
            bytesLeft = reader.buffer.length - reader.offset;
            if ((objectUni === null || objectUni === void 0 ? void 0 : objectUni.key) && (objectUni === null || objectUni === void 0 ? void 0 : objectUni.value)) {
                this.values.push({ [objectUni.key]: objectUni.value });
            }
            else {
                // add the remaining data as a hex string
                reader.offset = initialOffset;
                this.values.push({ [""]: reader.readSlice(reader.buffer.length - reader.offset) });
                bytesLeft = 0;
                break;
            }
        }
        if (bytesLeft && bytesLeft <= vdxf_1.HASH160_BYTE_LENGTH) {
            this.values.push({ [""]: reader.readSlice(bytesLeft) });
        }
        return reader.offset;
    }
    static fromJson(obj) {
        const arrayItem = [];
        if (!Array.isArray(obj)) {
            if (typeof obj != 'object') {
                if (typeof obj != 'string')
                    throw new Error('Not JSON string as expected');
                return new VdxfUniValue({ values: [{ [""]: (0, string_1.isHexString)(obj)
                                ? Buffer.from(obj, "hex")
                                : Buffer.from(obj, "utf-8") }] });
            }
            if (obj.serializedhex) {
                if (!(0, string_1.isHexString)(obj.serializedhex)) {
                    throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
                }
                return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.serializedhex, "hex") }] });
            }
            if (obj.serializedbase64) {
                try {
                    return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.serializedbase64, "base64") }] });
                }
                catch (e) {
                    throw new Error("contentmap: If the \"serializedbase64\" key is present, it's data must be only valid base64 and complete");
                }
            }
            if (obj.message) {
                return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.message, "utf-8") }] });
            }
            obj = [obj];
        }
        // obj is now guaranteed to be an array
        for (const item of obj) {
            if (typeof item != 'object') {
                if (typeof item != 'string')
                    throw new Error('Not JSON string as expected');
                arrayItem.push({ [""]: (0, string_1.isHexString)(item)
                        ? Buffer.from(item, "hex")
                        : Buffer.from(item, "utf-8") });
                continue;
            }
            for (const [rawKey, val] of Object.entries(item)) {
                const objTypeKey = rawKey.includes('::')
                    ? CompactAddressObject_1.CompactIAddressObject.fromFQN(rawKey).toIAddress()
                    : rawKey;
                switch (objTypeKey) {
                    case VDXF_Data.DataByteKey.vdxfid: {
                        const oneByte = Buffer.from(val, "hex");
                        if (oneByte.length != 1)
                            throw new Error("contentmap: byte data must be exactly one byte");
                        arrayItem.push({ [objTypeKey]: oneByte });
                        break;
                    }
                    case VDXF_Data.DataInt16Key.vdxfid: {
                        const buf = Buffer.alloc(2);
                        buf.writeInt16LE(val);
                        arrayItem.push({ [objTypeKey]: buf });
                        break;
                    }
                    case VDXF_Data.DataUint16Key.vdxfid: {
                        const buf = Buffer.alloc(2);
                        buf.writeUInt16LE(val);
                        arrayItem.push({ [objTypeKey]: buf });
                        break;
                    }
                    case VDXF_Data.DataInt32Key.vdxfid: {
                        const buf = Buffer.alloc(4);
                        buf.writeInt32LE(val);
                        arrayItem.push({ [objTypeKey]: buf });
                        break;
                    }
                    case VDXF_Data.DataUint32Key.vdxfid: {
                        const buf = Buffer.alloc(4);
                        buf.writeUInt32LE(val);
                        arrayItem.push({ [objTypeKey]: buf });
                        break;
                    }
                    case VDXF_Data.DataInt64Key.vdxfid: {
                        const buf = Buffer.alloc(8);
                        buf.writeIntLE(val, 0, 8);
                        arrayItem.push({ [objTypeKey]: buf });
                        break;
                    }
                    case VDXF_Data.DataUint160Key.vdxfid:
                        (0, address_1.fromBase58Check)(val).hash;
                        arrayItem.push({ [objTypeKey]: val });
                        break;
                    case VDXF_Data.DataUint256Key.vdxfid: {
                        const oneHash = Buffer.from(val, "hex");
                        if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH)
                            throw new Error("contentmap: hash data must be exactly 32 bytes");
                        arrayItem.push({ [objTypeKey]: oneHash });
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: val });
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        if (!(0, string_1.isHexString)(val))
                            throw new Error("contentmap: bytevector data must be valid hex");
                        arrayItem.push({ [objTypeKey]: Buffer.from(val, "hex") });
                        break;
                    case VDXF_Data.DataCurrencyMapKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: CurrencyValueMap_1.CurrencyValueMap.fromJson(val, true) });
                        break;
                    case VDXF_Data.DataRatingsKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: Rating_1.Rating.fromJson(val) });
                        break;
                    case VDXF_Data.DataTransferDestinationKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: TransferDestination_1.TransferDestination.fromJson(val) });
                        break;
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: ContentMultiMapRemove_1.ContentMultiMapRemove.fromJson(val) });
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: CrossChainDataRef_1.CrossChainDataRef.fromJson(val) });
                        break;
                    case VDXF_Data.DataDescriptorKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: DataDescriptor_1.DataDescriptor.fromJson(val) });
                        break;
                    case VDXF_Data.MMRDescriptorKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: MMRDescriptor_1.MMRDescriptor.fromJson(val) });
                        break;
                    case VDXF_Data.SignatureDataKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: SignatureData_1.SignatureData.fromJson(val) });
                        break;
                    case VDXF_Data.CredentialKey.vdxfid:
                        arrayItem.push({ [objTypeKey]: Credential_1.Credential.fromJson(val) });
                        break;
                    default:
                        throw new Error("Unknown vdxfkey: " + val);
                }
            }
        }
        return new VdxfUniValue({ values: arrayItem });
    }
    toJson() {
        const ret = [];
        for (const inner of this.values) {
            const key = Object.keys(inner)[0];
            const value = inner[key];
            if (key === "" && Buffer.isBuffer(value)) {
                ret.push(value.toString('hex'));
            }
            else if (Buffer.isBuffer(value)) {
                ret.push({ [key]: value.toString('hex') });
            }
            else if (typeof value === 'string') {
                ret.push({ [key]: value });
            }
            else if (value instanceof bn_js_1.BN) {
                ret.push({ [key]: value.toString(10) });
            }
            else {
                ret.push({ [key]: value.toJson() });
            }
        }
        return ret.length === 1 ? ret[0] : ret;
    }
}
exports.VdxfUniValue = VdxfUniValue;
/**
 * FqnVdxfUniValue is a VdxfUniValue variant used exclusively within FqnContentMultiMap.
 * It serializes all complex-type keys as CompactIAddressObjects so that FQN keys survive
 * toBuffer/fromBuffer round-trips. Named entries are stored in a KvMap<VdxfUniType> keyed
 * by CompactIAddressObject; raw/unparsed bytes are stored separately in _rawBytes.
 *
 * Wire format for complex-type entries:
 *   [CompactIAddressObject (variable)][varint version][compact size][data bytes]
 *
 * fromBuffer always expects CompactIAddressObject format — no legacy 20-byte hash support.
 */
class FqnVdxfUniValue extends VdxfUniValue {
    constructor(data) {
        var _a;
        super();
        this._kvValues = new KvMap_1.KvMap();
        if (data === null || data === void 0 ? void 0 : data.values)
            this.values = data.values;
        this.version = (_a = data === null || data === void 0 ? void 0 : data.version) !== null && _a !== void 0 ? _a : exports.VDXF_UNI_VALUE_VERSION_CURRENT;
    }
    // Backwards-compatible array view over the internal KvMap + _rawBytes
    get values() {
        const result = [];
        for (const [key, value] of this._kvValues.entries()) {
            result.push({ [key.toBuffer().toString('hex')]: value });
        }
        if (this._rawBytes !== undefined) {
            result.push({ [""]: this._rawBytes });
        }
        return result;
    }
    entries() {
        return this._kvValues.entries();
    }
    set values(arr) {
        this._kvValues = new KvMap_1.KvMap();
        this._rawBytes = undefined;
        if (!arr)
            return;
        for (const inner of arr) {
            const key = Object.keys(inner)[0];
            if (key === '') {
                this._rawBytes = inner[key];
            }
            else {
                const compact = new CompactAddressObject_1.CompactIAddressObject();
                compact.fromBuffer(Buffer.from(key, 'hex'), 0);
                this._kvValues.set(compact, inner[key]);
            }
        }
    }
    static compactFor(rawKey) {
        return rawKey.includes('::')
            ? CompactAddressObject_1.CompactIAddressObject.fromFQN(rawKey)
            : CompactAddressObject_1.CompactIAddressObject.fromAddress(rawKey);
    }
    static fromVdxfUniValue(v) {
        const inst = new FqnVdxfUniValue({ version: v.version });
        for (const inner of v.values) {
            const key = Object.keys(inner)[0];
            if (key === '') {
                inst._rawBytes = inner[key];
            }
            else {
                inst._kvValues.set(CompactAddressObject_1.CompactIAddressObject.fromAddress(key), inner[key]);
            }
        }
        return inst;
    }
    getByteLength() {
        let length = 0;
        const totalStreamLength = (bufLen) => {
            const encodeStreamLen = varuint_1.default.encodingLength(bufLen + varuint_1.default.encodingLength(bufLen));
            return bufLen + encodeStreamLen;
        };
        for (const [compact, value] of this._kvValues.entries()) {
            const switchKey = compact.toIAddress();
            // Fixed-size primitive types: no key prefix
            switch (switchKey) {
                case VDXF_Data.DataByteKey.vdxfid:
                    length += 1;
                    continue;
                case VDXF_Data.DataUint16Key.vdxfid:
                case VDXF_Data.DataInt16Key.vdxfid:
                    length += 2;
                    continue;
                case VDXF_Data.DataInt32Key.vdxfid:
                case VDXF_Data.DataUint32Key.vdxfid:
                    length += 4;
                    continue;
                case VDXF_Data.DataInt64Key.vdxfid:
                    length += 8;
                    continue;
                case VDXF_Data.DataUint160Key.vdxfid:
                    length += vdxf_1.HASH160_BYTE_LENGTH;
                    continue;
                case VDXF_Data.DataUint256Key.vdxfid:
                    length += vdxf_1.HASH256_BYTE_LENGTH;
                    continue;
            }
            // Complex types: key is a CompactIAddressObject
            length += compact.getByteLength();
            switch (switchKey) {
                case VDXF_Data.DataStringKey.vdxfid: {
                    const valBuf = Buffer.from(value, "utf-8");
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += varuint_1.default.encodingLength(valBuf.length);
                    length += totalStreamLength(valBuf.length);
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = value;
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += varuint_1.default.encodingLength(valBuf.length);
                    length += totalStreamLength(valBuf.length);
                    break;
                }
                case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                    const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap(Object.assign(Object.assign({}, value), { multivalue: true }));
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += totalStreamLength(oneCurMap.getByteLength());
                    break;
                }
                case VDXF_Data.DataRatingsKey.vdxfid: {
                    const obj = new Rating_1.Rating(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.CredentialKey.vdxfid: {
                    const obj = new Credential_1.Credential(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                    const obj = new TransferDestination_1.TransferDestination(value);
                    length += varint_1.default.encodingLength(obj.typeNoFlags());
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                    const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                    const obj = value;
                    length += varint_1.default.encodingLength(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.DataDescriptorKey.vdxfid: {
                    const obj = new DataDescriptor_1.DataDescriptor(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.MMRDescriptorKey.vdxfid: {
                    const obj = new MMRDescriptor_1.MMRDescriptor(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                case VDXF_Data.SignatureDataKey.vdxfid: {
                    const obj = new SignatureData_1.SignatureData(value);
                    length += varint_1.default.encodingLength(obj.version);
                    length += totalStreamLength(obj.getByteLength());
                    break;
                }
                default:
                    throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + switchKey);
            }
        }
        if (this._rawBytes !== undefined) {
            length += this._rawBytes.length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        for (const [compact, value] of this._kvValues.entries()) {
            const switchKey = compact.toIAddress();
            // Fixed-size primitive types: no key prefix
            switch (switchKey) {
                case VDXF_Data.DataByteKey.vdxfid: {
                    const oneByte = value;
                    if (oneByte.length != 1)
                        throw new Error("contentmap: byte data must be exactly one byte");
                    writer.writeSlice(oneByte);
                    continue;
                }
                case VDXF_Data.DataInt16Key.vdxfid: {
                    const buf = Buffer.alloc(2);
                    buf.writeInt16LE(value.toNumber());
                    writer.writeSlice(buf);
                    continue;
                }
                case VDXF_Data.DataUint16Key.vdxfid: {
                    const buf = Buffer.alloc(2);
                    buf.writeUInt16LE(value.toNumber());
                    writer.writeSlice(buf);
                    continue;
                }
                case VDXF_Data.DataInt32Key.vdxfid: {
                    const buf = Buffer.alloc(4);
                    buf.writeInt32LE(value.toNumber());
                    writer.writeSlice(buf);
                    continue;
                }
                case VDXF_Data.DataUint32Key.vdxfid: {
                    const buf = Buffer.alloc(4);
                    buf.writeUInt32LE(value.toNumber());
                    writer.writeSlice(buf);
                    continue;
                }
                case VDXF_Data.DataInt64Key.vdxfid: {
                    const buf = Buffer.alloc(8);
                    buf.writeBigInt64LE(BigInt(value.toString()));
                    writer.writeSlice(buf);
                    continue;
                }
                case VDXF_Data.DataUint160Key.vdxfid:
                    writer.writeSlice((0, address_1.fromBase58Check)(value).hash);
                    continue;
                case VDXF_Data.DataUint256Key.vdxfid: {
                    const oneHash = value;
                    if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH)
                        throw new Error("contentmap: hash data must be exactly 32 bytes");
                    writer.writeSlice(Buffer.from(oneHash).reverse());
                    continue;
                }
            }
            // Complex types: write CompactIAddressObject key prefix
            writer.writeSlice(compact.toBuffer());
            switch (switchKey) {
                case VDXF_Data.DataStringKey.vdxfid: {
                    const valBuf = Buffer.from(value, "utf-8");
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
                    writer.writeVarSlice(valBuf);
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = value;
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(varuint_1.default.encodingLength(valBuf.length) + valBuf.length);
                    writer.writeVarSlice(valBuf);
                    break;
                }
                case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                    const obj = new CurrencyValueMap_1.CurrencyValueMap(Object.assign(Object.assign({}, value), { multivalue: true }));
                    writer.writeVarInt(new bn_js_1.BN(1));
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataRatingsKey.vdxfid: {
                    const obj = new Rating_1.Rating(value);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.CredentialKey.vdxfid: {
                    const obj = value;
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                    const obj = new TransferDestination_1.TransferDestination(value);
                    writer.writeVarInt(obj.typeNoFlags());
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                    const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                    const obj = value;
                    writer.writeVarInt(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.DataDescriptorKey.vdxfid: {
                    const obj = new DataDescriptor_1.DataDescriptor(value);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.MMRDescriptorKey.vdxfid: {
                    const obj = new MMRDescriptor_1.MMRDescriptor(value);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                case VDXF_Data.SignatureDataKey.vdxfid: {
                    const obj = new SignatureData_1.SignatureData(value);
                    writer.writeVarInt(obj.version);
                    writer.writeCompactSize(obj.getByteLength());
                    writer.writeSlice(obj.toBuffer());
                    break;
                }
                default:
                    throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + switchKey);
            }
        }
        if (this._rawBytes !== undefined) {
            writer.writeSlice(this._rawBytes);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this._kvValues = new KvMap_1.KvMap();
        this._rawBytes = undefined;
        let bytesLeft = reader.buffer.length - reader.offset;
        while (bytesLeft > 0) {
            let parsedKey;
            let parsedValue;
            const initialOffset = reader.offset;
            try {
                const compactAddr = new CompactAddressObject_1.CompactIAddressObject();
                reader.offset = compactAddr.fromBuffer(reader.buffer, reader.offset);
                const switchKey = compactAddr.toIAddress();
                switch (switchKey) {
                    case VDXF_Data.DataCurrencyMapKey.vdxfid: {
                        const obj = new CurrencyValueMap_1.CurrencyValueMap({ multivalue: true });
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataRatingsKey.vdxfid: {
                        const obj = new Rating_1.Rating();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.CredentialKey.vdxfid: {
                        const obj = new Credential_1.Credential();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                        const obj = new TransferDestination_1.TransferDestination();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                        const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        reader.readVarInt();
                        reader.readCompactSize();
                        parsedKey = compactAddr;
                        parsedValue = reader.readVarSlice().toString('utf8');
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        reader.readVarInt();
                        reader.readCompactSize();
                        parsedKey = compactAddr;
                        parsedValue = reader.readVarSlice();
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                        const obj = new CrossChainDataRef_1.CrossChainDataRef();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataDescriptorKey.vdxfid: {
                        const obj = new DataDescriptor_1.DataDescriptor();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.MMRDescriptorKey.vdxfid: {
                        const obj = new MMRDescriptor_1.MMRDescriptor();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.SignatureDataKey.vdxfid: {
                        const obj = new SignatureData_1.SignatureData();
                        reader.readVarInt();
                        reader.readCompactSize();
                        reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                }
            }
            catch (e) {
                parsedKey = undefined;
                parsedValue = undefined;
            }
            bytesLeft = reader.buffer.length - reader.offset;
            if (parsedKey && parsedValue !== undefined) {
                this._kvValues.set(parsedKey, parsedValue);
            }
            else {
                reader.offset = initialOffset;
                this._rawBytes = reader.readSlice(reader.buffer.length - reader.offset);
                bytesLeft = 0;
                break;
            }
        }
        return reader.offset;
    }
    static fromJson(obj) {
        if (!Array.isArray(obj)) {
            if (typeof obj != 'object') {
                if (typeof obj != 'string')
                    throw new Error('Not JSON string as expected');
                const inst = new FqnVdxfUniValue();
                inst._rawBytes = (0, string_1.isHexString)(obj) ? Buffer.from(obj, "hex") : Buffer.from(obj, "utf-8");
                return inst;
            }
            if (obj.serializedhex) {
                if (!(0, string_1.isHexString)(obj.serializedhex)) {
                    throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
                }
                const inst = new FqnVdxfUniValue();
                inst._rawBytes = Buffer.from(obj.serializedhex, "hex");
                return inst;
            }
            if (obj.serializedbase64) {
                try {
                    const inst = new FqnVdxfUniValue();
                    inst._rawBytes = Buffer.from(obj.serializedbase64, "base64");
                    return inst;
                }
                catch (e) {
                    throw new Error("contentmap: If the \"serializedbase64\" key is present, it's data must be only valid base64 and complete");
                }
            }
            if (obj.message) {
                const inst = new FqnVdxfUniValue();
                inst._rawBytes = Buffer.from(obj.message, "utf-8");
                return inst;
            }
            obj = [obj];
        }
        const inst = new FqnVdxfUniValue();
        for (const item of obj) {
            if (typeof item != 'object') {
                if (typeof item != 'string')
                    throw new Error('Not JSON string as expected');
                inst._rawBytes = (0, string_1.isHexString)(item)
                    ? Buffer.from(item, "hex")
                    : Buffer.from(item, "utf-8");
                continue;
            }
            for (const [rawKey, val] of Object.entries(item)) {
                const compact = FqnVdxfUniValue.compactFor(rawKey);
                const switchKey = compact.toIAddress();
                switch (switchKey) {
                    case VDXF_Data.DataByteKey.vdxfid: {
                        const oneByte = Buffer.from(val, "hex");
                        if (oneByte.length != 1)
                            throw new Error("contentmap: byte data must be exactly one byte");
                        inst._kvValues.set(compact, oneByte);
                        break;
                    }
                    case VDXF_Data.DataInt16Key.vdxfid: {
                        const buf = Buffer.alloc(2);
                        buf.writeInt16LE(val);
                        inst._kvValues.set(compact, buf);
                        break;
                    }
                    case VDXF_Data.DataUint16Key.vdxfid: {
                        const buf = Buffer.alloc(2);
                        buf.writeUInt16LE(val);
                        inst._kvValues.set(compact, buf);
                        break;
                    }
                    case VDXF_Data.DataInt32Key.vdxfid: {
                        const buf = Buffer.alloc(4);
                        buf.writeInt32LE(val);
                        inst._kvValues.set(compact, buf);
                        break;
                    }
                    case VDXF_Data.DataUint32Key.vdxfid: {
                        const buf = Buffer.alloc(4);
                        buf.writeUInt32LE(val);
                        inst._kvValues.set(compact, buf);
                        break;
                    }
                    case VDXF_Data.DataInt64Key.vdxfid: {
                        const buf = Buffer.alloc(8);
                        buf.writeIntLE(val, 0, 8);
                        inst._kvValues.set(compact, buf);
                        break;
                    }
                    case VDXF_Data.DataUint160Key.vdxfid:
                        (0, address_1.fromBase58Check)(val).hash;
                        inst._kvValues.set(compact, val);
                        break;
                    case VDXF_Data.DataUint256Key.vdxfid: {
                        const oneHash = Buffer.from(val, "hex");
                        if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH)
                            throw new Error("contentmap: hash data must be exactly 32 bytes");
                        inst._kvValues.set(compact, oneHash);
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        inst._kvValues.set(compact, val);
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        if (!(0, string_1.isHexString)(val))
                            throw new Error("contentmap: bytevector data must be valid hex");
                        inst._kvValues.set(compact, Buffer.from(val, "hex"));
                        break;
                    case VDXF_Data.DataCurrencyMapKey.vdxfid:
                        inst._kvValues.set(compact, CurrencyValueMap_1.CurrencyValueMap.fromJson(val, true));
                        break;
                    case VDXF_Data.DataRatingsKey.vdxfid:
                        inst._kvValues.set(compact, Rating_1.Rating.fromJson(val));
                        break;
                    case VDXF_Data.DataTransferDestinationKey.vdxfid:
                        inst._kvValues.set(compact, TransferDestination_1.TransferDestination.fromJson(val));
                        break;
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
                        inst._kvValues.set(compact, ContentMultiMapRemove_1.ContentMultiMapRemove.fromJson(val));
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid:
                        inst._kvValues.set(compact, CrossChainDataRef_1.CrossChainDataRef.fromJson(val));
                        break;
                    case VDXF_Data.DataDescriptorKey.vdxfid:
                        inst._kvValues.set(compact, DataDescriptor_1.DataDescriptor.fromJson(val));
                        break;
                    case VDXF_Data.MMRDescriptorKey.vdxfid:
                        inst._kvValues.set(compact, MMRDescriptor_1.MMRDescriptor.fromJson(val));
                        break;
                    case VDXF_Data.SignatureDataKey.vdxfid:
                        inst._kvValues.set(compact, SignatureData_1.SignatureData.fromJson(val));
                        break;
                    case VDXF_Data.CredentialKey.vdxfid:
                        inst._kvValues.set(compact, Credential_1.Credential.fromJson(val));
                        break;
                    default:
                        throw new Error("Unknown vdxfkey: " + rawKey);
                }
            }
        }
        return inst;
    }
    toJson() {
        const ret = [];
        for (const [compact, value] of this._kvValues.entries()) {
            const jsonKey = compact.address;
            if (Buffer.isBuffer(value)) {
                ret.push({ [jsonKey]: value.toString('hex') });
            }
            else if (typeof value === 'string') {
                ret.push({ [jsonKey]: value });
            }
            else if (value instanceof bn_js_1.BN) {
                ret.push({ [jsonKey]: value.toString(10) });
            }
            else {
                ret.push({ [jsonKey]: value.toJson() });
            }
        }
        if (this._rawBytes !== undefined) {
            ret.push(this._rawBytes.toString('hex'));
        }
        return ret.length === 1 ? ret[0] : ret;
    }
}
exports.FqnVdxfUniValue = FqnVdxfUniValue;
