import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import bufferutils from '../utils/bufferutils';
import varuint from '../utils/varuint';

const { BufferReader, BufferWriter } = bufferutils;

export type PartialMMRDataUnit = { type: BigNumber, data: Buffer };

export type PartialMMRDataInitData = {
  flags?: BigNumber;
  data?: Array<PartialMMRDataUnit>;
  salt?: Array<Buffer>;
  hashtype?: BigNumber;
  priormmr?: Array<Buffer>;
}

export class PartialMMRData implements SerializableEntity {
  flags: BigNumber;
  data: Array<PartialMMRDataUnit>;
  hashtype?: BigNumber;

  salt?: Array<Buffer>;
  priormmr?: Array<Buffer>;

  static CONTAINS_SALT = new BN("1", 10);
  static CONTAINS_PRIORMMR = new BN("2", 10);

  // "1" is omitted to avoid overloading DATA_TYPE_MMRDATA in PartialSignData
  static DATA_TYPE_UNKNOWN = new BN("0", 10);
  static DATA_TYPE_FILENAME = new BN("2", 10);
  static DATA_TYPE_MESSAGE = new BN("3", 10);
  static DATA_TYPE_VDXFDATA = new BN("4", 10);
  static DATA_TYPE_SERIALIZEDHEX = new BN("5", 10);
  static DATA_TYPE_SERIALIZEDBASE64 = new BN("6", 10);
  static DATA_TYPE_DATAHASH = new BN("7", 10);
  static DATA_TYPE_RAWSTRINGDATA = new BN("8", 10);

  static HASH_TYPE_SHA256 = new BN("1", 10);
  static HASH_TYPE_SHA256D = new BN("2", 10);
  static HASH_TYPE_BLAKE2B = new BN("3", 10);
  static HASH_TYPE_KECCAK256 = new BN("4", 10);
  static DEFAULT_HASH_TYPE = PartialMMRData.HASH_TYPE_SHA256;
  
  constructor(data?: PartialMMRDataInitData) {
    this.flags = data && data.flags ? data.flags : new BN("0");
    this.data = data && data.data ? data.data : [];
    this.hashtype = data && data.hashtype ? data.hashtype : PartialMMRData.DEFAULT_HASH_TYPE;
    
    if (data?.salt) {
      this.toggleContainsSalt();
      this.salt = data.salt;
    }

    if (data?.priormmr) {
      this.toggleContainsPriorMMR();
      this.priormmr = data.priormmr;
    }
  }

  protected serializeSalt() {
    return !!(this.flags.and(PartialMMRData.CONTAINS_SALT).toNumber());
  }

  protected serializePriorMMR() {
    return !!(this.flags.and(PartialMMRData.CONTAINS_PRIORMMR).toNumber());
  }

  private toggleContainsSalt() {
    this.flags = this.flags.xor(PartialMMRData.CONTAINS_SALT);
  }

  private toggleContainsPriorMMR() {
    this.flags = this.flags.xor(PartialMMRData.CONTAINS_PRIORMMR);
  }

  private getPartialMMRDataByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.flags);

    length += varuint.encodingLength(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      const unit = this.data[i];

      length += varint.encodingLength(unit.type);

      length += varuint.encodingLength(unit.data.length);
      length += unit.data.length;
    }

    length += varint.encodingLength(this.hashtype);

    if (this.serializeSalt()) {
      length += varuint.encodingLength(this.salt.length);
      for (let i = 0; i < this.salt.length; i++) {
        const salt = this.salt[i];
  
        length += varuint.encodingLength(salt.length);
        length += salt.length;
      }
    }

    if (this.serializePriorMMR()) {
      length += varuint.encodingLength(this.priormmr.length);
      for (let i = 0; i < this.priormmr.length; i++) {
        const priormmr = this.priormmr[i];
  
        length += varuint.encodingLength(priormmr.length);
        length += priormmr.length;
      }
    }

    return length;
  }

  getByteLength(): number {
    return this.getPartialMMRDataByteLength();
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.flags = reader.readVarInt();

    const numData = reader.readCompactSize();
    for (let i = 0; i < numData; i++) {
      const type = reader.readVarInt();
      const data = reader.readVarSlice();

      this.data.push({
        type,
        data
      })
    }

    this.hashtype = reader.readVarInt();

    if (this.serializeSalt()) {
      this.salt = reader.readVector();
    }

    if (this.serializePriorMMR()) {
      this.priormmr = reader.readVector();
    }

    return reader.offset;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getPartialMMRDataByteLength()));
  
    // Serialize flags
    writer.writeVarInt(this.flags);
  
    writer.writeCompactSize(this.data.length);

    for (let i = 0; i < this.data.length; i++) {
      writer.writeVarInt(this.data[i].type);
      writer.writeVarSlice(this.data[i].data);
    }

    writer.writeVarInt(this.hashtype);

    if (this.serializeSalt()) {
      writer.writeVector(this.salt);
    }

    if (this.serializePriorMMR()) {
      writer.writeVector(this.priormmr);
    }
  
    return writer.buffer;
  }
}