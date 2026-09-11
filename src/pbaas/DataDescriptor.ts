import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../utils/varint'
import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
const { BufferReader, BufferWriter } = bufferutils
import { VdxfUniValue } from './VdxfUniValue';
import { BufferDataVdxfObject } from '../vdxf/index';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { HASH_TYPE_BLAKE2B, HASH_TYPE_BLAKE2BMMR2, HASH_TYPE_INVALID, HASH_TYPE_KECCAK256, HASH_TYPE_SHA256, HASH_TYPE_SHA256D } from '../constants/pbaas';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, NULL_ADDRESS } from '../constants/vdxf';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { readLimitedString } from '../utils/string';

export interface DataDescriptorJson {
  version: number;
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

export class DataDescriptor extends SerializableEntityBase implements SerializableEntity {
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
  static FLAG_MASK = (DataDescriptor.FLAG_ENCRYPTED_DATA.add(
    DataDescriptor.FLAG_SALT_PRESENT).add(
      DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).add(
        DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).add(
          DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).add(
            DataDescriptor.FLAG_LABEL_PRESENT).add(
              DataDescriptor.FLAG_MIME_TYPE_PRESENT).add(
                DataDescriptor.FLAG_VDXF_KEY_PRESENT));

  version: BigNumber;
  flags: BigNumber;   // Flags indicating what items are present in the object
  vdxfKey: string;    // optional VDXF key identifying the object data type
  objectdata: Buffer; // either direct data or serialized UTXORef +offset, length, and/or other type of info for different links
  label: string;      // label associated with this data
  mimeType: string;   // optional mime type
  salt: Buffer;       // encryption public key, data only present if encrypted or data referenced by unencrypted link is encrypted
  epk: Buffer;        // encryption public key, data only present if encrypted or data referenced by unencrypted link is encrypted
  ivk: Buffer;        // incoming viewing key, optional and contains data only if full viewing key is published at this encryption level
  ssk: Buffer;        // specific symmetric key, optional and only to decrypt this linked sub-object

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    vdxfKey?: string,
    objectdata?: Buffer,
    label?: string,
    mimeType?: string,
    salt?: Buffer,
    epk?: Buffer,
    ivk?: Buffer,
    ssk?: Buffer
  }) {
    super();
    this.flags = new BN(0);
    this.version = DataDescriptor.DEFAULT_VERSION;
    this.vdxfKey = "";
    this.objectdata = Buffer.from([]);

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.version != null) this.version = data.version
      if (data.vdxfKey != null) this.vdxfKey = data.vdxfKey
      if (data.objectdata != null) this.objectdata = data.objectdata
      if (data.label != null) this.label = data.label;
      if (data.mimeType != null) this.mimeType = data.mimeType;
      if (data.salt != null) this.salt = data.salt;

      if (data.epk != null) this.epk = data.epk;
      if (data.ivk != null) this.ivk = data.ivk;
      if (data.ssk != null) this.ssk = data.ssk;

      if (this.label && this.label.length > 64) {
        this.label = this.label.slice(0, 64);
      }
      if (this.mimeType && this.mimeType.length > 128) {
        this.mimeType = this.mimeType.slice(0, 128);
      }

      this.setFlags();

    }
  }

  static fromJson(data: any): DataDescriptor {
    const newDataDescriptor = new DataDescriptor();

    if (data != null) {
      if (data.flags != null) newDataDescriptor.flags = new BN(data.flags)
      if (data.version != null) newDataDescriptor.version = new BN(data.version)
      if (data.vdxfkey != null) newDataDescriptor.vdxfKey = data.vdxfkey;
      if (data.objectdata != null) newDataDescriptor.objectdata = VdxfUniValue.fromJson(data.objectdata).toBuffer();
      if (data.label != null) newDataDescriptor.label = data.label;
      if (data.mimetype != null) newDataDescriptor.mimeType = data.mimetype;
      if (data.salt != null) newDataDescriptor.salt = Buffer.from(data.salt, 'hex');
      if (data.epk != null) newDataDescriptor.epk = Buffer.from(data.epk, 'hex');
      if (data.ivk != null) newDataDescriptor.ivk = Buffer.from(data.ivk, 'hex');
      if (data.ssk != null) newDataDescriptor.ssk = Buffer.from(data.ssk, 'hex');

      if (newDataDescriptor.label && newDataDescriptor.label.length > 64) {
        newDataDescriptor.label = newDataDescriptor.label.slice(0, 64);
      }
      if (newDataDescriptor.mimeType && newDataDescriptor.mimeType.length > 128) {
        newDataDescriptor.mimeType = newDataDescriptor.mimeType.slice(0, 128);
      }
    };

    newDataDescriptor.setFlags();

    return newDataDescriptor;
  }

  decodeHashVector(): Array<Buffer> {
    const vdxfData = new BufferDataVdxfObject();
    vdxfData.fromBuffer(this.objectdata);
    const hashes = [];

    if (vdxfData.vdxfkey == VDXF_Data.VectorUint256Key.vdxfid) {
      const reader = new BufferReader(Buffer.from(vdxfData.data, 'hex'));
      const count = reader.readCompactSize();
      for (let i = 0; i < count; i++) {
        hashes.push(reader.readSlice(32));
      }
    }
    return hashes;
  }

  getByteLength(): number {

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
      if (labelLength > 64) {
        throw new Error("Label too long");
      }
      length += varuint.encodingLength(labelLength);
      length += labelLength;
    }

    if (this.hasMIME()) {
      const mimeLength = Buffer.byteLength(this.mimeType, 'utf8');
      if (mimeLength > 128) {
        throw new Error("MIME type too long");
      }
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
    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    if (this.hasVDXFKey()) {
      this.vdxfKey = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
    } else {
      this.vdxfKey = "";
    }
    this.objectdata = reader.readVarSlice();

    if (this.hasLabel()) {
      this.label = readLimitedString(reader, 64).toString('utf8');
    } else this.label = undefined;

    if (this.hasMIME()) {
      this.mimeType = readLimitedString(reader, 128).toString('utf8');
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
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).gt(new BN(0));
  }

  hasMIME(): boolean {
    return this.flags.and(DataDescriptor.FLAG_MIME_TYPE_PRESENT).gt(new BN(0));
  }

  hasIVK(): boolean {
    return this.flags.and(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).gt(new BN(0));
  }

  hasSSK(): boolean {
    return this.flags.and(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).gt(new BN(0));
  }

  hasLabel(): boolean {
    return this.flags.and(DataDescriptor.FLAG_LABEL_PRESENT).gt(new BN(0));
  }

  calcFlags(): BigNumber {
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).add
      (this.vdxfKey && this.vdxfKey !== NULL_ADDRESS ? DataDescriptor.FLAG_VDXF_KEY_PRESENT : new BN(0)).add
      (this.label ? DataDescriptor.FLAG_LABEL_PRESENT : new BN(0)).add
      (this.mimeType ? DataDescriptor.FLAG_MIME_TYPE_PRESENT : new BN(0)).add
      (this.salt ? DataDescriptor.FLAG_SALT_PRESENT : new BN(0)).add
      (this.epk ? DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT : new BN(0)).add
      (this.ivk ? DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT : new BN(0)).add
      (this.ssk ? DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT : new BN(0));
  }

  setFlags() {
    this.flags = this.calcFlags();
  }

  isValid(): boolean {
    if (!this.version.gte(DataDescriptor.FIRST_VERSION) || !this.version.lte(DataDescriptor.LAST_VERSION)) {
      return false;
    }

    if (this.flags.isNeg() || !this.flags.and(DataDescriptor.FLAG_MASK).eq(this.flags)) {
      return false;
    }

    return (!this.label || Buffer.byteLength(this.label, 'utf8') <= 64) &&
      (!this.mimeType || Buffer.byteLength(this.mimeType, 'utf8') <= 128);
  }

  toJson(): DataDescriptorJson {

    this.setFlags();

    const retval: DataDescriptorJson = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber()
    };

    if (this.hasVDXFKey()) retval['vdxfkey'] = this.vdxfKey;

    let isText = false;
    if (this.mimeType) {
      retval['mimetype'] = this.mimeType;
      if (this.mimeType.startsWith("text/")) isText = true;
    }

    let processedObject = new VdxfUniValue();

    processedObject.fromBuffer(this.objectdata);

    if (processedObject.values[0]?.[""]) {

      const keys = Object.keys(processedObject.values[0]);
      const values = Object.values(processedObject.values[0]);

      if (isText && Buffer.isBuffer(values[0]) && keys[0] === "") {
        const objectDataUni = { message: '' };

        objectDataUni.message = values[0].toString('utf8');

        retval['objectdata'] = objectDataUni;

      } else if (Buffer.isBuffer(values[0])) {
        retval['objectdata'] = (values[0] as Buffer).toString('hex');
      }
    } else {
      retval['objectdata'] = processedObject.toJson();
    }

    if (this.label) retval['label'] = this.label;
    if (this.salt) retval['salt'] = this.salt.toString('hex');
    if (this.epk) retval['epk'] = this.epk.toString('hex');
    if (this.ivk) retval['ivk'] = this.ivk.toString('hex');
    if (this.ssk) retval['ssk'] = this.ssk.toString('hex');

    return retval;
  }
};

export class VDXFDataDescriptor extends BufferDataVdxfObject {
  dataDescriptor: DataDescriptor;

  constructor(dataDescriptor?: DataDescriptor,
    vdxfkey: string = "",
    version: BigNumber = new BN(1)) {
    super("", vdxfkey);
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
    retval.dataDescriptor.fromBuffer(data.toDataBuffer());
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

    this.data = reader.readVarSlice().toString('hex');

    this.dataDescriptor = new DataDescriptor();
    this.dataDescriptor.fromBuffer(Buffer.from(this.data, 'hex'));
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

};

export enum EHashTypes {
  HASH_INVALID = HASH_TYPE_INVALID.toNumber(),
  HASH_BLAKE2BMMR = HASH_TYPE_BLAKE2B.toNumber(),
  HASH_BLAKE2BMMR2 = HASH_TYPE_BLAKE2BMMR2.toNumber(),
  HASH_KECCAK = HASH_TYPE_KECCAK256.toNumber(),
  HASH_SHA256D = HASH_TYPE_SHA256D.toNumber(),
  HASH_SHA256 = HASH_TYPE_SHA256.toNumber(),
  HASH_LASTTYPE = HASH_TYPE_SHA256.toNumber()
};
