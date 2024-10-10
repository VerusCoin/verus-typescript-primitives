"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttestationProvisioningData = exports.AttestationViewRequest = exports.Attestation = void 0;
const bufferutils_1 = require("../../utils/bufferutils");
const address_1 = require("../../utils/address");
const vdxf_1 = require("../../constants/vdxf");
const DataDescriptor_1 = require("../../pbaas/DataDescriptor");
const __1 = require("../");
const varuint_1 = require("../../utils/varuint");
const index_1 = require("../index");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Attestation extends index_1.BufferDataVdxfObject {
    getAttestationData() {
        const reader = new BufferReader(Buffer.from(this.data, 'hex'));
        const returnedData = {};
        while (reader.buffer.length > reader.offset) {
            let vdxfkey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            switch (vdxfkey) {
                case __1.ATTESTATION_VIEW_REQUEST.vdxfid:
                    returnedData[vdxfkey] = new AttestationViewRequest();
                    reader.offset = returnedData[vdxfkey].fromBuffer(reader.buffer, reader.offset);
                    break;
                case __1.ATTESTATION_PROVISION_TYPE.vdxfid:
                    let dataDescriptorItemsCount = reader.readCompactSize();
                    let dataDescriptors = [];
                    for (let i = 0; i < dataDescriptorItemsCount; i++) {
                        let dataDescriptor = new DataDescriptor_1.DataDescriptor();
                        reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
                        dataDescriptors.push(dataDescriptor);
                    }
                    returnedData[vdxfkey] = dataDescriptors;
                    break;
                default:
                    throw new Error("Unsupported Attestation Data Type");
            }
        }
        return returnedData;
    }
}
exports.Attestation = Attestation;
class AttestationViewRequest {
    constructor(data) {
        this.attestation_id = data.attestation_id || "";
        this.accepted_attestors = data.accepted_attestors || [];
        this.attestation_keys = data.attestation_keys || [];
        this.attestor_filters = data.attestor_filters || [];
    }
    getByteLength() {
        let length = 0; // attestation_id
        length += varuint_1.default.encodingLength(this.accepted_attestors.length);
        length += this.accepted_attestors.length * 20; // accepted_attestors
        length += varuint_1.default.encodingLength(this.attestation_keys.length);
        length += this.attestation_keys.length * 20; // attestation_keys
        length += varuint_1.default.encodingLength(this.attestor_filters.length);
        length += this.attestor_filters.length * 20; // attestor_filters
        return length;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestation_id).hash);
        bufferWriter.writeCompactSize(this.accepted_attestors.length);
        for (let i = 0; i < this.accepted_attestors.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.accepted_attestors[i]).hash);
        }
        bufferWriter.writeCompactSize(this.attestation_keys.length);
        for (let i = 0; i < this.attestation_keys.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestation_keys[i]).hash);
        }
        bufferWriter.writeCompactSize(this.attestor_filters.length);
        for (let i = 0; i < this.attestor_filters.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestor_filters[i]).hash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.attestation_id = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        let attestorCount = reader.readCompactSize();
        for (let i = 0; i < attestorCount; i++) {
            this.accepted_attestors.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestationKeyCount = reader.readCompactSize();
        for (let i = 0; i < attestationKeyCount; i++) {
            this.attestation_keys.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestorFilterCount = reader.readCompactSize();
        for (let i = 0; i < attestorFilterCount; i++) {
            this.attestor_filters.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        return reader.offset;
    }
}
exports.AttestationViewRequest = AttestationViewRequest;
class AttestationProvisioningData {
    constructor(data) {
        this.attestation_id = data.attestation_id || "";
        this.accepted_attestors = data.accepted_attestors || [];
        this.attestation_keys = data.attestation_keys || [];
        this.attestor_filters = data.attestor_filters || [];
    }
    getByteLength() {
        let length = 0; // attestation_id
        length += varuint_1.default.encodingLength(this.accepted_attestors.length);
        length += this.accepted_attestors.length * 20; // accepted_attestors
        length += varuint_1.default.encodingLength(this.attestation_keys.length);
        length += this.attestation_keys.length * 20; // attestation_keys
        length += varuint_1.default.encodingLength(this.attestor_filters.length);
        length += this.attestor_filters.length * 20; // attestor_filters
        return length;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestation_id).hash);
        bufferWriter.writeCompactSize(this.accepted_attestors.length);
        for (let i = 0; i < this.accepted_attestors.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.accepted_attestors[i]).hash);
        }
        bufferWriter.writeCompactSize(this.attestation_keys.length);
        for (let i = 0; i < this.attestation_keys.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestation_keys[i]).hash);
        }
        bufferWriter.writeCompactSize(this.attestor_filters.length);
        for (let i = 0; i < this.attestor_filters.length; i++) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.attestor_filters[i]).hash);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.attestation_id = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        let attestorCount = reader.readCompactSize();
        for (let i = 0; i < attestorCount; i++) {
            this.accepted_attestors.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestationKeyCount = reader.readCompactSize();
        for (let i = 0; i < attestationKeyCount; i++) {
            this.attestation_keys.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestorFilterCount = reader.readCompactSize();
        for (let i = 0; i < attestorFilterCount; i++) {
            this.attestor_filters.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        return reader.offset;
    }
}
exports.AttestationProvisioningData = AttestationProvisioningData;
