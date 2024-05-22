"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureData = void 0;
const varint_1 = require("../../utils/varint");
const varuint_1 = require("../../utils/varuint");
const address_1 = require("../../utils/address");
const bufferutils_1 = require("../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../../constants/vdxf");
const DataDescriptor_1 = require("./DataDescriptor");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const createHash = require("create-hash");
const vdxf_2 = require("../../constants/vdxf");
class SignatureData {
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
    static fromJson(data) {
        const signatureData = new SignatureData();
        if (data) {
            if (data.version)
                signatureData.version = new bn_js_1.BN(data.version);
            if (data.systemid)
                signatureData.systemID = data.systemid;
            if (data.hashtype)
                signatureData.hashType = new bn_js_1.BN(data.hashtype);
            let hashType = SignatureData.getSignatureHashType(Buffer.from(data.signaturehash, 'hex'));
            if (hashType == DataDescriptor_1.EHashTypes.HASH_SHA256) {
                signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex').reverse();
            }
            else {
                signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex');
            }
            if (data.identityid)
                signatureData.identityID = data.identityid;
            if (data.signaturetype)
                signatureData.sigType = new bn_js_1.BN(data.signaturetype);
            signatureData.vdxfKeys = data.vdxfkeys || [];
            signatureData.vdxfKeyNames = data.vdxfkeynames || [];
            signatureData.boundHashes = data.boundhashes || [];
            signatureData.signatureAsVch = Buffer.from(data.signature, 'base64');
        }
        return signatureData;
    }
    static getSignatureHashType(buffer) {
        var bufferReader = new bufferutils_1.default.BufferReader(buffer, 0);
        let version = bufferReader.readUInt8();
        if (version === 2)
            return bufferReader.readUInt8();
        else
            return DataDescriptor_1.EHashTypes.HASH_SHA256;
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += 20; // systemID uint160
        byteLength += varint_1.default.encodingLength(this.hashType);
        byteLength += varuint_1.default.encodingLength(this.signatureHash.length);
        byteLength += this.signatureHash.length;
        byteLength += 20; // identityID uint160
        byteLength += varint_1.default.encodingLength(this.sigType);
        byteLength += varuint_1.default.encodingLength(this.vdxfKeys.length);
        byteLength += this.vdxfKeys.length * 20;
        byteLength += varuint_1.default.encodingLength(this.vdxfKeyNames.length);
        for (const keyName of this.vdxfKeyNames) {
            byteLength += varuint_1.default.encodingLength(Buffer.from(keyName, 'utf8').length);
            byteLength += Buffer.from(keyName, 'utf8').length;
        }
        byteLength += varuint_1.default.encodingLength(this.boundHashes.length);
        byteLength += this.boundHashes.length * 32;
        byteLength += varuint_1.default.encodingLength(this.signatureAsVch.length);
        byteLength += this.signatureAsVch.length;
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.systemID).hash);
        bufferWriter.writeVarInt(this.hashType);
        bufferWriter.writeVarSlice(this.signatureHash);
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.identityID).hash);
        bufferWriter.writeVarInt(this.sigType);
        bufferWriter.writeCompactSize(this.vdxfKeys.length);
        for (const key of this.vdxfKeys) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(key).hash);
        }
        bufferWriter.writeCompactSize(this.vdxfKeyNames.length);
        for (const keyName of this.vdxfKeyNames) {
            bufferWriter.writeVarSlice(Buffer.from(keyName, 'utf8'));
        }
        bufferWriter.writeCompactSize(this.boundHashes.length);
        for (const boundHash of this.boundHashes) {
            bufferWriter.writeSlice(boundHash);
        }
        bufferWriter.writeVarSlice(this.signatureAsVch);
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.systemID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.hashType = reader.readVarInt();
        this.signatureHash = reader.readVarSlice();
        this.identityID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.sigType = reader.readVarInt();
        const vdxfKeysLength = reader.readCompactSize();
        this.vdxfKeys = [];
        for (let i = 0; i < vdxfKeysLength; i++) {
            this.vdxfKeys.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        const vdxfKeyNamesLength = reader.readCompactSize();
        this.vdxfKeyNames = [];
        for (let i = 0; i < vdxfKeyNamesLength; i++) {
            this.vdxfKeyNames.push(reader.readVarSlice().toString('utf8'));
        }
        const boundHashesLength = reader.readCompactSize();
        this.boundHashes = [];
        for (let i = 0; i < boundHashesLength; i++) {
            this.boundHashes.push(reader.readSlice(32));
        }
        this.signatureAsVch = reader.readVarSlice();
        return reader.offset;
    }
    IsValid() {
        return !!(this.version.gte(SignatureData.FIRST_VERSION) &&
            this.version.lte(SignatureData.LAST_VERSION) &&
            this.systemID);
    }
    toJson() {
        const returnObj = { version: this.version.toString(),
            systemid: this.systemID,
            hashtype: this.hashType.toString() };
        if (this.hashType == new bn_js_1.BN(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
            returnObj['signaturehash'] = this.signatureHash.reverse().toString('hex');
        }
        else {
            returnObj['signaturehash'] = this.signatureHash.toString('hex');
        }
        returnObj['identityid'] = this.identityID;
        returnObj['signaturetype'] = this.sigType.toString();
        returnObj['signature'] = this.signatureAsVch.toString('base64');
        if (this.vdxfKeys) {
            returnObj['vdxfkeys'] = this.vdxfKeys;
        }
        if (this.vdxfKeyNames) {
            returnObj['vdxfkeynames'] = this.vdxfKeyNames;
        }
        if (this.boundHashes) {
            returnObj['boundhashes'] = this.boundHashes;
        }
        return returnObj;
    }
    getIdentityHash(sigObject) {
        var heightBuffer = Buffer.allocUnsafe(4);
        heightBuffer.writeUInt32LE(sigObject.height);
        if (sigObject.hashtype != Number(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
            throw new Error("Invalid signature type for identity hash");
        }
        if (sigObject.version == 1) {
            return createHash("sha256")
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.systemID).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identityID).hash)
                .update(this.signatureHash)
                .digest();
        }
        else {
            return createHash("sha256")
                .update((0, address_1.fromBase58Check)(this.systemID).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identityID).hash)
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update(this.signatureHash)
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
