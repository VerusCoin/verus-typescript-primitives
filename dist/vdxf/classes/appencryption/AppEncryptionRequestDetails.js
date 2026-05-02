"use strict";
/**
 * AppEncryptionRequestDetails - Class for handling application requests for encrypted derived seeds
 *
 * This class is used when an application is requesting an encrypted derived seed from the user's master seed,
 * using specific parameters passed by the application. The request includes:
 * - App or delegated ID making the request (mandatory)
 * - A target encryption key (zaddress format) for encrypting the reply
 * - Derivation number for seed generation
 * - Optional derivation ID (defaults to Z-address from ID signing if not present)
 * - Optional request ID for tracking
 *
 * The user's wallet can use these parameters to derive a specific seed from their master seed
 * and encrypt it using the provided encryption key, ensuring the application receives only
 * the specific derived seed it needs without exposing the master seed.
 *
 * The FLAG_RETURN_ESK flag can be set to signal that the Extended Spending Key should be returned.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEncryptionRequestDetails = void 0;
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const CompactAddressObject_1 = require("../CompactAddressObject");
const varuint_1 = require("../../../utils/varuint");
const pbaas_1 = require("../../../pbaas");
class AppEncryptionRequestDetails {
    constructor(data) {
        this.version = (data === null || data === void 0 ? void 0 : data.version) || AppEncryptionRequestDetails.DEFAULT_VERSION;
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0);
        this.encryptResponseToAddress = (data === null || data === void 0 ? void 0 : data.encryptResponseToAddress) || null;
        this.derivationNumber = (data === null || data === void 0 ? void 0 : data.derivationNumber) || new bn_js_1.BN(0);
        this.derivationID = data === null || data === void 0 ? void 0 : data.derivationID;
        this.requestID = data === null || data === void 0 ? void 0 : data.requestID;
        this.setFlags();
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    calcFlags() {
        let flags = new bn_js_1.BN(this.flags);
        if (this.requestID != null) {
            flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID);
        }
        if (this.encryptResponseToAddress != null) {
            flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS);
        }
        if (this.derivationID != null) {
            flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID);
        }
        return flags;
    }
    isValid() {
        let valid = true;
        valid && (valid = this.derivationNumber != null && this.derivationNumber.gte(new bn_js_1.BN(0)));
        return valid;
    }
    hasDerivationID(flags = this.flags) {
        return flags.and(AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID).gt(new bn_js_1.BN(0));
    }
    hasRequestID(flags = this.flags) {
        return flags.and(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID).gt(new bn_js_1.BN(0));
    }
    hasEncryptResponseToAddress(flags = this.flags) {
        return flags.and(AppEncryptionRequestDetails.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS).gt(new bn_js_1.BN(0));
    }
    returnESK(flags = this.flags) {
        return flags.and(AppEncryptionRequestDetails.FLAG_RETURN_ESK).gt(new bn_js_1.BN(0));
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.hasEncryptResponseToAddress()) {
            length += this.encryptResponseToAddress.getByteLength();
        }
        length += varuint_1.default.encodingLength(this.derivationNumber.toNumber());
        if (this.hasDerivationID()) {
            length += this.derivationID.getByteLength();
        }
        if (this.hasRequestID()) {
            length += this.requestID.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        // Write flags
        writer.writeCompactSize(this.flags.toNumber());
        if (this.hasEncryptResponseToAddress()) {
            writer.writeSlice(this.encryptResponseToAddress.toBuffer());
        }
        // Write mandatory derivation number
        writer.writeVarInt(this.derivationNumber);
        if (this.hasDerivationID()) {
            writer.writeSlice(this.derivationID.toBuffer());
        }
        if (this.hasRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        // Read flags
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        // Read encryptToAddress as 43-byte sapling data and encode as sapling address
        if (this.hasEncryptResponseToAddress()) {
            this.encryptResponseToAddress = new pbaas_1.SaplingPaymentAddress();
            reader.offset = this.encryptResponseToAddress.fromBuffer(reader.buffer, reader.offset);
        }
        // Read mandatory derivation number
        this.derivationNumber = reader.readVarInt();
        if (this.hasDerivationID()) {
            const derivationIDObj = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = derivationIDObj.fromBuffer(reader.buffer, reader.offset);
            this.derivationID = derivationIDObj;
        }
        if (this.hasRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        return reader.offset;
    }
    toJson() {
        var _a, _b;
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            encryptresponsetoaddress: this.encryptResponseToAddress.toAddressString(),
            derivationnumber: this.derivationNumber.toNumber(),
            derivationid: (_a = this.derivationID) === null || _a === void 0 ? void 0 : _a.toJson(),
            requestid: (_b = this.requestID) === null || _b === void 0 ? void 0 : _b.toJson()
        };
    }
    static fromJson(json) {
        const instance = new AppEncryptionRequestDetails();
        instance.version = new bn_js_1.BN(json.version);
        instance.flags = new bn_js_1.BN(json.flags);
        if (instance.hasEncryptResponseToAddress()) {
            instance.encryptResponseToAddress = pbaas_1.SaplingPaymentAddress.fromAddressString(json.encryptresponsetoaddress);
        }
        instance.derivationNumber = new bn_js_1.BN(json.derivationnumber);
        if (instance.hasDerivationID()) {
            instance.derivationID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json === null || json === void 0 ? void 0 : json.derivationid);
        }
        if (instance.hasRequestID()) {
            instance.requestID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json === null || json === void 0 ? void 0 : json.requestid);
        }
        return instance;
    }
}
exports.AppEncryptionRequestDetails = AppEncryptionRequestDetails;
AppEncryptionRequestDetails.VERSION_INVALID = new bn_js_1.BN(0);
AppEncryptionRequestDetails.FIRST_VERSION = new bn_js_1.BN(1);
AppEncryptionRequestDetails.LAST_VERSION = new bn_js_1.BN(1);
AppEncryptionRequestDetails.DEFAULT_VERSION = new bn_js_1.BN(1);
AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1);
AppEncryptionRequestDetails.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS = new bn_js_1.BN(2);
AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID = new bn_js_1.BN(4);
AppEncryptionRequestDetails.FLAG_RETURN_ESK = new bn_js_1.BN(8); //flag to signal to return the Extended Spending Key
