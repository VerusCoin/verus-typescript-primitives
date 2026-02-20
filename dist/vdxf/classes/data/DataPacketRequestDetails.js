"use strict";
/**
 * DataPacketRequestDetails - Class for sending personal data to user or requesting the user
 * signature on personal data
 *
 * This class is used when an application is requesting to transfer or receive personal
 * user data. The request includes:
 * - Data objects as DataDescriptor instances containing the user's personal data
 * - Optional statements array for additional context or transfer conditions
 * - Optional signature data for verification of the transfer
 * - Flags indicating transfer direction and optional components
 *
 * The user's wallet can use these parameters to present the data transfer request
 * to the user, showing what personal data is being transferred, any associated
 * statements or conditions, and whether it's for the user's signature or being
 * transmitted to/from the user. This enables secure, user-controlled personal
 * data sharing with clear visibility into what data is being transferred.
 *

 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataPacketRequestDetails = void 0;
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const pbaas_1 = require("../../../pbaas");
const VerifiableSignatureData_1 = require("../VerifiableSignatureData");
const CompactAddressObject_1 = require("../CompactAddressObject");
class DataPacketRequestDetails {
    constructor(data) {
        this.version = (data === null || data === void 0 ? void 0 : data.version) || DataPacketRequestDetails.DEFAULT_VERSION;
        this.flags = (data === null || data === void 0 ? void 0 : data.flags) || new bn_js_1.BN(0);
        this.signableObjects = (data === null || data === void 0 ? void 0 : data.signableObjects) || [];
        this.statements = (data === null || data === void 0 ? void 0 : data.statements) || [];
        this.signature = (data === null || data === void 0 ? void 0 : data.signature) || undefined;
        this.requestID = data === null || data === void 0 ? void 0 : data.requestID;
        this.salt = data === null || data === void 0 ? void 0 : data.salt;
        this.setFlags();
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    calcFlags() {
        let flags = new bn_js_1.BN(this.flags);
        if (this.statements && this.statements.length > 0) {
            flags = flags.or(DataPacketRequestDetails.FLAG_HAS_STATEMENTS);
        }
        if (this.signature) {
            flags = flags.or(DataPacketRequestDetails.FLAG_HAS_SIGNATURE);
        }
        if (this.requestID) {
            flags = flags.or(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID);
        }
        if (this.salt) {
            flags = flags.or(DataPacketRequestDetails.FLAG_HAS_SALT);
        }
        return flags;
    }
    hasStatements() {
        return this.flags.and(DataPacketRequestDetails.FLAG_HAS_STATEMENTS).eq(DataPacketRequestDetails.FLAG_HAS_STATEMENTS);
    }
    hasSignature() {
        return this.flags.and(DataPacketRequestDetails.FLAG_HAS_SIGNATURE).eq(DataPacketRequestDetails.FLAG_HAS_SIGNATURE);
    }
    hasRequestID() {
        return this.flags.and(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID).eq(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID);
    }
    hasSalt() {
        return this.flags.and(DataPacketRequestDetails.FLAG_HAS_SALT).eq(DataPacketRequestDetails.FLAG_HAS_SALT);
    }
    isValid() {
        let valid = this.version.gte(DataPacketRequestDetails.FIRST_VERSION) &&
            this.version.lte(DataPacketRequestDetails.LAST_VERSION);
        // Check that we have signable objects
        valid && (valid = this.signableObjects.length > 0);
        if (this.hasStatements()) {
            valid && (valid = this.statements !== undefined && this.statements.length > 0);
        }
        if (this.hasSignature()) {
            valid && (valid = this.signature !== undefined); // TODO: && this.signature.isValid();
        }
        if (this.hasSalt()) {
            valid && (valid = this.salt !== undefined && Buffer.isBuffer(this.salt) && this.salt.length > 0);
        }
        return valid;
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        // Add length for signableObjects array
        length += varuint_1.default.encodingLength(this.signableObjects.length);
        for (const obj of this.signableObjects) {
            length += obj.getByteLength();
        }
        // Add signer length if present
        if (this.hasStatements()) {
            length += varuint_1.default.encodingLength(this.statements.length);
            for (const stmt of this.statements) {
                length += varuint_1.default.encodingLength(Buffer.byteLength(stmt, 'utf8'));
                length += Buffer.byteLength(stmt, 'utf8');
            }
        }
        if (this.hasSignature() && this.signature) {
            length += this.signature.getByteLength();
        }
        if (this.hasRequestID()) {
            length += this.requestID.getByteLength();
        }
        if (this.hasSalt() && this.salt) {
            length += varuint_1.default.encodingLength(this.salt.length);
            length += this.salt.length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        // Write signableObjects array
        writer.writeCompactSize(this.signableObjects.length);
        for (const obj of this.signableObjects) {
            writer.writeSlice(obj.toBuffer());
        }
        // Write statements if present    
        if (this.hasStatements()) {
            writer.writeCompactSize(this.statements.length);
            for (const stmt of this.statements) {
                writer.writeVarSlice(Buffer.from(stmt, 'utf8'));
            }
        }
        if (this.hasSignature() && this.signature) {
            writer.writeSlice(this.signature.toBuffer());
        }
        if (this.hasRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        if (this.hasSalt()) {
            writer.writeVarSlice(this.salt);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        // Read signableObjects array
        const objectCount = reader.readCompactSize();
        this.signableObjects = [];
        for (let i = 0; i < objectCount; i++) {
            const obj = new pbaas_1.DataDescriptor();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            this.signableObjects.push(obj);
        }
        // Read statements if flag is set
        if (this.hasStatements()) {
            this.statements = [];
            const statementCount = reader.readCompactSize();
            for (let i = 0; i < statementCount; i++) {
                const stmt = reader.readVarSlice().toString('utf8');
                this.statements.push(stmt);
            }
        }
        if (this.hasSignature()) {
            const signature = new VerifiableSignatureData_1.VerifiableSignatureData();
            reader.offset = signature.fromBuffer(reader.buffer, reader.offset);
            this.signature = signature;
        }
        if (this.hasRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        if (this.hasSalt()) {
            this.salt = reader.readVarSlice();
        }
        return reader.offset;
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            signableobjects: this.signableObjects.map(obj => obj.toJson()),
            statements: this.statements,
            signature: this.signature ? this.signature.toJson() : undefined,
            requestid: this.requestID ? this.requestID.toJson() : undefined,
            salt: this.salt ? this.salt.toString('hex') : undefined
        };
    }
    static fromJson(json) {
        const instance = new DataPacketRequestDetails();
        instance.version = new bn_js_1.BN(json.version);
        instance.flags = new bn_js_1.BN(json.flags);
        const dataDescriptorObjects = [];
        for (const objJson of json.signableobjects) {
            const dataDescriptor = pbaas_1.DataDescriptor.fromJson(objJson);
            dataDescriptorObjects.push(dataDescriptor);
        }
        instance.signableObjects = dataDescriptorObjects;
        instance.statements = json.statements || [];
        instance.signature = json.signature ? VerifiableSignatureData_1.VerifiableSignatureData.fromJson(json.signature) : undefined;
        instance.requestID = json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined;
        instance.salt = json.salt ? Buffer.from(json.salt, 'hex') : undefined;
        return instance;
    }
}
exports.DataPacketRequestDetails = DataPacketRequestDetails;
DataPacketRequestDetails.VERSION_INVALID = new bn_js_1.BN(0);
DataPacketRequestDetails.FIRST_VERSION = new bn_js_1.BN(1);
DataPacketRequestDetails.LAST_VERSION = new bn_js_1.BN(1);
DataPacketRequestDetails.DEFAULT_VERSION = new bn_js_1.BN(1);
// types of data to sign
DataPacketRequestDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1);
DataPacketRequestDetails.FLAG_HAS_STATEMENTS = new bn_js_1.BN(2);
DataPacketRequestDetails.FLAG_HAS_SIGNATURE = new bn_js_1.BN(4);
DataPacketRequestDetails.FLAG_FOR_USERS_SIGNATURE = new bn_js_1.BN(8);
DataPacketRequestDetails.FLAG_FOR_TRANSMITTAL_TO_USER = new bn_js_1.BN(16);
DataPacketRequestDetails.FLAG_HAS_URL_FOR_DOWNLOAD = new bn_js_1.BN(32);
DataPacketRequestDetails.FLAG_HAS_SALT = new bn_js_1.BN(64);
DataPacketRequestDetails.FLAG_STATEMENTS_ARE_DATA_DESCRIPTORS = new bn_js_1.BN(128);
