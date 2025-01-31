import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../utils/varint'
import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
const { BufferReader, BufferWriter } = bufferutils
import { VdxfUniValue } from '.';
import { BufferDataVdxfObject } from '../vdxf/index';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';
import { SerializableEntity } from '../utils/types/SerializableEntity';

export interface DataDescriptorJson {
  version: number;
  flags?: number;
  objectdata?: string | {['message']: string} | object;
  label?: string;
  mimetype?: string;
  salt?: string;
  epk?: string;
  ivk?: string;
  ssk?: string;
}
export class DataDescriptor implements SerializableEntity  {

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
  static FLAG_MASK = (DataDescriptor.FLAG_ENCRYPTED_DATA.add(
    DataDescriptor.FLAG_SALT_PRESENT).add(
      DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).add(
        DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).add(
          DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).add(
            DataDescriptor.FLAG_LABEL_PRESENT).add(
              DataDescriptor.FLAG_MIME_TYPE_PRESENT));

  version: BigNumber;
  flags: BigNumber;   // Flags indicating what items are present in the object
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
    objectdata?: Buffer,
    label?: string,
    mimeType?: string,
    salt?: Buffer,
    epk?: Buffer,
    ivk?: Buffer,
    ssk?: Buffer
  }) {
    this.flags = new BN(0);
    this.version = DataDescriptor.DEFAULT_VERSION;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.version != null) this.version = data.version
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

      this.SetFlags();

    }
  }

  static fromJson(data: any): DataDescriptor {

    const newDataDescriptor = new DataDescriptor();

    if (data != null) {
      if (data.flags != null) newDataDescriptor.flags = new BN(data.flags)
      if (data.version != null) newDataDescriptor.version = new BN(data.version)
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

    newDataDescriptor.SetFlags();

    return newDataDescriptor;

  }

  DecodeHashVector(): Array<Buffer> {

    const vdxfData = new BufferDataVdxfObject();
    vdxfData.fromBuffer(this.objectdata);
    const hashes = [];

    if (vdxfData.vdxfkey == VDXF_Data.VectorUint256Key.vdxfid) {
      const reader = new BufferReader(Buffer.from(vdxfData.data, 'hex'));
      const count = reader.readVarInt();
      for (let i = 0; i < count.toNumber(); i++) {
        hashes.push(reader.readSlice(32));
      }
    }
    return hashes;

  }

  getByteLength(): number {

    let length = 0;

    length += varint.encodingLength(this.version);
    length += varint.encodingLength(this.flags);
    length += varuint.encodingLength(this.objectdata.length);
    length += this.objectdata.length;

    if (this.HasLabel()) {
      if (this.label.length > 64) {
        throw new Error("Label too long");
      }
      length += varuint.encodingLength(this.label.length);
      length += this.label.length;
    }

    if (this.HasMIME()) {
      if (this.mimeType.length > 128) {
        throw new Error("MIME type too long");
      }
      length += varuint.encodingLength(this.mimeType.length);
      length += this.mimeType.length;
    }

    if (this.HasSalt()) {
      length += varuint.encodingLength(this.salt.length);
      length += this.salt.length;
    }

    if (this.HasEPK()) {
      length += varuint.encodingLength(this.epk.length);
      length += this.epk.length;
    }

    if (this.HasIVK()) {
      length += varuint.encodingLength(this.ivk.length);
      length += this.ivk.length;
    }

    if (this.HasSSK()) {
      length += varuint.encodingLength(this.ssk.length);
      length += this.ssk.length;
    }
    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.version);
    writer.writeVarInt(this.flags);
    writer.writeVarSlice(this.objectdata);

    if (this.HasLabel()) {
      writer.writeVarSlice(Buffer.from(this.label));
    }

    if (this.HasMIME()) {
      writer.writeVarSlice(Buffer.from(this.mimeType));
    }

    if (this.HasSalt()) {
      writer.writeVarSlice(this.salt);
    }

    if (this.HasEPK()) {
      writer.writeVarSlice(this.epk);
    }

    if (this.HasIVK()) {
      writer.writeVarSlice(this.ivk);
    }

    if (this.HasSSK()) {
      writer.writeVarSlice(this.ssk);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);
    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();
    this.objectdata = reader.readVarSlice();

    if (this.HasLabel()) {
      this.label = reader.readVarSlice().toString();
    }

    if (this.HasMIME()) {
      this.mimeType = reader.readVarSlice().toString();
    }

    if (this.HasSalt()) {
      this.salt = reader.readVarSlice();
    }

    if (this.HasEPK()) {
      this.epk = reader.readVarSlice();
    }

    if (this.HasIVK()) {
      this.ivk = reader.readVarSlice();
    }

    if (this.HasSSK()) {
      this.ssk = reader.readVarSlice();
    }
    return reader.offset;

  }

  HasEncryptedData(): boolean {
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).gt(new BN(0));
  }

  HasSalt(): boolean {
    return this.flags.and(DataDescriptor.FLAG_SALT_PRESENT).gt(new BN(0));
  }

  HasEPK(): boolean {
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT).gt(new BN(0));
  }

  HasMIME(): boolean {
    return this.flags.and(DataDescriptor.FLAG_MIME_TYPE_PRESENT).gt(new BN(0));
  }

  HasIVK(): boolean {
    return this.flags.and(DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT).gt(new BN(0));
  }

  HasSSK(): boolean {
    return this.flags.and(DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT).gt(new BN(0));
  }

  HasLabel(): boolean {
    return this.flags.and(DataDescriptor.FLAG_LABEL_PRESENT).gt(new BN(0));
  }

  CalcFlags(): BigNumber {
    return this.flags.and(DataDescriptor.FLAG_ENCRYPTED_DATA).add
      (this.label ? DataDescriptor.FLAG_LABEL_PRESENT : new BN(0)).add
      (this.mimeType ? DataDescriptor.FLAG_MIME_TYPE_PRESENT : new BN(0)).add
      (this.salt ? DataDescriptor.FLAG_SALT_PRESENT : new BN(0)).add
      (this.epk ? DataDescriptor.FLAG_ENCRYPTION_PUBLIC_KEY_PRESENT : new BN(0)).add
      (this.ivk ? DataDescriptor.FLAG_INCOMING_VIEWING_KEY_PRESENT : new BN(0)).add
      (this.ssk ? DataDescriptor.FLAG_SYMMETRIC_ENCRYPTION_KEY_PRESENT : new BN(0));
  }

  SetFlags() {
    this.flags = this.CalcFlags();
  }

  isValid(): boolean {
    return !!(this.version.gte(DataDescriptor.FIRST_VERSION) && this.version.lte(DataDescriptor.LAST_VERSION) && this.flags.and(DataDescriptor.FLAG_MASK.notn(DataDescriptor.FLAG_MASK.bitLength())));
  }

  toJson():DataDescriptorJson {

    const retval: DataDescriptorJson = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber()
    };

    let isText = false;
    if (this.mimeType) {
      retval['mimetype'] = this.mimeType;
      if (this.mimeType.startsWith("text/")) isText = true;
    }

    let processedObject = new VdxfUniValue();
    
    processedObject.fromBuffer(this.objectdata)

    if (isText && ((processedObject.values.get("") === "string") || Buffer.isBuffer(processedObject.values.get("")))) {
      const objectDataUni = { message: ''};
      if(processedObject.values.get("") === "string") {
        objectDataUni.message = processedObject.values.get("") as string;
      } else {
        objectDataUni.message = (processedObject.values.get("") as Buffer).toString('utf-8');
      }
      retval['objectdata'] = objectDataUni;

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
    retval.data = data.data;
    retval.fromBuffer(Buffer.from(retval.data, 'hex'));
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
    this.dataDescriptor.fromBuffer(Buffer.from(this.data, 'hex'), reader.offset);
    delete this.data;

    return reader.offset;
  }

  HasEncryptedData(): boolean {
    return this.dataDescriptor.HasEncryptedData();
  }

  HasLabel(): boolean {
    return this.dataDescriptor.HasLabel();
  }

  HasSalt(): boolean {
    return this.dataDescriptor.HasSalt();
  }

  HasEPK(): boolean {
    return this.dataDescriptor.HasEPK();
  }

  HasIVK(): boolean {
    return this.dataDescriptor.HasIVK();
  }

  HasSSK(): boolean {
    return this.dataDescriptor.HasSSK();
  }

  CalcFlags(): BigNumber {
    return this.dataDescriptor.CalcFlags();
  }

  SetFlags() {
    return this.dataDescriptor.SetFlags();
  }

};

export enum EHashTypes {
  HASH_INVALID = 0,
  HASH_BLAKE2BMMR = 1,
  HASH_BLAKE2BMMR2 = 2,
  HASH_KECCAK = 3,
  HASH_SHA256D = 4,
  HASH_SHA256 = 5,
  HASH_LASTTYPE = 5
};

