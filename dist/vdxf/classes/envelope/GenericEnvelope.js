"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericEnvelope = void 0;
const bufferutils_1 = require("../../../utils/bufferutils");
const base64url_1 = require("base64url");
const bn_js_1 = require("bn.js");
const OrdinalVDXFObject_1 = require("../ordinals/OrdinalVDXFObject");
const varuint_1 = require("../../../utils/varuint");
const crypto_1 = require("crypto");
const VerifiableSignatureData_1 = require("../VerifiableSignatureData");
const CompactAddressObject_1 = require("../CompactAddressObject");
class GenericEnvelope {
    constructor(envelope = {
        details: [],
        flags: GenericEnvelope.BASE_FLAGS
    }) {
        this.signature = envelope === null || envelope === void 0 ? void 0 : envelope.signature;
        this.requestID = envelope === null || envelope === void 0 ? void 0 : envelope.requestID;
        this.details = envelope === null || envelope === void 0 ? void 0 : envelope.details;
        this.createdAt = envelope === null || envelope === void 0 ? void 0 : envelope.createdAt;
        this.salt = envelope === null || envelope === void 0 ? void 0 : envelope.salt;
        this.appOrDelegatedID = envelope === null || envelope === void 0 ? void 0 : envelope.appOrDelegatedID;
        if (envelope === null || envelope === void 0 ? void 0 : envelope.flags)
            this.flags = envelope.flags;
        else
            this.flags = GenericEnvelope.BASE_FLAGS;
        if (envelope === null || envelope === void 0 ? void 0 : envelope.version)
            this.version = envelope.version;
        else
            this.version = GenericEnvelope.VERSION_CURRENT;
        this.setFlags();
    }
    isValidVersion() {
        return this.version.gte(GenericEnvelope.VERSION_FIRSTVALID) && this.version.lte(GenericEnvelope.VERSION_LASTVALID);
    }
    isSigned() {
        return !!(this.flags.and(GenericEnvelope.FLAG_SIGNED).toNumber());
    }
    hasRequestID() {
        return !!(this.flags.and(GenericEnvelope.FLAG_HAS_REQUEST_ID).toNumber());
    }
    hasMultiDetails() {
        return !!(this.flags.and(GenericEnvelope.FLAG_MULTI_DETAILS).toNumber());
    }
    hasCreatedAt() {
        return !!(this.flags.and(GenericEnvelope.FLAG_HAS_CREATED_AT).toNumber());
    }
    hasSalt() {
        return !!(this.flags.and(GenericEnvelope.FLAG_HAS_SALT).toNumber());
    }
    hasAppOrDelegatedID() {
        return !!(this.flags.and(GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID).toNumber());
    }
    isTestnet() {
        return !!(this.flags.and(GenericEnvelope.FLAG_IS_TESTNET).toNumber());
    }
    setSigned() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_SIGNED);
    }
    setHasRequestID() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_REQUEST_ID);
    }
    setHasMultiDetails() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_MULTI_DETAILS);
    }
    setHasCreatedAt() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_CREATED_AT);
    }
    setHasSalt() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_SALT);
    }
    setHasAppOrDelegatedID() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID);
    }
    setIsTestnet() {
        this.flags = this.flags.or(GenericEnvelope.FLAG_IS_TESTNET);
    }
    setFlags() {
        if (this.signature)
            this.setSigned();
        if (this.requestID)
            this.setHasRequestID();
        if (this.createdAt)
            this.setHasCreatedAt();
        if (this.salt)
            this.setHasSalt();
        if (this.appOrDelegatedID)
            this.setHasAppOrDelegatedID();
        if (this.details && this.details.length > 1)
            this.setHasMultiDetails();
    }
    getRawDataSha256(includeSig = false) {
        return (0, crypto_1.createHash)("sha256").update(this.toBufferOptionalSig(includeSig, true)).digest();
    }
    getDetailsIdentitySignatureHash(signedBlockheight) {
        if (this.isSigned()) {
            return this.signature.getIdentityHash(signedBlockheight, this.getRawDataSha256());
        }
        else
            throw new Error("Must contain verifiable signature with at least systemID and identityID to generate details identity signature hash");
    }
    getDetails(index = 0) {
        return this.details[index];
    }
    getDetailsBufferLength() {
        let length = 0;
        if (this.hasMultiDetails()) {
            length += varuint_1.default.encodingLength(this.details.length);
            for (const detail of this.details) {
                length += detail.getByteLength();
            }
        }
        else {
            length += this.getDetails().getByteLength();
        }
        return length;
    }
    getDetailsBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getDetailsBufferLength()));
        if (this.hasMultiDetails()) {
            writer.writeCompactSize(this.details.length);
            for (const detail of this.details) {
                writer.writeSlice(detail.toBuffer());
            }
        }
        else {
            writer.writeSlice(this.getDetails().toBuffer());
        }
        return writer.buffer;
    }
    setDetailsFromBuffer(buffer, offset = 0) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const rootSystemName = this.isTestnet() ? 'VRSCTEST' : 'VRSC';
        if (this.hasMultiDetails()) {
            this.details = [];
            const numItems = reader.readCompactSize();
            for (let i = 0; i < numItems; i++) {
                const ord = OrdinalVDXFObject_1.OrdinalVDXFObject.createFromBuffer(reader.buffer, reader.offset, false, rootSystemName);
                reader.offset = ord.offset;
                this.details.push(ord.obj);
            }
        }
        else {
            const ord = OrdinalVDXFObject_1.OrdinalVDXFObject.createFromBuffer(reader.buffer, reader.offset, false, rootSystemName);
            reader.offset = ord.offset;
            this.details = [ord.obj];
        }
        return reader.offset;
    }
    getDataBufferLengthAfterSig() {
        let length = 0;
        if (this.hasRequestID()) {
            length += this.requestID.getByteLength();
        }
        if (this.hasCreatedAt()) {
            length += varuint_1.default.encodingLength(this.createdAt.toNumber());
        }
        if (this.hasSalt()) {
            const saltLen = this.salt.length;
            length += varuint_1.default.encodingLength(saltLen);
            length += saltLen;
        }
        if (this.hasAppOrDelegatedID()) {
            length += this.appOrDelegatedID.getByteLength();
        }
        length += this.getDetailsBufferLength();
        return length;
    }
    getDataBufferAfterSig() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getDataBufferLengthAfterSig()));
        if (this.hasRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        if (this.hasCreatedAt()) {
            writer.writeCompactSize(this.createdAt.toNumber());
        }
        if (this.hasSalt()) {
            writer.writeVarSlice(this.salt);
        }
        if (this.hasAppOrDelegatedID()) {
            writer.writeSlice(this.appOrDelegatedID.toBuffer());
        }
        writer.writeSlice(this.getDetailsBuffer());
        return writer.buffer;
    }
    internalGetByteLength(includeSig = true, forHashing = false) {
        let length = 0;
        length += varuint_1.default.encodingLength(this.version.toNumber());
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.isSigned() && includeSig) {
            length += forHashing ? this.signature.getByteLengthForHashing() : this.signature.getByteLength();
        }
        length += this.getDataBufferLengthAfterSig();
        return length;
    }
    getByteLengthOptionalSig(includeSig, forHashing) {
        return this.internalGetByteLength(includeSig, forHashing);
    }
    getByteLength() {
        return this.getByteLengthOptionalSig(true);
    }
    toBufferOptionalSig(includeSig = true, forHashing = false) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.internalGetByteLength(includeSig, forHashing)));
        writer.writeCompactSize(this.version.toNumber());
        writer.writeCompactSize(this.flags.toNumber());
        if (this.isSigned() && includeSig) {
            writer.writeSlice(forHashing ? this.signature.toBufferForHashing() : this.signature.toBuffer());
        }
        writer.writeSlice(this.getDataBufferAfterSig());
        return writer.buffer;
    }
    toBuffer() {
        return this.toBufferOptionalSig(true);
    }
    fromBuffer(buffer, offset) {
        if (buffer.length == 0)
            throw new Error("Cannot create envelope from empty buffer");
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readCompactSize());
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (this.isSigned()) {
            const _sig = new VerifiableSignatureData_1.VerifiableSignatureData({ isTestnet: this.isTestnet() });
            reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
            this.signature = _sig;
        }
        const rootSystemName = this.isTestnet() ? 'VRSCTEST' : 'VRSC';
        if (this.hasRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        if (this.hasCreatedAt()) {
            this.createdAt = new bn_js_1.BN(reader.readCompactSize());
        }
        if (this.hasSalt()) {
            this.salt = reader.readVarSlice();
        }
        if (this.hasAppOrDelegatedID()) {
            this.appOrDelegatedID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.appOrDelegatedID.fromBuffer(reader.buffer, reader.offset);
        }
        reader.offset = this.setDetailsFromBuffer(reader.buffer, reader.offset);
        return reader.offset;
    }
    toString() {
        return base64url_1.default.encode(this.toBuffer());
    }
    toJson() {
        const details = [];
        if (this.details != null) {
            for (const detail of this.details) {
                details.push(detail.toJson());
            }
        }
        return {
            version: this.version.toString(),
            flags: this.flags.toString(),
            signature: this.isSigned() ? this.signature.toJson() : undefined,
            requestid: this.hasRequestID() ? this.requestID.toJson() : undefined,
            createdat: this.hasCreatedAt() ? this.createdAt.toString() : undefined,
            salt: this.hasSalt() ? this.salt.toString('hex') : undefined,
            appOrDelegatedID: this.hasAppOrDelegatedID() ? this.appOrDelegatedID.toJson() : undefined,
            details: details
        };
    }
}
exports.GenericEnvelope = GenericEnvelope;
GenericEnvelope.VERSION_CURRENT = new bn_js_1.BN(1, 10);
GenericEnvelope.VERSION_FIRSTVALID = new bn_js_1.BN(1, 10);
GenericEnvelope.VERSION_LASTVALID = new bn_js_1.BN(1, 10);
GenericEnvelope.BASE_FLAGS = new bn_js_1.BN(0, 10);
GenericEnvelope.FLAG_SIGNED = new bn_js_1.BN(1, 10);
GenericEnvelope.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(2, 10);
GenericEnvelope.FLAG_HAS_CREATED_AT = new bn_js_1.BN(4, 10);
GenericEnvelope.FLAG_MULTI_DETAILS = new bn_js_1.BN(8, 10);
GenericEnvelope.FLAG_IS_TESTNET = new bn_js_1.BN(16, 10);
GenericEnvelope.FLAG_HAS_SALT = new bn_js_1.BN(32, 10);
GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID = new bn_js_1.BN(64, 10);
