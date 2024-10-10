"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureData = void 0;
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const DataDescriptor_1 = require("./DataDescriptor");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const createHash = require("create-hash");
const vdxf_2 = require("../constants/vdxf");
class SignatureData {
    constructor(data) {
        if (data) {
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.system_ID = data.system_ID || "";
            this.hash_type = data.hash_type || new bn_js_1.BN(0);
            this.signature_hash = data.signature_hash || Buffer.alloc(0);
            this.identity_ID = data.identity_ID || "";
            this.sig_type = data.sig_type || new bn_js_1.BN(0);
            this.vdxf_keys = data.vdxf_keys || [];
            this.vdxf_key_names = data.vdxf_key_names || [];
            this.bound_hashes = data.bound_hashes || [];
            this.signature_as_vch = data.signature_as_vch || Buffer.alloc(0);
        }
    }
    static fromJson(data) {
        var _a;
        const signatureData = new SignatureData();
        if (data) {
            signatureData.version = new bn_js_1.BN(data.version);
            signatureData.system_ID = data.systemid;
            signatureData.hash_type = new bn_js_1.BN(data.hashtype);
            signatureData.identity_ID = data.identityid;
            signatureData.sig_type = new bn_js_1.BN(data.signaturetype);
            if (signatureData.hash_type == new bn_js_1.BN(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
                signatureData.signature_hash = Buffer.from(data.signaturehash, 'hex').reverse();
            }
            else {
                signatureData.signature_hash = Buffer.from(data.signaturehash, 'hex');
            }
            signatureData.signature_as_vch = Buffer.from(data.signature, 'base64');
            signatureData.vdxf_keys = data.vdxfkeys || [];
            signatureData.vdxf_key_names = data.vdxfkeynames || [];
            signatureData.bound_hashes = ((_a = data.boundhashes) === null || _a === void 0 ? void 0 : _a.map((hash) => Buffer.from(hash, 'hex'))) || [];
        }
        return signatureData;
    }
    static getSignatureHashType(input) {
        var bufferReader = new bufferutils_1.default.BufferReader(input, 0);
        let version = bufferReader.readUInt8();
        if (version === 2)
            return bufferReader.readUInt8();
        else
            return DataDescriptor_1.EHashTypes.HASH_SHA256;
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += 20; // system_ID uint160
        byteLength += varint_1.default.encodingLength(this.hash_type);
        byteLength += varuint_1.default.encodingLength(this.signature_hash.length);
        byteLength += this.signature_hash.length;
        byteLength += 20; // identity_ID uint160
        byteLength += varint_1.default.encodingLength(this.sig_type);
        byteLength += varuint_1.default.encodingLength(this.vdxf_keys.length);
        byteLength += this.vdxf_keys.length * 20;
        byteLength += varuint_1.default.encodingLength(this.vdxf_key_names.length);
        for (const keyName of this.vdxf_key_names) {
            byteLength += varuint_1.default.encodingLength(Buffer.from(keyName, 'utf8').length);
            byteLength += Buffer.from(keyName, 'utf8').length;
        }
        byteLength += varuint_1.default.encodingLength(this.bound_hashes.length);
        byteLength += this.bound_hashes.length * 32;
        byteLength += varuint_1.default.encodingLength(this.signature_as_vch.length);
        byteLength += this.signature_as_vch.length;
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.system_ID).hash);
        bufferWriter.writeVarInt(this.hash_type);
        bufferWriter.writeVarSlice(this.signature_hash);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.identity_ID).hash);
        bufferWriter.writeVarInt(this.sig_type);
        bufferWriter.writeCompactSize(this.vdxf_keys.length);
        for (const key of this.vdxf_keys) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(key).hash);
        }
        bufferWriter.writeCompactSize(this.vdxf_key_names.length);
        for (const keyName of this.vdxf_key_names) {
            bufferWriter.writeVarSlice(Buffer.from(keyName, 'utf8'));
        }
        bufferWriter.writeCompactSize(this.bound_hashes.length);
        for (const boundHash of this.bound_hashes) {
            bufferWriter.writeSlice(boundHash);
        }
        bufferWriter.writeVarSlice(this.signature_as_vch);
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.system_ID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.hash_type = reader.readVarInt();
        this.signature_hash = reader.readVarSlice();
        this.identity_ID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.sig_type = reader.readVarInt();
        const vdxfKeysLength = reader.readCompactSize();
        this.vdxf_keys = [];
        for (let i = 0; i < vdxfKeysLength; i++) {
            this.vdxf_keys.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        const vdxfKeyNamesLength = reader.readCompactSize();
        this.vdxf_key_names = [];
        for (let i = 0; i < vdxfKeyNamesLength; i++) {
            this.vdxf_key_names.push(reader.readVarSlice().toString('utf8'));
        }
        const boundHashesLength = reader.readCompactSize();
        this.bound_hashes = [];
        for (let i = 0; i < boundHashesLength; i++) {
            this.bound_hashes.push(reader.readSlice(32));
        }
        this.signature_as_vch = reader.readVarSlice();
        return reader.offset;
    }
    isValid() {
        return !!(this.version.gte(SignatureData.FIRST_VERSION) &&
            this.version.lte(SignatureData.LAST_VERSION) &&
            this.system_ID);
    }
    toJson() {
        const returnObj = {
            version: this.version.toString(),
            systemid: this.system_ID,
            hashtype: this.hash_type.toString()
        };
        if (this.hash_type == new bn_js_1.BN(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
            returnObj['signaturehash'] = this.signature_hash.reverse().toString('hex');
        }
        else {
            returnObj['signaturehash'] = this.signature_hash.toString('hex');
        }
        returnObj['identityid'] = this.identity_ID;
        returnObj['signaturetype'] = this.sig_type.toString();
        returnObj['signature'] = this.signature_as_vch.toString('base64');
        if (this.vdxf_keys) {
            returnObj['vdxfkeys'] = this.vdxf_keys;
        }
        if (this.vdxf_key_names) {
            returnObj['vdxfkeynames'] = this.vdxf_key_names;
        }
        if (this.bound_hashes) {
            returnObj['boundhashes'] = this.bound_hashes.map((hash) => hash.toString('hex'));
        }
        return returnObj;
    }
    getIdentityHash(sigObject) {
        var heightBuffer = Buffer.allocUnsafe(4);
        heightBuffer.writeUInt32LE(sigObject.height);
        if (sigObject.hash_type != Number(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
            throw new Error("Invalid signature type for identity hash");
        }
        if (sigObject.version == 1) {
            return createHash("sha256")
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.system_ID).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identity_ID).hash)
                .update(this.signature_hash)
                .digest();
        }
        else {
            return createHash("sha256")
                .update((0, address_1.fromBase58Check)(this.system_ID).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identity_ID).hash)
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update(this.signature_hash)
                .digest();
        }
    }
}
exports.SignatureData = SignatureData;
SignatureData.VERSION_INVALID = new bn_js_1.BN(0);
SignatureData.FIRST_VERSION = new bn_js_1.BN(1);
SignatureData.LAST_VERSION = new bn_js_1.BN(1);
SignatureData.DEFAULT_VERSION = new bn_js_1.BN(1);
SignatureData.TYPE_VERUSID_DEFAULT = new bn_js_1.BN(1);
