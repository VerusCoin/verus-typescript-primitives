"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EHashTypes = exports.VDXFDataDescriptor = exports.DataDescriptor = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const VdxfUniValue_1 = require("./VdxfUniValue");
const index_1 = require("../vdxf/index");
const VDXF_Data = require("../vdxf/vdxfdatakeys");
const pbaas_1 = require("../constants/pbaas");
const vdxf_1 = require("../constants/vdxf");
const address_1 = require("../utils/address");
const string_1 = require("../utils/string");
const descriptorValidation_1 = require("./descriptorValidation");
class DataDescriptor extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.flags = new bn_js_1.BN(0);
        this.version = new bn_js_1.BN(DataDescriptor.DEFAULT_VERSION);
        this.vdxfKey = '';
        this.objectdata = Buffer.from([]);
        if (data != null) {
            if (data.flags != null)
                this.flags = (0, descriptorValidation_1.descriptorInteger)(data.flags, 32, 'Flags');
            if (data.version != null)
                this.version = (0, descriptorValidation_1.descriptorInteger)(data.version, 32, 'Version');
            if (data.vdxfKey != null)
                this.vdxfKey = data.vdxfKey;
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
            this.setFlags();
        }
    }
    /** Lossless daemon JSON subset; invalid key sizes are rejected, not silently invalidated. */
    static fromJson(data = {}) {
        var _a, _b;
        const source = data !== null && data !== void 0 ? data : {};
        const descriptor = new DataDescriptor({
            version: (0, descriptorValidation_1.descriptorInteger)((_a = source.version) !== null && _a !== void 0 ? _a : 0, 32, 'Version'),
            flags: (0, descriptorValidation_1.descriptorInteger)((_b = source.flags) !== null && _b !== void 0 ? _b : 0, 32, 'Flags'),
            label: source.label,
            mimeType: source.mimetype,
            vdxfKey: source.vdxfkey,
        });
        for (const field of ['salt', 'epk', 'ivk', 'ssk']) {
            if (source[field] != null) {
                if (!(0, string_1.isHexString)(source[field]))
                    throw new Error(`${field} must be complete hexadecimal bytes`);
                descriptor[field] = Buffer.from(source[field], 'hex');
            }
        }
        descriptor.validateJson();
        if (typeof source.objectdata === 'string' &&
            !(0, string_1.isHexString)(source.objectdata)) {
            throw new Error('Nonhex objectdata is discarded by the daemon; use { message: text }');
        }
        if (source.objectdata != null) {
            descriptor.objectdata = VdxfUniValue_1.VdxfUniValue.fromJson(source.objectdata).toBuffer();
        }
        descriptor.setFlags();
        return descriptor;
    }
    /** Explicit alias for the canonical daemon JSON representation. */
    static fromDaemonJson(data = {}) {
        return DataDescriptor.fromJson(data);
    }
    /** Default matches FromVector's trailing-byte tolerance; strict requires one complete vector. */
    decodeHashVector(strict = false) {
        const wrapper = new BufferReader(this.objectdata);
        const key = (0, address_1.toBase58Check)(wrapper.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        wrapper.readVarInt(32);
        const payload = wrapper.readVarSlice();
        if (key !== VDXF_Data.VectorUint256Key.vdxfid) {
            if (strict)
                throw new Error('Expected a VectorUint256 VDXF tag');
            return [];
        }
        const reader = new BufferReader(payload);
        const count = reader.readCompactSize();
        if (count > Math.floor((payload.length - reader.offset) / 32)) {
            throw new Error('Truncated hash vector');
        }
        const hashes = [];
        for (let i = 0; i < count; i++)
            hashes.push(Buffer.from(reader.readSlice(32)));
        if (strict &&
            (reader.offset !== payload.length ||
                wrapper.offset !== this.objectdata.length)) {
            throw new Error('Trailing bytes in hash vector');
        }
        return hashes;
    }
    getByteLength() {
        (0, descriptorValidation_1.descriptorInteger)(this.version, 32, 'Version');
        this.setFlags();
        let length = 0;
        length += varint_1.default.encodingLength(this.version);
        length += varint_1.default.encodingLength(this.flags);
        if (this.hasVDXFKey()) {
            length += vdxf_1.HASH160_BYTE_LENGTH;
        }
        length += varuint_1.default.encodingLength(this.objectdata.length);
        length += this.objectdata.length;
        if (this.hasLabel()) {
            const labelLength = Buffer.byteLength(this.label, 'utf8');
            (0, descriptorValidation_1.validateDescriptorText)(this.label, 64, 'Label');
            length += varuint_1.default.encodingLength(labelLength);
            length += labelLength;
        }
        if (this.hasMIME()) {
            const mimeLength = Buffer.byteLength(this.mimeType, 'utf8');
            (0, descriptorValidation_1.validateDescriptorText)(this.mimeType, 128, 'MIME type');
            length += varuint_1.default.encodingLength(mimeLength);
            length += mimeLength;
        }
        if (this.hasSalt()) {
            length += varuint_1.default.encodingLength(this.salt.length);
            length += this.salt.length;
        }
        if (this.hasEPK()) {
            length += varuint_1.default.encodingLength(this.epk.length);
            length += this.epk.length;
        }
        if (this.hasIVK()) {
            length += varuint_1.default.encodingLength(this.ivk.length);
            length += this.ivk.length;
        }
        if (this.hasSSK()) {
            length += varuint_1.default.encodingLength(this.ssk.length);
            length += this.ssk.length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(this.flags);
        if (this.hasVDXFKey()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.vdxfKey).hash);
        }
        writer.writeVarSlice(this.objectdata);
        if (this.hasLabel()) {
            writer.writeVarSlice(Buffer.from(this.label));
        }
        if (this.hasMIME()) {
            writer.writeVarSlice(Buffer.from(this.mimeType));
        }
        if (this.hasSalt()) {
            writer.writeVarSlice(this.salt);
        }
        if (this.hasEPK()) {
            writer.writeVarSlice(this.epk);
        }
        if (this.hasIVK()) {
            writer.writeVarSlice(this.ivk);
        }
        if (this.hasSSK()) {
            writer.writeVarSlice(this.ssk);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt(32);
        this.flags = reader.readVarInt(32);
        if (this.hasVDXFKey()) {
            this.vdxfKey = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        }
        else {
            this.vdxfKey = '';
        }
        this.objectdata = reader.readVarSlice();
        if (this.hasLabel()) {
            this.label = (0, descriptorValidation_1.descriptorUtf8)((0, string_1.readLimitedString)(reader, 64));
        }
        else
            this.label = undefined;
        if (this.hasMIME()) {
            this.mimeType = (0, descriptorValidation_1.descriptorUtf8)((0, string_1.readLimitedString)(reader, 128));
        }
        else
            this.mimeType = undefined;
        if (this.hasSalt()) {
            this.salt = reader.readVarSlice();
        }
        else
            this.salt = undefined;
        if (this.hasEPK()) {
            this.epk = reader.readVarSlice();
        }
        else
            this.epk = undefined;
        if (this.hasIVK()) {
            this.ivk = reader.readVarSlice();
        }
        else
            this.ivk = undefined;
        if (this.hasSSK()) {
            this.ssk = reader.readVarSlice();
        }
        else
            this.ssk = undefined;
        return reader.offset;
    }
    hasEncryptedData() {
        return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).gt(new bn_js_1.BN(0));
    }
    hasVDXFKey() {
        return this.flags.and(DataDescriptor.FLAG_VDXF_KEY_PRESENT).gt(new bn_js_1.BN(0));
    }
    hasSalt() {
        return this.flags.and(DataDescriptor.FLAG_SALT_PRESENT).gt(new bn_js_1.BN(0));
    }
    hasEPK() {
        return this.flags
            .and(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT)
            .gt(new bn_js_1.BN(0));
    }
    hasMIME() {
        return this.flags.and(DataDescriptor.FLAG_MIME_TYPE_PRESENT).gt(new bn_js_1.BN(0));
    }
    hasIVK() {
        return this.flags
            .and(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT)
            .gt(new bn_js_1.BN(0));
    }
    hasSSK() {
        return this.flags
            .and(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT)
            .gt(new bn_js_1.BN(0));
    }
    hasLabel() {
        return this.flags.and(DataDescriptor.FLAG_LABEL_PRESENT).gt(new bn_js_1.BN(0));
    }
    hasNonzeroVDXFKey() {
        // The wire field is a uint160; address prefixes do not affect its nullness.
        return (!!this.vdxfKey &&
            (0, address_1.fromBase58Check)(this.vdxfKey).hash.some((byte) => byte !== 0));
    }
    calcFlags() {
        var _a, _b, _c, _d;
        (0, descriptorValidation_1.descriptorInteger)(this.flags, 32, 'Flags');
        return this.flags
            .and(DataDescriptor.FLAG_ENCRYPTED_DATA)
            .add(this.hasNonzeroVDXFKey()
            ? DataDescriptor.FLAG_VDXF_KEY_PRESENT
            : new bn_js_1.BN(0))
            .add(this.label ? DataDescriptor.FLAG_LABEL_PRESENT : new bn_js_1.BN(0))
            .add(this.mimeType ? DataDescriptor.FLAG_MIME_TYPE_PRESENT : new bn_js_1.BN(0))
            .add(((_a = this.salt) === null || _a === void 0 ? void 0 : _a.length) ? DataDescriptor.FLAG_SALT_PRESENT : new bn_js_1.BN(0))
            .add(((_b = this.epk) === null || _b === void 0 ? void 0 : _b.length)
            ? DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT
            : new bn_js_1.BN(0))
            .add(((_c = this.ivk) === null || _c === void 0 ? void 0 : _c.length)
            ? DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT
            : new bn_js_1.BN(0))
            .add(((_d = this.ssk) === null || _d === void 0 ? void 0 : _d.length)
            ? DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT
            : new bn_js_1.BN(0));
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    isValid() {
        var _a, _b;
        if (!this.version.gte(DataDescriptor.FIRST_VERSION) ||
            !this.version.lte(DataDescriptor.LAST_VERSION)) {
            return false;
        }
        if (this.flags.isNeg() ||
            !this.flags.and(DataDescriptor.FLAG_MASK).eq(this.flags)) {
            return false;
        }
        // The byte limits are stricter than daemon IsValid, but match its binary reader.
        try {
            (0, descriptorValidation_1.validateDescriptorText)((_a = this.label) !== null && _a !== void 0 ? _a : '', 64, 'Label');
            (0, descriptorValidation_1.validateDescriptorText)((_b = this.mimeType) !== null && _b !== void 0 ? _b : '', 128, 'MIME type');
            return true;
        }
        catch (_) {
            return false;
        }
    }
    validateJson() {
        var _a, _b, _c;
        (0, descriptorValidation_1.descriptorInteger)(this.version, 32, 'Version');
        (0, descriptorValidation_1.descriptorInteger)(this.flags, 32, 'Flags');
        (0, descriptorValidation_1.validateDaemonMetadata)((_a = this.label) !== null && _a !== void 0 ? _a : '', 64, 'Label');
        (0, descriptorValidation_1.validateDaemonMetadata)((_b = this.mimeType) !== null && _b !== void 0 ? _b : '', 128, 'MIME type');
        if (this.hasNonzeroVDXFKey()) {
            throw new Error('Daemon JSON drops vdxfkey; use binary serialization');
        }
        for (const field of ['epk', 'ivk', 'ssk']) {
            if (((_c = this[field]) === null || _c === void 0 ? void 0 : _c.length) && this[field].length !== 32) {
                throw new Error(`${field} must be exactly 32 bytes in daemon JSON`);
            }
        }
    }
    /** Reject metadata or fields that the daemon JSON representation cannot retain. */
    toJson() {
        var _a, _b;
        this.validateJson();
        this.setFlags();
        const result = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
        };
        if (this.mimeType)
            result.mimetype = this.mimeType;
        if (this.label)
            result.label = this.label;
        const processed = new VdxfUniValue_1.VdxfUniValue();
        processed.fromBuffer(this.objectdata);
        const hasReference = processed.values.some((value) => Object.prototype.hasOwnProperty.call(value, VDXF_Data.CrossChainDataRefKey.vdxfid));
        const text = this.objectdata.toString('utf8');
        // Text mode uses the original bytes, except that references stay structured.
        // Invalid UTF-8 falls back to the same generic VDXF representation as the daemon.
        if (((_a = this.mimeType) === null || _a === void 0 ? void 0 : _a.startsWith('text/')) &&
            !hasReference &&
            Buffer.from(text, 'utf8').equals(this.objectdata)) {
            result.objectdata = { message: text };
        }
        else if (!this.objectdata.length) {
            result.objectdata = null;
        }
        else {
            result.objectdata = processed.toJson();
            // Tagged parsing can recognize a payload while losing its version or
            // string bytes. Such values must remain in their binary representation.
            const restored = VdxfUniValue_1.VdxfUniValue.fromJson(result.objectdata);
            if (!restored.toBuffer().equals(this.objectdata)) {
                throw new Error('Object data cannot round-trip through daemon JSON');
            }
        }
        for (const field of ['salt', 'epk', 'ivk', 'ssk']) {
            if ((_b = this[field]) === null || _b === void 0 ? void 0 : _b.length)
                result[field] = this[field].toString('hex');
        }
        return result;
    }
    /** Explicit alias for the canonical daemon JSON representation. */
    toDaemonJson() {
        return this.toJson();
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
DataDescriptor.FLAG_VDXF_KEY_PRESENT = new bn_js_1.BN(0x80);
DataDescriptor.FLAG_MASK = DataDescriptor.FLAG_ENCRYPTED_DATA.add(DataDescriptor.FLAG_SALT_PRESENT)
    .add(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT)
    .add(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT)
    .add(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT)
    .add(DataDescriptor.FLAG_LABEL_PRESENT)
    .add(DataDescriptor.FLAG_MIME_TYPE_PRESENT)
    .add(DataDescriptor.FLAG_VDXF_KEY_PRESENT);
class VDXFDataDescriptor extends index_1.BufferDataVdxfObject {
    constructor(dataDescriptor, vdxfkey = '', version = new bn_js_1.BN(1)) {
        super('', vdxfkey);
        this.version = version;
        if (dataDescriptor) {
            this.dataDescriptor = dataDescriptor;
        }
    }
    static fromDataVdxfObject(data) {
        const retval = new VDXFDataDescriptor();
        retval.version = data.version;
        retval.vdxfkey = data.vdxfkey;
        retval.dataDescriptor = new DataDescriptor();
        const payload = data.toDataBuffer();
        if (retval.dataDescriptor.fromBuffer(payload) !== payload.length) {
            throw new Error('Trailing bytes in data descriptor payload');
        }
        delete retval.data;
        return retval;
    }
    dataByteLength() {
        let length = 0;
        length += this.dataDescriptor.getByteLength();
        return length;
    }
    toDataBuffer() {
        return this.dataDescriptor.toBuffer();
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const payload = reader.readVarSlice();
        this.dataDescriptor = new DataDescriptor();
        if (this.dataDescriptor.fromBuffer(payload) !== payload.length) {
            throw new Error('Trailing bytes in data descriptor payload');
        }
        delete this.data;
        return reader.offset;
    }
    hasEncryptedData() {
        return this.dataDescriptor.hasEncryptedData();
    }
    hasLabel() {
        return this.dataDescriptor.hasLabel();
    }
    hasSalt() {
        return this.dataDescriptor.hasSalt();
    }
    hasEPK() {
        return this.dataDescriptor.hasEPK();
    }
    hasIVK() {
        return this.dataDescriptor.hasIVK();
    }
    hasSSK() {
        return this.dataDescriptor.hasSSK();
    }
    calcFlags() {
        return this.dataDescriptor.calcFlags();
    }
    setFlags() {
        return this.dataDescriptor.setFlags();
    }
}
exports.VDXFDataDescriptor = VDXFDataDescriptor;
var EHashTypes;
(function (EHashTypes) {
    EHashTypes[EHashTypes["HASH_INVALID"] = pbaas_1.HASH_TYPE_INVALID.toNumber()] = "HASH_INVALID";
    EHashTypes[EHashTypes["HASH_BLAKE2BMMR"] = pbaas_1.HASH_TYPE_BLAKE2B.toNumber()] = "HASH_BLAKE2BMMR";
    EHashTypes[EHashTypes["HASH_BLAKE2BMMR2"] = pbaas_1.HASH_TYPE_BLAKE2BMMR2.toNumber()] = "HASH_BLAKE2BMMR2";
    EHashTypes[EHashTypes["HASH_KECCAK"] = pbaas_1.HASH_TYPE_KECCAK256.toNumber()] = "HASH_KECCAK";
    EHashTypes[EHashTypes["HASH_SHA256D"] = pbaas_1.HASH_TYPE_SHA256D.toNumber()] = "HASH_SHA256D";
    EHashTypes[EHashTypes["HASH_SHA256"] = pbaas_1.HASH_TYPE_SHA256.toNumber()] = "HASH_SHA256";
    EHashTypes[EHashTypes["HASH_LASTTYPE"] = pbaas_1.HASH_TYPE_SHA256.toNumber()] = "HASH_LASTTYPE";
})(EHashTypes || (exports.EHashTypes = EHashTypes = {}));
