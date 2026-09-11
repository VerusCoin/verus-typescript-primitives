"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaplingExtendedSpendingKey = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
const sapling_1 = require("../utils/sapling");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class SaplingExtendedSpendingKey extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        super();
        if (data != null) {
            this.depth = (_a = data.depth) !== null && _a !== void 0 ? _a : 0;
            this.parentFVKTag = (_b = data.parentFVKTag) !== null && _b !== void 0 ? _b : Buffer.alloc(4);
            this.childIndex = (_c = data.childIndex) !== null && _c !== void 0 ? _c : Buffer.alloc(4);
            this.chainCode = (_d = data.chainCode) !== null && _d !== void 0 ? _d : Buffer.alloc(32);
            this.ask = (_e = data.ask) !== null && _e !== void 0 ? _e : Buffer.alloc(32);
            this.nsk = (_f = data.nsk) !== null && _f !== void 0 ? _f : Buffer.alloc(32);
            this.ovk = (_g = data.ovk) !== null && _g !== void 0 ? _g : Buffer.alloc(32);
            this.dk = (_h = data.dk) !== null && _h !== void 0 ? _h : Buffer.alloc(32);
        }
    }
    getByteLength() {
        return 1 + 4 + 4 + 32 + 32 + 32 + 32 + 32; // 169 bytes total
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeUInt8(this.depth);
        writer.writeSlice(this.parentFVKTag);
        writer.writeSlice(this.childIndex);
        writer.writeSlice(this.chainCode);
        writer.writeSlice(this.ask);
        writer.writeSlice(this.nsk);
        writer.writeSlice(this.ovk);
        writer.writeSlice(this.dk);
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.depth = reader.readUInt8();
        this.parentFVKTag = reader.readSlice(4);
        this.childIndex = reader.readSlice(4);
        this.chainCode = reader.readSlice(32);
        this.ask = reader.readSlice(32);
        this.nsk = reader.readSlice(32);
        this.ovk = reader.readSlice(32);
        this.dk = reader.readSlice(32);
        return reader.offset;
    }
    static fromKeyString(key) {
        const decoded = (0, sapling_1.decodeSaplingExtendedSpendingKey)(key);
        return new SaplingExtendedSpendingKey(decoded);
    }
    toKeyString(testnet = false) {
        return (0, sapling_1.encodeSaplingExtendedSpendingKey)({
            depth: this.depth,
            parentFVKTag: this.parentFVKTag,
            childIndex: this.childIndex,
            chainCode: this.chainCode,
            ask: this.ask,
            nsk: this.nsk,
            ovk: this.ovk,
            dk: this.dk
        }, testnet);
    }
}
exports.SaplingExtendedSpendingKey = SaplingExtendedSpendingKey;
