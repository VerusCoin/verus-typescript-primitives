import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export interface IdentityMultimapRefJson { 
  version: number;
  flags: number;
  vdxfkey: string;
  startheight: number;
  endheight: number;
  datahash: string;
  systemid: string;
}
export class IdentityMultimapRef implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  id_ID: string;
  key: string;
  height_start: BigNumber;
  height_end: BigNumber;
  data_hash: Buffer;
  system_id: string;

  static FLAG_NO_DELETION = new BN(1)
  static FLAG_HAS_DATAHASH = new BN(2)
  static FLAG_HAS_SYSTEM = new BN(4)
  static FIRST_VERSION = new BN(1)
  static LAST_VERSION = new BN(1)
  static CURRENT_VERSION = new BN(1)

  constructor(data?) {

    if (data) {
      this.version = data.version || IdentityMultimapRef.CURRENT_VERSION;
      this.flags = data.flags || new BN(0);
      this.id_ID = data.id_ID || "";
      this.key = data.key || "";
      this.height_start = data.height_start || new BN(0);
      this.height_end = data.height_end || new BN(0);
      this.data_hash = data.data_hash || Buffer.alloc(0);
      this.system_id = data.system_id || "";
    }
  }

  setFlags() {
    this.flags = this.flags.and(IdentityMultimapRef.FLAG_NO_DELETION);
    if (this.data_hash && this.data_hash.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_DATAHASH);
    }
    if (this.system_id && this.system_id.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_SYSTEM);
    }
  }

  getByteLength() {
    let byteLength = 0;
    this.setFlags();

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);
    byteLength += 20; // id_ID uint160
    byteLength += 20; // key uint160
    byteLength += varint.encodingLength(this.height_start); // height_start uint32
    byteLength += varint.encodingLength(this.height_end); // height_end uint32
    byteLength += 32; // data_hash uint25

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      byteLength += 32;
    }

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      byteLength += 20
    }
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarInt(this.flags);
    bufferWriter.writeSlice(fromBase58Check(this.id_ID).hash);
    bufferWriter.writeSlice(fromBase58Check(this.key).hash);
    bufferWriter.writeVarInt(this.height_start);
    bufferWriter.writeVarInt(this.height_end);

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      bufferWriter.writeSlice(this.data_hash);
    }
    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      bufferWriter.writeSlice(fromBase58Check(this.system_id).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    this.id_ID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.key = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.height_start = reader.readVarInt();
    this.height_end = reader.readVarInt();

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      this.data_hash = reader.readSlice(32);
    }

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      this.system_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }
    return reader.offset;
  }

  isValid(): boolean {
    return this.version.gte(IdentityMultimapRef.FIRST_VERSION) &&
      this.version.lte(IdentityMultimapRef.LAST_VERSION) &&
      (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH.add(IdentityMultimapRef.FLAG_HAS_SYSTEM).notn(16))).eq(new BN(0)) &&
      !(!this.id_ID || this.id_ID.length === 0) && !(!this.key || this.key.length === 0);
  }

  hasDataHash() {
    return this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0));
  }

  hasSystemID() {
    return this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0));
  }

  toJson() {

    let retval;

    retval.version = this.version.toString(10);
    retval.flags = this.flags.toString(10);
    retval.vdxfkey = this.key;
    if (this.hasDataHash()) {
      retval.datahash = this.data_hash.toString('hex');
    }

    if (this.hasSystemID()) {
      retval.systemid = this.system_id;
    }
    retval.startheight = this.height_start.toString(10);
    retval.endheight = this.height_end.toString(10);
  }

  static fromJson(data: IdentityMultimapRefJson): IdentityMultimapRef {
    return new IdentityMultimapRef({
      version: new BN(data.version),
      flags: new BN(data.flags),
      key: data.vdxfkey,
      height_start: new BN(data.startheight),
      height_end: new BN(data.endheight),
      data_hash: Buffer.from(data.datahash, 'hex'),
      system_id: data.systemid
    })
  }
}