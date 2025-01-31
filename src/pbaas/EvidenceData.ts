import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';

const { BufferReader, BufferWriter } = bufferutils

export interface EvidenceDataInChainObjectJson {
  vdxftype?: string;
  value: {hex: string, version: number};
}


export interface EvidenceDataJson {
  vdxftype?: string;
  hex: string;
}

export enum ETypes {
  TYPE_INVALID = 0,
  TYPE_FIRST_VALID = 1,
  TYPE_DATA = 1,                      // holding a transaction proof of export with finalization referencing finalization of root notarization
  TYPE_MULTIPART_DATA = 2,            // this is used to combine multiple outputs that can be used to reconstruct one evidence set
  TYPE_LAST_VALID = 2,
};

export class MultiPartDescriptor implements SerializableEntity {
  index: BigNumber
  totalLength: BigNumber;
  start: BigNumber;

  constructor(data?: { index, totalLength, start }) {
    this.index = data?.index || new BN(0, 10);
    this.totalLength = data?.totalLength || new BN(0, 10);
    this.start = data?.start || new BN(0, 10);
  }

  getByteLength() {
    let byteLength = 0;
    byteLength += varint.encodingLength(this.index);
    byteLength += varint.encodingLength(this.totalLength);
    byteLength += varint.encodingLength(this.start);
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))
    bufferWriter.writeVarInt(this.index);
    bufferWriter.writeVarInt(this.totalLength);
    bufferWriter.writeVarInt(this.start);
    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);
    this.index = reader.readVarInt();
    this.totalLength = reader.readVarInt();
    this.start = reader.readVarInt();
    return reader.offset;
  }
}

export class EvidenceData implements SerializableEntity {
  version: BigNumber;
  type: BigNumber;

  md: MultiPartDescriptor;            // if this is multipart, there is no VDXF descriptor
  vdxfd: string;

  dataVec: Buffer;

  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_CURRENT = new BN(1);
  static VERSION_LAST = new BN(1);

  constructor(data?: { version, type, md, vdxfd, dataVec }) {
    this.version = data?.version || new BN(1, 10);
    this.type = data?.type ||  new BN(ETypes.TYPE_DATA);                   // holding a transaction proof of export with finalization referencing finalization of root notarization
    this.md = data?.md;
    this.vdxfd = data?.vdxfd;
    this.dataVec = data?.dataVec || Buffer.alloc(0);
  }

  getByteLength() {
    let byteLength = 0;
    byteLength += varint.encodingLength(new BN(this.version));
    byteLength += varint.encodingLength(new BN(this.version));
    byteLength += varint.encodingLength(new BN(this.type));

    if (this.type.eq(new BN(ETypes.TYPE_MULTIPART_DATA))) {
      byteLength += this.md.getByteLength();
    } else {
      byteLength += 20;
    }
    byteLength += varuint.encodingLength(this.dataVec.length);
    byteLength += this.dataVec.length;

    return byteLength;
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarInt(this.type);

    if (this.type.eq(new BN(ETypes.TYPE_MULTIPART_DATA))) {
      bufferWriter.writeSlice(this.md.toBuffer());
    } else {
      bufferWriter.writeSlice(fromBase58Check(this.vdxfd).hash);
    }

    bufferWriter.writeVarSlice(this.dataVec);

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.version = reader.readVarInt();
    this.type = reader.readVarInt();

    if (this.type.eq(new BN(ETypes.TYPE_MULTIPART_DATA))) {
      this.md = new MultiPartDescriptor();
      reader.offset = this.md.fromBuffer(buffer, reader.offset);
    } else {
      this.vdxfd = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }
    this.dataVec = reader.readVarSlice();

    return reader.offset;
  }

  isValid(): boolean {
    return this.version.gte(EvidenceData.VERSION_FIRST) &&
      this.version.lte(EvidenceData.VERSION_LAST) &&
      this.type.gte(new BN(ETypes.TYPE_FIRST_VALID)) &&
      this.type.lte(new BN(ETypes.TYPE_LAST_VALID));
  }

  toJson() {

    return {
      version: this.version.toString(10),
      hex: this.toBuffer().toString('hex')
    }
  }

  static fromJson(data: EvidenceDataJson): EvidenceData {

    const newEvidenceData = new EvidenceData();
    newEvidenceData.fromBuffer(Buffer.from(data.hex, 'hex'));
    return newEvidenceData;
  }
}