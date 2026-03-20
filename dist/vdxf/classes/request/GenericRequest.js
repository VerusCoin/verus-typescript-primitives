"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericRequest = void 0;
const bn_js_1 = require("bn.js");
const GenericEnvelope_1 = require("../envelope/GenericEnvelope");
const SaplingPaymentAddress_1 = require("../../../pbaas/SaplingPaymentAddress");
const bufferutils_1 = require("../../../utils/bufferutils");
const base64url_1 = require("base64url");
const deeplink_1 = require("../../../constants/deeplink");
const ResponseURI_1 = require("../ResponseURI");
const varuint_1 = require("../../../utils/varuint");
class GenericRequest extends GenericEnvelope_1.GenericEnvelope {
    constructor(envelope = {
        details: [],
        flags: GenericRequest.BASE_FLAGS
    }) {
        super(envelope);
        this.responseURIs = envelope === null || envelope === void 0 ? void 0 : envelope.responseURIs;
        this.encryptResponseToAddress = envelope === null || envelope === void 0 ? void 0 : envelope.encryptResponseToAddress;
        this.preferredHandler = envelope === null || envelope === void 0 ? void 0 : envelope.preferredHandler;
        this.setFlags();
    }
    hasResponseURIs() {
        return !!(this.flags.and(GenericRequest.FLAG_HAS_RESPONSE_URIS).toNumber());
    }
    hasEncryptResponseToAddress() {
        return !!(this.flags.and(GenericRequest.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS).toNumber());
    }
    hasPreferredHandler() {
        return !!(this.flags.and(GenericRequest.FLAG_HAS_PREFERRED_HANDLER).toNumber());
    }
    setHasResponseURIs() {
        this.flags = this.flags.or(GenericRequest.FLAG_HAS_RESPONSE_URIS);
    }
    setHasEncryptResponseToAddress() {
        this.flags = this.flags.or(GenericRequest.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS);
    }
    setHasPreferredHandler() {
        this.flags = this.flags.or(GenericRequest.FLAG_HAS_PREFERRED_HANDLER);
    }
    setFlags() {
        super.setFlags();
        if (this.responseURIs)
            this.setHasResponseURIs();
        if (this.encryptResponseToAddress)
            this.setHasEncryptResponseToAddress();
        if (this.preferredHandler != null)
            this.setHasPreferredHandler();
    }
    getByteLengthOptionalSig(includeSig = true, forHashing = false) {
        let length = super.getByteLengthOptionalSig(includeSig, forHashing);
        if (this.hasResponseURIs()) {
            length += varuint_1.default.encodingLength(this.responseURIs.length);
            for (let i = 0; i < this.responseURIs.length; i++) {
                length += this.responseURIs[i].getByteLength();
            }
        }
        if (this.hasEncryptResponseToAddress()) {
            length += this.encryptResponseToAddress.getByteLength();
        }
        if (this.hasPreferredHandler()) {
            length += varuint_1.default.encodingLength(this.preferredHandler);
        }
        return length;
    }
    toBufferOptionalSig(includeSig = true, forHashing = false) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLengthOptionalSig(includeSig, forHashing)));
        const superBuf = super.toBufferOptionalSig(includeSig, forHashing);
        writer.writeSlice(superBuf);
        if (this.hasResponseURIs()) {
            writer.writeCompactSize(this.responseURIs.length);
            for (let i = 0; i < this.responseURIs.length; i++) {
                writer.writeSlice(this.responseURIs[i].toBuffer());
            }
        }
        if (this.hasEncryptResponseToAddress()) {
            writer.writeSlice(this.encryptResponseToAddress.toBuffer());
        }
        if (this.hasPreferredHandler()) {
            writer.writeCompactSize(this.preferredHandler);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        if (buffer.length == 0)
            throw new Error("Cannot create request from empty buffer");
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        reader.offset = super.fromBuffer(reader.buffer, reader.offset);
        if (this.hasResponseURIs()) {
            this.responseURIs = [];
            const callbackURIsLength = reader.readCompactSize();
            for (let i = 0; i < callbackURIsLength; i++) {
                const newURI = new ResponseURI_1.ResponseURI();
                reader.offset = newURI.fromBuffer(reader.buffer, reader.offset);
                this.responseURIs.push(newURI);
            }
        }
        if (this.hasEncryptResponseToAddress()) {
            this.encryptResponseToAddress = new SaplingPaymentAddress_1.SaplingPaymentAddress();
            reader.offset = this.encryptResponseToAddress.fromBuffer(reader.buffer, reader.offset);
        }
        if (this.hasPreferredHandler()) {
            this.preferredHandler = reader.readCompactSize();
        }
        return reader.offset;
    }
    toJson() {
        const parentJson = super.toJson();
        if (this.hasResponseURIs()) {
            parentJson["responseuris"] = this.responseURIs.map(x => x.toJson());
        }
        if (this.hasEncryptResponseToAddress()) {
            parentJson["encryptresponsetoaddress"] = this.encryptResponseToAddress.toAddressString();
        }
        if (this.hasPreferredHandler()) {
            parentJson["preferredhandler"] = this.preferredHandler;
        }
        return parentJson;
    }
    static fromWalletDeeplinkUri(uri) {
        const urlProtocol = `${deeplink_1.DEEPLINK_PROTOCOL_URL_STRING}:`;
        const split = uri.split(`/`);
        if (split.length !== 4 || split.some(x => x == null))
            throw new Error("Unrecognized URL format");
        if (split[0] !== urlProtocol)
            throw new Error("Unrecognized URL protocol");
        else if (isNaN(Number(split[2])) || !(new bn_js_1.BN(split[2], 10).eq(deeplink_1.DEEPLINK_PROTOCOL_URL_CURRENT_VERSION))) {
            throw new Error("Unrecognized or incompatible generic request protocol version");
        }
        const inv = new GenericRequest();
        inv.fromBuffer(base64url_1.default.toBuffer(split[3]), 0);
        return inv;
    }
    static fromQrString(qrstring) {
        const inv = new GenericRequest();
        inv.fromBuffer(base64url_1.default.toBuffer(qrstring), 0);
        return inv;
    }
    toWalletDeeplinkUri() {
        return `${deeplink_1.DEEPLINK_PROTOCOL_URL_STRING}://${deeplink_1.DEEPLINK_PROTOCOL_URL_CURRENT_VERSION.toString()}/${this.toString()}`;
    }
    toQrString() {
        return this.toString();
    }
}
exports.GenericRequest = GenericRequest;
GenericRequest.VERSION_CURRENT = new bn_js_1.BN(1, 10);
GenericRequest.VERSION_FIRSTVALID = new bn_js_1.BN(1, 10);
GenericRequest.VERSION_LASTVALID = new bn_js_1.BN(1, 10);
GenericRequest.BASE_FLAGS = GenericEnvelope_1.GenericEnvelope.BASE_FLAGS;
GenericRequest.FLAG_SIGNED = GenericEnvelope_1.GenericEnvelope.FLAG_SIGNED;
GenericRequest.FLAG_HAS_CREATED_AT = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_CREATED_AT;
GenericRequest.FLAG_MULTI_DETAILS = GenericEnvelope_1.GenericEnvelope.FLAG_MULTI_DETAILS;
GenericRequest.FLAG_IS_TESTNET = GenericEnvelope_1.GenericEnvelope.FLAG_IS_TESTNET;
GenericRequest.FLAG_HAS_SALT = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_SALT;
GenericRequest.FLAG_HAS_APP_OR_DELEGATED_ID = GenericEnvelope_1.GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID;
GenericRequest.FLAG_HAS_RESPONSE_URIS = new bn_js_1.BN(128, 10);
GenericRequest.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS = new bn_js_1.BN(256, 10);
GenericRequest.FLAG_HAS_PREFERRED_HANDLER = new bn_js_1.BN(512, 10);
