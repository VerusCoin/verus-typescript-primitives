"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifiableSignatureData = void 0;
const varuint_1 = require("../../utils/varuint");
const address_1 = require("../../utils/address");
const bufferutils_1 = require("../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../../constants/vdxf");
const DataDescriptor_1 = require("../../pbaas/DataDescriptor");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const createHash = require("create-hash");
const vdxf_2 = require("../../constants/vdxf");
const CompactAddressObject_1 = require("./CompactAddressObject");
const pbaas_1 = require("../../constants/pbaas");
const varint_1 = require("../../utils/varint");
const pbaas_2 = require("../../pbaas");
class VerifiableSignatureData {
    constructor(data) {
        this.version = data && data.version ? data.version : new bn_js_1.BN(0);
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN(0);
        this.signatureVersion = data && data.signatureVersion ? data.signatureVersion : new bn_js_1.BN(2, 10);
        this.isTestnet = data && data.isTestnet ? data.isTestnet : false;
        // If systemID is provided, use it and set the FLAG_HAS_SYSTEM. Otherwise, default based on isTestnet
        if (data && data.systemID) {
            this.systemID = data.systemID;
            this.setHasSystem();
        }
        else {
            const defaultChainId = this.isTestnet ? pbaas_1.TESTNET_VERUS_CHAINID : pbaas_1.DEFAULT_VERUS_CHAINID;
            this.systemID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: defaultChainId });
        }
        this.hashType = data && data.hashType ? data.hashType : pbaas_1.HASH_TYPE_SHA256;
        this.identityID = data ? data.identityID : undefined;
        this.vdxfKeys = data ? data.vdxfKeys : undefined;
        this.vdxfKeyNames = data ? data.vdxfKeyNames : undefined;
        this.boundHashes = data ? data.boundHashes : undefined;
        this.statements = data ? data.statements : undefined;
        this.signatureAsVch = data && data.signatureAsVch ? data.signatureAsVch : Buffer.alloc(0);
        this.setFlags();
    }
    hasFlag(flag) {
        return !!(this.flags.and(flag).toNumber());
    }
    setFlag(flag) {
        this.flags = this.flags.or(flag);
    }
    hasVdxfKeys() {
        return this.hasFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
    }
    hasVdxfKeyNames() {
        return this.hasFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
    }
    hasBoundHashes() {
        return this.hasFlag(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
    }
    hasStatements() {
        return this.hasFlag(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
    }
    hasSystem() {
        return this.hasFlag(VerifiableSignatureData.FLAG_HAS_SYSTEM);
    }
    setHasVdxfKeys() {
        this.setFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
    }
    setHasVdxfKeyNames() {
        this.setFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
    }
    setHasBoundHashes() {
        this.setFlag(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
    }
    setHasStatements() {
        this.setFlag(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
    }
    setHasSystem() {
        this.setFlag(VerifiableSignatureData.FLAG_HAS_SYSTEM);
    }
    calcFlags() {
        let flags = new bn_js_1.BN(this.flags);
        if (this.hasVdxfKeys())
            flags = flags.or(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
        if (this.hasVdxfKeyNames())
            flags = flags.or(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
        if (this.hasBoundHashes())
            flags = flags.or(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
        if (this.hasStatements())
            flags = flags.or(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
        if (this.hasSystem())
            flags = flags.or(VerifiableSignatureData.FLAG_HAS_SYSTEM);
        return flags;
    }
    setFlags() {
        if (this.vdxfKeys)
            this.setHasVdxfKeys();
        if (this.vdxfKeyNames)
            this.setHasVdxfKeyNames();
        if (this.boundHashes)
            this.setHasBoundHashes();
        if (this.statements)
            this.setHasStatements();
    }
    getBufferEncodingLength(buf) {
        const bufLen = buf.byteLength;
        return varuint_1.default.encodingLength(bufLen) + bufLen;
    }
    getExtraHashDataByteLength() {
        let byteLength = 0;
        if (this.vdxfKeys && this.vdxfKeys.length > 0) {
            byteLength += varuint_1.default.encodingLength(this.vdxfKeys.length);
            byteLength += this.vdxfKeys.length * vdxf_1.HASH160_BYTE_LENGTH;
        }
        if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
            byteLength += varuint_1.default.encodingLength(this.vdxfKeyNames.length);
            for (const name of this.vdxfKeyNames) {
                byteLength += this.getBufferEncodingLength(Buffer.from(name, 'utf8'));
            }
        }
        if (this.boundHashes && this.boundHashes.length > 0) {
            byteLength += varuint_1.default.encodingLength(this.boundHashes.length);
            byteLength += this.boundHashes.length * vdxf_1.HASH256_BYTE_LENGTH;
        }
        return byteLength;
    }
    getExtraHashData() {
        const byteLength = this.getExtraHashDataByteLength();
        if (byteLength === 0) {
            return Buffer.alloc(0);
        }
        const bufferWriter = new BufferWriter(Buffer.alloc(byteLength));
        if (this.vdxfKeys && this.vdxfKeys.length > 0) {
            // Sort vdxfKeys by their 20-byte buffer values before writing
            const keyBuffers = this.vdxfKeys.map(x => (0, address_1.fromBase58Check)(x).hash);
            const sortedBuffers = keyBuffers.sort(Buffer.compare);
            bufferWriter.writeArray(sortedBuffers);
        }
        if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
            // Sort vdxfKeyNames before writing
            const sortedNames = [...this.vdxfKeyNames].sort();
            bufferWriter.writeVector(sortedNames.map(x => Buffer.from(x, 'utf8')));
        }
        if (this.boundHashes && this.boundHashes.length > 0) {
            // Sort boundHashes before writing
            const sortedHashes = [...this.boundHashes].sort(Buffer.compare);
            bufferWriter.writeArray(sortedHashes);
        }
        return bufferWriter.buffer;
    }
    _getByteLength(forHashing) {
        let byteLength = 0;
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varuint_1.default.encodingLength(this.flags.toNumber());
        byteLength += varuint_1.default.encodingLength(this.signatureVersion.toNumber());
        byteLength += varuint_1.default.encodingLength(this.hashType.toNumber());
        // For hashing, always include systemID even if !hasSystem, so signature remains valid if defaults change
        // For serialization, only include systemID if hasSystem flag is set
        if (forHashing || this.hasSystem()) {
            byteLength += this.systemID.getByteLength();
        }
        byteLength += this.identityID.getByteLength();
        if (this.hasVdxfKeys()) {
            byteLength += varuint_1.default.encodingLength(this.vdxfKeys.length);
            for (const key of this.vdxfKeys) {
                byteLength += vdxf_1.HASH160_BYTE_LENGTH;
            }
        }
        if (this.hasVdxfKeyNames()) {
            byteLength += varuint_1.default.encodingLength(this.vdxfKeyNames.length);
            for (const key of this.vdxfKeyNames) {
                byteLength += this.getBufferEncodingLength(Buffer.from(key, 'utf8'));
            }
        }
        if (this.hasBoundHashes()) {
            byteLength += varuint_1.default.encodingLength(this.boundHashes.length);
            for (const hash of this.boundHashes) {
                byteLength += this.getBufferEncodingLength(hash);
            }
        }
        if (this.hasStatements()) {
            byteLength += varuint_1.default.encodingLength(this.statements.length);
            for (const statement of this.statements) {
                byteLength += this.getBufferEncodingLength(statement);
            }
        }
        byteLength += this.getBufferEncodingLength(this.signatureAsVch);
        return byteLength;
    }
    getByteLength() {
        return this._getByteLength(false);
    }
    getByteLengthForHashing() {
        return this._getByteLength(true);
    }
    _toBuffer(forHashing) {
        const bufferWriter = new BufferWriter(Buffer.alloc(this._getByteLength(forHashing)));
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeCompactSize(this.flags.toNumber());
        bufferWriter.writeCompactSize(this.signatureVersion.toNumber());
        bufferWriter.writeCompactSize(this.hashType.toNumber());
        // For hashing, always include systemID even if !hasSystem, so signature remains valid if defaults change
        // For serialization, only include systemID if hasSystem flag is set
        if (forHashing || this.hasSystem()) {
            bufferWriter.writeSlice(this.systemID.toBuffer());
        }
        bufferWriter.writeSlice(this.identityID.toBuffer());
        if (this.hasVdxfKeys()) {
            bufferWriter.writeArray(this.vdxfKeys.map(x => (0, address_1.fromBase58Check)(x).hash));
        }
        if (this.hasVdxfKeyNames()) {
            bufferWriter.writeVector(this.vdxfKeyNames.map(x => Buffer.from(x, 'utf8')));
        }
        if (this.hasBoundHashes()) {
            bufferWriter.writeVector(this.boundHashes);
        }
        if (this.hasStatements()) {
            bufferWriter.writeVector(this.statements);
        }
        bufferWriter.writeVarSlice(this.signatureAsVch);
        return bufferWriter.buffer;
    }
    toBuffer() {
        return this._toBuffer(false);
    }
    toBufferForHashing() {
        return this._toBuffer(true);
    }
    fromBuffer(buffer, offset = 0) {
        const bufferReader = new BufferReader(buffer, offset);
        this.version = bufferReader.readVarInt();
        this.flags = new bn_js_1.BN(bufferReader.readCompactSize());
        this.signatureVersion = new bn_js_1.BN(bufferReader.readCompactSize());
        this.hashType = new bn_js_1.BN(bufferReader.readCompactSize());
        if (this.hasSystem()) {
            this.systemID = new CompactAddressObject_1.CompactIAddressObject();
            bufferReader.offset = this.systemID.fromBuffer(bufferReader.buffer, bufferReader.offset);
        }
        this.identityID = new CompactAddressObject_1.CompactIAddressObject();
        bufferReader.offset = this.identityID.fromBuffer(bufferReader.buffer, bufferReader.offset);
        if (this.hasVdxfKeys()) {
            this.vdxfKeys = bufferReader.readArray(vdxf_1.HASH160_BYTE_LENGTH).map(x => (0, address_1.toBase58Check)(x, vdxf_1.I_ADDR_VERSION));
        }
        if (this.hasVdxfKeyNames()) {
            this.vdxfKeyNames = bufferReader.readVector().map((x) => x.toString('utf8'));
        }
        if (this.hasBoundHashes()) {
            this.boundHashes = bufferReader.readVector();
        }
        if (this.hasStatements()) {
            this.statements = bufferReader.readVector();
        }
        this.signatureAsVch = bufferReader.readVarSlice();
        return bufferReader.offset;
    }
    // To fully implement, refer to VerusCoin/src/pbaas/crosschainrpc.cpp line 337, IdentitySignatureHash
    getIdentityHash(height, sigHash) {
        var heightBuffer = Buffer.allocUnsafe(4);
        heightBuffer.writeUInt32LE(height);
        if (!this.hashType.eq(new bn_js_1.BN(DataDescriptor_1.EHashTypes.HASH_SHA256))) {
            throw new Error("Only SHA256 hash type is currently supported.");
        }
        if (this.signatureVersion.eq(new bn_js_1.BN(0))) {
            throw new Error("Invalid sig data version");
        }
        else if (this.signatureVersion.eq(new bn_js_1.BN(1))) {
            return createHash("sha256")
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.systemID.toIAddress()).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identityID.toIAddress()).hash)
                .update(sigHash)
                .digest();
        }
        else if (this.signatureVersion.eq(new bn_js_1.BN(2))) {
            const extraHashData = this.getExtraHashData();
            const hash = createHash("sha256");
            if (extraHashData.length > 0) {
                hash.update(extraHashData);
            }
            return hash
                .update((0, address_1.fromBase58Check)(this.systemID.toIAddress()).hash)
                .update(heightBuffer)
                .update((0, address_1.fromBase58Check)(this.identityID.toIAddress()).hash)
                .update(vdxf_2.VERUS_DATA_SIGNATURE_PREFIX)
                .update(sigHash)
                .digest();
        }
        else {
            throw new Error("Unrecognized sig data version");
        }
    }
    toSignatureData(sigHash) {
        return new pbaas_2.SignatureData({
            version: this.version,
            systemID: this.systemID.toIAddress(),
            hashType: this.hashType,
            signatureHash: sigHash,
            identityID: this.identityID.toIAddress(),
            sigType: pbaas_2.SignatureData.TYPE_VERUSID_DEFAULT,
            vdxfKeys: this.vdxfKeys,
            vdxfKeyNames: this.vdxfKeyNames,
            boundHashes: this.boundHashes,
            signatureAsVch: this.signatureAsVch
        });
    }
    toJson() {
        var _a, _b;
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            signatureversion: this.signatureVersion.toNumber(),
            hashtype: this.hashType.toNumber(),
            systemid: this.systemID.toJson(),
            identityid: this.identityID.toJson(),
            vdxfkeys: this.vdxfKeys,
            vdxfkeynames: this.vdxfKeyNames,
            boundhashes: (_a = this.boundHashes) === null || _a === void 0 ? void 0 : _a.map(x => x.toString('hex')),
            statements: (_b = this.statements) === null || _b === void 0 ? void 0 : _b.map(x => x.toString('hex')),
            signature: this.signatureAsVch.toString('hex')
        };
    }
    static fromJson(json) {
        var _a, _b;
        const instance = new VerifiableSignatureData();
        instance.version = new bn_js_1.BN(json.version);
        instance.flags = new bn_js_1.BN(json.flags);
        instance.signatureVersion = new bn_js_1.BN(json.signatureversion);
        instance.hashType = new bn_js_1.BN(json.hashtype);
        instance.systemID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.systemid);
        instance.identityID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.identityid);
        instance.vdxfKeys = json === null || json === void 0 ? void 0 : json.vdxfkeys;
        instance.vdxfKeyNames = json === null || json === void 0 ? void 0 : json.vdxfkeynames;
        instance.boundHashes = (_a = json.boundhashes) === null || _a === void 0 ? void 0 : _a.map(x => Buffer.from(x, 'hex'));
        instance.statements = (_b = json.statements) === null || _b === void 0 ? void 0 : _b.map(x => Buffer.from(x, 'hex'));
        instance.signatureAsVch = Buffer.from(json.signature, 'hex');
        return instance;
    }
    static fromCLIJson(json, rootSystemName = 'VRSC') {
        var _a;
        const instance = new VerifiableSignatureData();
        instance.version = new bn_js_1.BN(VerifiableSignatureData.TYPE_VERUSID_DEFAULT);
        instance.hashType = new bn_js_1.BN(json.signaturedata.hashtype);
        instance.signatureVersion = new bn_js_1.BN(json.signatureversion); //default Signature Version
        instance.systemID = CompactAddressObject_1.CompactIAddressObject.fromAddress(json.systemid, rootSystemName);
        instance.identityID = CompactAddressObject_1.CompactIAddressObject.fromAddress(json.address, rootSystemName);
        // Set optional fields
        instance.vdxfKeys = json.vdxfkeys;
        instance.vdxfKeyNames = json.vdxfkeynames;
        instance.boundHashes = (_a = json.boundhashes) === null || _a === void 0 ? void 0 : _a.map(x => Buffer.from(x, 'hex'));
        // Store the full signature (from daemon in base64 format)
        instance.signatureAsVch = Buffer.from(json.signature, 'base64');
        instance.setFlags();
        return instance;
    }
}
exports.VerifiableSignatureData = VerifiableSignatureData;
VerifiableSignatureData.VERSION_INVALID = new bn_js_1.BN(0);
VerifiableSignatureData.FIRST_VERSION = new bn_js_1.BN(1);
VerifiableSignatureData.LAST_VERSION = new bn_js_1.BN(1);
VerifiableSignatureData.DEFAULT_VERSION = new bn_js_1.BN(1);
VerifiableSignatureData.TYPE_VERUSID_DEFAULT = new bn_js_1.BN(1);
VerifiableSignatureData.FLAG_HAS_VDXF_KEYS = new bn_js_1.BN(1);
VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES = new bn_js_1.BN(2);
VerifiableSignatureData.FLAG_HAS_BOUND_HASHES = new bn_js_1.BN(4);
VerifiableSignatureData.FLAG_HAS_STATEMENTS = new bn_js_1.BN(8);
VerifiableSignatureData.FLAG_HAS_SYSTEM = new bn_js_1.BN(16);
