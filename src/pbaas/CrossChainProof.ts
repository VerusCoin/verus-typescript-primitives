import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { EvidenceData, EvidenceDataJson, EvidenceDataInChainObjectJson } from './EvidenceData';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';

const { BufferReader, BufferWriter } = bufferutils

export interface CrossChainProofJson {
  version: number;
  chainobjects: Array<EvidenceDataInChainObjectJson>;
}

export enum CHAIN_OBJECT_TYPES
{
    CHAINOBJ_INVALID = 0,
    CHAINOBJ_HEADER = 1,            // serialized full block header w/proof
    CHAINOBJ_HEADER_REF = 2,        // equivalent to header, but only includes non-canonical data
    CHAINOBJ_TRANSACTION_PROOF = 3, // serialized transaction or partial transaction with proof
    CHAINOBJ_PROOF_ROOT = 4,        // merkle proof of preceding block or transaction
    CHAINOBJ_COMMITMENTDATA = 5,    // prior block commitments to ensure recognition of overlapping notarizations
    CHAINOBJ_RESERVETRANSFER = 6,   // serialized transaction, sometimes without an opret, which will be reconstructed
    CHAINOBJ_RESERVED = 7,          // unused and reserved
    CHAINOBJ_CROSSCHAINPROOF = 8,   // specific composite object, which is a single or multi-proof
    CHAINOBJ_NOTARYSIGNATURE = 9,   // notary signature
    CHAINOBJ_EVIDENCEDATA = 10      // flexible evidence data
};

export class CrossChainProof implements SerializableEntity {
  version: BigNumber;
  chainObjects: Array<EvidenceData>;

  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static VERSION_CURRENT = new BN(1);
  static VERSION_LAST = new BN(1);

  constructor(data?: {version, chainObjects}) {
    this.version = data?.version || new BN(1, 10);
    this.chainObjects = data?.chainObjects || [];    
  }

  static KnownVDXFKeys(): Map<string, CHAIN_OBJECT_TYPES> {
    const keys = new Map();
    keys.set(VDXF_Data.EvidenceDataKey.vdxfid, CHAIN_OBJECT_TYPES.CHAINOBJ_EVIDENCEDATA);
    return keys;
  }

  getByteLength() {
    let byteLength = 0;
    byteLength += 4; // version uint32
    byteLength += varint.encodingLength(new BN(this.chainObjects.length));
    
    for (let i = 0; i < this.chainObjects.length; i++) {
      byteLength += 2; // objtype uint16
      byteLength += this.chainObjects[i].getByteLength();
    }

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeUInt32(this.version.toNumber());
    bufferWriter.writeVarInt(new BN(this.chainObjects.length));

    for (let i = 0; i < this.chainObjects.length; i++) {
      bufferWriter.writeUInt16(this.chainObjects[i].type.toNumber());
      bufferWriter.writeSlice(this.chainObjects[i].toBuffer());
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readUInt32());
    this.chainObjects = [];

    const chainObjectsLength = reader.readVarInt().toNumber();

    for (let i = 0; i < chainObjectsLength; i++) {
      const objType = reader.readUInt16();
      //TODO: Implement all proof types
      if (objType != CHAIN_OBJECT_TYPES.CHAINOBJ_EVIDENCEDATA) throw new Error("Invalid chain object type");
      const obj = new EvidenceData();
      obj.fromBuffer(buffer, reader.offset);
      this.chainObjects.push(obj);
    }

    return reader.offset;
  }

  isValid(): boolean {

    for (let i = 0; i < this.chainObjects.length; i++) {
      if (!this.chainObjects[i].isValid()) return false;
    }

    return this.chainObjects.length > 0;

  }

  toJson() {

    const outputChainObjects = [];
  //TODO: Implement all proof types
    for (let i = 0; i < this.chainObjects.length; i++) {
      if (!(this.chainObjects[i] instanceof EvidenceData)) throw new Error("Invalid chain object type");
      outputChainObjects.push({vdxftype: VDXF_Data.EvidenceDataKey.vdxfid, value: this.chainObjects[i].toJson()});
    }

    return {
      version: this.version.toString(10),
      chainobjects: outputChainObjects
    }
  }

  //TODO: Implement all proof types
  static fromJson(data: CrossChainProofJson): CrossChainProof {

    let chainObjects = [];
    for (let i = 0; i < data.chainobjects.length; i++) {
      if (!CrossChainProof.KnownVDXFKeys().get(data.chainobjects[i].vdxftype)) throw new Error("Invalid chain object type");
      const vdxftype = CrossChainProof.KnownVDXFKeys().get(data.chainobjects[i].vdxftype);
      switch (vdxftype) {
        case CHAIN_OBJECT_TYPES.CHAINOBJ_EVIDENCEDATA:
          chainObjects.push(EvidenceData.fromJson({hex: data.chainobjects[i].value.hex}));
          break;
        default:
          throw new Error("Invalid chain object type");
      }
    }

    return new CrossChainProof({
      version: new BN(data.version, 10),
      chainObjects: chainObjects
    });
  }


}

