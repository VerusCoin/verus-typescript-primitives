"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attestation = void 0;
const bufferutils_1 = require("../../utils/bufferutils");
const address_1 = require("../../utils/address");
const vdxf_1 = require("../../constants/vdxf");
const DataDescriptor_1 = require("./DataDescriptor");
const __1 = require("../");
const varuint_1 = require("../../utils/varuint");
const index_1 = require("../index");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Attestation extends index_1.BufferDataVdxfObject {
    setAttestationViewRequestData(attestationId, accepted_attestors, attestation_keys, attestor_filters) {
        this.vdxfkey = __1.ATTESTATION_VIEW_REQUEST.vdxfid;
        let length = 20; // attestationId
        length += varuint_1.default.encodingLength(accepted_attestors.length);
        length += accepted_attestors.length * 20; // accepted_attestors
        length += varuint_1.default.encodingLength(attestation_keys.length);
        length += attestation_keys.length * 20; // attestation_keys
        length += varuint_1.default.encodingLength(attestor_filters.length);
        length += attestor_filters.length * 20; // attestor_filters
        let writer = new BufferWriter(Buffer.alloc(length));
        writer.writeSlice((0, address_1.fromBase58Check)(attestationId).hash);
        writer.writeCompactSize(accepted_attestors.length);
        for (let i = 0; i < accepted_attestors.length; i++) {
            writer.writeSlice((0, address_1.fromBase58Check)(accepted_attestors[i]).hash);
        }
        writer.writeCompactSize(attestation_keys.length);
        for (let i = 0; i < attestation_keys.length; i++) {
            writer.writeSlice((0, address_1.fromBase58Check)(attestation_keys[i]).hash);
        }
        writer.writeCompactSize(attestor_filters.length);
        for (let i = 0; i < attestor_filters.length; i++) {
            writer.writeSlice((0, address_1.fromBase58Check)(attestor_filters[i]).hash);
        }
    }
    getAttestationViewRequestData() {
        if (this.vdxfkey != __1.ATTESTATION_VIEW_REQUEST.vdxfid) {
            throw new Error("Invalid attestation request type");
        }
        let retVal = {
            attestationId: "",
            accepted_attestors: [],
            attestation_keys: [],
            attestor_filters: []
        };
        const reader = new BufferReader(Buffer.from(this.data, 'hex'), 0);
        retVal.attestationId = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        let attestorCount = reader.readCompactSize();
        for (let i = 0; i < attestorCount; i++) {
            retVal.accepted_attestors.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestationKeyCount = reader.readCompactSize();
        for (let i = 0; i < attestationKeyCount; i++) {
            retVal.attestation_keys.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        let attestorFilterCount = reader.readCompactSize();
        for (let i = 0; i < attestorFilterCount; i++) {
            retVal.attestor_filters.push((0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION));
        }
        return retVal;
    }
    getAttestationProvisioningData() {
        if (this.vdxfkey != __1.ATTESTATION_PROVISION_TYPE.vdxfid) {
            throw new Error("Invalid attestation request type");
        }
        const reader = new BufferReader(Buffer.from(this.data, 'hex'), 0);
        let dataDescriptorItemsCount = reader.readCompactSize();
        let dataDescriptors = [];
        for (let i = 0; i < dataDescriptorItemsCount; i++) {
            let dataDescriptor = new DataDescriptor_1.DataDescriptor();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            dataDescriptors.push(dataDescriptor);
        }
        return dataDescriptors;
    }
}
exports.Attestation = Attestation;
