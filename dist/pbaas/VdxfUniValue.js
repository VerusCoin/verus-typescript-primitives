"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FqnVdxfUniValue = exports.VdxfUniValue = exports.VDXF_UNI_VALUE_VERSION_CURRENT = exports.VDXF_UNI_VALUE_VERSION_INVALID = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const CurrencyValueMap_1 = require("./CurrencyValueMap");
const Rating_1 = require("./Rating");
const TransferDestination_1 = require("./TransferDestination");
const ContentMultiMapRemove_1 = require("./ContentMultiMapRemove");
const CrossChainDataRef_1 = require("./CrossChainDataRef");
const SignatureData_1 = require("./SignatureData");
const DataDescriptor_1 = require("./DataDescriptor");
const MMRDescriptor_1 = require("./MMRDescriptor");
const Credential_1 = require("./Credential");
const URLRef_1 = require("./URLRef");
const CompactAddressObject_1 = require("../vdxf/classes/CompactAddressObject");
const VDXF_Data = require("../vdxf/vdxfdatakeys");
const KvMap_1 = require("../utils/KvMap");
exports.VDXF_UNI_VALUE_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.VDXF_UNI_VALUE_VERSION_CURRENT = new bn_js_1.BN(1, 10);
const { BufferWriter, BufferReader } = bufferutils_1.default;
function readEntityPayload(entity, buffer) {
    if (entity.fromBuffer(buffer, 0) !== buffer.length) {
        throw new Error("UniValue payload length mismatch");
    }
}
function readByteVectorPayload(buffer) {
    const reader = new BufferReader(buffer);
    const value = reader.readVarSlice();
    if (reader.offset !== buffer.length) {
        throw new Error("UniValue payload length mismatch");
    }
    return value;
}
function parseByteJson(value) {
    if (typeof value !== 'number') {
        throw new Error('Daemon byte data must be a number');
    }
    if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error('Byte data must be an integer between 0 and 255');
    }
    return Buffer.from([value]);
}
// JSON conversion is lossless: Node's hex decoder otherwise accepts malformed
// input by silently dropping characters or partial bytes.
function daemonRawData(value) {
    if (typeof value === 'string') {
        if (!/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
            throw new Error('Daemon VDXF strings must be hex; use { message: text } for UTF-8');
        }
        return Buffer.from(value, 'hex');
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Daemon VDXF data must be an object or hex string');
    }
    const keys = ['serializedhex', 'serializedbase64', 'message'].filter((key) => Object.prototype.hasOwnProperty.call(value, key));
    if (keys.length === 0)
        return undefined;
    if (keys.length !== 1 || Object.keys(value).length !== 1) {
        throw new Error('Daemon VDXF raw data requires exactly one encoding key');
    }
    const key = keys[0];
    const data = value[key];
    if (typeof data !== 'string')
        throw new Error(`${key} must be a string`);
    if (key === 'serializedhex')
        return daemonRawData(data);
    if (key === 'serializedbase64') {
        // VectorEncodeVDXFUni tests DecodeBase64's invalid flag backwards.
        throw new Error('Daemon serializedbase64 decoding is defective; use serializedhex');
    }
    const bytes = Buffer.from(data, 'utf8');
    if (bytes.toString('utf8') !== data) {
        throw new Error('message must not contain unpaired UTF-16 surrogates');
    }
    return bytes;
}
function daemonURLRefJson(ref) {
    var _a, _b;
    // CURLRef::ToUniValue writes version into flags. Version 1 has no flags/hash
    // on the wire, so its canonical JSON is safe; version 2 is not lossless.
    if (!ref.version.eqn(1) || ((_a = ref.dataHash) === null || _a === void 0 ? void 0 : _a.some(byte => byte !== 0)) ||
        (((_b = ref.dataHash) === null || _b === void 0 ? void 0 : _b.length) && ref.dataHash.length !== 32)) {
        throw new Error('Daemon URL reference JSON supports only version 1 without a data hash');
    }
    daemonRawData({ message: ref.url });
    return {
        version: 1,
        flags: 1,
        datahash: '00'.repeat(32),
        url: ref.url,
        type: CrossChainDataRef_1.CrossChainDataRef.TYPE_URL_REF,
    };
}
;
class VdxfUniValue extends SerializableEntityBase_1.SerializableEntityBase {
    get values() { return this._values; }
    set values(arr) { this._values = arr; }
    constructor(data) {
        super();
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
            return bufLen + varuint_1.default.encodingLength(bufLen);
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
                    // The string body includes its own CompactSize length prefix.
                    length += totalStreamLength(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = value;
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += totalStreamLength(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
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
                    writer.writeSlice(oneHash.reverse());
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
                    const valBuf = value;
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
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataRatingsKey.vdxfid: {
                        const obj = new Rating_1.Rating();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.CredentialKey.vdxfid: {
                        const obj = new Credential_1.Credential();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                        const obj = new TransferDestination_1.TransferDestination();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                        const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        reader.readVarInt(32);
                        objectUni = { key: checkVal, value: readByteVectorPayload(reader.readVarSlice()).toString('utf8') };
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        reader.readVarInt(32);
                        objectUni = { key: checkVal, value: readByteVectorPayload(reader.readVarSlice()) };
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                        const obj = new CrossChainDataRef_1.CrossChainDataRef();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.DataDescriptorKey.vdxfid: {
                        const obj = new DataDescriptor_1.DataDescriptor();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.MMRDescriptorKey.vdxfid: {
                        const obj = new MMRDescriptor_1.MMRDescriptor();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid())
                            objectUni = { key: checkVal, value: obj };
                        break;
                    }
                    case VDXF_Data.SignatureDataKey.vdxfid: {
                        const obj = new SignatureData_1.SignatureData();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
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
            if ((objectUni === null || objectUni === void 0 ? void 0 : objectUni.key) && objectUni.value !== undefined) {
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
    /** Parse the supported lossless daemon JSON representation. */
    static fromJson(obj) {
        const values = [];
        for (const item of Array.isArray(obj) ? obj : [obj]) {
            const bytes = daemonRawData(item);
            if (bytes !== undefined) {
                values.push({ '': bytes });
                continue;
            }
            for (const [rawKey, input] of Object.entries(item)) {
                const key = rawKey.includes('::')
                    ? CompactAddressObject_1.CompactIAddressObject.fromFQN(rawKey).toIAddress()
                    : rawKey;
                let value;
                switch (key) {
                    case VDXF_Data.DataByteKey.vdxfid:
                        value = parseByteJson(input);
                        break;
                    case VDXF_Data.DataInt16Key.vdxfid:
                    case VDXF_Data.DataUint16Key.vdxfid:
                    case VDXF_Data.DataInt32Key.vdxfid:
                    case VDXF_Data.DataUint32Key.vdxfid:
                    case VDXF_Data.DataInt64Key.vdxfid:
                        value = new bn_js_1.BN(input, 10);
                        break;
                    case VDXF_Data.DataUint160Key.vdxfid:
                        (0, address_1.fromBase58Check)(input).hash;
                        value = input;
                        break;
                    case VDXF_Data.DataUint256Key.vdxfid:
                        if (typeof input !== 'string') {
                            throw new Error('Daemon uint256 data must be hex');
                        }
                        value = daemonRawData(input);
                        if (value.length !== 32) {
                            throw new Error('Daemon uint256 data must be exactly 32 bytes');
                        }
                        // Keep display order; the fixed-width writer reverses it on the wire.
                        break;
                    case VDXF_Data.DataStringKey.vdxfid:
                        daemonRawData({ message: input });
                        value = input;
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        if (typeof input !== 'string') {
                            throw new Error('Daemon byte vector data must be hex');
                        }
                        value = daemonRawData(input);
                        break;
                    case VDXF_Data.DataCurrencyMapKey.vdxfid:
                        value = CurrencyValueMap_1.CurrencyValueMap.fromJson(input, true);
                        break;
                    case VDXF_Data.DataRatingsKey.vdxfid:
                        value = Rating_1.Rating.fromJson(input);
                        break;
                    case VDXF_Data.DataTransferDestinationKey.vdxfid:
                        value = TransferDestination_1.TransferDestination.fromJson(input);
                        break;
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
                        value = ContentMultiMapRemove_1.ContentMultiMapRemove.fromJson(input);
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                        const reference = CrossChainDataRef_1.CrossChainDataRef.fromJson(input);
                        if (reference.ref instanceof URLRef_1.URLRef) {
                            const source = input;
                            if (source.version !== 1 && source.version !== '1') {
                                throw new Error('Daemon URL reference JSON supports only version 1 without a data hash');
                            }
                            if (source.datahash != null && source.datahash !== '') {
                                if (typeof source.datahash !== 'string') {
                                    throw new Error('URL reference datahash must be hex');
                                }
                                if (daemonRawData(source.datahash).length !== 32) {
                                    throw new Error('URL reference datahash must be exactly 32 bytes');
                                }
                            }
                            daemonURLRefJson(reference.ref);
                        }
                        value = reference;
                        break;
                    }
                    case VDXF_Data.DataDescriptorKey.vdxfid:
                        value = DataDescriptor_1.DataDescriptor.fromJson(input);
                        break;
                    case VDXF_Data.MMRDescriptorKey.vdxfid:
                        value = MMRDescriptor_1.MMRDescriptor.fromJson(input);
                        break;
                    case VDXF_Data.SignatureDataKey.vdxfid:
                        value = SignatureData_1.SignatureData.fromJson(input);
                        break;
                    case VDXF_Data.CredentialKey.vdxfid:
                        value = Credential_1.Credential.fromJson(input);
                        break;
                    default:
                        throw new Error('Unknown vdxfkey: ' + rawKey);
                }
                values.push({ [key]: value });
            }
        }
        return new VdxfUniValue({ values });
    }
    /** Explicit RPC spelling of the same JSON contract. */
    static fromDaemonJson(obj) {
        return this.fromJson(obj);
    }
    toJson() {
        const ret = [];
        for (const inner of this.values) {
            const key = Object.keys(inner)[0];
            const value = inner[key];
            if (key === VDXF_Data.DataByteVectorKey.vdxfid) {
                // VDXFDataToUniValue emits only the payload, losing the committed tag.
                throw new Error('Daemon JSON drops the byte-vector wrapper; use binary');
            }
            if (key === VDXF_Data.DataByteKey.vdxfid) {
                if (!Buffer.isBuffer(value) || value.length !== 1) {
                    throw new Error('Daemon byte data must be exactly one byte');
                }
                ret.push({ [key]: value[0] });
            }
            else if (key === VDXF_Data.DataUint256Key.vdxfid) {
                if (!Buffer.isBuffer(value) || value.length !== 32) {
                    throw new Error('Daemon uint256 data must be exactly 32 bytes');
                }
                ret.push({ [key]: value.toString('hex') });
            }
            else if (key === '' && Buffer.isBuffer(value)) {
                ret.push(value.toString('hex'));
            }
            else if (Buffer.isBuffer(value)) {
                ret.push({ [key]: value.toString('hex') });
            }
            else if (typeof value === 'string') {
                if (key === VDXF_Data.DataStringKey.vdxfid) {
                    daemonRawData({ message: value });
                }
                ret.push({ [key]: value });
            }
            else if (value instanceof bn_js_1.BN) {
                ret.push({ [key]: value.toString(10) });
            }
            else if (value instanceof CrossChainDataRef_1.CrossChainDataRef) {
                ret.push({
                    [key]: value.ref instanceof URLRef_1.URLRef
                        ? daemonURLRefJson(value.ref)
                        : value.toJson(),
                });
            }
            else {
                ret.push({ [key]: value.toJson() });
            }
        }
        return ret.length === 1 ? ret[0] : ret;
    }
    /** Explicit RPC spelling of the same JSON contract. */
    toDaemonJson() {
        return this.toJson();
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
    // Expose the common VdxfUniValue value shape over FQN-keyed storage.
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
            return bufLen + varuint_1.default.encodingLength(bufLen);
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
                    // The string body includes its own CompactSize length prefix.
                    length += totalStreamLength(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
                    break;
                }
                case VDXF_Data.DataByteVectorKey.vdxfid: {
                    const valBuf = value;
                    length += varint_1.default.encodingLength(new bn_js_1.BN(1));
                    length += totalStreamLength(valBuf.length + varuint_1.default.encodingLength(valBuf.length));
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
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataRatingsKey.vdxfid: {
                        const obj = new Rating_1.Rating();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.CredentialKey.vdxfid: {
                        const obj = new Credential_1.Credential();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataTransferDestinationKey.vdxfid: {
                        const obj = new TransferDestination_1.TransferDestination();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
                        const obj = new ContentMultiMapRemove_1.ContentMultiMapRemove();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataStringKey.vdxfid:
                        reader.readVarInt(32);
                        parsedKey = compactAddr;
                        parsedValue = readByteVectorPayload(reader.readVarSlice()).toString('utf8');
                        break;
                    case VDXF_Data.DataByteVectorKey.vdxfid:
                        reader.readVarInt(32);
                        parsedKey = compactAddr;
                        parsedValue = readByteVectorPayload(reader.readVarSlice());
                        break;
                    case VDXF_Data.CrossChainDataRefKey.vdxfid: {
                        const obj = new CrossChainDataRef_1.CrossChainDataRef();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.DataDescriptorKey.vdxfid: {
                        const obj = new DataDescriptor_1.DataDescriptor();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.MMRDescriptorKey.vdxfid: {
                        const obj = new MMRDescriptor_1.MMRDescriptor();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
                        if (obj.isValid()) {
                            parsedKey = compactAddr;
                            parsedValue = obj;
                        }
                        break;
                    }
                    case VDXF_Data.SignatureDataKey.vdxfid: {
                        const obj = new SignatureData_1.SignatureData();
                        reader.readVarInt(32);
                        readEntityPayload(obj, reader.readVarSlice());
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
        const inst = new FqnVdxfUniValue();
        for (const item of Array.isArray(obj) ? obj : [obj]) {
            const bytes = daemonRawData(item);
            if (bytes !== undefined) {
                if (inst._rawBytes !== undefined) {
                    throw new Error('FQN JSON supports only one raw byte chunk');
                }
                inst._rawBytes = bytes;
                continue;
            }
            for (const [rawKey, input] of Object.entries(item)) {
                // FQN storage has unique named entries followed by one raw suffix.
                // Reject input that would otherwise be reordered or overwritten.
                if (inst._rawBytes !== undefined) {
                    throw new Error('FQN JSON requires raw bytes after all named entries');
                }
                const compact = FqnVdxfUniValue.compactFor(rawKey);
                if (inst._kvValues.has(compact)) {
                    throw new Error('FQN JSON contains a duplicate named key: ' + rawKey);
                }
                const key = compact.toIAddress();
                const parsed = VdxfUniValue.fromJson({ [key]: input });
                inst._kvValues.set(compact, parsed.values[0][key]);
            }
        }
        return inst;
    }
    toJson() {
        const ret = [];
        for (const [compact, value] of this._kvValues.entries()) {
            const key = compact.toIAddress();
            const json = new VdxfUniValue({ values: [{ [key]: value }] }).toJson();
            ret.push({ [compact.address]: json[key] });
        }
        if (this._rawBytes !== undefined) {
            ret.push(this._rawBytes.toString('hex'));
        }
        return ret.length === 1 ? ret[0] : ret;
    }
}
exports.FqnVdxfUniValue = FqnVdxfUniValue;
