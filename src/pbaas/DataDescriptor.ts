import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import varuint from '../utils/varuint';
import bufferutils from '../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { VdxfUniValue } from './VdxfUniValue';
import { BufferDataVdxfObject } from '../vdxf/index';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import {
  HASH_TYPE_BLAKE2B,
  HASH_TYPE_BLAKE2BMMR2,
  HASH_TYPE_INVALID,
  HASH_TYPE_KECCAK256,
  HASH_TYPE_SHA256,
  HASH_TYPE_SHA256D,
} from '../constants/pbaas';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../constants/vdxf';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { isHexString, readLimitedString } from '../utils/string';
import {
  descriptorInteger,
  descriptorUtf8,
  validateDaemonMetadata,
  validateDescriptorText,
} from './descriptorValidation';

export interface DataDescriptorJson {
  version?: number;
  flags?: number;
  vdxfkey?: string;
  objectdata?: string | { ['message']: string } | object;
  label?: string;
  mimetype?: string;
  salt?: string;
  epk?: string;
  ivk?: string;
  ssk?: string;
}

export class DataDescriptor
  extends SerializableEntityBase
  implements SerializableEntity
{
  static VERSION_INVALID = new BN(0);
  static VERSION_FIRST = new BN(1);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);

  static FLAG_ENCRYPTED_DATA = new BN(1);
  static FLAG_SALT_PRESENT = new BN(2);
  static FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT = new BN(4);
  static FLAG_INCOMING_VIEWING_KEY_PRESENT = new BN(8);
  static FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT = new BN(0x10);
  static FLAG_LABEL_PRESENT = new BN(0x20);
  static FLAG_MIME_TYPE_PRESENT = new BN(0x40);
  static FLAG_VDXF_KEY_PRESENT = new BN(0x80);
  static FLAG_MASK = DataDescriptor.FLAG_ENCRYPTED_DATA.add(
    DataDescriptor.FLAG_SALT_PRESENT
  )
    .add(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT)
    .add(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT)
    .add(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT)
    .add(DataDescriptor.FLAG_LABEL_PRESENT)
    .add(DataDescriptor.FLAG_MIME_TYPE_PRESENT)
    .add(DataDescriptor.FLAG_VDXF_KEY_PRESENT);

  version: BigNumber;
  flags: BigNumber; // Flags indicating what items are present in the object
  vdxfKey: string; // optional VDXF key identifying the object data type
  objectdata: Buffer; // either direct data or serialized UTXORef +offset, length, and/or other type of info for different links
  label: string; // label associated with this data
  mimeType: string; // optional mime type
  salt: Buffer; // optional bytes appended to plaintext before hashing
  epk: Buffer; // encryption public key, data only present if encrypted or data referenced by unencrypted link is encrypted
  ivk: Buffer; // incoming viewing key, optional and contains data only if full viewing key is published at this encryption level
  ssk: Buffer; // specific symmetric key, optional and only to decrypt this linked sub-object

  constructor(data?: {
    version?: BigNumber;
    flags?: BigNumber;
    vdxfKey?: string;
    objectdata?: Buffer;
    label?: string;
    mimeType?: string;
    salt?: Buffer;
    epk?: Buffer;
    ivk?: Buffer;
    ssk?: Buffer;
  }) {
    super();
    this.flags = new BN(0);
    this.version = new BN(DataDescriptor.DEFAULT_VERSION);
    this.vdxfKey = '';
    this.objectdata = Buffer.from([]);

    if (data != null) {
      if (data.flags != null)
        this.flags = descriptorInteger(data.flags, 32, 'Flags');
      if (data.version != null)
        this.version = descriptorInteger(data.version, 32, 'Version');
      if (data.vdxfKey != null) this.vdxfKey = data.vdxfKey;
      if (data.objectdata != null) this.objectdata = data.objectdata;
      if (data.label != null) this.label = data.label;
      if (data.mimeType != null) this.mimeType = data.mimeType;
      if (data.salt != null) this.salt = data.salt;

      if (data.epk != null) this.epk = data.epk;
      if (data.ivk != null) this.ivk = data.ivk;
      if (data.ssk != null) this.ssk = data.ssk;

      this.setFlags();
    }
  }

  /** Lossless daemon JSON subset; invalid key sizes are rejected, not silently invalidated. */
  static fromJson(data: DataDescriptorJson | null = {}): DataDescriptor {
    const source = data ?? {};
    const descriptor = new DataDescriptor({
      version: descriptorInteger(source.version ?? 0, 32, 'Version'),
      flags: descriptorInteger(source.flags ?? 0, 32, 'Flags'),
      label: source.label,
      mimeType: source.mimetype,
      vdxfKey: source.vdxfkey,
    });

    for (const field of ['salt', 'epk', 'ivk', 'ssk'] as const) {
      if (source[field] != null) {
        if (!isHexString(source[field]))
          throw new Error(`${field} must be complete hexadecimal bytes`);
        descriptor[field] = Buffer.from(source[field], 'hex');
      }
    }
    descriptor.validateJson();

    if (
      typeof source.objectdata === 'string' &&
      !isHexString(source.objectdata)
    ) {
      throw new Error(
        'Nonhex objectdata is discarded by the daemon; use { message: text }'
      );
    }
    if (source.objectdata != null) {
      descriptor.objectdata = VdxfUniValue.fromJson(
        source.objectdata
      ).toBuffer();
    }
    descriptor.setFlags();
    return descriptor;
  }

  /** Explicit alias for the canonical daemon JSON representation. */
  static fromDaemonJson(data: DataDescriptorJson | null = {}): DataDescriptor {
    return DataDescriptor.fromJson(data);
  }

  /** Default matches FromVector's trailing-byte tolerance; strict requires one complete vector. */
  decodeHashVector(strict = false): Array<Buffer> {
    const wrapper = new BufferReader(this.objectdata);
    const key = toBase58Check(
      wrapper.readSlice(HASH160_BYTE_LENGTH),
      I_ADDR_VERSION
    );
    wrapper.readVarInt(32);
    const payload = wrapper.readVarSlice();

    if (key !== VDXF_Data.VectorUint256Key.vdxfid) {
      if (strict) throw new Error('Expected a VectorUint256 VDXF tag');
      return [];
    }

    const reader = new BufferReader(payload);
    const count = reader.readCompactSize();
    if (count > Math.floor((payload.length - reader.offset) / 32)) {
      throw new Error('Truncated hash vector');
    }

    const hashes: Buffer[] = [];
    for (let i = 0; i < count; i++)
      hashes.push(Buffer.from(reader.readSlice(32)));
    if (
      strict &&
      (reader.offset !== payload.length ||
        wrapper.offset !== this.objectdata.length)
    ) {
      throw new Error('Trailing bytes in hash vector');
    }
    return hashes;
  }

  getByteLength(): number {
    descriptorInteger(this.version, 32, 'Version');
    this.setFlags();

    let length = 0;

    length += varint.encodingLength(this.version);
    length += varint.encodingLength(this.flags);
    if (this.hasVDXFKey()) {
      length += HASH160_BYTE_LENGTH;
    }
    length += varuint.encodingLength(this.objectdata.length);
    length += this.objectdata.length;

    if (this.hasLabel()) {
      const labelLength = Buffer.byteLength(this.label, 'utf8');
      validateDescriptorText(this.label, 64, 'Label');
      length += varuint.encodingLength(labelLength);
      length += labelLength;
    }

    if (this.hasMIME()) {
      const mimeLength = Buffer.byteLength(this.mimeType, 'utf8');
      validateDescriptorText(this.mimeType, 128, 'MIME type');
      length += varuint.encodingLength(mimeLength);
      length += mimeLength;
    }

    if (this.hasSalt()) {
      length += varuint.encodingLength(this.salt.length);
      length += this.salt.length;
    }

    if (this.hasEPK()) {
      length += varuint.encodingLength(this.epk.length);
      length += this.epk.length;
    }

    if (this.hasIVK()) {
      length += varuint.encodingLength(this.ivk.length);
      length += this.ivk.length;
    }

    if (this.hasSSK()) {
      length += varuint.encodingLength(this.ssk.length);
      length += this.ssk.length;
    }
    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.version);
    writer.writeVarInt(this.flags);
    if (this.hasVDXFKey()) {
      writer.writeSlice(fromBase58Check(this.vdxfKey).hash);
    }
    writer.writeVarSlice(this.objectdata);

    if (this.hasLabel()) {
      writer.writeVarSlice(Buffer.from(this.label));
    }

    if (this.hasMIME()) {
      writer.writeVarSlice(Buffer.from(this.mimeType));
    }

    if (this.hasSalt()) {
      writer.writeVarSlice(this.salt);
    }

    if (this.hasEPK()) {
      writer.writeVarSlice(this.epk);
    }

    if (this.hasIVK()) {
      writer.writeVarSlice(this.ivk);
    }

    if (this.hasSSK()) {
      writer.writeVarSlice(this.ssk);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);
    this.version = reader.readVarInt(32);
    this.flags = reader.readVarInt(32);
    if (this.hasVDXFKey()) {
      this.vdxfKey = toBase58Check(
        reader.readSlice(HASH160_BYTE_LENGTH),
        I_ADDR_VERSION
      );
    } else {
      this.vdxfKey = '';
    }
    this.objectdata = reader.readVarSlice();

    if (this.hasLabel()) {
      this.label = descriptorUtf8(readLimitedString(reader, 64));
    } else this.label = undefined;

    if (this.hasMIME()) {
      this.mimeType = descriptorUtf8(readLimitedString(reader, 128));
    } else this.mimeType = undefined;

    if (this.hasSalt()) {
      this.salt = reader.readVarSlice();
    } else this.salt = undefined;

    if (this.hasEPK()) {
      this.epk = reader.readVarSlice();
    } else this.epk = undefined;

    if (this.hasIVK()) {
      this.ivk = reader.readVarSlice();
    } else this.ivk = undefined;

    if (this.hasSSK()) {
      this.ssk = reader.readVarSlice();
    } else this.ssk = undefined;
    return reader.offset;
  }

  hasEncryptedData(): boolean {
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).gt(new BN(0));
  }

  hasVDXFKey(): boolean {
    return this.flags.and(DataDescriptor.FLAG_VDXF_KEY_PRESENT).gt(new BN(0));
  }

  hasSalt(): boolean {
    return this.flags.and(DataDescriptor.FLAG_SALT_PRESENT).gt(new BN(0));
  }

  hasEPK(): boolean {
    return this.flags
      .and(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT)
      .gt(new BN(0));
  }

  hasMIME(): boolean {
    return this.flags.and(DataDescriptor.FLAG_MIME_TYPE_PRESENT).gt(new BN(0));
  }

  hasIVK(): boolean {
    return this.flags
      .and(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT)
      .gt(new BN(0));
  }

  hasSSK(): boolean {
    return this.flags
      .and(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT)
      .gt(new BN(0));
  }

  hasLabel(): boolean {
    return this.flags.and(DataDescriptor.FLAG_LABEL_PRESENT).gt(new BN(0));
  }

  private hasNonzeroVDXFKey(): boolean {
    // The wire field is a uint160; address prefixes do not affect its nullness.
    return (
      !!this.vdxfKey &&
      fromBase58Check(this.vdxfKey).hash.some((byte) => byte !== 0)
    );
  }

  calcFlags(): BigNumber {
    descriptorInteger(this.flags, 32, 'Flags');
    return this.flags
      .and(DataDescriptor.FLAG_ENCRYPTED_DATA)
      .add(
        this.hasNonzeroVDXFKey()
          ? DataDescriptor.FLAG_VDXF_KEY_PRESENT
          : new BN(0)
      )
      .add(this.label ? DataDescriptor.FLAG_LABEL_PRESENT : new BN(0))
      .add(this.mimeType ? DataDescriptor.FLAG_MIME_TYPE_PRESENT : new BN(0))
      .add(this.salt?.length ? DataDescriptor.FLAG_SALT_PRESENT : new BN(0))
      .add(
        this.epk?.length
          ? DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT
          : new BN(0)
      )
      .add(
        this.ivk?.length
          ? DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT
          : new BN(0)
      )
      .add(
        this.ssk?.length
          ? DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT
          : new BN(0)
      );
  }

  setFlags() {
    this.flags = this.calcFlags();
  }

  isValid(): boolean {
    if (
      !this.version.gte(DataDescriptor.FIRST_VERSION) ||
      !this.version.lte(DataDescriptor.LAST_VERSION)
    ) {
      return false;
    }

    if (
      this.flags.isNeg() ||
      !this.flags.and(DataDescriptor.FLAG_MASK).eq(this.flags)
    ) {
      return false;
    }

    // The byte limits are stricter than daemon IsValid, but match its binary reader.
    try {
      validateDescriptorText(this.label ?? '', 64, 'Label');
      validateDescriptorText(this.mimeType ?? '', 128, 'MIME type');
      return true;
    } catch (_) {
      return false;
    }
  }

  private validateJson(): void {
    descriptorInteger(this.version, 32, 'Version');
    descriptorInteger(this.flags, 32, 'Flags');
    validateDaemonMetadata(this.label ?? '', 64, 'Label');
    validateDaemonMetadata(this.mimeType ?? '', 128, 'MIME type');

    if (this.hasNonzeroVDXFKey()) {
      throw new Error('Daemon JSON drops vdxfkey; use binary serialization');
    }
    for (const field of ['epk', 'ivk', 'ssk'] as const) {
      if (this[field]?.length && this[field].length !== 32) {
        throw new Error(`${field} must be exactly 32 bytes in daemon JSON`);
      }
    }
  }

  /** Reject metadata or fields that the daemon JSON representation cannot retain. */
  toJson(): DataDescriptorJson {
    this.validateJson();
    this.setFlags();

    const result: DataDescriptorJson = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
    };
    if (this.mimeType) result.mimetype = this.mimeType;
    if (this.label) result.label = this.label;

    const processed = new VdxfUniValue();
    processed.fromBuffer(this.objectdata);
    const hasReference = processed.values.some((value) =>
      Object.prototype.hasOwnProperty.call(
        value,
        VDXF_Data.CrossChainDataRefKey.vdxfid
      )
    );
    const text = this.objectdata.toString('utf8');

    // Text mode uses the original bytes, except that references stay structured.
    // Invalid UTF-8 falls back to the same generic VDXF representation as the daemon.
    if (
      this.mimeType?.startsWith('text/') &&
      !hasReference &&
      Buffer.from(text, 'utf8').equals(this.objectdata)
    ) {
      result.objectdata = { message: text };
    } else if (!this.objectdata.length) {
      result.objectdata = null;
    } else {
      result.objectdata = processed.toJson();

      // Tagged parsing can recognize a payload while losing its version or
      // string bytes. Such values must remain in their binary representation.
      const restored = VdxfUniValue.fromJson(result.objectdata);
      if (!restored.toBuffer().equals(this.objectdata)) {
        throw new Error('Object data cannot round-trip through daemon JSON');
      }
    }

    for (const field of ['salt', 'epk', 'ivk', 'ssk'] as const) {
      if (this[field]?.length) result[field] = this[field].toString('hex');
    }
    return result;
  }

  /** Explicit alias for the canonical daemon JSON representation. */
  toDaemonJson(): DataDescriptorJson {
    return this.toJson();
  }
}

export class VDXFDataDescriptor extends BufferDataVdxfObject {
  dataDescriptor: DataDescriptor;

  constructor(
    dataDescriptor?: DataDescriptor,
    vdxfkey: string = '',
    version: BigNumber = new BN(1)
  ) {
    super('', vdxfkey);
    this.version = version;
    if (dataDescriptor) {
      this.dataDescriptor = dataDescriptor;
    }
  }

  static fromDataVdxfObject(data: BufferDataVdxfObject): VDXFDataDescriptor {
    const retval = new VDXFDataDescriptor();
    retval.version = data.version;
    retval.vdxfkey = data.vdxfkey;
    retval.dataDescriptor = new DataDescriptor();
    const payload = data.toDataBuffer();
    if (retval.dataDescriptor.fromBuffer(payload) !== payload.length) {
      throw new Error('Trailing bytes in data descriptor payload');
    }
    delete retval.data;
    return retval;
  }
  dataByteLength(): number {
    let length = 0;

    length += this.dataDescriptor.getByteLength();

    return length;
  }

  toDataBuffer(): Buffer {
    return this.dataDescriptor.toBuffer();
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    const payload = reader.readVarSlice();
    this.dataDescriptor = new DataDescriptor();
    if (this.dataDescriptor.fromBuffer(payload) !== payload.length) {
      throw new Error('Trailing bytes in data descriptor payload');
    }
    delete this.data;

    return reader.offset;
  }

  hasEncryptedData(): boolean {
    return this.dataDescriptor.hasEncryptedData();
  }

  hasLabel(): boolean {
    return this.dataDescriptor.hasLabel();
  }

  hasSalt(): boolean {
    return this.dataDescriptor.hasSalt();
  }

  hasEPK(): boolean {
    return this.dataDescriptor.hasEPK();
  }

  hasIVK(): boolean {
    return this.dataDescriptor.hasIVK();
  }

  hasSSK(): boolean {
    return this.dataDescriptor.hasSSK();
  }

  calcFlags(): BigNumber {
    return this.dataDescriptor.calcFlags();
  }

  setFlags() {
    return this.dataDescriptor.setFlags();
  }
}

export enum EHashTypes {
  HASH_INVALID = HASH_TYPE_INVALID.toNumber(),
  HASH_BLAKE2BMMR = HASH_TYPE_BLAKE2B.toNumber(),
  HASH_BLAKE2BMMR2 = HASH_TYPE_BLAKE2BMMR2.toNumber(),
  HASH_KECCAK = HASH_TYPE_KECCAK256.toNumber(),
  HASH_SHA256D = HASH_TYPE_SHA256D.toNumber(),
  HASH_SHA256 = HASH_TYPE_SHA256.toNumber(),
  HASH_LASTTYPE = HASH_TYPE_SHA256.toNumber(),
}
