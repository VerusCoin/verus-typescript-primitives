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
        if (data != null) {
            const d = data;
            const deprecated = ['system_ID', 'hash_type', 'signature_hash', 'identity_ID', 'sig_type', 'vdxf_keys', 'vdxf_key_names', 'bound_hashes', 'signature_as_vch'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
            if (deprecated.length > 0) {
                const map = {
                    system_ID: 'systemID',
                    hash_type: 'hashType',
                    signature_hash: 'signatureHash',
                    identity_ID: 'identityID',
                    sig_type: 'sigType',
                    vdxf_keys: 'vdxfKeys',
                    vdxf_key_names: 'vdxfKeyNames',
                    bound_hashes: 'boundHashes',
                    signature_as_vch: 'signatureAsVch',
                };
                throw new Error(`SignatureData: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
            }
        }
        if (data) {
            this.version = data.version || new bn_js_1.BN(1, 10);
            this.systemID = data.systemID || "";
            this.hashType = data.hashType || new bn_js_1.BN(0);
            this.signatureHash = data.signatureHash || Buffer.alloc(0);
            this.identityID = data.identityID || "";
            this.sigType = data.sigType || new bn_js_1.BN(0);
            this.vdxfKeys = data.vdxfKeys || [];
            this.vdxfKeyNames = data.vdxfKeyNames || [];
            this.boundHashes = data.boundHashes || [];
            this.signatureAsVch = data.signatureAsVch || Buffer.alloc(0);
        }
    }
    /** @deprecated Use systemID instead */
    get system_ID() { return this.systemID; }
    /** @deprecated Use hashType instead */
    get hash_type() { return this.hashType; }
    /** @deprecated Use signatureHash instead */
    get signature_hash() { return this.signatureHash; }
    /** @deprecated Use identityID instead */
    get identity_ID() { return this.identityID; }
    /** @deprecated Use sigType instead */
    get sig_type() { return this.sigType; }
    /** @deprecated Use vdxfKeys instead */
    get vdxf_keys() { return this.vdxfKeys; }
    /** @deprecated Use vdxfKeyNames instead */
    get vdxf_key_names() { return this.vdxfKeyNames; }
    /** @deprecated Use boundHashes instead */
    get bound_hashes() { return this.boundHashes; }
    /** @deprecated Use signatureAsVch instead */
    get signature_as_vch() { return this.signatureAsVch; }
    static fromJson(data) {
        var _a;
        const signatureData = new SignatureData();
        if (data) {
            signatureData.version = new bn_js_1.BN(data.version);
            signatureData.systemID = data.systemid;
            signatureData.hashType = new bn_js_1.BN(data.hashtype);
            signatureData.identityID = data.identityid;
            signatureData.sigType = new bn_js_1.BN(data.signaturetype);
            if (signatureData.hashType.eq(new bn_js_1.BN(Number(DataDescriptor_1.EHashTypes.HASH_SHA256)))) {
                signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex');
            }
            else {
                signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex').reverse();
            }
            signatureData.signatureAsVch = Buffer.from(data.signature, 'base64');
            signatureData.vdxfKeys = data.vdxfkeys || [];
            signatureData.vdxfKeyNames = data.vdxfkeynames || [];
            signatureData.boundHashes = ((_a = data.boundhashes) === null || _a === void 0 ? void 0 : _a.map((hash) => Buffer.from(hash, 'hex').reverse())) || [];
        }
        return signatureData;
    }
    /**
     * Determines the signature hash type based on the input buffer.
     *
     * @param {Buffer} input - The input buffer containing signature data.
     * @returns {number} - The hash type. If the version byte is `2`, the next byte
     *                     in the buffer is returned as the hash type. Otherwise,
     *                     it defaults to `EHashTypes.HASH_SHA256`.
     *
     * The method reads the first byte of the input buffer as the version. If the
     * version is `2`, it reads the next byte as the hash type. This logic is used
     * to support multiple versions of signature data formats, where version `2`
     * introduces a new hash type. For all other versions, the default hash type
     * is `EHashTypes.HASH_SHA256`.
     */
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
        byteLength += vdxf_1.HASH160_BYTE_LENGTH; // systemID uint160
        byteLength += varint_1.default.encodingLength(this.hashType);
        byteLength += varuint_1.default.encodingLength(this.signatureHash.length);
        byteLength += this.signatureHash.length;
        byteLength += vdxf_1.HASH160_BYTE_LENGTH; // identityID uint160
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
    isValid() {
        return !!(this.version.gte(SignatureData.FIRST_VERSION) &&
            this.version.lte(SignatureData.LAST_VERSION) &&
            this.systemID);
    }
    toJson() {
        const returnObj = {
            version: this.version.toNumber(),
            systemid: this.systemID,
            hashtype: this.hashType.toNumber(),
            signaturehash: '', // Will be set below
            identityid: this.identityID,
            signaturetype: this.sigType.toNumber(),
            signature: this.signatureAsVch.toString('base64')
        };
        if (this.hashType.eq(new bn_js_1.BN(Number(DataDescriptor_1.EHashTypes.HASH_SHA256)))) {
            returnObj.signaturehash = Buffer.from(this.signatureHash).toString('hex');
        }
        else {
            returnObj.signaturehash = Buffer.from(this.signatureHash).reverse().toString('hex');
        }
        if (this.vdxfKeys && this.vdxfKeys.length > 0) {
            returnObj.vdxfkeys = this.vdxfKeys;
        }
        if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
            returnObj.vdxfkeynames = this.vdxfKeyNames;
        }
        if (this.boundHashes && this.boundHashes.length > 0) {
            returnObj.boundhashes = this.boundHashes.map((hash) => Buffer.from(hash).reverse().toString('hex'));
        }
        return returnObj;
    }
    // To fully implement, refer to VerusCoin/src/pbaas/crosschainrpc.cpp line 337, IdentitySignatureHash
    // missing bound hashes and vdxf keys
    getIdentityHash(sigObject) {
        var heightBuffer = Buffer.allocUnsafe(4);
        heightBuffer.writeUInt32LE(sigObject.height);
        if (sigObject.hash_type != Number(DataDescriptor_1.EHashTypes.HASH_SHA256)) {
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
