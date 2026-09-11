"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppEncryptionResponseDetails = void 0;
const SerializableEntityBase_1 = require("../../../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varint_1 = require("../../../utils/varint");
const bufferutils_1 = require("../../../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const pbaas_1 = require("../../../pbaas");
const createHash = require("create-hash");
const SaplingExtendedSpendingKey_1 = require("../../../pbaas/SaplingExtendedSpendingKey");
const SaplingExtendedViewingKey_1 = require("../../../pbaas/SaplingExtendedViewingKey");
const CompactAddressObject_1 = require("../CompactAddressObject");
class AppEncryptionResponseDetails extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        var _a, _b, _c, _d, _e;
        super();
        this.version = (_a = data === null || data === void 0 ? void 0 : data.version) !== null && _a !== void 0 ? _a : new bn_js_1.BN(1);
        this.flags = (_b = data === null || data === void 0 ? void 0 : data.flags) !== null && _b !== void 0 ? _b : new bn_js_1.BN(0, 10);
        this.incomingViewingKey = (_c = data === null || data === void 0 ? void 0 : data.incomingViewingKey) !== null && _c !== void 0 ? _c : Buffer.alloc(32);
        this.extendedViewingKey = (_d = data === null || data === void 0 ? void 0 : data.extendedViewingKey) !== null && _d !== void 0 ? _d : new SaplingExtendedViewingKey_1.SaplingExtendedViewingKey();
        this.address = (_e = data === null || data === void 0 ? void 0 : data.address) !== null && _e !== void 0 ? _e : new pbaas_1.SaplingPaymentAddress();
        if (data === null || data === void 0 ? void 0 : data.requestID) {
            if (!this.containsRequestID())
                this.toggleContainsRequestID();
            this.requestID = data.requestID;
        }
        if (data === null || data === void 0 ? void 0 : data.extendedSpendingKey) {
            if (!this.containsExtendedSpendingKey())
                this.toggleContainsExtendedSpendingKey();
            this.extendedSpendingKey = data.extendedSpendingKey;
        }
    }
    containsRequestID() {
        return !!(this.flags.and(AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID).toNumber());
    }
    toggleContainsRequestID() {
        this.flags = this.flags.xor(AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID);
    }
    containsExtendedSpendingKey() {
        return !!(this.flags.and(AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY).toNumber());
    }
    toggleContainsExtendedSpendingKey() {
        this.flags = this.flags.xor(AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY);
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
        length += 32; // incomingViewingKey
        length += this.extendedViewingKey.getByteLength();
        length += this.address.getByteLength();
        if (this.containsExtendedSpendingKey()) {
            length += this.extendedSpendingKey.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.flags);
        if (this.containsRequestID()) {
            writer.writeSlice(this.requestID.toBuffer());
        }
        writer.writeSlice(this.incomingViewingKey);
        writer.writeSlice(this.extendedViewingKey.toBuffer());
        writer.writeSlice(this.address.toBuffer());
        if (this.containsExtendedSpendingKey()) {
            writer.writeSlice(this.extendedSpendingKey.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.flags = reader.readVarInt();
        if (this.containsRequestID()) {
            this.requestID = new CompactAddressObject_1.CompactIAddressObject({ type: CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
            reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
        }
        this.incomingViewingKey = reader.readSlice(32);
        this.extendedViewingKey = new SaplingExtendedViewingKey_1.SaplingExtendedViewingKey();
        reader.offset = this.extendedViewingKey.fromBuffer(reader.buffer, reader.offset);
        this.address = new pbaas_1.SaplingPaymentAddress();
        reader.offset = this.address.fromBuffer(reader.buffer, reader.offset);
        if (this.containsExtendedSpendingKey()) {
            this.extendedSpendingKey = new SaplingExtendedSpendingKey_1.SaplingExtendedSpendingKey();
            reader.offset = this.extendedSpendingKey.fromBuffer(reader.buffer, reader.offset);
        }
        return reader.offset;
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            requestid: this.containsRequestID() ? this.requestID.toJson() : undefined,
            incomingviewingkey: this.incomingViewingKey.toString('hex'),
            extendedviewingkey: this.extendedViewingKey.toKeyString(),
            address: this.address.toAddressString(),
            extendedspendingkey: this.containsExtendedSpendingKey() ? this.extendedSpendingKey.toKeyString() : undefined
        };
    }
    static fromJson(json) {
        var _a;
        return new AppEncryptionResponseDetails({
            version: new bn_js_1.BN(json.version, 10),
            flags: new bn_js_1.BN((_a = json.flags) !== null && _a !== void 0 ? _a : 0, 10),
            requestID: json.requestid ? CompactAddressObject_1.CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined,
            incomingViewingKey: Buffer.from(json.incomingviewingkey, 'hex'),
            extendedViewingKey: SaplingExtendedViewingKey_1.SaplingExtendedViewingKey.fromKeyString(json.extendedviewingkey),
            address: pbaas_1.SaplingPaymentAddress.fromAddressString(json.address),
            extendedSpendingKey: json.extendedspendingkey ? SaplingExtendedSpendingKey_1.SaplingExtendedSpendingKey.fromKeyString(json.extendedspendingkey) : undefined
        });
    }
}
exports.AppEncryptionResponseDetails = AppEncryptionResponseDetails;
AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID = new bn_js_1.BN(1, 10);
AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY = new bn_js_1.BN(2, 10);
