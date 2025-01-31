import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../utils/varint'
import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
const { BufferReader, BufferWriter } = bufferutils
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { EHashTypes } from './DataDescriptor';
import { VdxfUniValue } from '.';
import { BufferDataVdxfObject } from '../vdxf/index';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';
import { SerializableEntity } from '../utils/types/SerializableEntity';

export interface MMRDescriptorJson {
  version: number;
  objecthashtype?: number;
  mmrhashtype?: number;
  mmrroot?: DataDescriptorJson;
  mmrhashes?: DataDescriptorJson;
  datadescriptors?: DataDescriptorJson[];
}

export class MMRDescriptor implements SerializableEntity {
  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);

  version: BigNumber;
  objectHashType: EHashTypes;
  mmrHashType: EHashTypes;
  mmrRoot: DataDescriptor;
  mmrHashes: DataDescriptor;
  dataDescriptors: DataDescriptor[];

  constructor(data?: {
    version?: BigNumber,
    objectHashType?: EHashTypes,
    mmrHashType?: EHashTypes,
    mmrRoot?: DataDescriptor,
    mmrHashes?: DataDescriptor,
    dataDescriptors?: DataDescriptor[]
  }) {

    if (data) {
      if (data.version) this.version = data.version;
      if (data.objectHashType) this.objectHashType = data.objectHashType;
      if (data.mmrHashType) this.mmrHashType = data.mmrHashType;
      if (data.mmrRoot) this.mmrRoot = data.mmrRoot;
      if (data.mmrHashes) this.mmrHashes = data.mmrHashes;
      if (data.dataDescriptors) this.dataDescriptors = data.dataDescriptors;

    } else {
      this.version = MMRDescriptor.DEFAULT_VERSION;
    }
  }

  static fromJson(data: MMRDescriptorJson): MMRDescriptor {

    const newMMRDescriptor = new MMRDescriptor();

    if (data) {
      if (data.version) newMMRDescriptor.version = new BN(data.version);
      if (data.objecthashtype) newMMRDescriptor.objectHashType = data.objecthashtype;
      if (data.mmrhashtype) newMMRDescriptor.mmrHashType = data.mmrhashtype;
      if (data.mmrroot) newMMRDescriptor.mmrRoot = DataDescriptor.fromJson(data.mmrroot);
      if (data.mmrhashes) newMMRDescriptor.mmrHashes = DataDescriptor.fromJson(data.mmrhashes);
      if (data.datadescriptors) {
        newMMRDescriptor.dataDescriptors = [];

        data.datadescriptors.forEach((data) => {
          newMMRDescriptor.dataDescriptors.push(DataDescriptor.fromJson(data));
        });

      };
    }
    return newMMRDescriptor;
  }

  getByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.version);
    length += varint.encodingLength(new BN(this.objectHashType));
    length += varint.encodingLength(new BN(this.mmrHashType));
    length += this.mmrRoot.getByteLength();
    length += this.mmrHashes.getByteLength();
    length += varuint.encodingLength(this.dataDescriptors.length);
    this.dataDescriptors.forEach((dataDescriptor) => {
      length += dataDescriptor.getByteLength();
    });

    return length;
  }

  toBuffer(): Buffer {

    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.version);
    writer.writeVarInt(new BN(this.objectHashType));
    writer.writeVarInt(new BN(this.mmrHashType));
    writer.writeSlice(this.mmrRoot.toBuffer());
    writer.writeSlice(this.mmrHashes.toBuffer());
    writer.writeCompactSize(this.dataDescriptors.length);

    this.dataDescriptors.forEach((dataDescriptor) => {
      writer.writeSlice(dataDescriptor.toBuffer());
    });
    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new BufferReader(buffer, offset);
    this.version = reader.readVarInt();
    this.objectHashType = reader.readVarInt().toNumber();
    this.mmrHashType = reader.readVarInt().toNumber();
    this.mmrRoot = new DataDescriptor();
    reader.offset = this.mmrRoot.fromBuffer(reader.buffer, reader.offset);
    this.mmrHashes = new DataDescriptor();
    reader.offset = this.mmrHashes.fromBuffer(reader.buffer, reader.offset);
    const dataDescriptorsLength = reader.readCompactSize();
    this.dataDescriptors = [];
    for (let i = 0; i < dataDescriptorsLength; i++) {
      const dataDescriptor = new DataDescriptor();
      reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
      this.dataDescriptors.push(dataDescriptor);
    }
    return reader.offset;
  }

  hasData(): boolean {
    return !!(this.mmrHashes.objectdata && this.dataDescriptors);
  }

  isValid(): boolean {
    return this.version >= MMRDescriptor.FIRST_VERSION && this.version <= MMRDescriptor.LAST_VERSION;
  }

  toJson():MMRDescriptorJson {

    const retval = {
      version: this.version.toNumber(),
      objecthashtype: this.objectHashType.valueOf(),
      mmrhashtype: this.mmrHashType,
      mmrroot: this.mmrRoot.toJson(),
      mmrhashes: this.mmrHashes.toJson(),
      datadescriptors: this.dataDescriptors.map((dataDescriptor) => dataDescriptor.toJson())
    };

    return retval;
  }
};

