"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXORef = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class UTXORef {
    constructor(data) {
        this.hash = data.hash || Buffer.alloc(0);
        this.n = data.n || new bn_js_1.BN(0);
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += 32; // hash uint256
        byteLength += 4; // n uint32
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeSlice(this.hash);
        bufferWriter.writeUInt32(this.n.toNumber());
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.hash = reader.readSlice(32);
        this.n = new bn_js_1.BN(reader.readUInt32());
        return reader.offset;
    }
    isValid() {
        return this.n.lt(new bn_js_1.BN(0xffffffff));
    }
    toJson() {
        return {
            hash: this.hash.toString('hex'),
            n: this.n.toNumber()
        };
    }
    static fromJson(data) {
        return new UTXORef({
            hash: Buffer.from(data.hash, 'hex'),
            n: new bn_js_1.BN(data.n, 10)
        });
    }
}
exports.UTXORef = UTXORef;
