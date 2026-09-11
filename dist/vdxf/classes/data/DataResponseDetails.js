"use strict";
/**
 * DataResponseDetails - Class for providing structured responses to various request types
 *
 * This class serves as a universal response mechanism that can be used to reply to multiple
 * types of requests. It packages response data within a DataDescriptor along with metadata
 * for request tracking and timestamping.
 *
 * USAGE AS RESPONSE TO DIFFERENT REQUEST TYPES:
 *
 * 1. AppEncryptionRequestDetails Response:
 *    - The DataDescriptor 'data' field contains the encrypted derived seed
 *    - The requestID references the original AppEncryptionRequestDetails.requestID
 *    - Enables secure delivery of application-specific encrypted keys
 *
 * 2. UserDataRequestDetails Response:
 *    - The DataDescriptor 'data' field contains requested user data/attestations
 *    - The requestID references the original UserDataRequestDetails.requestID
 *    - Allows selective disclosure of personal information
 *
 * 3. DataPacketRequestDetails Response:
 *    - The DataDescriptor 'data' field contains the response data or signed content
 *    - The requestID references the original DataPacketRequestDetails.requestID
 *    - Supports bidirectional data exchange with signatures and statements
 *
 * REQUEST-RESPONSE CORRELATION:
 * Each of the above request types includes its own requestID field. This response object's
 * requestID field can be used to match responses back to their originating requests, enabling
 * proper request-response correlation in asynchronous communication flows.
 *
 * GENERAL DATA REPLIES:
 * This response format can also be used for other general data replies where:
 * - Structured data needs to be transmitted via DataDescriptor
 * - Request tracking through requestID is desired
 * - Timestamp metadata (createdAt) is needed for the response
 * - Response validation and integrity checking via SHA-256 is required
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataResponseDetails = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varint_1 = require("../../../utils/varint");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const pbaas_1 = require("../../../pbaas");
const createHash = require("create-hash");
const CompactAddressObject_1 = require("../CompactAddressObject");
class DataResponseDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(initialData) {
        super();
        this.flags = initialData && initialData.flags ? initialData.flags : new bn_js_1.BN("0", 10);
        if (initialData === null || initialData === void 0 ? void 0 : initialData.requestID) {
            if (!this.containsRequestID())
                this.toggleContainsRequestID();
            this.requestID = initialData === null || initialData === void 0 ? void 0 : initialData.requestID;
        }
        this.data = initialData && initialData.data ? initialData.data : new pbaas_1.DataDescriptor();
    }
    containsRequestID() {
        return !!(this.flags.and(DataResponseDetails.FLAG_HAS_REQUEST_ID).toNumber());
    }
    toggleContainsRequestID() {
        this.flags = this.flags.xor(DataResponseDetails.FLAG_HAS_REQUEST_ID);
    }
    toSha256() {
        return createHash("sha256").update(this.toBuffer()).digest();
    }
    getByteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.flags);
        if (this.containsRequestID()) {
            length += this.requestID.getByteLength();
        }
        length += this.data.getByteLength();
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.flags);
        if (this.containsRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        writer.writeSlice(this.data.toBuffer());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = reader.readVarInt();
        if (this.containsRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        this.data = new pbaas_1.DataDescriptor();
        this.data.fromBuffer(reader.buffer, reader.offset);
        reader.offset += this.data.getByteLength();
        return reader.offset;
    }
    toJson() {
        return {
            flags: this.flags.toNumber(),
            requestid: this.containsRequestID() ? this.requestID.toJson() : undefined,
            data: this.data.toJson()
        };
    }
    static fromJson(json) {
        return new DataResponseDetails({
            flags: new bn_js_1.BN(json.flags, 10),
            requestID: json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined,
            data: pbaas_1.DataDescriptor.fromJson(json.data)
        });
    }
}
exports.DataResponseDetails = DataResponseDetails;
DataResponseDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1, 10);
