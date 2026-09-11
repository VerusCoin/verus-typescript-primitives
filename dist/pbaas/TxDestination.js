"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxDestination = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const IdentityID_1 = require("./IdentityID");
const KeyID_1 = require("./KeyID");
const NoDestination_1 = require("./NoDestination");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const PubKey_1 = require("./PubKey");
const UnknownID_1 = require("./UnknownID");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class TxDestination extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data = new NoDestination_1.NoDestination(), type) {
        super();
        this.data = data;
        if (!type) {
            this.type = TxDestination.getTxDestinationVariantType(data);
        }
        else
            this.type = type;
    }
    static getTxDestinationVariantType(variant) {
        if (variant instanceof PubKey_1.PubKey)
            return TxDestination.TYPE_PK;
        else if (variant instanceof KeyID_1.KeyID)
            return TxDestination.TYPE_PKH;
        else if (variant instanceof IdentityID_1.IdentityID)
            return TxDestination.TYPE_ID;
        else
            return TxDestination.TYPE_INVALID;
    }
    static getTxDestinationVariant(type) {
        if (type.eq(this.TYPE_PK))
            return PubKey_1.PubKey;
        else if (type.eq(this.TYPE_PKH))
            return KeyID_1.KeyID;
        else if (type.eq(this.TYPE_ID))
            return IdentityID_1.IdentityID;
        else
            return UnknownID_1.UnknownID;
    }
    toAddress() {
        if (this.data instanceof IdentityID_1.IdentityID || this.data instanceof KeyID_1.KeyID)
            return this.data.toAddress();
        else
            throw new Error("Can't get address for TxDestination type " + this.type.toNumber());
    }
    getByteLength() {
        if (this.type.eq(TxDestination.TYPE_PKH))
            return 21;
        else if (this.type.eq(TxDestination.TYPE_PK))
            return 34;
        else {
            const datalen = this.data.getByteLength() + 1;
            return varuint_1.default.encodingLength(datalen) + datalen;
        }
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        const destBytes = reader.readVarSlice();
        if (destBytes.length === 20) {
            this.type = TxDestination.TYPE_PKH;
            this.data = new KeyID_1.KeyID(destBytes);
        }
        else if (destBytes.length === 33) {
            this.type = TxDestination.TYPE_PK;
            this.data = new PubKey_1.PubKey(destBytes);
        }
        else {
            const subReader = new BufferReader(destBytes, 0);
            this.type = new bn_js_1.BN(subReader.readUInt8(), 10);
            const DestVariant = TxDestination.getTxDestinationVariant(this.type);
            this.data = new DestVariant(subReader.readSlice(destBytes.length - subReader.offset));
        }
        return reader.offset;
    }
    toBuffer() {
        const buffer = Buffer.alloc(this.getByteLength());
        const writer = new BufferWriter(buffer);
        if (this.type.eq(TxDestination.TYPE_PKH) || this.type.eq(TxDestination.TYPE_PK)) {
            writer.writeVarSlice(this.data.toBuffer());
        }
        else {
            const subWriter = new BufferWriter(Buffer.alloc(1 + this.data.getByteLength()));
            subWriter.writeUInt8(this.type.toNumber());
            subWriter.writeSlice(this.data.toBuffer());
            writer.writeVarSlice(subWriter.buffer);
        }
        return writer.buffer;
    }
    static fromChunk(chunk) {
        const writer = new BufferWriter(Buffer.alloc(varuint_1.default.encodingLength(chunk.length)));
        writer.writeCompactSize(chunk.length);
        const dest = new TxDestination();
        dest.fromBuffer(Buffer.concat([writer.buffer, chunk]));
        return dest;
    }
    toChunk() {
        return Buffer.from(this.toBuffer().subarray(varuint_1.default.encodingLength(this.data.toBuffer().length)));
    }
}
exports.TxDestination = TxDestination;
TxDestination.TYPE_INVALID = new bn_js_1.BN(0, 10);
TxDestination.TYPE_PK = new bn_js_1.BN(1, 10);
TxDestination.TYPE_PKH = new bn_js_1.BN(2, 10);
TxDestination.TYPE_SH = new bn_js_1.BN(3, 10);
TxDestination.TYPE_ID = new bn_js_1.BN(4, 10);
TxDestination.TYPE_INDEX = new bn_js_1.BN(5, 10);
TxDestination.TYPE_QUANTUM = new bn_js_1.BN(6, 10);
TxDestination.TYPE_LAST = new bn_js_1.BN(6, 10);
