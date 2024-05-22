"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VDXFDataToUniValueArray = exports.VDXFDataToUniValue = exports.VectorEncodeVDXFUni = exports.MMRDescriptor = exports.EHashTypes = exports.VDXFDataDescriptor = exports.DataDescriptor = void 0;
const bn_js_1 = require("bn.js");
const varint_1 = require("../../utils/varint");
const varuint_1 = require("../../utils/varuint");
const bufferutils_1 = require("../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const string_1 = require("../../utils/string");
const address_1 = require("../../utils/address");
const CurrencyValueMap_1 = require("../../pbaas/CurrencyValueMap");
const Rating_1 = require("../../pbaas/Rating");
const TransferDestination_1 = require("../../pbaas/TransferDestination");
const ContentMultiMapRemove_1 = require("../../pbaas/ContentMultiMapRemove");
const CrossChainDataRef_1 = require("./CrossChainDataRef");
const vdxf_1 = require("../../constants/vdxf");
const SignatureData_1 = require("./SignatureData");
const index_1 = require("../index");
const VDXF_Data = require("../vdxfDataKeys");
class DataDescriptor {
    constructor(data) {
        this.flags = new bn_js_1.BN(0);
        this.version = DataDescriptor.DEFAULT_VERSION;
        if (data != null) {
            if (data.flags != null)
                this.flags = data.flags;
            if (data.version != null)
                this.version = data.version;
            if (data.objectdata != null)
                this.objectdata = data.objectdata;
            if (data.label != null)
                this.label = data.label;
            if (data.mimeType != null)
                this.mimeType = data.mimeType;
            if (data.salt != null)
                this.salt = data.salt;
            if (data.epk != null)
                this.epk = data.epk;
            if (data.ivk != null)
                this.ivk = data.ivk;
            if (data.ssk != null)
                this.ssk = data.ssk;
            if (this.label && this.label.length > 64) {
                this.label = this.label.slice(0, 64);
            }
            if (this.mimeType && this.mimeType.length > 128) {
                this.mimeType = this.mimeType.slice(0, 128);
            }
            this.SetFlags();
        }
    }
    static fromJson(data) {
        const newDataDescriptor = new DataDescriptor();
        if (data != null) {
            if (data.flags != null)
                newDataDescriptor.flags = new bn_js_1.BN(data.flags);
            if (data.version != null)
                newDataDescriptor.version = new bn_js_1.BN(data.version);
            if (data.objectdata != null)
                newDataDescriptor.objectdata = (0, exports.VectorEncodeVDXFUni)(data.objectdata);
            if (data.label != null)
                newDataDescriptor.label = data.label;
            if (data.mimetype != null)
                newDataDescriptor.mimeType = data.mimetype;
            if (data.salt != null)
                newDataDescriptor.salt = Buffer.from(data.salt, 'hex');
            if (data.epk != null)
                newDataDescriptor.epk = Buffer.from(data.epk, 'hex');
            if (data.ivk != null)
                newDataDescriptor.ivk = Buffer.from(data.ivk, 'hex');
            if (data.ssk != null)
                newDataDescriptor.ssk = Buffer.from(data.ssk, 'hex');
            if (newDataDescriptor.label && newDataDescriptor.label.length > 64) {
                newDataDescriptor.label = newDataDescriptor.label.slice(0, 64);
            }
            if (newDataDescriptor.mimeType && newDataDescriptor.mimeType.length > 128) {
                newDataDescriptor.mimeType = newDataDescriptor.mimeType.slice(0, 128);
            }
        }
        ;
        newDataDescriptor.SetFlags();
        return newDataDescriptor;
    }
    DecodeHashVector() {
        const vdxfData = new index_1.BufferDataVdxfObject();
        vdxfData.fromBuffer(this.objectdata);
        const hashes = [];
        if (vdxfData.vdxfkey == VDXF_Data.VectorUint256Key().vdxfid) {
            const reader = new BufferReader(Buffer.from(vdxfData.data, 'hex'));
            const count = reader.readVarInt();
            for (let i = 0; i < count.toNumber(); i++) {
                hashes.push(reader.readSlice(32));
            }
        }
        return hashes;
    }
    byteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.version);
        length += varint_1.default.encodingLength(this.flags);
        length += varuint_1.default.encodingLength(this.objectdata.length);
        length += this.objectdata.length;
        if (this.HasLabel()) {
            if (this.label.length > 64) {
                throw new Error("Label too long");
            }
            length += varuint_1.default.encodingLength(this.label.length);
            length += this.label.length;
        }
        if (this.HasMIME()) {
            if (this.mimeType.length > 128) {
                throw new Error("MIME type too long");
            }
            length += varuint_1.default.encodingLength(this.mimeType.length);
            length += this.mimeType.length;
        }
        if (this.HasSalt()) {
            length += varuint_1.default.encodingLength(this.salt.length);
            length += this.salt.length;
        }
        if (this.HasEPK()) {
            length += varuint_1.default.encodingLength(this.epk.length);
            length += this.epk.length;
        }
        if (this.HasIVK()) {
            length += varuint_1.default.encodingLength(this.ivk.length);
            length += this.ivk.length;
        }
        if (this.HasSSK()) {
            length += varuint_1.default.encodingLength(this.ssk.length);
            length += this.ssk.length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.byteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(this.flags);
        writer.writeVarSlice(this.objectdata);
        if (this.HasLabel()) {
            writer.writeVarSlice(Buffer.from(this.label));
        }
        if (this.HasMIME()) {
            writer.writeVarSlice(Buffer.from(this.mimeType));
        }
        if (this.HasSalt()) {
            writer.writeVarSlice(this.salt);
        }
        if (this.HasEPK()) {
            writer.writeVarSlice(this.epk);
        }
        if (this.HasIVK()) {
            writer.writeVarSlice(this.ivk);
        }
        if (this.HasSSK()) {
            writer.writeVarSlice(this.ssk);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.flags = reader.readVarInt();
        this.objectdata = reader.readVarSlice();
        if (this.HasLabel()) {
            this.label = reader.readVarSlice().toString();
        }
        if (this.HasMIME()) {
            this.mimeType = reader.readVarSlice().toString();
        }
        if (this.HasSalt()) {
            this.salt = reader.readVarSlice();
        }
        if (this.HasEPK()) {
            this.epk = reader.readVarSlice();
        }
        if (this.HasIVK()) {
            this.ivk = reader.readVarSlice();
        }
        if (this.HasSSK()) {
            this.ssk = reader.readVarSlice();
        }
        return reader.offset;
    }
    HasEncryptedData() {
        return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).gt(new bn_js_1.BN(0));
    }
    HasSalt() {
        return this.flags.and(DataDescriptor.FLAG_SALT_PRESENT).gt(new bn_js_1.BN(0));
    }
    HasEPK() {
        return this.flags.and(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).gt(new bn_js_1.BN(0));
    }
    HasMIME() {
        return this.flags.and(DataDescriptor.FLAG_MIME_TYPE_PRESENT).gt(new bn_js_1.BN(0));
    }
    HasIVK() {
        return this.flags.and(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).gt(new bn_js_1.BN(0));
    }
    HasSSK() {
        return this.flags.and(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).gt(new bn_js_1.BN(0));
    }
    HasLabel() {
        return this.flags.and(DataDescriptor.FLAG_LABEL_PRESENT).gt(new bn_js_1.BN(0));
    }
    CalcFlags() {
        return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).add(this.label ? DataDescriptor.FLAG_LABEL_PRESENT : new bn_js_1.BN(0)).add(this.mimeType ? DataDescriptor.FLAG_MIME_TYPE_PRESENT : new bn_js_1.BN(0)).add(this.salt ? DataDescriptor.FLAG_SALT_PRESENT : new bn_js_1.BN(0)).add(this.epk ? DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT : new bn_js_1.BN(0)).add(this.ivk ? DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT : new bn_js_1.BN(0)).add(this.ssk ? DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT : new bn_js_1.BN(0));
    }
    SetFlags() {
        this.flags = this.CalcFlags();
    }
    IsValid() {
        return !!(this.version.gte(DataDescriptor.FIRST_VERSION) && this.version.lte(DataDescriptor.LAST_VERSION) && this.flags.and(DataDescriptor.FLAG_MASK.notn(DataDescriptor.FLAG_MASK.bitLength())));
    }
    toJson() {
        const retval = {
            version: this.version.toString(),
            flags: this.flags.toString()
        };
        let isText = false;
        if (this.mimeType) {
            retval['mimetype'] = this.mimeType;
            if (this.mimeType.startsWith("text/"))
                isText = true;
        }
        let processedObject = (0, exports.VDXFDataToUniValueArray)(this.objectdata);
        if (isText && typeof processedObject === 'string' || processedObject instanceof String) {
            let objectDataUni = { message: Buffer.from(processedObject, 'hex').toString('utf-8') };
            retval['objectdata'] = objectDataUni;
        }
        else {
            retval['objectdata'] = processedObject;
        }
        if (this.label)
            retval['label'] = this.label;
        if (this.salt)
            retval['salt'] = this.salt.toString('hex');
        if (this.epk)
            retval['epk'] = this.epk.toString('hex');
        if (this.ivk)
            retval['ivk'] = this.ivk.toString('hex');
        if (this.ssk)
            retval['ssk'] = this.ssk.toString('hex');
        return retval;
    }
}
exports.DataDescriptor = DataDescriptor;
DataDescriptor.VERSION_INVALID = new bn_js_1.BN(0);
DataDescriptor.VERSION_FIRST = new bn_js_1.BN(1);
DataDescriptor.FIRST_VERSION = new bn_js_1.BN(1);
DataDescriptor.LAST_VERSION = new bn_js_1.BN(1);
DataDescriptor.DEFAULT_VERSION = new bn_js_1.BN(1);
DataDescriptor.FLAG_ENCRYPTED_DATA = new bn_js_1.BN(1);
DataDescriptor.FLAG_SALT_PRESENT = new bn_js_1.BN(2);
DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT = new bn_js_1.BN(4);
DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT = new bn_js_1.BN(8);
DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT = new bn_js_1.BN(0x10);
DataDescriptor.FLAG_LABEL_PRESENT = new bn_js_1.BN(0x20);
DataDescriptor.FLAG_MIME_TYPE_PRESENT = new bn_js_1.BN(0x40);
DataDescriptor.FLAG_MASK = (DataDescriptor.FLAG_ENCRYPTED_DATA.add(DataDescriptor.FLAG_SALT_PRESENT).add(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).add(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).add(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).add(DataDescriptor.FLAG_LABEL_PRESENT).add(DataDescriptor.FLAG_MIME_TYPE_PRESENT));
;
class VDXFDataDescriptor extends index_1.BufferDataVdxfObject {
    constructor(dataDescriptor, vdxfkey = "", version = new bn_js_1.BN(1)) {
        super("", vdxfkey);
        this.version = version;
        if (dataDescriptor) {
            this.dataDescriptor = dataDescriptor;
        }
    }
    static fromDataVdfxObject(data) {
        const retval = new VDXFDataDescriptor();
        retval.version = data.version;
        retval.data = data.data;
        retval.fromBuffer(Buffer.from(retval.data, 'hex'));
        delete retval.data;
        return retval;
    }
    dataByteLength() {
        let length = 0;
        length += this.dataDescriptor.byteLength();
        return length;
    }
    toDataBuffer() {
        return this.dataDescriptor.toBuffer();
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        this.data = reader.readVarSlice().toString('hex');
        this.dataDescriptor = new DataDescriptor();
        this.dataDescriptor.fromBuffer(Buffer.from(this.data, 'hex'), reader.offset);
        delete this.data;
        return reader.offset;
    }
    HasEncryptedData() {
        return this.dataDescriptor.HasEncryptedData();
    }
    HasLabel() {
        return this.dataDescriptor.HasLabel();
    }
    HasSalt() {
        return this.dataDescriptor.HasSalt();
    }
    HasEPK() {
        return this.dataDescriptor.HasEPK();
    }
    HasIVK() {
        return this.dataDescriptor.HasIVK();
    }
    HasSSK() {
        return this.dataDescriptor.HasSSK();
    }
    CalcFlags() {
        return this.dataDescriptor.CalcFlags();
    }
    SetFlags() {
        return this.dataDescriptor.SetFlags();
    }
}
exports.VDXFDataDescriptor = VDXFDataDescriptor;
;
var EHashTypes;
(function (EHashTypes) {
    EHashTypes[EHashTypes["HASH_INVALID"] = 0] = "HASH_INVALID";
    EHashTypes[EHashTypes["HASH_BLAKE2BMMR"] = 1] = "HASH_BLAKE2BMMR";
    EHashTypes[EHashTypes["HASH_BLAKE2BMMR2"] = 2] = "HASH_BLAKE2BMMR2";
    EHashTypes[EHashTypes["HASH_KECCAK"] = 3] = "HASH_KECCAK";
    EHashTypes[EHashTypes["HASH_SHA256D"] = 4] = "HASH_SHA256D";
    EHashTypes[EHashTypes["HASH_SHA256"] = 5] = "HASH_SHA256";
    EHashTypes[EHashTypes["HASH_LASTTYPE"] = 5] = "HASH_LASTTYPE";
})(EHashTypes = exports.EHashTypes || (exports.EHashTypes = {}));
;
class MMRDescriptor {
    constructor(data) {
        if (data) {
            if (data.version)
                this.version = data.version;
            if (data.objectHashType)
                this.objectHashType = data.objectHashType;
            if (data.mmrHashType)
                this.mmrHashType = data.mmrHashType;
            if (data.mmrRoot)
                this.mmrRoot = data.mmrRoot;
            if (data.mmrHashes)
                this.mmrHashes = data.mmrHashes;
            if (data.dataDescriptors)
                this.dataDescriptors = data.dataDescriptors;
        }
        else {
            this.version = MMRDescriptor.DEFAULT_VERSION;
        }
    }
    static fromJson(data) {
        const newMMRDescriptor = new MMRDescriptor();
        if (data) {
            if (data.version)
                newMMRDescriptor.version = new bn_js_1.BN(data.version);
            if (data.objecthashtype)
                newMMRDescriptor.objectHashType = data.objecthashtype;
            if (data.mmrhashtype)
                newMMRDescriptor.mmrHashType = data.mmrhashtype;
            if (data.mmrroot)
                newMMRDescriptor.mmrRoot = DataDescriptor.fromJson(data.mmrroot);
            if (data.mmrhashes)
                newMMRDescriptor.mmrHashes = DataDescriptor.fromJson(data.mmrhashes);
            if (data.datadescriptors) {
                newMMRDescriptor.dataDescriptors = [];
                data.datadescriptors.forEach((data) => {
                    newMMRDescriptor.dataDescriptors.push(DataDescriptor.fromJson(data));
                });
            }
            ;
        }
        return newMMRDescriptor;
    }
    byteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.version);
        length += varint_1.default.encodingLength(new bn_js_1.BN(this.objectHashType));
        length += varint_1.default.encodingLength(new bn_js_1.BN(this.mmrHashType));
        length += this.mmrRoot.byteLength();
        length += this.mmrHashes.byteLength();
        length += varuint_1.default.encodingLength(this.dataDescriptors.length);
        this.dataDescriptors.forEach((dataDescriptor) => {
            length += dataDescriptor.byteLength();
        });
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.byteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(new bn_js_1.BN(this.objectHashType));
        writer.writeVarInt(new bn_js_1.BN(this.mmrHashType));
        writer.writeSlice(this.mmrRoot.toBuffer());
        writer.writeSlice(this.mmrHashes.toBuffer());
        writer.writeCompactSize(this.dataDescriptors.length);
        this.dataDescriptors.forEach((dataDescriptor) => {
            writer.writeSlice(dataDescriptor.toBuffer());
        });
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.objectHashType = reader.readVarInt().toNumber();
        this.mmrHashType = reader.readVarInt().toNumber();
        this.mmrRoot = new DataDescriptor();
        reader.offset = this.mmrRoot.fromBuffer(reader.buffer, reader.offset);
        this.mmrHashes = new DataDescriptor();
        reader.offset = this.mmrHashes.fromBuffer(reader.buffer, reader.offset);
        const dataDescriptorsLength = reader.readCompactSize();
        this.dataDescriptors = [];
        for (let i = 0; i < dataDescriptorsLength; i++) {
            const dataDescriptor = new DataDescriptor();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            this.dataDescriptors.push(dataDescriptor);
        }
        return reader.offset;
    }
    HasData() {
        return !!(this.mmrHashes.objectdata && this.dataDescriptors);
    }
    IsValid() {
        return this.version >= MMRDescriptor.FIRST_VERSION && this.version <= MMRDescriptor.LAST_VERSION;
    }
    toJson() {
        const retval = {
            version: this.version.toString(),
            objecthashtype: this.objectHashType,
            mmrhashtype: this.mmrHashType,
            mmrroot: this.mmrRoot.toJson(),
            mmrhashes: this.mmrHashes.toJson(),
            datadescriptors: this.dataDescriptors.map((dataDescriptor) => dataDescriptor.toJson())
        };
        return retval;
    }
}
exports.MMRDescriptor = MMRDescriptor;
MMRDescriptor.VERSION_INVALID = new bn_js_1.BN(0);
MMRDescriptor.FIRST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.LAST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.DEFAULT_VERSION = new bn_js_1.BN(1);
;
const VectorEncodeVDXFUni = (obj) => {
    let ss = Buffer.from('');
    if (typeof (obj) != 'object') {
        if (typeof (obj) != 'string')
            throw new Error('VectorEncodeVDXFUni: not JSON string as expected');
        if ((0, string_1.isHexString)(obj)) {
            return Buffer.from(obj, "hex");
        }
        return Buffer.from(obj, "utf-8");
    }
    if (obj.serializedHex) {
        if (!(0, string_1.isHexString)(obj.serializedHex)) {
            throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
        }
        return Buffer.from(obj.serializedHex);
    }
    if (obj.serializedBase64) {
        try {
            return Buffer.from(obj.serializedBase64, 'base64');
        }
        catch (e) {
            throw new Error("contentmap: If the \"serializedBase64\" key is present, it's data must be only valid base64 and complete");
        }
    }
    if (obj.message) {
        return Buffer.from(obj.message, "utf-8");
    }
    // this should be an object with "vdxfkey" as the key and {object} as the json object to serialize
    const oneValKeys = Object.keys(obj);
    const oneValValues = Object.values(obj);
    for (let k = 0; k < oneValKeys.length; k++) {
        const objTypeKey = oneValKeys[k];
        if (objTypeKey == VDXF_Data.DataByteKey().vdxfid) {
            const oneByte = Buffer.from(oneValValues[k], "hex");
            if (oneByte.length != 1) {
                throw new Error("contentmap: byte data must be exactly one byte");
            }
            ss = Buffer.concat([ss, oneByte]);
        }
        else if (objTypeKey == VDXF_Data.DataInt16Key().vdxfid) {
            const oneShort = Buffer.alloc(2);
            oneShort.writeInt16LE(oneValValues[k]);
            ss = Buffer.concat([ss, oneShort]);
        }
        else if (objTypeKey == VDXF_Data.DataUint16Key().vdxfid) {
            const oneUShort = Buffer.alloc(2);
            oneUShort.writeUInt16LE(oneValValues[k]);
            ss = Buffer.concat([ss, oneUShort]);
        }
        else if (objTypeKey == VDXF_Data.DataInt32Key().vdxfid) {
            const oneInt = Buffer.alloc(4);
            oneInt.writeInt32LE(oneValValues[k]);
            ss = Buffer.concat([ss, oneInt]);
        }
        else if (objTypeKey == VDXF_Data.DataUint32Key().vdxfid) {
            const oneUInt = Buffer.alloc(4);
            oneUInt.writeUInt32LE(oneValValues[k]);
            ss = Buffer.concat([ss, oneUInt]);
        }
        else if (objTypeKey == VDXF_Data.DataInt64Key().vdxfid) {
            const oneInt64 = Buffer.alloc(8);
            oneInt64.writeIntLE(oneValValues[k], 0, 8);
            ss = Buffer.concat([ss, oneInt64]);
        }
        else if (objTypeKey == VDXF_Data.DataUint160Key().vdxfid) {
            const oneKey = (0, address_1.fromBase58Check)(oneValValues[k]).hash;
            ss = Buffer.concat([ss, oneKey]);
        }
        else if (objTypeKey == VDXF_Data.DataUint256Key().vdxfid) {
            const oneHash = Buffer.from(oneValValues[k], "hex");
            if (oneHash.length != 32) {
                throw new Error("contentmap: hash data must be exactly 32 bytes");
            }
            ss = Buffer.concat([ss, oneHash.reverse()]);
        }
        else if (objTypeKey == VDXF_Data.DataStringKey().vdxfid) {
            let length = 20;
            length += 1;
            const encodedLength = varuint_1.default.encodingLength(Buffer.from(oneValValues[k], "utf-8").length);
            length += varuint_1.default.encodingLength(encodedLength + Buffer.from(oneValValues[k], "utf-8").length);
            length += encodedLength;
            length += Buffer.from(oneValValues[k], "utf-8").length;
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(new bn_js_1.BN(1));
            writer.writeCompactSize(encodedLength + Buffer.from(oneValValues[k], "utf-8").length);
            writer.writeVarSlice(Buffer.from(oneValValues[k], "utf-8"));
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.DataByteVectorKey().vdxfid) {
            let length = 20;
            length += 1;
            const encodedLength = varuint_1.default.encodingLength(Buffer.from(oneValValues[k], "hex").length);
            length += varuint_1.default.encodingLength(encodedLength + Buffer.from(oneValValues[k], "hex").length);
            length += encodedLength;
            length += Buffer.from(oneValValues[k], "hex").length;
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(new bn_js_1.BN(1));
            writer.writeCompactSize(encodedLength + Buffer.from(oneValValues[k], "hex").length);
            writer.writeVarSlice(Buffer.from(oneValValues[k], "hex"));
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.DataCurrencyMapKey().vdxfid) {
            const destinations = Object.keys(oneValValues[k]);
            const values = Object.values(oneValValues[k]);
            const oneCurMap = new CurrencyValueMap_1.CurrencyValueMap({ value_map: new Map(destinations.map((key, index) => [key, new bn_js_1.BN(values[index])])), multivalue: true });
            let length = 20;
            length += 1;
            length += varuint_1.default.encodingLength(oneCurMap.getByteLength());
            length += oneCurMap.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(new bn_js_1.BN(1));
            writer.writeCompactSize(oneCurMap.getByteLength());
            writer.writeSlice(oneCurMap.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.DataRatingsKey().vdxfid) {
            const version = new bn_js_1.BN(oneValValues[k].version);
            const trustLevel = new bn_js_1.BN(oneValValues[k].trustLevel);
            const destinations = Object.keys(oneValValues[k].rating);
            const values = Object.values(oneValValues[k]);
            const oneRatingMap = new Rating_1.Rating({ ratings: new Map(destinations.map((key, index) => [key, Buffer.from(values[index], 'hex')])), version, trustLevel });
            let length = 20;
            length += varint_1.default.encodingLength(oneRatingMap.version);
            length += varuint_1.default.encodingLength(oneRatingMap.getByteLength());
            length += oneRatingMap.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(oneRatingMap.version);
            writer.writeCompactSize(oneRatingMap.getByteLength());
            writer.writeSlice(oneRatingMap.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.DataTransferDestinationKey().vdxfid) {
            const transferDest = new TransferDestination_1.TransferDestination(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(transferDest.typeNoFlags());
            length += varuint_1.default.encodingLength(transferDest.getByteLength());
            length += transferDest.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(transferDest.typeNoFlags());
            writer.writeCompactSize(transferDest.getByteLength());
            writer.writeSlice(transferDest.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.ContentMultiMapRemoveKey().vdxfid) {
            const transferDest = new ContentMultiMapRemove_1.ContentMultiMapRemove(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(transferDest.version);
            length += varuint_1.default.encodingLength(transferDest.getByteLength());
            length += transferDest.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(transferDest.version);
            writer.writeCompactSize(transferDest.getByteLength());
            writer.writeSlice(transferDest.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.CrossChainDataRefKey().vdxfid) {
            const transferDest = new CrossChainDataRef_1.CrossChainDataRef(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
            length += varuint_1.default.encodingLength(transferDest.getByteLength());
            length += transferDest.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(vdxf_1.VDXF_OBJECT_DEFAULT_VERSION);
            writer.writeCompactSize(transferDest.getByteLength());
            writer.writeSlice(transferDest.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.DataDescriptorKey().vdxfid) {
            const descr = DataDescriptor.fromJson(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(descr.version);
            length += varuint_1.default.encodingLength(descr.byteLength());
            length += descr.byteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(descr.version);
            writer.writeCompactSize(descr.byteLength());
            writer.writeSlice(descr.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.MMRDescriptorKey().vdxfid) {
            const descr = MMRDescriptor.fromJson(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(descr.version);
            length += varuint_1.default.encodingLength(descr.byteLength());
            length += descr.byteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(descr.version);
            writer.writeCompactSize(descr.byteLength());
            writer.writeSlice(descr.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else if (objTypeKey == VDXF_Data.SignatureDataKey().vdxfid) {
            const sigData = SignatureData_1.SignatureData.fromJson(oneValValues[k]);
            let length = 20;
            length += varint_1.default.encodingLength(sigData.version);
            length += varuint_1.default.encodingLength(sigData.getByteLength());
            length += sigData.getByteLength();
            const writer = new BufferWriter(Buffer.alloc(length));
            writer.writeSlice((0, address_1.fromBase58Check)(objTypeKey).hash);
            writer.writeVarInt(sigData.version);
            writer.writeCompactSize(sigData.getByteLength());
            writer.writeSlice(sigData.toBuffer());
            ss = Buffer.concat([ss, writer.buffer]);
        }
        else {
            throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + oneValValues[k]);
        }
    }
    return ss;
};
exports.VectorEncodeVDXFUni = VectorEncodeVDXFUni;
const VDXFDataToUniValue = (buffer, offset = 0, pSuccess = null) => {
    const reader = new BufferReader(buffer, offset);
    let objectUni;
    try {
        let checkVal;
        let version = new bn_js_1.BN(0);
        let objSize = 0;
        checkVal = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        if (checkVal == VDXF_Data.DataCurrencyMapKey().vdxfid) {
            const oneCurrencyMap = new CurrencyValueMap_1.CurrencyValueMap();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneCurrencyMap.fromBuffer(reader.buffer, reader.offset);
            if (oneCurrencyMap.IsValid()) {
                objectUni = { [checkVal]: oneCurrencyMap.toJson() };
            }
        }
        else if (checkVal == VDXF_Data.DataRatingsKey().vdxfid) {
            const oneRatingObj = new Rating_1.Rating();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneRatingObj.fromBuffer(reader.buffer, reader.offset);
            if (oneRatingObj.IsValid()) {
                objectUni = { [checkVal]: oneRatingObj.toJson() };
            }
        }
        else if (checkVal == VDXF_Data.DataTransferDestinationKey().vdxfid) {
            const oneTransferDest = new TransferDestination_1.TransferDestination();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneTransferDest.fromBuffer(reader.buffer, reader.offset);
            if (oneTransferDest.IsValid()) {
                objectUni = { [checkVal]: oneTransferDest.toJson() };
            }
        }
        else if (checkVal == VDXF_Data.ContentMultiMapRemoveKey().vdxfid) {
            throw new Error("ContentMultiMapRemoveKey not implemented");
            // TODO: Implement ContentMultiMapRemoveKey
            // CContentMultiMapRemove oneContentRemove;
            // ss >> VARINT(version);
            // ss >> COMPACTSIZE(objSize);
            // ss >> oneContentRemove;
            // if (oneContentRemove.IsValid())
            // {
            //     objectUni = UniValue(UniValue::VOBJ);
            //     objectUni.pushKV(EncodeDestination(CIdentityID(checkVal)), oneContentRemove.ToUniValue());
            // }
        }
        else if (checkVal == VDXF_Data.DataStringKey().vdxfid) {
            let stringVal;
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            stringVal = reader.readVarSlice().toString('utf-8');
            objectUni = { [checkVal]: stringVal };
        }
        else if (checkVal == VDXF_Data.DataByteVectorKey().vdxfid) {
            let vecVal;
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            vecVal = reader.readVarSlice();
            objectUni = { [checkVal]: vecVal.toString('hex') };
        }
        else if (checkVal == VDXF_Data.CrossChainDataRefKey().vdxfid) {
            throw new Error("CrossChainDataRefKey not implemented");
            // TODO: Implement CrossChainDataRefKey
            // CCrossChainDataRef dataRef;
            // ss >> VARINT(version);
            // ss >> COMPACTSIZE(objSize);
            // ss >> dataRef;
            // if (dataRef.IsValid())
            // {
            //     objectUni = UniValue(UniValue::VOBJ);
            //     objectUni.pushKV(EncodeDestination(CIdentityID(checkVal)), dataRef.ToUniValue());
            // }
        }
        else if (checkVal == VDXF_Data.DataDescriptorKey().vdxfid) {
            const dataDescriptor = new DataDescriptor();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            if (dataDescriptor.IsValid()) {
                objectUni = { [checkVal]: dataDescriptor.toJson() };
            }
        }
        else if (checkVal == VDXF_Data.MMRDescriptorKey().vdxfid) {
            const mmrDescriptor = new MMRDescriptor();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = mmrDescriptor.fromBuffer(reader.buffer, reader.offset);
            if (mmrDescriptor.IsValid()) {
                objectUni = { [checkVal]: mmrDescriptor.toJson() };
            }
        }
        else if (checkVal == VDXF_Data.SignatureDataKey().vdxfid) {
            const sigData = new SignatureData_1.SignatureData();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = sigData.fromBuffer(reader.buffer, reader.offset);
            if (sigData.IsValid()) {
                objectUni = { [checkVal]: sigData.toJson() };
            }
        }
        // if we have an object that we recognized, encode it
        if (objectUni) {
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
    return { objectUni, offset: reader.offset, pSuccess };
};
exports.VDXFDataToUniValue = VDXFDataToUniValue;
const VDXFDataToUniValueArray = (buffer, offset = 0) => {
    let entryArr = [];
    const reader = new BufferReader(buffer, offset);
    let bytesLeft = buffer.length;
    while (bytesLeft > 20) // size of uint160
     {
        let objOut = { value: false };
        const { objectUni, offset } = (0, exports.VDXFDataToUniValue)(reader.buffer, reader.offset, objOut);
        reader.offset = offset;
        bytesLeft = buffer.length - reader.offset;
        if (objOut.value) {
            entryArr.push(objectUni);
        }
        else {
            // add the remaining data as a hex string
            reader.offset = reader.offset - 20;
            entryArr.push(reader.readSlice(bytesLeft + 20).toString('hex'));
            bytesLeft = 0;
            break;
        }
    }
    if (bytesLeft && bytesLeft <= 20) {
        entryArr.push(reader.readSlice(bytesLeft).toString('hex'));
    }
    return entryArr.length == 0 ? null : (entryArr.length == 1 ? entryArr[0] : entryArr);
};
exports.VDXFDataToUniValueArray = VDXFDataToUniValueArray;
