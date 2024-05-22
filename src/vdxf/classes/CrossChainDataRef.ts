import varint from '../../utils/varint'
import varuint from '../../utils/varuint'
import { fromBase58Check, toBase58Check } from "../../utils/address";
import bufferutils from '../../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { SerializableEntity } from '../../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export class CUTXORef implements SerializableEntity {
  hash: Buffer;
  n: BigNumber;

  constructor(data?: { hash?: Buffer, n?: BigNumber }) {
    this.hash = data.hash || Buffer.alloc(0);
    this.n = data.n || new BN(0);
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += 32; // hash uint256
    byteLength += 4;  // n uint32

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeSlice(this.hash);
    bufferWriter.writeUInt32(this.n.toNumber());

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.hash = reader.readSlice(32);
    this.n = new BN(reader.readUInt32());

    return reader.offset;
  }
}


export class PBaaSEvidenceRef implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  output: CUTXORef;
  objectNum: BigNumber;
  subObject: BigNumber;
  systemID: string;

  static FLAG_ISEVIDENCE = new BN(1)
  static FLAG_HAS_SYSTEM = new BN(2)

  constructor(data?) {

    if (data) {
      Object.assign(this, data)
    }
  }

  SetFlags() {
    this.flags = this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE);
    if (this.systemID && this.systemID.length > 0) {
      this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_SYSTEM);
    }

  }

  getByteLength() {
    let byteLength = 0;
    this.SetFlags();

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);
    byteLength += this.output.getByteLength();
    byteLength += varint.encodingLength(this.objectNum);
    byteLength += varint.encodingLength(this.subObject);

    if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      byteLength += 20;
    }

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarInt(this.flags);
    bufferWriter.writeSlice(this.output.toBuffer());
    bufferWriter.writeVarInt(this.objectNum);
    bufferWriter.writeVarInt(this.subObject);

    if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      bufferWriter.writeSlice(fromBase58Check(this.systemID).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    this.output = new CUTXORef();
    offset = this.output.fromBuffer(reader.buffer, reader.offset);
    this.objectNum = reader.readVarInt();
    this.subObject = reader.readVarInt();
    
    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      this.systemID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }

    return reader.offset;
  }
}

export class IdentityMultimapRef implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  idID: string;
  key: string;
  heightStart: BigNumber;
  heightEnd: BigNumber;
  dataHash: Buffer;
  systemID: string;

  static FLAG_NO_DELETION = new BN(1)
  static FLAG_HAS_DATAHASH = new BN(2)
  static FLAG_HAS_SYSTEM = new BN(4)

  constructor(data?) {

    if (data) {
      Object.assign(this, data)
    }
  }

  SetFlags() {
    this.flags = this.flags.and(IdentityMultimapRef.FLAG_NO_DELETION);
    if (this.dataHash && this.dataHash.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_DATAHASH);
    }
    if (this.systemID && this.systemID.length > 0) {
      this.flags = this.flags.or(IdentityMultimapRef.FLAG_HAS_SYSTEM);
    }
  }

  getByteLength() {
    let byteLength = 0;
    this.SetFlags();

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);
    byteLength += 20; // idID uint160
    byteLength += 20; // key uint160
    byteLength += varint.encodingLength(this.heightStart); // heightStart uint32
    byteLength += varint.encodingLength(this.heightEnd); // heightEnd uint32
    byteLength += 32; // dataHash uint25

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
    bufferWriter.writeSlice(fromBase58Check(this.idID).hash);
    bufferWriter.writeSlice(fromBase58Check(this.key).hash);
    bufferWriter.writeVarInt(this.heightStart);
    bufferWriter.writeVarInt(this.heightEnd);

    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_DATAHASH).gt(new BN(0))) {
      bufferWriter.writeSlice(this.dataHash);
    }
    if (this.flags.and(IdentityMultimapRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      bufferWriter.writeSlice(fromBase58Check(this.systemID).hash);
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
      this.systemID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }
    return reader.offset;
  }
}

export class URLRef implements SerializableEntity {
  version: BigNumber;
  url: string;
  constructor(data?: { version?: BigNumber, url?: string }) {

    if (data) {
      this.version = data.version || new BN(1, 10);
      this.url = data.url || "";
    }
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);
    byteLength += varuint.encodingLength(Buffer.from(this.url, 'utf8').length);
    byteLength += Buffer.from(this.url, 'utf8').length;
    if (byteLength > 4096)
      throw new Error("URLRef exceeds maximum length of 4096 bytes")
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.url = reader.readVarSlice().toString('utf8');

    return reader.offset;
  }
}

export class CrossChainDataRef implements SerializableEntity {
  ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef;

  static TYPE_CROSSCHAIN_DATAREF = 0;
  static TYPE_IDENTITY_DATAREF = 1;
  static TYPE_URL_REF = 2;

  constructor(data: PBaaSEvidenceRef | IdentityMultimapRef | URLRef | any) {
    this.ref = data || null;
  }

  which(): number {
    if (this.ref instanceof PBaaSEvidenceRef) {
      return CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF;
    } else if (this.ref instanceof IdentityMultimapRef) {
      return CrossChainDataRef.TYPE_IDENTITY_DATAREF;
    } else if (this.ref instanceof URLRef) {
      return CrossChainDataRef.TYPE_URL_REF;
    }
  }

  getByteLength() {
    let byteLength = 1;  //type uint8
    byteLength += this.ref.getByteLength();
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))
    bufferWriter.writeUInt8(this.which());
    bufferWriter.writeSlice(this.ref.toBuffer());
    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    const type = reader.readUInt8();

    if (type == CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF) {
      this.ref = new PBaaSEvidenceRef();
    } else if (type == CrossChainDataRef.TYPE_IDENTITY_DATAREF) {
      this.ref = new IdentityMultimapRef();
    } else if (type == CrossChainDataRef.TYPE_URL_REF) {
      this.ref = new URLRef();
    }

    offset = this.ref.fromBuffer(buffer, reader.offset);
    return reader.offset;
  }
}