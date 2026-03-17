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
            const d = data;
            if ('min_sigs' in d || 'primary_addresses' in d) {
                throw new Error("Principal: snake_case property names are no longer supported. Use 'minSigs' instead of 'min_sigs', 'primaryAddresses' instead of 'primary_addresses'.");
            }
            if (data.flags != null)
                this.flags = data.flags;
            if (data.version != null)
                this.version = data.version;
            if (data.minSigs != null)
                this.minSigs = data.minSigs;
            if (data.primaryAddresses)
                this.primaryAddresses = data.primaryAddresses;
        }
    }
    /** @deprecated Use minSigs instead */
    get min_sigs() { return this.minSigs; }
    /** @deprecated Use primaryAddresses instead */
    get primary_addresses() { return this.primaryAddresses; }
    containsFlags() {
        return true;
    }
    containsVersion() {
        return true;
    }
    containsPrimaryAddresses() {
        return true;
    }
    containsMinSigs() {
        return true;
    }
    getSelfByteLength() {
        let byteLength = 0;
        if (this.containsVersion())
            byteLength += 4; //uint32 version size
        if (this.containsFlags())
            byteLength += 4; //uint32 flags size
        if (this.containsPrimaryAddresses()) {
            byteLength += varuint_1.default.encodingLength(this.primaryAddresses.length);
            for (const addr of this.primaryAddresses) {
                byteLength += varuint_1.default.encodingLength(addr.getByteLength());
                byteLength += addr.getByteLength();
            }
        }
        if (this.containsMinSigs()) {
            byteLength += 4; //uint32 minimum signatures size
        }
        return byteLength;
    }
    getByteLength() {
        return this.getSelfByteLength();
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()));
        if (this.containsVersion())
            writer.writeUInt32(this.version.toNumber());
        if (this.containsFlags())
            writer.writeUInt32(this.flags.toNumber());
        if (this.containsPrimaryAddresses())
            writer.writeVector(this.primaryAddresses.map(x => x.toBuffer()));
        if (this.containsMinSigs())
            writer.writeUInt32(this.minSigs.toNumber());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        if (this.containsVersion())
            this.version = new bn_js_1.BN(reader.readUInt32(), 10);
        if (this.containsFlags())
            this.flags = new bn_js_1.BN(reader.readUInt32(), 10);
        if (this.containsPrimaryAddresses()) {
            this.primaryAddresses = reader.readVector().map(x => {
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
        if (this.containsMinSigs())
            this.minSigs = new bn_js_1.BN(reader.readUInt32(), 10);
        return reader.offset;
    }
}
exports.Principal = Principal;
