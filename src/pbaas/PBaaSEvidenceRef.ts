import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { UTXORef } from './UTXORef';
import { IdentityMultimapRef } from './IdentityMultimapRef';

const { BufferReader, BufferWriter } = bufferutils

export interface PBaaSEvidenceRefJson {
  version: number;
  flags: number;
  output: any;
  objectnum: number;
  subobject: number;
  systemid: string;
}

export class PBaaSEvidenceRef implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  output: UTXORef;
  objectNum: BigNumber;
  subObject: BigNumber;
  systemId: string;

  static FLAG_ISEVIDENCE = new BN(1)
  static FLAG_HAS_SYSTEM = new BN(2)
  static FIRST_VERSION = new BN(1)
  static LAST_VERSION = new BN(1)

  constructor(data?: { version?: BigNumber, flags?: BigNumber, output?: UTXORef, objectNum?: BigNumber, subObject?: BigNumber, systemId?: string }) {

    if (data) {
      const d = data as any;
      const deprecated = ['object_num', 'sub_object', 'system_id'].filter(k => k in d);
      if (deprecated.length > 0) {
        const map: Record<string, string> = { object_num: 'objectNum', sub_object: 'subObject', system_id: 'systemId' };
        throw new Error(`PBaaSEvidenceRef: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
      this.version = data.version || new BN(1, 10);
      this.flags = data.flags || new BN(0);
      this.output = data.output || new UTXORef();
      this.objectNum = data.objectNum || new BN(0);
      this.subObject = data.subObject || new BN(0);
      this.systemId = data.systemId || "";
    }
  }

  /** @deprecated Use objectNum instead */
  get object_num(): BigNumber { return this.objectNum; }

  /** @deprecated Use subObject instead */
  get sub_object(): BigNumber { return this.subObject; }

  /** @deprecated Use systemId instead */
  get system_id(): string { return this.systemId; }

  setFlags() {
    this.flags = this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE);
    if (this.systemId && this.systemId.length > 0) {
      this.flags = this.flags.or(PBaaSEvidenceRef.FLAG_HAS_SYSTEM);
    }

  }

  getByteLength() {
    let byteLength = 0;
    this.setFlags();

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);
    byteLength += this.output.getByteLength();
    byteLength += varint.encodingLength(this.objectNum);
    byteLength += varint.encodingLength(this.subObject);

    if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      byteLength += HASH160_BYTE_LENGTH;
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
      bufferWriter.writeSlice(fromBase58Check(this.systemId).hash);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    this.output = new UTXORef();
    reader.offset = this.output.fromBuffer(reader.buffer, reader.offset);
    this.objectNum = reader.readVarInt();
    this.subObject = reader.readVarInt();

    if (this.flags.and(PBaaSEvidenceRef.FLAG_HAS_SYSTEM).gt(new BN(0))) {
      this.systemId = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    }

    return reader.offset;
  }

  isValid(): boolean {
    return this.output.isValid() && this.version.gte(PBaaSEvidenceRef.FIRST_VERSION) &&
      this.version.lte(PBaaSEvidenceRef.LAST_VERSION) &&
      (this.flags.and(PBaaSEvidenceRef.FLAG_ISEVIDENCE).gt(new BN(0)));
  }

  toJson(): PBaaSEvidenceRefJson {

    let retval: PBaaSEvidenceRefJson = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      output: this.output.toJson(),
      objectnum: this.objectNum.toNumber(),
      subobject: this.subObject.toNumber(),
      systemid: this.systemId || ""
    }

    return retval;
  }

  static fromJson(json: PBaaSEvidenceRefJson): PBaaSEvidenceRef {
    return new PBaaSEvidenceRef({
      version: new BN(json.version),
      flags: new BN(json.flags),
      output: UTXORef.fromJson(json.output),
      objectNum: new BN(json.objectnum),
      subObject: new BN(json.subobject),
      systemId: json.systemid
    });
  }
}