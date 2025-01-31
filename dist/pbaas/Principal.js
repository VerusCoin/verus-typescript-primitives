"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Principal = exports.PRINCIPAL_VERSION_CURRENT = exports.PRINCIPAL_VERSION_INVALID = exports.PRINCIPAL_DEFAULT_FLAGS = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../utils/varuint");
const KeyID_1 = require("./KeyID");
const NoDestination_1 = require("./NoDestination");
exports.PRINCIPAL_DEFAULT_FLAGS = new bn_js_1.BN(0, 10);
exports.PRINCIPAL_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.PRINCIPAL_VERSION_CURRENT = new bn_js_1.BN(1, 10);
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Principal {
    constructor(data) {
        this.flags = exports.PRINCIPAL_DEFAULT_FLAGS;
        this.version = exports.PRINCIPAL_VERSION_INVALID;
        if (data != null) {
            if (data.flags != null)
                this.flags = data.flags;
            if (data.version != null)
                this.version = data.version;
            if (data.min_sigs != null)
                this.min_sigs = data.min_sigs;
            if (data.primary_addresses)
                this.primary_addresses = data.primary_addresses;
        }
    }
    serializeFlags() {
        return true;
    }
    serializeVersion() {
        return true;
    }
    serializePrimaryAddresses() {
        return true;
    }
    serializeMinSigs() {
        return true;
    }
    getSelfByteLength() {
        let byteLength = 0;
        if (this.serializeVersion())
            byteLength += 4; //uint32 version size
        if (this.serializeFlags())
            byteLength += 4; //uint32 flags size
        if (this.serializePrimaryAddresses()) {
            byteLength += varuint_1.default.encodingLength(this.primary_addresses.length);
            for (const addr of this.primary_addresses) {
                byteLength += varuint_1.default.encodingLength(addr.getByteLength());
                byteLength += addr.getByteLength();
            }
        }
        if (this.serializeMinSigs()) {
            byteLength += 4; //uint32 minimum signatures size
        }
        return byteLength;
    }
    getByteLength() {
        return this.getSelfByteLength();
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()));
        if (this.serializeVersion())
            writer.writeUInt32(this.version.toNumber());
        if (this.serializeFlags())
            writer.writeUInt32(this.flags.toNumber());
        if (this.serializePrimaryAddresses())
            writer.writeVector(this.primary_addresses.map(x => x.toBuffer()));
        if (this.serializeMinSigs())
            writer.writeUInt32(this.min_sigs.toNumber());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        if (this.serializeVersion())
            this.version = new bn_js_1.BN(reader.readUInt32(), 10);
        if (this.serializeFlags())
            this.flags = new bn_js_1.BN(reader.readUInt32(), 10);
        if (this.serializePrimaryAddresses()) {
            this.primary_addresses = reader.readVector().map(x => {
                if (x.length === 20) {
                    return new KeyID_1.KeyID(x);
                }
                else if (x.length === 33) {
                    //TODO: Implement pubkey principal by adding PubKey class as possible TxDestination
                    throw new Error("Pubkey Principal not yet supported");
                }
                else {
                    return new NoDestination_1.NoDestination();
                }
            });
        }
        if (this.serializeMinSigs())
            this.min_sigs = new bn_js_1.BN(reader.readUInt32(), 10);
        return reader.offset;
    }
}
exports.Principal = Principal;
