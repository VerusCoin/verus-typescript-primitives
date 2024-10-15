"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MMRDescriptor = void 0;
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const DataDescriptor_1 = require("./DataDescriptor");
class MMRDescriptor {
    constructor(data) {
        if (data) {
            if (data.version)
                this.version = data.version;
            if (data.objectHashType)
                this.objectHashType = data.objectHashType;
            if (data.mmrHashType)
                this.mmrHashType = data.mmrHashType;
            if (data.mmrRoot)
                this.mmrRoot = data.mmrRoot;
            if (data.mmrHashes)
                this.mmrHashes = data.mmrHashes;
            if (data.dataDescriptors)
                this.dataDescriptors = data.dataDescriptors;
        }
        else {
            this.version = MMRDescriptor.DEFAULT_VERSION;
        }
    }
    static fromJson(data) {
        const newMMRDescriptor = new MMRDescriptor();
        if (data) {
            if (data.version)
                newMMRDescriptor.version = new bn_js_1.BN(data.version);
            if (data.objecthashtype)
                newMMRDescriptor.objectHashType = data.objecthashtype;
            if (data.mmrhashtype)
                newMMRDescriptor.mmrHashType = data.mmrhashtype;
            if (data.mmrroot)
                newMMRDescriptor.mmrRoot = DataDescriptor_1.DataDescriptor.fromJson(data.mmrroot);
            if (data.mmrhashes)
                newMMRDescriptor.mmrHashes = DataDescriptor_1.DataDescriptor.fromJson(data.mmrhashes);
            if (data.datadescriptors) {
                newMMRDescriptor.dataDescriptors = [];
                data.datadescriptors.forEach((data) => {
                    newMMRDescriptor.dataDescriptors.push(DataDescriptor_1.DataDescriptor.fromJson(data));
                });
            }
            ;
        }
        return newMMRDescriptor;
    }
    getByteLength() {
        let length = 0;
        length += varint_1.default.encodingLength(this.version);
        length += varint_1.default.encodingLength(new bn_js_1.BN(this.objectHashType));
        length += varint_1.default.encodingLength(new bn_js_1.BN(this.mmrHashType));
        length += this.mmrRoot.getByteLength();
        length += this.mmrHashes.getByteLength();
        length += varuint_1.default.encodingLength(this.dataDescriptors.length);
        this.dataDescriptors.forEach((dataDescriptor) => {
            length += dataDescriptor.getByteLength();
        });
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(new bn_js_1.BN(this.objectHashType));
        writer.writeVarInt(new bn_js_1.BN(this.mmrHashType));
        writer.writeSlice(this.mmrRoot.toBuffer());
        writer.writeSlice(this.mmrHashes.toBuffer());
        writer.writeCompactSize(this.dataDescriptors.length);
        this.dataDescriptors.forEach((dataDescriptor) => {
            writer.writeSlice(dataDescriptor.toBuffer());
        });
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = reader.readVarInt();
        this.objectHashType = reader.readVarInt().toNumber();
        this.mmrHashType = reader.readVarInt().toNumber();
        this.mmrRoot = new DataDescriptor_1.DataDescriptor();
        reader.offset = this.mmrRoot.fromBuffer(reader.buffer, reader.offset);
        this.mmrHashes = new DataDescriptor_1.DataDescriptor();
        reader.offset = this.mmrHashes.fromBuffer(reader.buffer, reader.offset);
        const dataDescriptorsLength = reader.readCompactSize();
        this.dataDescriptors = [];
        for (let i = 0; i < dataDescriptorsLength; i++) {
            const dataDescriptor = new DataDescriptor_1.DataDescriptor();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            this.dataDescriptors.push(dataDescriptor);
        }
        return reader.offset;
    }
    hasData() {
        return !!(this.mmrHashes.objectdata && this.dataDescriptors);
    }
    isValid() {
        return this.version >= MMRDescriptor.FIRST_VERSION && this.version <= MMRDescriptor.LAST_VERSION;
    }
    toJson() {
        const retval = {
            version: this.version.toNumber(),
            objecthashtype: this.objectHashType.valueOf(),
            mmrhashtype: this.mmrHashType,
            mmrroot: this.mmrRoot.toJson(),
            mmrhashes: this.mmrHashes.toJson(),
            datadescriptors: this.dataDescriptors.map((dataDescriptor) => dataDescriptor.toJson())
        };
        return retval;
    }
}
exports.MMRDescriptor = MMRDescriptor;
MMRDescriptor.VERSION_INVALID = new bn_js_1.BN(0);
MMRDescriptor.FIRST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.LAST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.DEFAULT_VERSION = new bn_js_1.BN(1);
;
