import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import varuint from '../utils/varuint';
import bufferutils from '../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { EHashTypes } from './DataDescriptor';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { descriptorInteger } from './descriptorValidation';

export interface MMRDescriptorJson {
  version?: number;
  objecthashtype?: number;
  mmrhashtype?: number;
  mmrroot?: DataDescriptorJson;
  mmrhashes?: DataDescriptorJson;
  datadescriptors?: DataDescriptorJson[];
}

export class MMRDescriptor
  extends SerializableEntityBase
  implements SerializableEntity
{
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
    version?: BigNumber;
    objectHashType?: EHashTypes;
    mmrHashType?: EHashTypes;
    mmrRoot?: DataDescriptor;
    mmrHashes?: DataDescriptor;
    dataDescriptors?: DataDescriptor[];
  }) {
    super();
    this.version = new BN(MMRDescriptor.DEFAULT_VERSION);
    this.objectHashType = EHashTypes.HASH_SHA256;
    this.mmrHashType = EHashTypes.HASH_BLAKE2BMMR;
    this.mmrRoot = new DataDescriptor();
    this.mmrHashes = new DataDescriptor();
    this.dataDescriptors = [];

    if (data) {
      if (data.version != null)
        this.version = descriptorInteger(data.version, 32, 'Version');
      if (data.objectHashType != null)
        this.objectHashType = descriptorInteger(
          data.objectHashType,
          31,
          'Object hash type'
        ).toNumber();
      if (data.mmrHashType != null)
        this.mmrHashType = descriptorInteger(
          data.mmrHashType,
          31,
          'MMR hash type'
        ).toNumber();
      if (data.mmrRoot) this.mmrRoot = data.mmrRoot;
      if (data.mmrHashes) this.mmrHashes = data.mmrHashes;
      if (data.dataDescriptors) this.dataDescriptors = data.dataDescriptors;
    }
  }

  /** Daemon JSON uses zero for absent numeric fields and invalid nested descriptors. */
  static fromJson(data: MMRDescriptorJson | null = {}): MMRDescriptor {
    const source = data ?? {};
    return new MMRDescriptor({
      version: descriptorInteger(source.version ?? 0, 32, 'Version'),
      objectHashType: descriptorInteger(
        source.objecthashtype ?? 0,
        31,
        'Object hash type'
      ).toNumber(),
      mmrHashType: descriptorInteger(
        source.mmrhashtype ?? 0,
        31,
        'MMR hash type'
      ).toNumber(),
      mmrRoot: DataDescriptor.fromJson(source.mmrroot),
      mmrHashes: DataDescriptor.fromJson(source.mmrhashes),
      dataDescriptors: (source.datadescriptors ?? []).map((value) =>
        DataDescriptor.fromJson(value)
      ),
    });
  }

  /** Explicit alias for the canonical daemon JSON representation. */
  static fromDaemonJson(data: MMRDescriptorJson | null = {}): MMRDescriptor {
    return MMRDescriptor.fromJson(data);
  }

  private validateIntegers(): void {
    descriptorInteger(this.version, 32, 'Version');
    descriptorInteger(this.objectHashType, 31, 'Object hash type');
    descriptorInteger(this.mmrHashType, 31, 'MMR hash type');
  }

  getByteLength(): number {
    this.validateIntegers();
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
    this.version = reader.readVarInt(32);
    this.objectHashType = reader.readVarInt(31).toNumber();
    this.mmrHashType = reader.readVarInt(31).toNumber();
    this.mmrRoot = new DataDescriptor();
    reader.offset = this.mmrRoot.fromBuffer(reader.buffer, reader.offset);
    this.mmrHashes = new DataDescriptor();
    reader.offset = this.mmrHashes.fromBuffer(reader.buffer, reader.offset);
    const dataDescriptorsLength = reader.readCompactSize();
    // Even an empty descriptor needs version, flags and an object-data length.
    if (
      dataDescriptorsLength >
      Math.floor((reader.buffer.length - reader.offset) / 3)
    ) {
      throw new Error('Truncated MMR data descriptors');
    }
    this.dataDescriptors = [];
    for (let i = 0; i < dataDescriptorsLength; i++) {
      const dataDescriptor = new DataDescriptor();
      reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
      this.dataDescriptors.push(dataDescriptor);
    }
    return reader.offset;
  }

  hasData(): boolean {
    return (
      this.mmrHashes.objectdata.length > 0 && this.dataDescriptors.length > 0
    );
  }

  isValid(): boolean {
    return (
      this.version.gte(MMRDescriptor.FIRST_VERSION) &&
      this.version.lte(MMRDescriptor.LAST_VERSION)
    );
  }

  toJson(): MMRDescriptorJson {
    this.validateIntegers();
    return {
      version: this.version.toNumber(),
      objecthashtype: this.objectHashType,
      mmrhashtype: this.mmrHashType,
      mmrroot: this.mmrRoot.toJson(),
      mmrhashes: this.mmrHashes.toJson(),
      datadescriptors: this.dataDescriptors.map((value) => value.toJson()),
    };
  }

  /** Explicit alias for the canonical daemon JSON representation. */
  toDaemonJson(): MMRDescriptorJson {
    return this.toJson();
  }
}
