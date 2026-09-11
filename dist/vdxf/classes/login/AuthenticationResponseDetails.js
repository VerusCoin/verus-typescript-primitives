"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationResponseDetails = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const varint_1 = require("../../../utils/varint");
const bufferutils_1 = require("../../../utils/bufferutils");
const createHash = require("create-hash");
const bn_js_1 = require("bn.js");
const CompactAddressObject_1 = require("../CompactAddressObject");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class AuthenticationResponseDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0", 10);
        this.requestID = (data === null || data === void 0 ? void 0 : data.requestID) || null;
        this.setFlags();
    }
    hasRequestID() {
        return this.flags.and(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID).eq(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID);
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    calcFlags(flags = this.flags) {
        if (this.requestID) {
            flags = flags.or(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID);
        }
        return flags;
    }
    toSha256() {
        return createHash("sha256").update(this.toBuffer()).digest();
    }
    getByteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.flags);
        if (this.hasRequestID()) {
            length += this.requestID.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.flags);
        if (this.hasRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = reader.readVarInt();
        if (this.hasRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        return reader.offset;
    }
    toJson() {
        return {
            flags: this.flags.toString(10),
            requestid: this.hasRequestID() ? this.requestID.toJson() : undefined
        };
    }
    static fromJson(json) {
        return new AuthenticationResponseDetails({
            flags: new bn_js_1.BN(json.flags, 10),
            requestID: json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined
        });
    }
}
exports.AuthenticationResponseDetails = AuthenticationResponseDetails;
AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1, 10);
