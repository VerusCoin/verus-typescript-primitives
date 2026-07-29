"use strict";
/**
 * InformationRequest - Class for handling application requests for specific user information/data
 *
 * This class is used when an application is requesting specific information or data from the user's
 * identity or data stores. The request includes:
 * - Search data keys (VDXF keys) to identify the specific data being requested
 * - Optional specific keys within the data object for partial data requests
 * - Signer information to identify wanted signer of the data
 * - Optional statement for boundhashes in the signature
 *
 * The user's wallet can use these parameters to locate the signed object information and present
 * it to the user for approval before sharing with the requesting application. This enables
 * selective disclosure of personal information while maintaining user privacy and control.
 *
 * Request type and data type are encoded as varuints (not flags):
 * - FULL_DATA vs PARTIAL_DATA vs COLLECTION: Whether complete objects, specific fields,
 *   or multiple objects are requested
 * - ATTESTATION/CLAIM/CREDENTIAL: Type of verification being requested
 *
 * Flags are reserved for optional fields only (signer, requested keys, request ID).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDataRequestDetails = void 0;
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const CompactAddressObject_1 = require("../CompactAddressObject");
const address_1 = require("../../../utils/address");
const vdxf_1 = require("../../../constants/vdxf");
const pbaas_1 = require("../../../constants/pbaas");
class UserDataRequestDetails {
    constructor(data) {
        this.version = (data === null || data === void 0 ? void 0 : data.version) || UserDataRequestDetails.DEFAULT_VERSION;
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0);
        this.dataType = (data === null || data === void 0 ? void 0 : data.dataType) || UserDataRequestDetails.FULL_DATA;
        this.requestType = (data === null || data === void 0 ? void 0 : data.requestType) || UserDataRequestDetails.ATTESTATION;
        this.searchDataKeyHashType = (data === null || data === void 0 ? void 0 : data.searchDataKeyHashType) || pbaas_1.DEFAULT_HASH_TYPE;
        this.searchDataKey = (data === null || data === void 0 ? void 0 : data.searchDataKey) || [];
        this.signer = data === null || data === void 0 ? void 0 : data.signer;
        this.requestedKeys = data === null || data === void 0 ? void 0 : data.requestedKeys;
        this.requestID = data === null || data === void 0 ? void 0 : data.requestID;
        this.setFlags();
    }
    calcFlags() {
        let flags = new bn_js_1.BN(this.flags);
        if (this.requestedKeys && this.requestedKeys.length > 0) {
            flags = flags.or(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS);
        }
        if (this.signer) {
            flags = flags.or(UserDataRequestDetails.FLAG_HAS_SIGNER);
        }
        if (this.requestID) {
            flags = flags.or(UserDataRequestDetails.FLAG_HAS_REQUEST_ID);
        }
        return flags;
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    hasSigner() {
        return this.flags.and(UserDataRequestDetails.FLAG_HAS_SIGNER).eq(UserDataRequestDetails.FLAG_HAS_SIGNER);
    }
    hasRequestedKeys() {
        return this.flags.and(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS).eq(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS);
    }
    hasRequestID() {
        return this.flags.and(UserDataRequestDetails.FLAG_HAS_REQUEST_ID).eq(UserDataRequestDetails.FLAG_HAS_REQUEST_ID);
    }
    /**
     * Checks if dataType is one of the supported values (FULL_DATA, PARTIAL_DATA, COLLECTION)
     * @returns True if dataType is valid
     */
    hasDataTypeSet() {
        return this.dataType.eq(UserDataRequestDetails.FULL_DATA) ||
            this.dataType.eq(UserDataRequestDetails.PARTIAL_DATA) ||
            this.dataType.eq(UserDataRequestDetails.COLLECTION);
    }
    /**
     * Checks if requestType is one of the supported values (ATTESTATION, CLAIM, CREDENTIAL)
     * @returns True if requestType is valid
     */
    hasRequestTypeSet() {
        return this.requestType.eq(UserDataRequestDetails.ATTESTATION) ||
            this.requestType.eq(UserDataRequestDetails.CLAIM) ||
            this.requestType.eq(UserDataRequestDetails.CREDENTIAL);
    }
    hasSearchDataKeyHashTypeSet() {
        return this.searchDataKeyHashType.eq(pbaas_1.HASH_TYPE_BLAKE2B) ||
            this.searchDataKeyHashType.eq(pbaas_1.HASH_TYPE_BLAKE2BMMR2) ||
            this.searchDataKeyHashType.eq(pbaas_1.HASH_TYPE_KECCAK256) ||
            this.searchDataKeyHashType.eq(pbaas_1.HASH_TYPE_SHA256D) ||
            this.searchDataKeyHashType.eq(pbaas_1.HASH_TYPE_SHA256);
    }
    isValid() {
        let valid = this.version.gte(UserDataRequestDetails.FIRST_VERSION) && this.version.lte(UserDataRequestDetails.LAST_VERSION);
        // Check that exactly one data type flag is set
        valid && (valid = this.hasDataTypeSet());
        // Check that exactly one request type flag is set
        valid && (valid = this.hasRequestTypeSet());
        // Check that searchDataKeyHashType is one of the supported hash types
        valid && (valid = this.hasSearchDataKeyHashTypeSet());
        // Check that searchDataKey is present
        valid && (valid = Object.keys(this.searchDataKey).length > 0);
        return valid;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        length += varuint_1.default.encodingLength(this.dataType.toNumber());
        length += varuint_1.default.encodingLength(this.requestType.toNumber());
        length += varuint_1.default.encodingLength(this.searchDataKeyHashType.toNumber());
        length += varuint_1.default.encodingLength(this.searchDataKey.length);
        for (const item of this.searchDataKey) {
            const key = Object.keys(item)[0];
            const value = item[key];
            length += vdxf_1.HASH160_BYTE_LENGTH;
            length += varuint_1.default.encodingLength(value.length);
            length += value.length;
        }
        if (this.hasSigner()) {
            length += this.signer.getByteLength();
        }
        if (this.hasRequestedKeys()) {
            length += varuint_1.default.encodingLength(this.requestedKeys ? this.requestedKeys.length : 0);
            if (this.requestedKeys) {
                for (const key of this.requestedKeys) {
                    length += vdxf_1.HASH160_BYTE_LENGTH;
                }
            }
        }
        if (this.hasRequestID()) {
            length += this.requestID.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        writer.writeCompactSize(this.dataType.toNumber());
        writer.writeCompactSize(this.requestType.toNumber());
        writer.writeCompactSize(this.searchDataKeyHashType.toNumber());
        writer.writeCompactSize(this.searchDataKey.length);
        for (const item of this.searchDataKey) {
            const key = Object.keys(item)[0];
            const value = item[key];
            writer.writeSlice((0, address_1.fromBase58Check)(key).hash); // 20-byte VDXF key
            writer.writeVarSlice(value);
        }
        if (this.hasSigner()) {
            writer.writeSlice(this.signer.toBuffer());
        }
        if (this.hasRequestedKeys()) {
            writer.writeCompactSize(this.requestedKeys.length);
            for (const key of this.requestedKeys) {
                writer.writeSlice((0, address_1.fromBase58Check)(key).hash); // 20-byte VDXF key
            }
        }
        if (this.hasRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        this.dataType = new bn_js_1.BN(reader.readCompactSize());
        this.requestType = new bn_js_1.BN(reader.readCompactSize());
        this.searchDataKeyHashType = new bn_js_1.BN(reader.readCompactSize());
        const searchDataKeyLength = reader.readCompactSize();
        this.searchDataKey = [];
        for (let i = 0; i < searchDataKeyLength; i++) {
            const keyHash = reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH); // 20-byte VDXF key
            const value = reader.readVarSlice();
            const key = (0, address_1.toBase58Check)(keyHash, vdxf_1.I_ADDR_VERSION);
            this.searchDataKey.push({ [key]: value });
        }
        if (this.hasSigner()) {
            const signer = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = signer.fromBuffer(reader.buffer, reader.offset);
            this.signer = signer;
        }
        if (this.hasRequestedKeys()) {
            const requestedKeysLength = reader.readCompactSize();
            this.requestedKeys = [];
            for (let i = 0; i < requestedKeysLength; i++) {
                const keyHash = reader.readSlice(20); // 20-byte VDXF key
                const key = (0, address_1.toBase58Check)(keyHash, vdxf_1.I_ADDR_VERSION);
                this.requestedKeys.push(key);
            }
        }
        if (this.hasRequestID()) {
            const requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = requestID.fromBuffer(reader.buffer, reader.offset);
            this.requestID = requestID;
        }
        return reader.offset;
    }
    toJson() {
        var _a, _b;
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            datatype: this.dataType.toNumber(),
            requesttype: this.requestType.toNumber(),
            searchdatakeyhashtype: this.searchDataKeyHashType.toNumber(),
            searchdatakey: this.searchDataKey,
            signer: (_a = this.signer) === null || _a === void 0 ? void 0 : _a.toJson(),
            requestedkeys: this.requestedKeys,
            requestid: (_b = this.requestID) === null || _b === void 0 ? void 0 : _b.toJson(),
        };
    }
    static fromJson(json) {
        const requestData = new UserDataRequestDetails();
        requestData.version = new bn_js_1.BN(json.version);
        requestData.flags = new bn_js_1.BN(json.flags);
        requestData.dataType = new bn_js_1.BN(json.datatype);
        requestData.requestType = new bn_js_1.BN(json.requesttype);
        requestData.searchDataKeyHashType = json.searchdatakeyhashtype == null ? pbaas_1.DEFAULT_HASH_TYPE : new bn_js_1.BN(json.searchdatakeyhashtype);
        requestData.searchDataKey = json.searchdatakey;
        requestData.signer = json.signer ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.signer) : undefined;
        requestData.requestedKeys = json.requestedkeys;
        requestData.requestID = json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined;
        return requestData;
    }
}
exports.UserDataRequestDetails = UserDataRequestDetails;
UserDataRequestDetails.VERSION_INVALID = new bn_js_1.BN(0);
UserDataRequestDetails.FIRST_VERSION = new bn_js_1.BN(1);
UserDataRequestDetails.LAST_VERSION = new bn_js_1.BN(1);
UserDataRequestDetails.DEFAULT_VERSION = new bn_js_1.BN(1);
UserDataRequestDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1);
UserDataRequestDetails.FLAG_HAS_SIGNER = new bn_js_1.BN(2);
UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS = new bn_js_1.BN(4);
// Data type values (varuints, not flags)
UserDataRequestDetails.FULL_DATA = new bn_js_1.BN(1);
UserDataRequestDetails.PARTIAL_DATA = new bn_js_1.BN(2);
UserDataRequestDetails.COLLECTION = new bn_js_1.BN(3);
// Request type values (varuints, not flags)
UserDataRequestDetails.ATTESTATION = new bn_js_1.BN(1);
UserDataRequestDetails.CLAIM = new bn_js_1.BN(2);
UserDataRequestDetails.CREDENTIAL = new bn_js_1.BN(3);
