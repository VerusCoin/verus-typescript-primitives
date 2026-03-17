import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, HASH256_BYTE_LENGTH } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export interface IdentityMultimapRefJson {
  version: number;
  flags: number;
  vdxfkey: string;
  identityid?: string;
  startheight: number;
  endheight: number;
  datahash?: string;
  systemid?: string;
}
export class IdentityMultimapRef implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  idID: string;
  key: string;
  heightStart: BigNumber;
  heightEnd: BigNumber;
  dataHash: Buffer;
  systemId: string;

  static FLAG_NO_DELETION = new BN(1)
  static FLAG_HAS_DATAHASH = new BN(2)
  static FLAG_HAS_SYSTEM = new BN(4)
  static FIRST_VERSION = new BN(1)
  static LAST_VERSION = new BN(1)
  static CURRENT_VERSION = new BN(1)

  constructor(data?) {

    if (data) {
      const deprecated = ['id_ID', 'height_start', 'height_end', 'data_hash', 'system_id'].filter(k => k in data);
      if (deprecated.length > 0) {
        const map: Record<string, string> = { id_ID: 'idID', height_start: 'heightStart', height_end: 'heightEnd', data_hash: 'dataHash', system_id: 'systemId' };
        throw new Error(`IdentityMultimapRef: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
      this.version = data.version || IdentityMultimapRef.CURRENT_VERSION;
      this.flags = data.flags || new BN(0);
      this.idID = data.idID || "";
      this.key = data.key || "";
      this.heightStart = data.heightStart || new BN(0);
      this.heightEnd = data.heightEnd || new BN(0);
      this.dataHash = data.dataHash || Buffer.alloc(0);
      this.systemId = data.systemId || "";
    }
  }

  /** @deprecated Use idID instead */
  get id_ID(): string { return this.idID; }

  /** @deprecated Use heightStart instead */
  get height_start(): BigNumber { return this.heightStart; }

  /** @deprecated Use heightEnd instead */
  get height_end(): BigNumber { return this.heightEnd; }

  /** @deprecated Use dataHash instead */
  get data_hash(): Buffer { return this.dataHash; }

  /** @deprecated Use systemId instead */
  get system_id(): string { return this.systemId; }

  setFlags() {
    this.flags = this.flags.and(IdentityMultimapRef.FLAG_NO_DELETION);
    if (this.dataHash && this.dataHash.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_DATAHASH);
    }
    if (this.systemId && this.systemId.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_SYSTEM);
    }
  }

  getByteLength() {
    let byteLength = 0;
    this.setFlags();

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);
    byteLength += HASH160_BYTE_LENGTH; // idID
    byteLength += HASH160_BYTE_LENGTH; // vdxfkey
    byteLength += varint.encodingLength(this.heightStart); // heightStart uint32
    byteLength += varint.encodingLength(this.heightEnd); // heightEnd uint32


    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      byteLength += HASH256_BYTE_LENGTH;
    }

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      byteLength += HASH160_BYTE_LENGTH
    }
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarInt(this.flags);
    bufferWriter.writeSlice(fromBase58Check(this.idID).hash);
    bufferWriter.writeSlice(fromBase58Check(this.key).hash);
    bufferWriter.writeVarInt(this.heightStart);
    bufferWriter.writeVarInt(this.heightEnd);

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      bufferWriter.writeSlice(this.dataHash);
    }
    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      bufferWriter.writeSlice(fromBase58Check(this.systemId).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    this.idID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.key = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.heightStart = reader.readVarInt();
    this.heightEnd = reader.readVarInt();

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      this.dataHash = reader.readSlice(32);
    }

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      this.systemId = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }
    return reader.offset;
  }

  isValid(): boolean {
    return this.version.gte(IdentityMultimapRef.FIRST_VERSION) &&
      this.version.lte(IdentityMultimapRef.LAST_VERSION) &&
      this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH.add(IdentityMultimapRef.FLAG_HAS_SYSTEM)).eq(IdentityMultimapRef.FLAG_HAS_DATAHASH.add(IdentityMultimapRef.FLAG_HAS_SYSTEM)) &&
      !(!this.idID || this.idID.length === 0) && !(!this.key || this.key.length === 0);
  }

  hasDataHash() {
    return this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0));
  }

  hasSystemID() {
    return this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0));
  }

  toJson() {

    let retval: IdentityMultimapRefJson = {

      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      vdxfkey: this.key,
      startheight: this.heightStart.toNumber(),
      endheight: this.heightEnd.toNumber(),
      identityid: this.idID
    };

    if (this.hasDataHash()) {
      retval.datahash = Buffer.from(this.dataHash).reverse().toString('hex');
    }

    if (this.hasSystemID()) {
      retval.systemid = this.systemId;
    }
    return retval;
  }

  static fromJson(data: IdentityMultimapRefJson): IdentityMultimapRef {
    return new IdentityMultimapRef({
      version: new BN(data.version),
      flags: new BN(data.flags),
      key: data.vdxfkey,
      idID: data.identityid,
      heightStart: new BN(data.startheight),
      heightEnd: new BN(data.endheight),
      dataHash: Buffer.from(data.datahash, 'hex').reverse(),
      systemId: data.systemid
    })
  }
}
