"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MMRDescriptor = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varint_1 = require("../utils/varint");
const varuint_1 = require("../utils/varuint");
const bufferutils_1 = require("../utils/bufferutils");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const DataDescriptor_1 = require("./DataDescriptor");
const DataDescriptor_2 = require("./DataDescriptor");
const descriptorValidation_1 = require("./descriptorValidation");
class MMRDescriptor extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.version = new bn_js_1.BN(MMRDescriptor.DEFAULT_VERSION);
        this.objectHashType = DataDescriptor_2.EHashTypes.HASH_SHA256;
        this.mmrHashType = DataDescriptor_2.EHashTypes.HASH_BLAKE2BMMR;
        this.mmrRoot = new DataDescriptor_1.DataDescriptor();
        this.mmrHashes = new DataDescriptor_1.DataDescriptor();
        this.dataDescriptors = [];
        if (data) {
            if (data.version != null)
                this.version = (0, descriptorValidation_1.descriptorInteger)(data.version, 32, 'Version');
            if (data.objectHashType != null)
                this.objectHashType = (0, descriptorValidation_1.descriptorInteger)(data.objectHashType, 31, 'Object hash type').toNumber();
            if (data.mmrHashType != null)
                this.mmrHashType = (0, descriptorValidation_1.descriptorInteger)(data.mmrHashType, 31, 'MMR hash type').toNumber();
            if (data.mmrRoot)
                this.mmrRoot = data.mmrRoot;
            if (data.mmrHashes)
                this.mmrHashes = data.mmrHashes;
            if (data.dataDescriptors)
                this.dataDescriptors = data.dataDescriptors;
        }
    }
    /** Daemon JSON uses zero for absent numeric fields and invalid nested descriptors. */
    static fromJson(data = {}) {
        var _a, _b, _c, _d;
        const source = data !== null && data !== void 0 ? data : {};
        return new MMRDescriptor({
            version: (0, descriptorValidation_1.descriptorInteger)((_a = source.version) !== null && _a !== void 0 ? _a : 0, 32, 'Version'),
            objectHashType: (0, descriptorValidation_1.descriptorInteger)((_b = source.objecthashtype) !== null && _b !== void 0 ? _b : 0, 31, 'Object hash type').toNumber(),
            mmrHashType: (0, descriptorValidation_1.descriptorInteger)((_c = source.mmrhashtype) !== null && _c !== void 0 ? _c : 0, 31, 'MMR hash type').toNumber(),
            mmrRoot: DataDescriptor_1.DataDescriptor.fromJson(source.mmrroot),
            mmrHashes: DataDescriptor_1.DataDescriptor.fromJson(source.mmrhashes),
            dataDescriptors: ((_d = source.datadescriptors) !== null && _d !== void 0 ? _d : []).map((value) => DataDescriptor_1.DataDescriptor.fromJson(value)),
        });
    }
    /** Explicit alias for the canonical daemon JSON representation. */
    static fromDaemonJson(data = {}) {
        return MMRDescriptor.fromJson(data);
    }
    validateIntegers() {
        (0, descriptorValidation_1.descriptorInteger)(this.version, 32, 'Version');
        (0, descriptorValidation_1.descriptorInteger)(this.objectHashType, 31, 'Object hash type');
        (0, descriptorValidation_1.descriptorInteger)(this.mmrHashType, 31, 'MMR hash type');
    }
    getByteLength() {
        this.validateIntegers();
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
        this.version = reader.readVarInt(32);
        this.objectHashType = reader.readVarInt(31).toNumber();
        this.mmrHashType = reader.readVarInt(31).toNumber();
        this.mmrRoot = new DataDescriptor_1.DataDescriptor();
        reader.offset = this.mmrRoot.fromBuffer(reader.buffer, reader.offset);
        this.mmrHashes = new DataDescriptor_1.DataDescriptor();
        reader.offset = this.mmrHashes.fromBuffer(reader.buffer, reader.offset);
        const dataDescriptorsLength = reader.readCompactSize();
        // Even an empty descriptor needs version, flags and an object-data length.
        if (dataDescriptorsLength >
            Math.floor((reader.buffer.length - reader.offset) / 3)) {
            throw new Error('Truncated MMR data descriptors');
        }
        this.dataDescriptors = [];
        for (let i = 0; i < dataDescriptorsLength; i++) {
            const dataDescriptor = new DataDescriptor_1.DataDescriptor();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            this.dataDescriptors.push(dataDescriptor);
        }
        return reader.offset;
    }
    hasData() {
        return (this.mmrHashes.objectdata.length > 0 && this.dataDescriptors.length > 0);
    }
    isValid() {
        return (this.version.gte(MMRDescriptor.FIRST_VERSION) &&
            this.version.lte(MMRDescriptor.LAST_VERSION));
    }
    toJson() {
        this.validateIntegers();
        return {
            version: this.version.toNumber(),
            objecthashtype: this.objectHashType,
            mmrhashtype: this.mmrHashType,
            mmrroot: this.mmrRoot.toJson(),
            mmrhashes: this.mmrHashes.toJson(),
            datadescriptors: this.dataDescriptors.map((value) => value.toJson()),
        };
    }
    /** Explicit alias for the canonical daemon JSON representation. */
    toDaemonJson() {
        return this.toJson();
    }
}
exports.MMRDescriptor = MMRDescriptor;
MMRDescriptor.VERSION_INVALID = new bn_js_1.BN(0);
MMRDescriptor.FIRST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.LAST_VERSION = new bn_js_1.BN(1);
MMRDescriptor.DEFAULT_VERSION = new bn_js_1.BN(1);
