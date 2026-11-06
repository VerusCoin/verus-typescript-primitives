"use strict";
/**
 * Requests a derived Sapling address and channel keys for encrypted communication
 * and data sharing between a user and an app. Identity uploads are one use of
 * the channel, not a requirement.
 *
 * The enclosing GenericRequest must have a verified signature. Its optional
 * appOrDelegatorID defines the app scope; otherwise the signer defines the scope.
 * An explicit appOrDelegatorID requires a signer whose signing authority the user
 * fully controls, or an approved delegate once the delegate handshake is supported.
 * Delegate authorization is currently unsupported and must be rejected by clients.
 * Serialization and isValid() do not establish signature validity or authorization.
 *
 * First derive with fromId = the user's ID, toId = the authorized app scope, and
 * the wallet's key material. Without derivationID, return this address and keys.
 * With derivationID, derive again using the first result's extended spending key,
 * fromId = the same user's ID, and toId = derivationID. Return only the second
 * address and keys. derivationID can be any ID and never replaces the app scope
 * in the first derivation. Clients perform these operations with zGetEncryptionAddress.
 * The first call uses derivationNumber as its encryption index; the second uses
 * secondaryDerivationNumber, which defaults to zero when omitted.
 *
 * encryptResponseToAddress optionally protects the returned channel details;
 * it is distinct from the derived channel address. FLAG_RETURN_ESK requests the
 * final extended spending key, not an intermediate scope key. An intermediate
 * spending key is required internally for double derivation even without this flag.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEncryptionRequestDetails = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const CompactAddressObject_1 = require("../CompactAddressObject");
const varuint_1 = require("../../../utils/varuint");
const varint_1 = require("../../../utils/varint");
const pbaas_1 = require("../../../pbaas");
class AppEncryptionRequestDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        var _a;
        super();
        this.version = (data === null || data === void 0 ? void 0 : data.version) || AppEncryptionRequestDetails.DEFAULT_VERSION;
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0);
        this.encryptResponseToAddress = (data === null || data === void 0 ? void 0 : data.encryptResponseToAddress) || null;
        this.derivationNumber = (data === null || data === void 0 ? void 0 : data.derivationNumber) || new bn_js_1.BN(0);
        this.derivationID = data === null || data === void 0 ? void 0 : data.derivationID;
        this.secondaryDerivationNumber = (_a = data === null || data === void 0 ? void 0 : data.secondaryDerivationNumber) !== null && _a !== void 0 ? _a : new bn_js_1.BN(0);
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
        valid && (valid = this.secondaryDerivationNumber != null && this.secondaryDerivationNumber.gte(new bn_js_1.BN(0)));
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
        length += varint_1.default.encodingLength(this.derivationNumber);
        if (this.hasDerivationID()) {
            length += this.derivationID.getByteLength();
            length += varint_1.default.encodingLength(this.secondaryDerivationNumber);
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
            writer.writeVarInt(this.secondaryDerivationNumber);
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
            this.secondaryDerivationNumber = reader.readVarInt();
        }
        else {
            this.derivationID = undefined;
            this.secondaryDerivationNumber = new bn_js_1.BN(0);
        }
        if (this.hasRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        return reader.offset;
    }
    toJson() {
        var _a;
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            encryptresponsetoaddress: this.hasEncryptResponseToAddress() ? this.encryptResponseToAddress.toAddressString() : undefined,
            derivationnumber: this.derivationNumber.toNumber(),
            derivationid: this.hasDerivationID() ? this.derivationID.toJson() : undefined,
            secondaryderivationnumber: this.hasDerivationID() ? this.secondaryDerivationNumber.toNumber() : undefined,
            requestid: (_a = this.requestID) === null || _a === void 0 ? void 0 : _a.toJson()
        };
    }
    static fromJson(json) {
        var _a;
        const instance = new AppEncryptionRequestDetails();
        instance.version = new bn_js_1.BN(json.version);
        instance.flags = new bn_js_1.BN(json.flags);
        if (instance.hasEncryptResponseToAddress()) {
            instance.encryptResponseToAddress = pbaas_1.SaplingPaymentAddress.fromAddressString(json.encryptresponsetoaddress);
        }
        instance.derivationNumber = new bn_js_1.BN(json.derivationnumber);
        if (instance.hasDerivationID()) {
            instance.derivationID = CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json === null || json === void 0 ? void 0 : json.derivationid);
            instance.secondaryDerivationNumber = new bn_js_1.BN((_a = json.secondaryderivationnumber) !== null && _a !== void 0 ? _a : 0);
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
