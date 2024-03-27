"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hash160 = void 0;
const vdxf_1 = require("../../constants/vdxf");
const address_1 = require("../../utils/address");
const bufferutils_1 = require("../../utils/bufferutils");
const varuint_1 = require("../../utils/varuint");
class Hash160 {
    constructor(hash = Buffer.alloc(0), version = vdxf_1.I_ADDR_VERSION, varlength = false) {
        this.hash = hash;
        this.version = version;
        this.varlength = varlength;
    }
    static getEmpty() {
        return new Hash160(Buffer.alloc(0), 0, true);
    }
    static fromAddress(address, varlength = false) {
        const base58 = (0, address_1.fromBase58Check)(address);
        return new Hash160(base58.hash, base58.version, varlength);
    }
    toAddress() {
        if (this.hash.length == 0) {
            return null;
        }
        else
            return (0, address_1.toBase58Check)(this.hash, this.version);
    }
    byteLength() {
        let length = 0;
        if (this.varlength) {
            length += varuint_1.default.encodingLength(this.hash.length);
            length += this.hash.length;
        }
        else {
            length += this.hash.length;
        }
        return length;
    }
    toBuffer() {
        const buffer = Buffer.alloc(this.byteLength());
        const writer = new bufferutils_1.default.BufferWriter(buffer);
        if (this.varlength) {
            writer.writeVarSlice(this.hash);
        }
        else {
            writer.writeSlice(this.hash);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, varlength = false, offset = 0) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        if (varlength) {
            this.hash = reader.readVarSlice();
        }
        else {
            this.hash = reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH);
        }
        this.version = vdxf_1.I_ADDR_VERSION;
        this.varlength = varlength;
        return reader.offset;
    }
    toJson() {
        return {
            hash: this.hash,
            version: this.version,
        };
    }
}
exports.Hash160 = Hash160;
