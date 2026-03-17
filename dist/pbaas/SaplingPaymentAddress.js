"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaplingPaymentAddress = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const sapling_1 = require("../utils/sapling");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class SaplingPaymentAddress {
    constructor(data) {
        if (data != null) {
            if ('pk_d' in data) {
                throw new Error("SaplingPaymentAddress: snake_case property names are no longer supported. Use 'pkD' instead of 'pk_d'.");
            }
            if (data.d != null)
                this.d = data.d;
            if (data.pkD != null)
                this.pkD = data.pkD;
        }
    }
    /** @deprecated Use pkD instead */
    get pk_d() { return this.pkD; }
    getByteLength() {
        let length = 0;
        length += this.d.length;
        length += this.pkD.length;
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeSlice(this.d);
        writer.writeSlice(this.pkD);
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.d = reader.readSlice(11);
        this.pkD = reader.readSlice(32);
        return reader.offset;
    }
    static fromAddressString(address) {
        const { d, pk_d } = (0, sapling_1.decodeSaplingAddress)(address);
        return new SaplingPaymentAddress({ d, pkD: pk_d });
    }
    toAddressString() {
        return (0, sapling_1.encodeSaplingAddress)({ d: this.d, pk_d: this.pkD });
    }
}
exports.SaplingPaymentAddress = SaplingPaymentAddress;
