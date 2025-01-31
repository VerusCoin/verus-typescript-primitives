"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialSignData = void 0;
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const IdentityID_1 = require("./IdentityID");
const SaplingPaymentAddress_1 = require("./SaplingPaymentAddress");
const varuint_1 = require("../utils/varuint");
const Hash160_1 = require("../vdxf/classes/Hash160");
const vdxf_1 = require("../constants/vdxf");
const PartialMMRData_1 = require("./PartialMMRData");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class PartialSignData {
    constructor(data) {
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0");
        this.createmmr = data && data.createmmr ? data.createmmr : false;
        if (data === null || data === void 0 ? void 0 : data.address) {
            this.toggleContainsAddress();
            this.address = data.address;
        }
        if (data === null || data === void 0 ? void 0 : data.prefixstring) {
            this.toggleContainsPrefixString();
            this.prefixstring = data.prefixstring;
        }
        if (data === null || data === void 0 ? void 0 : data.vdxfkeys) {
            this.toggleContainsVdxfKeys();
            this.vdxfkeys = data.vdxfkeys;
        }
        if (data === null || data === void 0 ? void 0 : data.vdxfkeynames) {
            this.toggleContainsVdxfKeyNames();
            this.vdxfkeynames = data.vdxfkeynames;
        }
        if (data === null || data === void 0 ? void 0 : data.boundhashes) {
            if (data === null || data === void 0 ? void 0 : data.hashtype) {
                this.hashtype = data.hashtype;
            }
            else
                this.hashtype = PartialSignData.DEFAULT_HASH_TYPE;
            this.toggleContainsBoundHashes();
            this.boundhashes = data.boundhashes;
        }
        if (data === null || data === void 0 ? void 0 : data.encrypttoaddress) {
            this.toggleContainsEncryptToAddress();
            this.encrypttoaddress = data.encrypttoaddress;
        }
        if (data === null || data === void 0 ? void 0 : data.signature) {
            this.toggleContainsCurrentSig();
            this.signature = data.signature;
        }
        if ((data === null || data === void 0 ? void 0 : data.datatype) && (data === null || data === void 0 ? void 0 : data.data)) {
            this.toggleContainsData();
            this.data = data.data;
            this.datatype = data.datatype;
        }
    }
    serializeData() {
        return !!(this.flags.and(PartialSignData.CONTAINS_DATA).toNumber());
    }
    serializeAddress() {
        return !!(this.flags.and(PartialSignData.CONTAINS_ADDRESS).toNumber());
    }
    serializeEncrypttoAddress() {
        return !!(this.flags.and(PartialSignData.CONTAINS_ENCRYPTTOADDRESS).toNumber());
    }
    serializeCurrentSig() {
        return !!(this.flags.and(PartialSignData.CONTAINS_CURRENTSIG).toNumber());
    }
    serializePrefixString() {
        return !!(this.flags.and(PartialSignData.CONTAINS_PREFIXSTRING).toNumber());
    }
    serializeVdxfKeys() {
        return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYS).toNumber());
    }
    serializeVdxfKeyNames() {
        return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYNAMES).toNumber());
    }
    serializeBoundhashes() {
        return !!(this.flags.and(PartialSignData.CONTAINS_BOUNDHASHES).toNumber());
    }
    toggleContainsData() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_DATA);
    }
    toggleContainsAddress() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_ADDRESS);
    }
    toggleContainsEncryptToAddress() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_ENCRYPTTOADDRESS);
    }
    toggleContainsCurrentSig() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_CURRENTSIG);
    }
    toggleContainsPrefixString() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_PREFIXSTRING);
    }
    toggleContainsVdxfKeys() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_VDXFKEYS);
    }
    toggleContainsVdxfKeyNames() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_VDXFKEYNAMES);
    }
    toggleContainsBoundHashes() {
        this.flags = this.flags.xor(PartialSignData.CONTAINS_BOUNDHASHES);
    }
    isMMRData() {
        return this.datatype && this.datatype.eq(PartialSignData.DATA_TYPE_MMRDATA);
    }
    getPartialSignDataByteLength() {
        function calculateVectorLength(items, getItemLength, varlength = true) {
            let totalLength = 0;
            totalLength += varuint_1.default.encodingLength(items.length);
            for (const item of items) {
                const itemLength = getItemLength(item);
                if (varlength)
                    totalLength += varuint_1.default.encodingLength(itemLength);
                totalLength += itemLength;
            }
            return totalLength;
        }
        let length = 0;
        length += varint_1.default.encodingLength(this.flags);
        if (this.serializeAddress())
            length += this.address.getByteLength();
        if (this.serializePrefixString()) {
            const prefixLen = this.prefixstring.length;
            length += varuint_1.default.encodingLength(prefixLen);
            length += prefixLen;
        }
        if (this.serializeVdxfKeys()) {
            length += calculateVectorLength(this.vdxfkeys, (vdxfkey) => vdxfkey.getByteLength(), false);
        }
        if (this.serializeVdxfKeyNames()) {
            length += calculateVectorLength(this.vdxfkeynames, (vdxfname) => vdxfname.length);
        }
        if (this.serializeBoundhashes()) {
            length += varint_1.default.encodingLength(this.hashtype);
            length += calculateVectorLength(this.boundhashes, (hash) => hash.length);
        }
        if (this.serializeEncrypttoAddress()) {
            length += this.encrypttoaddress.getByteLength();
        }
        length += 1; // Createmmr boolean value
        if (this.serializeData()) {
            length += varint_1.default.encodingLength(this.datatype);
            if (this.isMMRData()) {
                length += this.data.getByteLength();
            }
            else {
                const datalen = this.data.length;
                length += varuint_1.default.encodingLength(datalen);
                length += datalen;
            }
        }
        return length;
    }
    getByteLength() {
        return this.getPartialSignDataByteLength();
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.flags = reader.readVarInt();
        if (this.serializeAddress()) {
            const hash160 = new Hash160_1.Hash160SerEnt();
            hash160.fromBuffer(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH));
            if (hash160.version === vdxf_1.I_ADDR_VERSION) {
                this.address = hash160;
            }
            else if (hash160.version === vdxf_1.R_ADDR_VERSION) {
                this.address = hash160;
            }
            else
                throw new Error("Unrecognized address version");
        }
        if (this.serializePrefixString()) {
            this.prefixstring = reader.readVarSlice();
        }
        if (this.serializeVdxfKeys()) {
            const count = reader.readCompactSize();
            this.vdxfkeys = [];
            for (let i = 0; i < count; i++) {
                const varSlice = reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH);
                const idId = new IdentityID_1.IdentityID();
                idId.fromBuffer(varSlice);
                this.vdxfkeys.push(idId);
            }
        }
        if (this.serializeVdxfKeyNames()) {
            this.vdxfkeynames = reader.readVector();
        }
        if (this.serializeBoundhashes()) {
            this.hashtype = reader.readVarInt();
            this.boundhashes = reader.readVector();
        }
        if (this.serializeEncrypttoAddress()) {
            const saplingAddr = new SaplingPaymentAddress_1.SaplingPaymentAddress();
            reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);
            this.encrypttoaddress = saplingAddr;
        }
        this.createmmr = !!reader.readUInt8();
        if (this.serializeData()) {
            this.datatype = reader.readVarInt();
            if (this.isMMRData()) {
                const partialMMRData = new PartialMMRData_1.PartialMMRData();
                reader.offset = partialMMRData.fromBuffer(reader.buffer, reader.offset);
                this.data = partialMMRData;
            }
            else {
                this.data = reader.readVarSlice();
            }
        }
        return reader.offset;
    }
    toBuffer() {
        // Allocate the required size for partial sign data.
        // Make sure getPartialSignDataByteLength() accounts for all fields in your updated model.
        const writer = new BufferWriter(Buffer.alloc(this.getPartialSignDataByteLength()));
        // Serialize flags
        writer.writeVarInt(this.flags);
        // Address
        if (this.serializeAddress()) {
            if (!this.address) {
                throw new Error("Address is required but not provided");
            }
            writer.writeSlice(this.address.toBuffer());
        }
        // Prefix string
        if (this.serializePrefixString()) {
            if (!this.prefixstring) {
                throw new Error("Prefix string is required but not provided");
            }
            writer.writeVarSlice(this.prefixstring);
        }
        // VDXF keys
        if (this.serializeVdxfKeys()) {
            if (!this.vdxfkeys) {
                throw new Error("VDXF keys are required but not provided");
            }
            writer.writeCompactSize(this.vdxfkeys.length);
            for (const vdxfkey of this.vdxfkeys) {
                writer.writeSlice(vdxfkey.toBuffer());
            }
        }
        // VDXF key names
        if (this.serializeVdxfKeyNames()) {
            if (!this.vdxfkeynames) {
                throw new Error("VDXF key names are required but not provided");
            }
            writer.writeVector(this.vdxfkeynames);
        }
        // Bound hashes
        if (this.serializeBoundhashes()) {
            if (!this.boundhashes || !this.hashtype) {
                throw new Error("Bound hashes are required but not provided");
            }
            writer.writeVarInt(this.hashtype);
            writer.writeVector(this.boundhashes);
        }
        // Encrypt-to address (Sapling)
        if (this.serializeEncrypttoAddress()) {
            if (!this.encrypttoaddress || !(this.encrypttoaddress instanceof SaplingPaymentAddress_1.SaplingPaymentAddress)) {
                throw new Error("Sapling payment address is required but not provided");
            }
            writer.writeSlice(this.encrypttoaddress.toBuffer());
        }
        // createmmr (boolean)
        writer.writeUInt8(this.createmmr ? 1 : 0);
        // Data
        if (this.serializeData()) {
            if (!this.data || !this.datatype) {
                throw new Error("Data is required but not provided");
            }
            writer.writeVarInt(this.datatype);
            if (this.isMMRData()) {
                const mmrData = this.data;
                writer.writeSlice(mmrData.toBuffer());
            }
            else {
                writer.writeVarSlice(this.data);
            }
        }
        return writer.buffer;
    }
}
exports.PartialSignData = PartialSignData;
PartialSignData.CONTAINS_DATA = new bn_js_1.BN("1", 10);
PartialSignData.CONTAINS_ADDRESS = new bn_js_1.BN("2", 10);
PartialSignData.CONTAINS_ENCRYPTTOADDRESS = new bn_js_1.BN("4", 10);
PartialSignData.CONTAINS_CURRENTSIG = new bn_js_1.BN("8", 10);
PartialSignData.CONTAINS_PREFIXSTRING = new bn_js_1.BN("16", 10);
PartialSignData.CONTAINS_VDXFKEYS = new bn_js_1.BN("32", 10);
PartialSignData.CONTAINS_VDXFKEYNAMES = new bn_js_1.BN("64", 10);
PartialSignData.CONTAINS_BOUNDHASHES = new bn_js_1.BN("128", 10);
PartialSignData.DATA_TYPE_UNKNOWN = new bn_js_1.BN("0", 10);
PartialSignData.DATA_TYPE_MMRDATA = new bn_js_1.BN("1", 10);
PartialSignData.DATA_TYPE_FILENAME = new bn_js_1.BN("2", 10);
PartialSignData.DATA_TYPE_MESSAGE = new bn_js_1.BN("3", 10);
PartialSignData.DATA_TYPE_VDXFDATA = new bn_js_1.BN("4", 10);
PartialSignData.DATA_TYPE_MESSAGEHEX = new bn_js_1.BN("5", 10);
PartialSignData.DATA_TYPE_MESSAGEBASE64 = new bn_js_1.BN("6", 10);
PartialSignData.DATA_TYPE_DATAHASH = new bn_js_1.BN("7", 10);
PartialSignData.HASH_TYPE_SHA256 = new bn_js_1.BN("1", 10);
PartialSignData.HASH_TYPE_SHA256D = new bn_js_1.BN("2", 10);
PartialSignData.HASH_TYPE_BLAKE2B = new bn_js_1.BN("3", 10);
PartialSignData.HASH_TYPE_KECCAK256 = new bn_js_1.BN("4", 10);
PartialSignData.DEFAULT_HASH_TYPE = PartialSignData.HASH_TYPE_SHA256;
