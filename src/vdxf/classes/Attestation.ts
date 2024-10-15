import bufferutils from '../../utils/bufferutils'
import { toBase58Check, fromBase58Check } from '../../utils/address';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { ATTESTATION_VIEW_REQUEST, ATTESTATION_PROVISION_TYPE } from '../';
import varuint from '../../utils/varuint';
import { BufferDataVdxfObject } from '../index';
import { Serializable } from 'child_process';
import { SerializableEntity } from '../../utils/types/SerializableEntity';
const { BufferReader, BufferWriter } = bufferutils;

export class Attestation extends BufferDataVdxfObject {

  getAttestationData(): { [key: string]: AttestationViewRequest } {

    const reader = new BufferReader(Buffer.from(this.data, 'hex'));

    const returnedData = {};

    while (reader.buffer.length > reader.offset) {

      let vdxfkey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

      switch (vdxfkey) {
        case ATTESTATION_VIEW_REQUEST.vdxfid:
          returnedData[vdxfkey] = new AttestationViewRequest();
          reader.offset = returnedData[vdxfkey].fromBuffer(reader.buffer, reader.offset);
          break;
        case ATTESTATION_PROVISION_TYPE.vdxfid:

          let dataDescriptorItemsCount = reader.readCompactSize();

          let dataDescriptors = [];

          for (let i = 0; i < dataDescriptorItemsCount; i++) {
            let dataDescriptor = new DataDescriptor();
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

export class AttestationViewRequest implements SerializableEntity {
  attestation_id: string;
  accepted_attestors: Array<string>;
  attestation_keys: Array<string>;
  attestor_filters: Array<string>;

  constructor(data?: { attestation_id?: string, accepted_attestors?: Array<string>, attestation_keys?: Array<string>, attestor_filters?: Array<string> }) {
    this.attestation_id = data.attestation_id || "";
    this.accepted_attestors = data.accepted_attestors || [];
    this.attestation_keys = data.attestation_keys || [];
    this.attestor_filters = data.attestor_filters || [];
  }

  getByteLength() {

    let length = 0; // attestation_id
    length += varuint.encodingLength(this.accepted_attestors.length);
    length += this.accepted_attestors.length * 20; // accepted_attestors
    length += varuint.encodingLength(this.attestation_keys.length);
    length += this.attestation_keys.length * 20; // attestation_keys
    length += varuint.encodingLength(this.attestor_filters.length);
    length += this.attestor_filters.length * 20; // attestor_filters

    return length
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeSlice(fromBase58Check(this.attestation_id).hash);

    bufferWriter.writeCompactSize(this.accepted_attestors.length);

    for (let i = 0; i < this.accepted_attestors.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.accepted_attestors[i]).hash);
    }

    bufferWriter.writeCompactSize(this.attestation_keys.length);

    for (let i = 0; i < this.attestation_keys.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.attestation_keys[i]).hash);
    }

    bufferWriter.writeCompactSize(this.attestor_filters.length);

    for (let i = 0; i < this.attestor_filters.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.attestor_filters[i]).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);


    this.attestation_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

    let attestorCount = reader.readCompactSize();

    for (let i = 0; i < attestorCount; i++) {
      this.accepted_attestors.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestationKeyCount = reader.readCompactSize();

    for (let i = 0; i < attestationKeyCount; i++) {
      this.attestation_keys.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestorFilterCount = reader.readCompactSize();

    for (let i = 0; i < attestorFilterCount; i++) {
      this.attestor_filters.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    return reader.offset;
  }

}

export class AttestationProvisioningData implements SerializableEntity {
  attestation_id: string;
  accepted_attestors: Array<string>;
  attestation_keys: Array<string>;
  attestor_filters: Array<string>;

  constructor(data?: { attestation_id?: string, accepted_attestors?: Array<string>, attestation_keys?: Array<string>, attestor_filters?: Array<string> }) {
    this.attestation_id = data.attestation_id || "";
    this.accepted_attestors = data.accepted_attestors || [];
    this.attestation_keys = data.attestation_keys || [];
    this.attestor_filters = data.attestor_filters || [];
  }

  getByteLength() {

    let length = 0; // attestation_id
    length += varuint.encodingLength(this.accepted_attestors.length);
    length += this.accepted_attestors.length * 20; // accepted_attestors
    length += varuint.encodingLength(this.attestation_keys.length);
    length += this.attestation_keys.length * 20; // attestation_keys
    length += varuint.encodingLength(this.attestor_filters.length);
    length += this.attestor_filters.length * 20; // attestor_filters

    return length
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeSlice(fromBase58Check(this.attestation_id).hash);

    bufferWriter.writeCompactSize(this.accepted_attestors.length);

    for (let i = 0; i < this.accepted_attestors.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.accepted_attestors[i]).hash);
    }

    bufferWriter.writeCompactSize(this.attestation_keys.length);

    for (let i = 0; i < this.attestation_keys.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.attestation_keys[i]).hash);
    }

    bufferWriter.writeCompactSize(this.attestor_filters.length);

    for (let i = 0; i < this.attestor_filters.length; i++) {
      bufferWriter.writeSlice(fromBase58Check(this.attestor_filters[i]).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);


    this.attestation_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

    let attestorCount = reader.readCompactSize();

    for (let i = 0; i < attestorCount; i++) {
      this.accepted_attestors.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestationKeyCount = reader.readCompactSize();

    for (let i = 0; i < attestationKeyCount; i++) {
      this.attestation_keys.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    let attestorFilterCount = reader.readCompactSize();

    for (let i = 0; i < attestorFilterCount; i++) {
      this.attestor_filters.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    return reader.offset;
  }

}