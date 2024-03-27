"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Principal = exports.VERSION_CURRENT = exports.VERSION_INVALID = void 0;
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const bn_js_1 = require("bn.js");
exports.VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.VERSION_CURRENT = new bn_js_1.BN(1, 10);
const { BufferReader, BufferWriter } = bufferutils_1.default;
class TxDestination {
    constructor(data = null) {
        if (data != null) {
            for (const tempAddr of data.primaryaddresses) {
                let tempDecoded;
                try {
                    let tempRaddress = (0, address_1.fromBase58Check)(tempAddr);
                    tempDecoded = tempRaddress.hash;
                    if (tempDecoded.length != 20 || tempRaddress.version != vdxf_1.R_ADDR_VERSION)
                        throw new Error("R address Error");
                }
                catch (e) {
                    if (e.message === "R address Error")
                        throw new Error(e.message);
                    tempDecoded = Buffer.from(tempAddr, 'hex');
                    if (tempDecoded.length != 33)
                        throw new Error("Incorrect hex length of pub key");
                }
                this.primary_addresses = new Array;
                this.primary_addresses.push(tempDecoded);
            }
        }
    }
    getAddressString() {
        let retval = [];
        for (const addr of this.primary_addresses)
            if (addr.length == 20) {
                retval.push((0, address_1.toBase58Check)(addr, vdxf_1.R_ADDR_VERSION));
            }
            else if (addr.length == 33) {
                retval.push(addr.toString('hex'));
            }
            else {
                retval.push("");
            }
    }
    txgetByteLength() {
        let byteLength = 0;
        byteLength += varuint_1.default.encodingLength(this.primary_addresses.length);
        for (const txDest of this.primary_addresses) {
            byteLength += varuint_1.default.encodingLength(txDest.length);
            byteLength += txDest.length;
        }
        return byteLength;
    }
    txtoBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.txgetByteLength()));
        bufferWriter.writeVector(this.primary_addresses);
        return bufferWriter.buffer;
    }
    txfromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        let count;
        count = reader.readVarInt().toNumber();
        this.primary_addresses = new Array;
        for (let i = 0; i < count; i++) {
            this.primary_addresses.push(reader.readVarSlice());
        }
        return reader.offset;
    }
}
class Principal extends TxDestination {
    constructor(data) {
        super(data);
        this.flags = exports.VERSION_INVALID;
        this.version = exports.VERSION_INVALID;
        if (data != null) {
            if (data.flags != null)
                this.flags = new bn_js_1.BN(data.flags);
            if (data.version != null)
                this.version = new bn_js_1.BN(data.version);
            if (data.minimumsignatures != null)
                this.min_sigs = new bn_js_1.BN(data.minimumsignatures);
        }
    }
    _dataByteLength() {
        let byteLength = 0;
        byteLength += 4; //uint32 version size
        byteLength += 4; //uint32 flags size
        byteLength += this.txgetByteLength();
        byteLength += 4; //uint32 minimum signatures size
        return byteLength;
    }
    _toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this._dataByteLength()));
        bufferWriter.writeUInt32(this.version.toNumber());
        bufferWriter.writeUInt32(this.flags.toNumber());
        bufferWriter.writeSlice(this.txtoBuffer());
        bufferWriter.writeUInt32(this.min_sigs.toNumber());
        return bufferWriter.buffer;
    }
    _fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readUInt32(), 10);
        this.flags = new bn_js_1.BN(reader.readUInt32(), 10);
        reader.offset = this.txfromBuffer(reader.buffer, reader.offset);
        this.min_sigs = new bn_js_1.BN(reader.readUInt32(), 10);
        return reader.offset;
    }
}
exports.Principal = Principal;
