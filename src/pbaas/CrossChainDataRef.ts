import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { PBaaSEvidenceRef, PBaaSEvidenceRefJson } from './PBaaSEvidenceRef';
import { IdentityMultimapRef, IdentityMultimapRefJson } from './IdentityMultimapRef';
import { URLRef, URLRefJson } from './URLRef';

const { BufferReader, BufferWriter } = bufferutils

export type CrossChainDataRefJson = 
    | (PBaaSEvidenceRefJson & { type: number })
    | (IdentityMultimapRefJson & { type: number })
    | (URLRefJson & { type: number });

export class CrossChainDataRef implements SerializableEntity {
  ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef;

  static TYPE_CROSSCHAIN_DATAREF = 0;
  static TYPE_IDENTITY_DATAREF = 1;
  static TYPE_URL_REF = 2;

  constructor(data?: PBaaSEvidenceRef | IdentityMultimapRef | URLRef | any) {
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

  isValid(): boolean {
    return (typeof (this.ref) == typeof (PBaaSEvidenceRef) && this.ref.isValid()) ||
      (typeof (this.ref) == typeof (IdentityMultimapRef) && this.ref.isValid()) ||
      (typeof (this.ref) == typeof (URLRef) && this.ref.isValid());
  }

  toJson() {
    return {...this.ref.toJson(), type: this.which()};
  }

  static fromJson(data: CrossChainDataRefJson) {
    if (data.type == CrossChainDataRef.TYPE_CROSSCHAIN_DATAREF) {
      return new CrossChainDataRef(PBaaSEvidenceRef.fromJson(data as PBaaSEvidenceRefJson));
    } else if (data.type == CrossChainDataRef.TYPE_IDENTITY_DATAREF) {
      return new CrossChainDataRef(IdentityMultimapRef.fromJson(data as IdentityMultimapRefJson));
    } else if (data.type == CrossChainDataRef.TYPE_URL_REF) {
      return new CrossChainDataRef(URLRef.fromJson(data as URLRefJson));
    }
      else throw new Error("Invalid CrossChainDataRef type");
  }
}