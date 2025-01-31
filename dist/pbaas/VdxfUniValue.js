"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VdxfUniValue = exports.VDXF_UNI_VALUE_VERSION_CURRENT = exports.VDXF_UNI_VALUE_VERSION_INVALID = void 0;
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
const VDXF_Data = require("../vdxf/vdxfdatakeys");
exports.VDXF_UNI_VALUE_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.VDXF_UNI_VALUE_VERSION_CURRENT = new bn_js_1.BN(1, 10);
const { BufferWriter, BufferReader } = bufferutils_1.default;
;
// This UniValue class was adapted from C++ code for encoding JSON objects into bytes. It is not serialization and
// therefore doesn't have a fromBuffer function, as you can't reliably decode it, only encode.
class VdxfUniValue {
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
        for (const key of this.values.keys()) {
            const value = this.values.get(key);
            // if we just have serialized data 
            if (key === "") {
                length += Buffer.from(value, "hex").length;
                continue;
            }
            if (key == VDXF_Data.DataByteKey.vdxfid) {
                length += 1;
                continue;
            }
            else if ((key == VDXF_Data.DataUint16Key.vdxfid) || (key == VDXF_Data.DataInt16Key.vdxfid)) {
                length += 2;
                continue;
            }
            else if ((key == VDXF_Data.DataInt32Key.vdxfid) || (key == VDXF_Data.DataUint32Key.vdxfid)) {
                length += 4;
                continue;
            }
            else if (key == VDXF_Data.DataInt64Key.vdxfid) {
                length += 8;
                continue;
            }
            else if (key == VDXF_Data.DataUint160Key.vdxfid) {
                length += vdxf_1.HASH160_BYTE_LENGTH;
                continue;
            }
            else if (key == VDXF_Data.DataUint256Key.vdxfid) {
                length += vdxf_1.HASH256_BYTE_LENGTH;
                continue;
            }
            length += vdxf_1.HASH160_BYTE_LENGTH;
            if (key == VDXF_Data.DataStringKey.vdxfid) {
                const valBuf = Buffer.from(value, "utf-8");
                length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                // NOTE: 3 is from ss type + ver + vdxfIdVersion 
                length += varuint_1.default.encodingLength(valBuf.length + 3);
                length += varuint_1.default.encodingLength(valBuf.length);
                length += valBuf.length;
            }
            else if (key == VDXF_Data.DataByteVectorKey.vdxfid) {
                const valBuf = Buffer.from(value, "hex");
                length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                length += varuint_1.default.encodingLength(valBuf.length + 3);
                length += varuint_1.default.encodingLength(valBuf.length);
                length += valBuf.length;
            }
            else if (key == VDXF_Data.DataCurrencyMapKey.vdxfid) {
                const destinations = Object.keys(value);
                const values = Object.values(value);
                const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap({ value_map: new Map(destinations.map((key, index) => [key, new bn_js_1.BN(values[index])])), multivalue: true });
                length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                length += varuint_1.default.encodingLength(oneCurMap.getByteLength());
                length += oneCurMap.getByteLength();
            }
            else if (key == VDXF_Data.DataRatingsKey.vdxfid) {
                const oneRatingMap = new Rating_1.Rating(value);
                length += varint_1.default.encodingLength(oneRatingMap.version);
                length += varuint_1.default.encodingLength(oneRatingMap.getByteLength() + 3);
                length += oneRatingMap.getByteLength();
            }
            else if (key == VDXF_Data.DataTransferDestinationKey.vdxfid) {
                const transferDest = new TransferDestination_1.TransferDestination(value);
                length += varint_1.default.encodingLength(transferDest.typeNoFlags());
                length += varuint_1.default.encodingLength(transferDest.getByteLength() + 3);
                length += transferDest.getByteLength();
            }
            else if (key == VDXF_Data.ContentMultiMapRemoveKey.vdxfid) {
                const transferDest = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                length += varint_1.default.encodingLength(transferDest.version);
                length += varuint_1.default.encodingLength(transferDest.getByteLength() + 3);
                length += transferDest.getByteLength();
            }
            else if (key == VDXF_Data.CrossChainDataRefKey.vdxfid) {
                const transferDest = new CrossChainDataRef_1.CrossChainDataRef(value);
                length += varint_1.default.encodingLength(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                length += varuint_1.default.encodingLength(transferDest.getByteLength() + 3);
                length += transferDest.getByteLength();
            }
            else if (key == VDXF_Data.DataDescriptorKey.vdxfid) {
                const descr = new DataDescriptor_1.DataDescriptor(value);
                length += varint_1.default.encodingLength(descr.version);
                length += varuint_1.default.encodingLength(descr.getByteLength() + 3);
                length += descr.getByteLength();
            }
            else if (key == VDXF_Data.MMRDescriptorKey.vdxfid) {
                const descr = new MMRDescriptor_1.MMRDescriptor(value);
                length += varint_1.default.encodingLength(descr.version);
                length += varuint_1.default.encodingLength(descr.getByteLength() + 3);
                length += descr.getByteLength();
            }
            else if (key == VDXF_Data.SignatureDataKey.vdxfid) {
                const sigData = new SignatureData_1.SignatureData(value);
                length += varint_1.default.encodingLength(sigData.version);
                length += varuint_1.default.encodingLength(sigData.getByteLength() + 3);
                length += sigData.getByteLength();
            }
            else {
                throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
            }
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        for (const key of this.values.keys()) {
            const value = this.values.get(key);
            if (key === "") {
                writer.writeSlice(value);
                continue;
            }
            if (key == VDXF_Data.DataByteKey.vdxfid) {
                const oneByte = Buffer.from(value, "hex");
                if (oneByte.length != 1) {
                    throw new Error("contentmap: byte data must be exactly one byte");
                }
                writer.writeSlice(oneByte);
            }
            else if (key == VDXF_Data.DataInt16Key.vdxfid) {
                const oneShort = Buffer.alloc(2);
                oneShort.writeInt16LE(value.toNumber());
                writer.writeSlice(oneShort);
            }
            else if (key == VDXF_Data.DataUint16Key.vdxfid) {
                const oneUShort = Buffer.alloc(2);
                oneUShort.writeUInt16LE(value.toNumber());
                writer.writeSlice(oneUShort);
            }
            else if (key == VDXF_Data.DataInt32Key.vdxfid) {
                const oneInt = Buffer.alloc(4);
                oneInt.writeInt32LE(value.toNumber());
                writer.writeSlice(oneInt);
            }
            else if (key == VDXF_Data.DataUint32Key.vdxfid) {
                const oneUInt = Buffer.alloc(4);
                oneUInt.writeUInt32LE(value.toNumber());
                writer.writeSlice(oneUInt);
            }
            else if (key == VDXF_Data.DataInt64Key.vdxfid) {
                const oneInt64 = Buffer.alloc(8);
                oneInt64.writeBigInt64LE(BigInt(value.toString()));
                writer.writeSlice(oneInt64);
            }
            else if (key == VDXF_Data.DataUint160Key.vdxfid) {
                const oneKey = (0, address_1.fromBase58Check)(value).hash;
                writer.writeSlice(oneKey);
            }
            else if (key == VDXF_Data.DataUint256Key.vdxfid) {
                const oneHash = Buffer.from(value, "hex");
                if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH) {
                    throw new Error("contentmap: hash data must be exactly 32 bytes");
                }
                writer.writeVarSlice(oneHash.reverse());
            }
            else if (key == VDXF_Data.DataStringKey.vdxfid) {
                const valBuf = Buffer.from(value, "utf-8");
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(new bn_js_1.BN(1));
                writer.writeCompactSize(valBuf.length + 3);
                writer.writeVarSlice(valBuf);
            }
            else if (key == VDXF_Data.DataByteVectorKey.vdxfid) {
                const encodedLength = varuint_1.default.encodingLength(Buffer.from(value, "hex").length);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(new bn_js_1.BN(1));
                writer.writeCompactSize(encodedLength + Buffer.from(value, "hex").length);
                writer.writeVarSlice(Buffer.from(value, "hex"));
            }
            else if (key == VDXF_Data.DataCurrencyMapKey.vdxfid) {
                const destinations = Object.keys(value);
                const values = Object.values(value);
                const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap({ value_map: new Map(destinations.map((key, index) => [key, new bn_js_1.BN(values[index])])), multivalue: true });
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(new bn_js_1.BN(1));
                writer.writeCompactSize(oneCurMap.getByteLength());
                writer.writeSlice(oneCurMap.toBuffer());
            }
            else if (key == VDXF_Data.DataRatingsKey.vdxfid) {
                const oneRatingMap = new Rating_1.Rating(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(oneRatingMap.version);
                writer.writeCompactSize(oneRatingMap.getByteLength());
                writer.writeSlice(oneRatingMap.toBuffer());
            }
            else if (key == VDXF_Data.DataTransferDestinationKey.vdxfid) {
                const transferDest = new TransferDestination_1.TransferDestination(value);
                const writer = new BufferWriter(Buffer.alloc(length));
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(transferDest.typeNoFlags());
                writer.writeCompactSize(transferDest.getByteLength());
                writer.writeSlice(transferDest.toBuffer());
            }
            else if (key == VDXF_Data.ContentMultiMapRemoveKey.vdxfid) {
                const transferDest = new ContentMultiMapRemove_1.ContentMultiMapRemove(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(transferDest.version);
                writer.writeCompactSize(transferDest.getByteLength());
                writer.writeSlice(transferDest.toBuffer());
            }
            else if (key == VDXF_Data.CrossChainDataRefKey.vdxfid) {
                const transferDest = new CrossChainDataRef_1.CrossChainDataRef(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
                writer.writeCompactSize(transferDest.getByteLength());
                writer.writeSlice(transferDest.toBuffer());
            }
            else if (key == VDXF_Data.DataDescriptorKey.vdxfid) {
                const descr = new DataDescriptor_1.DataDescriptor(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(descr.version);
                writer.writeCompactSize(descr.getByteLength());
                writer.writeSlice(descr.toBuffer());
            }
            else if (key == VDXF_Data.MMRDescriptorKey.vdxfid) {
                const descr = new MMRDescriptor_1.MMRDescriptor(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(descr.version);
                writer.writeCompactSize(descr.getByteLength());
                writer.writeSlice(descr.toBuffer());
            }
            else if (key == VDXF_Data.SignatureDataKey.vdxfid) {
                const sigData = new SignatureData_1.SignatureData(value);
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash);
                writer.writeVarInt(sigData.version);
                writer.writeCompactSize(sigData.getByteLength());
                writer.writeSlice(sigData.toBuffer());
            }
            else {
                throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
            }
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.values = new Map();
        let bytesLeft = reader.buffer.length - reader.offset;
        while (bytesLeft > vdxf_1.HASH160_BYTE_LENGTH) // size of uint160
         {
            let pSuccess = { value: false };
            let objectUni;
            const initialOffset = reader.offset;
            try {
                let checkVal;
                let version = new bn_js_1.BN(0);
                let objSize = 0;
                checkVal = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
                if (checkVal == VDXF_Data.DataCurrencyMapKey.vdxfid) {
                    const oneCurrencyMap = new CurrencyValueMap_1.CurrencyValueMap({ multivalue: true });
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = oneCurrencyMap.fromBuffer(reader.buffer, reader.offset);
                    if (oneCurrencyMap.isValid()) {
                        objectUni = { key: checkVal, value: oneCurrencyMap };
                    }
                }
                else if (checkVal == VDXF_Data.DataRatingsKey.vdxfid) {
                    const oneRatingObj = new Rating_1.Rating();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = oneRatingObj.fromBuffer(reader.buffer, reader.offset);
                    if (oneRatingObj.isValid()) {
                        objectUni = { key: checkVal, value: oneRatingObj };
                    }
                }
                else if (checkVal == VDXF_Data.DataTransferDestinationKey.vdxfid) {
                    const oneTransferDest = new TransferDestination_1.TransferDestination();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = oneTransferDest.fromBuffer(reader.buffer, reader.offset);
                    if (oneTransferDest.isValid()) {
                        objectUni = { key: checkVal, value: oneTransferDest };
                    }
                }
                else if (checkVal == VDXF_Data.ContentMultiMapRemoveKey.vdxfid) {
                    const contentMap = new ContentMultiMapRemove_1.ContentMultiMapRemove();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = contentMap.fromBuffer(reader.buffer, reader.offset);
                    if (contentMap.isValid()) {
                        objectUni = { key: checkVal, value: contentMap };
                    }
                }
                else if (checkVal == VDXF_Data.DataStringKey.vdxfid) {
                    let stringVal;
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    stringVal = reader.readVarSlice().toString('utf8');
                    objectUni = { key: checkVal, value: stringVal };
                }
                else if (checkVal == VDXF_Data.DataByteVectorKey.vdxfid) {
                    let vecVal;
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    vecVal = reader.readVarSlice();
                    objectUni = { key: checkVal, value: vecVal.toString('hex') };
                }
                else if (checkVal == VDXF_Data.CrossChainDataRefKey.vdxfid) {
                    const dataRef = new CrossChainDataRef_1.CrossChainDataRef();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = dataRef.fromBuffer(reader.buffer, reader.offset);
                    if (dataRef.isValid()) {
                        objectUni = { key: checkVal, value: dataRef };
                    }
                }
                else if (checkVal == VDXF_Data.DataDescriptorKey.vdxfid) {
                    const dataDescriptor = new DataDescriptor_1.DataDescriptor();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
                    if (dataDescriptor.isValid()) {
                        objectUni = { key: checkVal, value: dataDescriptor };
                    }
                }
                else if (checkVal == VDXF_Data.MMRDescriptorKey.vdxfid) {
                    const mmrDescriptor = new MMRDescriptor_1.MMRDescriptor();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = mmrDescriptor.fromBuffer(reader.buffer, reader.offset);
                    if (mmrDescriptor.isValid()) {
                        objectUni = { key: checkVal, value: mmrDescriptor };
                    }
                }
                else if (checkVal == VDXF_Data.SignatureDataKey.vdxfid) {
                    const sigData = new SignatureData_1.SignatureData();
                    version = reader.readVarInt();
                    objSize = reader.readCompactSize();
                    reader.offset = sigData.fromBuffer(reader.buffer, reader.offset);
                    if (sigData.isValid()) {
                        objectUni = { key: checkVal, value: sigData };
                    }
                }
                // if we have an object that we recognized, encode it
                if (objectUni && objectUni.key && objectUni.value) {
                    if (pSuccess != null) {
                        pSuccess.value = true;
                    }
                }
                else {
                    if (pSuccess != null) {
                        pSuccess.value = false;
                    }
                }
            }
            catch (e) {
                if (pSuccess != null) {
                    pSuccess.value = false;
                }
            }
            bytesLeft = reader.buffer.length - reader.offset;
            if ((pSuccess === null || pSuccess === void 0 ? void 0 : pSuccess.value) && (pSuccess === null || pSuccess === void 0 ? void 0 : pSuccess.value)) {
                this.values.set(objectUni.key, objectUni.value);
            }
            else {
                // add the remaining data as a hex string
                reader.offset = initialOffset;
                this.values.set("", reader.readSlice(reader.buffer.length - reader.offset));
                bytesLeft = 0;
                break;
            }
        }
        if (bytesLeft && bytesLeft <= vdxf_1.HASH160_BYTE_LENGTH) {
            this.values.set("", reader.readSlice(bytesLeft));
        }
        return reader.offset;
    }
    static fromJson(obj) {
        const map = new Map();
        if (typeof (obj) != 'object') {
            if (typeof (obj) != 'string')
                throw new Error('Not JSON string as expected');
            if ((0, string_1.isHexString)(obj)) {
                map.set("", Buffer.from(obj, "hex"));
                return new VdxfUniValue({
                    values: map
                });
            }
            map.set("", Buffer.from(obj, "utf-8"));
            return new VdxfUniValue({
                values: map
            });
        }
        if (obj.serializedHex) {
            if (!(0, string_1.isHexString)(obj.serializedHex)) {
                throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
            }
            map.set("", Buffer.from(obj.serializedHex, "hex"));
            return new VdxfUniValue({
                values: map
            });
        }
        if (obj.serializedBase64) {
            try {
                map.set("", Buffer.from(obj.serializedBase64, "base64"));
                return new VdxfUniValue({
                    values: map
                });
            }
            catch (e) {
                throw new Error("contentmap: If the \"serializedBase64\" key is present, it's data must be only valid base64 and complete");
            }
        }
        if (obj.message) {
            map.set("", Buffer.from(obj.message, "utf-8"));
            return new VdxfUniValue({
                values: map
            });
        }
        // this should be an object with "vdxfkey" as the key and {object} as the json object to serialize
        const oneValKeys = Object.keys(obj);
        const oneValValues = Object.values(obj);
        for (let k = 0; k < oneValKeys.length; k++) {
            const objTypeKey = oneValKeys[k];
            if (objTypeKey == VDXF_Data.DataByteKey.vdxfid) {
                const oneByte = Buffer.from(oneValValues[k], "hex");
                if (oneByte.length != 1) {
                    throw new Error("contentmap: byte data must be exactly one byte");
                }
                map.set(objTypeKey, oneByte);
            }
            else if (objTypeKey == VDXF_Data.DataInt16Key.vdxfid) {
                const oneShort = Buffer.alloc(2);
                oneShort.writeInt16LE(oneValValues[k]);
                map.set(objTypeKey, oneShort);
            }
            else if (objTypeKey == VDXF_Data.DataUint16Key.vdxfid) {
                const oneUShort = Buffer.alloc(2);
                oneUShort.writeUInt16LE(oneValValues[k]);
                map.set(objTypeKey, oneUShort);
            }
            else if (objTypeKey == VDXF_Data.DataInt32Key.vdxfid) {
                const oneInt = Buffer.alloc(4);
                oneInt.writeInt32LE(oneValValues[k]);
                map.set(objTypeKey, oneInt);
            }
            else if (objTypeKey == VDXF_Data.DataUint32Key.vdxfid) {
                const oneUInt = Buffer.alloc(4);
                oneUInt.writeUInt32LE(oneValValues[k]);
                map.set(objTypeKey, oneUInt);
            }
            else if (objTypeKey == VDXF_Data.DataInt64Key.vdxfid) {
                const oneInt64 = Buffer.alloc(8);
                oneInt64.writeIntLE(oneValValues[k], 0, 8);
                map.set(objTypeKey, oneInt64);
            }
            else if (objTypeKey == VDXF_Data.DataUint160Key.vdxfid) {
                (0, address_1.fromBase58Check)(oneValValues[k]).hash;
                map.set(objTypeKey, oneValValues[k]);
            }
            else if (objTypeKey == VDXF_Data.DataUint256Key.vdxfid) {
                const oneHash = Buffer.from(oneValValues[k], "hex");
                if (oneHash.length != vdxf_1.HASH256_BYTE_LENGTH) {
                    throw new Error("contentmap: hash data must be exactly 32 bytes");
                }
                map.set(objTypeKey, oneHash);
            }
            else if (objTypeKey == VDXF_Data.DataStringKey.vdxfid) {
                map.set(objTypeKey, oneValValues[k]);
            }
            else if (objTypeKey == VDXF_Data.DataByteVectorKey.vdxfid) {
                if (!(0, string_1.isHexString)(oneValValues[k])) {
                    throw new Error("contentmap: bytevector data must be valid hex");
                }
                map.set(objTypeKey, Buffer.from(oneValValues[k], "hex"));
            }
            else if (objTypeKey == VDXF_Data.DataCurrencyMapKey.vdxfid) {
                const destinations = Object.keys(oneValValues[k]);
                const values = Object.values(oneValValues[k]);
                const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap({ value_map: new Map(destinations.map((key, index) => [key, new bn_js_1.BN(values[index])])), multivalue: true });
                map.set(objTypeKey, oneCurMap);
            }
            else if (objTypeKey == VDXF_Data.DataRatingsKey.vdxfid) {
                const oneRatingMap = Rating_1.Rating.fromJson(oneValValues[k]);
                map.set(objTypeKey, oneRatingMap);
            }
            else if (objTypeKey == VDXF_Data.DataTransferDestinationKey.vdxfid) {
                const transferDest = TransferDestination_1.TransferDestination.fromJson(oneValValues[k]);
                map.set(objTypeKey, transferDest);
            }
            else if (objTypeKey == VDXF_Data.ContentMultiMapRemoveKey.vdxfid) {
                const content = ContentMultiMapRemove_1.ContentMultiMapRemove.fromJson(oneValValues[k]);
                map.set(objTypeKey, content);
            }
            else if (objTypeKey == VDXF_Data.CrossChainDataRefKey.vdxfid) {
                const crossChainRefKey = CrossChainDataRef_1.CrossChainDataRef.fromJson(oneValValues[k]);
                map.set(objTypeKey, crossChainRefKey);
            }
            else if (objTypeKey == VDXF_Data.DataDescriptorKey.vdxfid) {
                const descriptor = DataDescriptor_1.DataDescriptor.fromJson(oneValValues[k]);
                map.set(objTypeKey, descriptor);
            }
            else if (objTypeKey == VDXF_Data.MMRDescriptorKey.vdxfid) {
                const mmrDescriptor = MMRDescriptor_1.MMRDescriptor.fromJson(oneValValues[k]);
                map.set(objTypeKey, mmrDescriptor);
            }
            else if (objTypeKey == VDXF_Data.SignatureDataKey.vdxfid) {
                const sigData = SignatureData_1.SignatureData.fromJson(oneValValues[k]);
                map.set(objTypeKey, sigData);
            }
            else {
                throw new Error("Unkknow vdxfkey: " + oneValValues[k]);
            }
        }
        return new VdxfUniValue({
            values: map
        });
    }
    toJson() {
        let ret = {};
        for (const key of this.values.keys()) {
            if (key === "") {
                ret[key] = this.values.get(key).toString('hex');
            }
            else if (typeof (this.values.get(key)) == 'string') {
                ret[key] = this.values.get(key);
            }
            else if (Buffer.isBuffer(this.values.get(key))) {
                ret[key] = this.values.get(key).toString('hex');
            }
            else if (this.values.get(key) instanceof bn_js_1.BN) {
                ret[key] = this.values.get(key).toString(10);
            }
            else {
                ret[key] = this.values.get(key).toJson();
            }
        }
        if (ret && ret[""] && Object.keys(ret).length == 1) {
            ret = ret[""];
        }
        return ret;
    }
}
exports.VdxfUniValue = VdxfUniValue;
