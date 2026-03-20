"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericResponse = void 0;
const bn_js_1 = require("bn.js");
const GenericEnvelope_1 = require("../envelope/GenericEnvelope");
const bufferutils_1 = require("../../../utils/bufferutils");
const DataDescriptor_1 = require("../../../pbaas/DataDescriptor");
const varuint_1 = require("../../../utils/varuint");
class GenericResponse extends GenericEnvelope_1.GenericEnvelope {
    constructor(envelope = {
        details: [],
        flags: GenericResponse.BASE_FLAGS
    }) {
        super(envelope);
        this.requestHash = envelope.requestHash;
        this.handledBy = envelope.handledBy;
        this.setFlags();
        this.requestHashType = envelope.requestHashType;
        if (this.requestHashType == null && this.hasRequestHash()) {
            this.requestHashType = new bn_js_1.BN(DataDescriptor_1.EHashTypes.HASH_SHA256);
        }
    }
    hasRequestHash() {
        return !!(this.flags.and(GenericResponse.FLAG_HAS_REQUEST_HASH).toNumber());
    }
    hasHandledBy() {
        return !!(this.flags.and(GenericResponse.FLAG_HAS_HANDLED_BY).toNumber());
    }
    setHasRequestHash() {
        this.flags = this.flags.or(GenericResponse.FLAG_HAS_REQUEST_HASH);
    }
    setHasHandledBy() {
        this.flags = this.flags.or(GenericResponse.FLAG_HAS_HANDLED_BY);
    }
    setFlags() {
        super.setFlags();
        if (this.requestHash)
            this.setHasRequestHash();
        if (this.handledBy != null)
            this.setHasHandledBy();
    }
    getByteLengthOptionalSig(includeSig = true, forHashing = false) {
        let length = super.getByteLengthOptionalSig(includeSig, forHashing);
        if (this.hasRequestHash()) {
            const hashLen = this.requestHash.length;
            length += varuint_1.default.encodingLength(this.requestHashType.toNumber());
            length += varuint_1.default.encodingLength(this.requestHash.length);
            length += hashLen;
        }
        if (this.hasHandledBy()) {
            length += varuint_1.default.encodingLength(this.handledBy);
        }
        return length;
    }
    toBufferOptionalSig(includeSig = true, forHashing = false) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLengthOptionalSig(includeSig, forHashing)));
        const superBuf = super.toBufferOptionalSig(includeSig, forHashing);
        writer.writeSlice(superBuf);
        if (this.hasRequestHash()) {
            writer.writeCompactSize(this.requestHashType.toNumber());
            writer.writeVarSlice(this.requestHash);
        }
        if (this.hasHandledBy()) {
            writer.writeCompactSize(this.handledBy);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        if (buffer.length == 0)
            throw new Error("Cannot create response from empty buffer");
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        reader.offset = super.fromBuffer(reader.buffer, reader.offset);
        if (this.hasRequestHash()) {
            this.requestHashType = new bn_js_1.BN(reader.readCompactSize());
            this.requestHash = reader.readVarSlice();
        }
        if (this.hasHandledBy()) {
            this.handledBy = reader.readCompactSize();
        }
        return reader.offset;
    }
    toJson() {
        const parentJson = super.toJson();
        if (this.hasRequestHash()) {
            parentJson["requesthash"] = this.requestHash.toString('hex');
            parentJson["requesthashtype"] = this.requestHashType.toNumber();
        }
        if (this.hasHandledBy()) {
            parentJson["handledby"] = this.handledBy;
        }
        return parentJson;
    }
}
exports.GenericResponse = GenericResponse;
GenericResponse.VERSION_CURRENT = new bn_js_1.BN(1, 10);
GenericResponse.VERSION_FIRSTVALID = new bn_js_1.BN(1, 10);
GenericResponse.VERSION_LASTVALID = new bn_js_1.BN(1, 10);
GenericResponse.BASE_FLAGS = GenericEnvelope_1.GenericEnvelope.BASE_FLAGS;
GenericResponse.FLAG_SIGNED = GenericEnvelope_1.GenericEnvelope.FLAG_SIGNED;
GenericResponse.FLAG_HAS_CREATED_AT = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_CREATED_AT;
GenericResponse.FLAG_MULTI_DETAILS = GenericEnvelope_1.GenericEnvelope.FLAG_MULTI_DETAILS;
GenericResponse.FLAG_IS_TESTNET = GenericEnvelope_1.GenericEnvelope.FLAG_IS_TESTNET;
GenericResponse.FLAG_HAS_SALT = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_SALT;
GenericResponse.FLAG_HAS_APP_OR_DELEGATED_ID = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID;
GenericResponse.FLAG_HAS_REQUEST_HASH = new bn_js_1.BN(128, 10);
GenericResponse.FLAG_HAS_HANDLED_BY = new bn_js_1.BN(256, 10);
