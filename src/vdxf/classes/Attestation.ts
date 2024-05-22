import bufferutils from '../../utils/bufferutils'
import { toBase58Check, fromBase58Check } from '../../utils/address';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { DataDescriptor } from './DataDescriptor';
import { ATTESTATION_VIEW_REQUEST, ATTESTATION_PROVISION_TYPE } from '../';
import varuint from '../../utils/varuint';
import { BufferDataVdxfObject } from '../index';
const { BufferReader, BufferWriter } = bufferutils;

export interface AttestationRequestInterface {
  attestationId: string,
  accepted_attestors: Array<string>,
  attestation_keys: Array<string>,
  attestor_filters?: Array<string>}

export class Attestation extends BufferDataVdxfObject {

  setAttestationViewRequestData(attestationId: string, accepted_attestors: Array<string>, attestation_keys: Array<string>, attestor_filters: Array<string>) {
    
    this.vdxfkey = ATTESTATION_VIEW_REQUEST.vdxfid;

    let length = 20; // attestationId
    length += varuint.encodingLength(accepted_attestors.length);
    length += accepted_attestors.length * 20; // accepted_attestors
    length += varuint.encodingLength(attestation_keys.length);
    length += attestation_keys.length * 20; // attestation_keys
    length += varuint.encodingLength(attestor_filters.length);
    length += attestor_filters.length * 20; // attestor_filters

    let writer = new BufferWriter(Buffer.alloc(length));

    writer.writeSlice(fromBase58Check(attestationId).hash);

    writer.writeCompactSize(accepted_attestors.length);

    for (let i = 0; i < accepted_attestors.length; i++) {
      writer.writeSlice(fromBase58Check(accepted_attestors[i]).hash);
    }

    writer.writeCompactSize(attestation_keys.length);

    for (let i = 0; i < attestation_keys.length; i++) {
      writer.writeSlice(fromBase58Check(attestation_keys[i]).hash);
    }

    writer.writeCompactSize(attestor_filters.length);

    for (let i = 0; i < attestor_filters.length; i++) {
      writer.writeSlice(fromBase58Check(attestor_filters[i]).hash);
    }    
  }

  getAttestationViewRequestData(): AttestationRequestInterface {

    if (this.vdxfkey != ATTESTATION_VIEW_REQUEST.vdxfid) {
      throw new Error("Invalid attestation request type");
    }

    let retVal: AttestationRequestInterface = {
      attestationId: "",
      accepted_attestors: [],
      attestation_keys: [],
      attestor_filters: []
    };

    const reader = new BufferReader(Buffer.from(this.data, 'hex'), 0);

    retVal.attestationId = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

    let attestorCount = reader.readCompactSize();

    for (let i = 0; i < attestorCount; i++) {
      retVal.accepted_attestors.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestationKeyCount = reader.readCompactSize();

    for (let i = 0; i < attestationKeyCount; i++) {
      retVal.attestation_keys.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestorFilterCount = reader.readCompactSize();

    for (let i = 0; i < attestorFilterCount; i++) {
      retVal.attestor_filters.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    return retVal;

  }

  getAttestationProvisioningData() {

    if (this.vdxfkey != ATTESTATION_PROVISION_TYPE.vdxfid) {
      throw new Error("Invalid attestation request type");
    }

    const reader = new BufferReader(Buffer.from(this.data, 'hex'), 0);

    let dataDescriptorItemsCount = reader.readCompactSize();

    let dataDescriptors = [];

    for (let i = 0; i < dataDescriptorItemsCount; i++) {
      let dataDescriptor = new DataDescriptor();
      reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
      dataDescriptors.push(dataDescriptor);
    }

    return dataDescriptors;
  }

}