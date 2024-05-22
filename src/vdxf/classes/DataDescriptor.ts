import { BigNumber } from '../../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../../utils/varint'
import varuint from '../../utils/varuint'
import bufferutils from '../../utils/bufferutils'
const { BufferReader, BufferWriter } = bufferutils
import { isHexString } from '../../utils/string';
import { fromBase58Check, toBase58Check } from '../../utils/address';
import { CurrencyValueMap } from '../../pbaas/CurrencyValueMap';
import { Rating } from '../../pbaas/Rating';
import { TransferDestination } from '../../pbaas/TransferDestination';
import { ContentMultiMapRemove } from '../../pbaas/ContentMultiMapRemove';
import { CrossChainDataRef } from './CrossChainDataRef';
import { VDXF_OBJECT_DEFAULT_VERSION, HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../../constants/vdxf';
import { SignatureData } from './SignatureData';
import { BufferDataVdxfObject } from '../index';
import * as VDXF_Data from '../vdxfDataKeys';

export class DataDescriptor {

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
      if (data.objectdata != null) newDataDescriptor.objectdata = VectorEncodeVDXFUni(data.objectdata)
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

    if (vdxfData.vdxfkey == VDXF_Data.VectorUint256Key().vdxfid) {
      const reader = new BufferReader(Buffer.from(vdxfData.data, 'hex'));
      const count = reader.readVarInt();
      for (let i = 0; i < count.toNumber(); i++) {
        hashes.push(reader.readSlice(32));
      }
    }
    return hashes;

  }

  byteLength(): number {

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
    const writer = new BufferWriter(Buffer.alloc(this.byteLength()));

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

  IsValid(): boolean {
    return !!(this.version.gte(DataDescriptor.FIRST_VERSION) && this.version.lte(DataDescriptor.LAST_VERSION) && this.flags.and(DataDescriptor.FLAG_MASK.notn(DataDescriptor.FLAG_MASK.bitLength())));
  }

  toJson() {

    const retval = {
      version: this.version.toString(),
      flags: this.flags.toString()
    };

    let isText = false;
    if (this.mimeType) {
      retval['mimetype'] = this.mimeType;
      if(this.mimeType.startsWith("text/")) isText = true;
    }
    
    let processedObject = VDXFDataToUniValueArray(this.objectdata)

    if (isText && typeof processedObject === 'string' || processedObject instanceof String) {

      let objectDataUni = {message: Buffer.from(processedObject, 'hex').toString('utf-8')};
      retval['objectdata'] = objectDataUni;

    } else {
      retval['objectdata'] = processedObject;
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

  constructor( dataDescriptor?: DataDescriptor,
  vdxfkey: string = "",
  version: BigNumber = new BN(1)) {
    super("", vdxfkey);
    this.version = version;
    if (dataDescriptor) {
      this.dataDescriptor = dataDescriptor;
    }
  }

  static fromDataVdfxObject(data: BufferDataVdxfObject): VDXFDataDescriptor {

    const retval = new VDXFDataDescriptor();
    retval.version = data.version;
    retval.data = data.data;
    retval.fromBuffer(Buffer.from(retval.data, 'hex'));
    delete retval.data;
    return retval;

  }
  dataByteLength(): number {

    let length = 0;

    length += this.dataDescriptor.byteLength();

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


export class MMRDescriptor {
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

  static fromJson(data: any): MMRDescriptor {

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

  byteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.version);
    length += varint.encodingLength(new BN(this.objectHashType));
    length += varint.encodingLength(new BN(this.mmrHashType));
    length += this.mmrRoot.byteLength();
    length += this.mmrHashes.byteLength();
    length += varuint.encodingLength(this.dataDescriptors.length);
    this.dataDescriptors.forEach((dataDescriptor) => {
      length += dataDescriptor.byteLength();
    });

    return length;
  }

  toBuffer(): Buffer {

    const writer = new BufferWriter(Buffer.alloc(this.byteLength()));

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

  HasData(): boolean {
    return !!(this.mmrHashes.objectdata && this.dataDescriptors);
  }

  IsValid(): boolean {
    return this.version >= MMRDescriptor.FIRST_VERSION && this.version <= MMRDescriptor.LAST_VERSION;
  }

  toJson() {

    const retval = {
      version: this.version.toString(),
      objecthashtype: this.objectHashType,
      mmrhashtype: this.mmrHashType,
      mmrroot: this.mmrRoot.toJson(),
      mmrhashes: this.mmrHashes.toJson(),
      datadescriptors: this.dataDescriptors.map((dataDescriptor) => dataDescriptor.toJson())
    };

    return retval;
  }
};

export const VectorEncodeVDXFUni = (obj): Buffer => {
  let ss = Buffer.from('');

  if (typeof (obj) != 'object') {
    if (typeof (obj) != 'string') throw new Error('VectorEncodeVDXFUni: not JSON string as expected');
    if (isHexString(obj)) {
      return Buffer.from(obj, "hex");
    }
    return Buffer.from(obj, "utf-8");
  }

  if (obj.serializedHex) {
    if (!isHexString(obj.serializedHex)) {
      throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
    }
    return Buffer.from(obj.serializedHex);
  }

  if (obj.serializedBase64) {
    try {
      return Buffer.from(obj.serializedBase64, 'base64');
    } catch (e) {
      throw new Error("contentmap: If the \"serializedBase64\" key is present, it's data must be only valid base64 and complete");
    }
  }

  if (obj.message) {
    return Buffer.from(obj.message, "utf-8");
  }

  // this should be an object with "vdxfkey" as the key and {object} as the json object to serialize
  const oneValKeys = Object.keys(obj);
  const oneValValues = Object.values(obj);

  for (let k = 0; k < oneValKeys.length; k++) {
    const objTypeKey = oneValKeys[k];
    if (objTypeKey == VDXF_Data.DataByteKey().vdxfid) {
      const oneByte = Buffer.from(oneValValues[k] as string, "hex");
      if (oneByte.length != 1) {
        throw new Error("contentmap: byte data must be exactly one byte");
      }
      ss = Buffer.concat([ss, oneByte]);
    }
    else if (objTypeKey == VDXF_Data.DataInt16Key().vdxfid) {
      const oneShort = Buffer.alloc(2);
      oneShort.writeInt16LE(oneValValues[k] as number);
      ss = Buffer.concat([ss, oneShort]);
    }
    else if (objTypeKey == VDXF_Data.DataUint16Key().vdxfid) {
      const oneUShort = Buffer.alloc(2);
      oneUShort.writeUInt16LE(oneValValues[k] as number);
      ss = Buffer.concat([ss, oneUShort]);
    }
    else if (objTypeKey == VDXF_Data.DataInt32Key().vdxfid) {
      const oneInt = Buffer.alloc(4);
      oneInt.writeInt32LE(oneValValues[k] as number);
      ss = Buffer.concat([ss, oneInt]);

    }
    else if (objTypeKey == VDXF_Data.DataUint32Key().vdxfid) {
      const oneUInt = Buffer.alloc(4);
      oneUInt.writeUInt32LE(oneValValues[k] as number);
      ss = Buffer.concat([ss, oneUInt]);
    }
    else if (objTypeKey == VDXF_Data.DataInt64Key().vdxfid) {
      const oneInt64 = Buffer.alloc(8);
      oneInt64.writeIntLE(oneValValues[k] as number, 0, 8);
      ss = Buffer.concat([ss, oneInt64]);
    }
    else if (objTypeKey == VDXF_Data.DataUint160Key().vdxfid) {
      const oneKey = fromBase58Check(oneValValues[k] as string).hash;
      ss = Buffer.concat([ss, oneKey]);
    }
    else if (objTypeKey == VDXF_Data.DataUint256Key().vdxfid) {
      const oneHash = Buffer.from(oneValValues[k] as string, "hex");
      if (oneHash.length != 32) {
        throw new Error("contentmap: hash data must be exactly 32 bytes");
      }
      ss = Buffer.concat([ss, oneHash.reverse()]);
    }
    else if (objTypeKey == VDXF_Data.DataStringKey().vdxfid) {

      let length = 20;
      length += 1;
      const encodedLength = varuint.encodingLength(Buffer.from(oneValValues[k] as string, "utf-8").length)
      length += varuint.encodingLength(encodedLength + Buffer.from(oneValValues[k] as string, "utf-8").length);
      length += encodedLength;
      length += Buffer.from(oneValValues[k] as string, "utf-8").length;

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(new BN(1));
      writer.writeCompactSize(encodedLength + Buffer.from(oneValValues[k] as string, "utf-8").length);
      writer.writeVarSlice(Buffer.from(oneValValues[k] as string, "utf-8"));

      ss = Buffer.concat([ss, writer.buffer]);
    }
    else if (objTypeKey == VDXF_Data.DataByteVectorKey().vdxfid) {

      let length = 20;
      length += 1;
      const encodedLength = varuint.encodingLength(Buffer.from(oneValValues[k] as string, "hex").length)
      length += varuint.encodingLength(encodedLength + Buffer.from(oneValValues[k] as string, "hex").length);
      length += encodedLength;
      length += Buffer.from(oneValValues[k] as string, "hex").length;

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(new BN(1));
      writer.writeCompactSize(encodedLength + Buffer.from(oneValValues[k] as string, "hex").length);
      writer.writeVarSlice(Buffer.from(oneValValues[k] as string, "hex"));

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.DataCurrencyMapKey().vdxfid) {

      const destinations = Object.keys(oneValValues[k]);
      const values = Object.values(oneValValues[k]);

      const oneCurMap = new CurrencyValueMap({ value_map: new Map(destinations.map((key, index) => [key, new BN(values[index])])), multivalue: true });

      let length = 20;
      length += 1;
      length += varuint.encodingLength(oneCurMap.getByteLength());
      length += oneCurMap.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(new BN(1));
      writer.writeCompactSize(oneCurMap.getByteLength());
      writer.writeSlice(oneCurMap.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.DataRatingsKey().vdxfid) {

      const version = new BN((oneValValues[k] as { version: number }).version);
      const trustLevel = new BN((oneValValues[k] as { trustLevel: number }).trustLevel);

      const destinations = Object.keys((oneValValues[k] as { rating: BigNumber }).rating);
      const values = Object.values(oneValValues[k]);

      const oneRatingMap = new Rating({ ratings: new Map(destinations.map((key, index) => [key, Buffer.from(values[index], 'hex')])), version, trustLevel });

      let length = 20;
      length += varint.encodingLength(oneRatingMap.version);
      length += varuint.encodingLength(oneRatingMap.getByteLength());
      length += oneRatingMap.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(oneRatingMap.version);
      writer.writeCompactSize(oneRatingMap.getByteLength());
      writer.writeSlice(oneRatingMap.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.DataTransferDestinationKey().vdxfid) {

      const transferDest = new TransferDestination(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(transferDest.typeNoFlags());
      length += varuint.encodingLength(transferDest.getByteLength());
      length += transferDest.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(transferDest.typeNoFlags());
      writer.writeCompactSize(transferDest.getByteLength());
      writer.writeSlice(transferDest.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.ContentMultiMapRemoveKey().vdxfid) {

      const transferDest = new ContentMultiMapRemove(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(transferDest.version);
      length += varuint.encodingLength(transferDest.getByteLength());
      length += transferDest.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(transferDest.version);
      writer.writeCompactSize(transferDest.getByteLength());
      writer.writeSlice(transferDest.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.CrossChainDataRefKey().vdxfid) {

      const transferDest = new CrossChainDataRef(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(VDXF_OBJECT_DEFAULT_VERSION);
      length += varuint.encodingLength(transferDest.getByteLength());
      length += transferDest.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(VDXF_OBJECT_DEFAULT_VERSION);
      writer.writeCompactSize(transferDest.getByteLength());
      writer.writeSlice(transferDest.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.DataDescriptorKey().vdxfid) {

      const descr = DataDescriptor.fromJson(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(descr.version);
      length += varuint.encodingLength(descr.byteLength());
      length += descr.byteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(descr.version);
      writer.writeCompactSize(descr.byteLength());
      writer.writeSlice(descr.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.MMRDescriptorKey().vdxfid) {

      const descr = MMRDescriptor.fromJson(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(descr.version);
      length += varuint.encodingLength(descr.byteLength());
      length += descr.byteLength();

      const writer = new BufferWriter(Buffer.alloc(length));

      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(descr.version);
      writer.writeCompactSize(descr.byteLength());
      writer.writeSlice(descr.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else if (objTypeKey == VDXF_Data.SignatureDataKey().vdxfid) {

      const sigData = SignatureData.fromJson(oneValValues[k]);

      let length = 20;
      length += varint.encodingLength(sigData.version);
      length += varuint.encodingLength(sigData.getByteLength());
      length += sigData.getByteLength();

      const writer = new BufferWriter(Buffer.alloc(length));
      writer.writeSlice(fromBase58Check(objTypeKey).hash);
      writer.writeVarInt(sigData.version);
      writer.writeCompactSize(sigData.getByteLength());
      writer.writeSlice(sigData.toBuffer());

      ss = Buffer.concat([ss, writer.buffer]);

    }
    else {
      throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + oneValValues[k]);
    }
  }
  return ss;
}


export const VDXFDataToUniValue = (buffer: Buffer, offset: number = 0, pSuccess = null) => {
    const reader = new BufferReader(buffer, offset);
    let objectUni: any;
    try
    {
        let checkVal: string;
        let version = new BN(0);
        let objSize = 0;
        checkVal = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

        if (checkVal == VDXF_Data.DataCurrencyMapKey().vdxfid)
        {
            const oneCurrencyMap = new CurrencyValueMap();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneCurrencyMap.fromBuffer(reader.buffer, reader.offset);
            if (oneCurrencyMap.IsValid())
            {
                objectUni = {[checkVal]: oneCurrencyMap.toJson()};
            }
        }
        else if (checkVal == VDXF_Data.DataRatingsKey().vdxfid)
        {
            const oneRatingObj = new Rating();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneRatingObj.fromBuffer(reader.buffer, reader.offset);
            if (oneRatingObj.IsValid())
            {
              objectUni = {[checkVal]: oneRatingObj.toJson()};
            }
        }
        else if (checkVal == VDXF_Data.DataTransferDestinationKey().vdxfid)
        {
            const oneTransferDest = new TransferDestination();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = oneTransferDest.fromBuffer(reader.buffer, reader.offset);
            if (oneTransferDest.IsValid())
            {
              objectUni = {[checkVal]: oneTransferDest.toJson()};
            }
        }
        else if (checkVal == VDXF_Data.ContentMultiMapRemoveKey().vdxfid)
        {
          throw new Error("ContentMultiMapRemoveKey not implemented");
          // TODO: Implement ContentMultiMapRemoveKey

          // CContentMultiMapRemove oneContentRemove;
            // ss >> VARINT(version);
            // ss >> COMPACTSIZE(objSize);
            // ss >> oneContentRemove;
            // if (oneContentRemove.IsValid())
            // {
            //     objectUni = UniValue(UniValue::VOBJ);
            //     objectUni.pushKV(EncodeDestination(CIdentityID(checkVal)), oneContentRemove.ToUniValue());
            // }
        }
        else if (checkVal == VDXF_Data.DataStringKey().vdxfid)
        {
            let stringVal:string;
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            stringVal = reader.readVarSlice().toString('utf-8');
            objectUni = {[checkVal]: stringVal};
        }
        else if (checkVal == VDXF_Data.DataByteVectorKey().vdxfid)
        {
            let vecVal: Buffer;
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            vecVal = reader.readVarSlice();
            objectUni = {[checkVal]: vecVal.toString('hex')};
        }
        else if (checkVal == VDXF_Data.CrossChainDataRefKey().vdxfid)
        {
            throw new Error("CrossChainDataRefKey not implemented");
            // TODO: Implement CrossChainDataRefKey
            // CCrossChainDataRef dataRef;
            // ss >> VARINT(version);
            // ss >> COMPACTSIZE(objSize);
            // ss >> dataRef;
            // if (dataRef.IsValid())
            // {
            //     objectUni = UniValue(UniValue::VOBJ);
            //     objectUni.pushKV(EncodeDestination(CIdentityID(checkVal)), dataRef.ToUniValue());
            // }
        }
        else if (checkVal == VDXF_Data.DataDescriptorKey().vdxfid)
        {
            const dataDescriptor = new DataDescriptor();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = dataDescriptor.fromBuffer(reader.buffer, reader.offset);
            if (dataDescriptor.IsValid())
            {
              objectUni = {[checkVal]: dataDescriptor.toJson()};
            }
        }
        else if (checkVal == VDXF_Data.MMRDescriptorKey().vdxfid)
        {
            const mmrDescriptor = new MMRDescriptor();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = mmrDescriptor.fromBuffer(reader.buffer, reader.offset);
            if (mmrDescriptor.IsValid())
            {
              objectUni = {[checkVal]: mmrDescriptor.toJson()};
            }
        }
        else if (checkVal == VDXF_Data.SignatureDataKey().vdxfid)
        {
            const sigData = new SignatureData();
            version = reader.readVarInt();
            objSize = reader.readCompactSize();
            reader.offset = sigData.fromBuffer(reader.buffer, reader.offset);
            if (sigData.IsValid())
            {
              objectUni = {[checkVal]: sigData.toJson()};
            }
        }

        // if we have an object that we recognized, encode it
        if (objectUni)
          {
              if (pSuccess != null)
              {
                  pSuccess.value = true;
              }
          }
          else
          {
              if (pSuccess != null)
              {
                  pSuccess.value = false;
              }
          }
      }
      catch (e)
      {
          if (pSuccess != null)
          {
              pSuccess.value = false;
          }
      }
    return { objectUni, offset: reader.offset, pSuccess };
}

export const VDXFDataToUniValueArray = (buffer: Buffer, offset: number = 0) => {
  let entryArr = [];
  const reader = new BufferReader(buffer, offset);
  let bytesLeft = buffer.length;

  while (bytesLeft > 20) // size of uint160
  {
      let objOut = { value: false};
      const { objectUni, offset} = VDXFDataToUniValue(reader.buffer, reader.offset, objOut);
      reader.offset = offset;
      bytesLeft = buffer.length - reader.offset;
      if (objOut.value)
      {
          entryArr.push(objectUni);
      }
      else
      {
          // add the remaining data as a hex string
          reader.offset = reader.offset - 20;
          entryArr.push(reader.readSlice(bytesLeft + 20).toString('hex'));
          bytesLeft = 0;
          break;
      }
  }
  if (bytesLeft && bytesLeft <= 20)
  {
      entryArr.push(reader.readSlice(bytesLeft).toString('hex'));
  }
  return entryArr.length == 0 ? null : (entryArr.length == 1 ? entryArr[0] : entryArr);

}