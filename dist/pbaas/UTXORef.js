"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UTXORef = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class UTXORef extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.hash = (data === null || data === void 0 ? void 0 : data.hash) || Buffer.alloc(0);
        this.n = (data === null || data === void 0 ? void 0 : data.n) || new bn_js_1.BN(0);
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += vdxf_1.HASH256_BYTE_LENGTH; // hash uint256
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
            txid: Buffer.from(this.hash).reverse().toString('hex'),
            voutnum: this.n.toNumber()
        };
    }
    static fromJson(data) {
        return new UTXORef({
            hash: Buffer.from(data.txid, 'hex').reverse(),
            n: new bn_js_1.BN(data.voutnum, 10)
        });
    }
}
exports.UTXORef = UTXORef;
