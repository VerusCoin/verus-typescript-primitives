import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import bufferutils from '../utils/bufferutils';
import { IdentityID } from './IdentityID';
import { KeyID } from './KeyID';
import { SaplingPaymentAddress } from './SaplingPaymentAddress';
import varuint from '../utils/varuint';
import { Hash160SerEnt } from '../vdxf/classes/Hash160';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, R_ADDR_VERSION } from '../constants/vdxf';
import { PartialMMRData } from './PartialMMRData';

const { BufferReader, BufferWriter } = bufferutils;

export type PartialSignDataInitData = {
  flags?: BigNumber;
  address?: IdentityID | KeyID;
  prefixstring?: Buffer;
  vdxfkeys?: Array<IdentityID>;
  vdxfkeynames?: Array<Buffer>;
  boundhashes?: Array<Buffer>;
  hashtype?: BigNumber;
  encrypttoaddress?: SaplingPaymentAddress;
  createmmr?: boolean;
  signature?: Buffer;
  datatype?: BigNumber;
  data?: Buffer | PartialMMRData;
}

export class PartialSignData implements SerializableEntity {
  flags: BigNumber;
  address?: IdentityID | KeyID;
  prefixstring?: Buffer; // UTF-8 Encoded prefix string
  vdxfkeys?: Array<IdentityID>;
  vdxfkeynames?: Array<Buffer>; // UTF-8 Encoded vdxf key names
  boundhashes?: Array<Buffer>;
  hashtype?: BigNumber;
  encrypttoaddress?: SaplingPaymentAddress;
  createmmr?: boolean;
  signature?: Buffer;

  datatype?: BigNumber;
  data?: Buffer | PartialMMRData;

  static CONTAINS_DATA = new BN("1", 10);
  static CONTAINS_ADDRESS = new BN("2", 10);
  static CONTAINS_ENCRYPTTOADDRESS = new BN("4", 10);
  static CONTAINS_CURRENTSIG = new BN("8", 10);
  static CONTAINS_PREFIXSTRING = new BN("16", 10);
  static CONTAINS_VDXFKEYS = new BN("32", 10);
  static CONTAINS_VDXFKEYNAMES = new BN("64", 10);
  static CONTAINS_BOUNDHASHES = new BN("128", 10);

  static DATA_TYPE_UNKNOWN = new BN("0", 10);
  static DATA_TYPE_MMRDATA = new BN("1", 10);
  static DATA_TYPE_FILENAME = new BN("2", 10);
  static DATA_TYPE_MESSAGE = new BN("3", 10);
  static DATA_TYPE_VDXFDATA = new BN("4", 10);
  static DATA_TYPE_MESSAGEHEX = new BN("5", 10);
  static DATA_TYPE_MESSAGEBASE64 = new BN("6", 10);
  static DATA_TYPE_DATAHASH = new BN("7", 10);

  static HASH_TYPE_SHA256 = new BN("1", 10);
  static HASH_TYPE_SHA256D = new BN("2", 10);
  static HASH_TYPE_BLAKE2B = new BN("3", 10);
  static HASH_TYPE_KECCAK256 = new BN("4", 10);
  static DEFAULT_HASH_TYPE = PartialSignData.HASH_TYPE_SHA256;
  
  constructor(data?: PartialSignDataInitData) {
    this.flags = data && data.flags ? data.flags : new BN("0");
    this.createmmr = data && data.createmmr ? data.createmmr : false;
    
    if (data?.address) {
      this.toggleContainsAddress();
      this.address = data.address;
    }

    if (data?.prefixstring) {
      this.toggleContainsPrefixString();
      this.prefixstring = data.prefixstring;
    }

    if (data?.vdxfkeys) {
      this.toggleContainsVdxfKeys();
      this.vdxfkeys = data.vdxfkeys;
    }

    if (data?.vdxfkeynames) {
      this.toggleContainsVdxfKeyNames();
      this.vdxfkeynames = data.vdxfkeynames;
    }

    if (data?.boundhashes) {
      if (data?.hashtype) {
        this.hashtype = data.hashtype;
      } else this.hashtype = PartialSignData.DEFAULT_HASH_TYPE;

      this.toggleContainsBoundHashes();
      this.boundhashes = data.boundhashes;
    }

    if (data?.encrypttoaddress) {
      this.toggleContainsEncryptToAddress();
      this.encrypttoaddress = data.encrypttoaddress;
    }
    
    if (data?.signature) {
      this.toggleContainsCurrentSig();
      this.signature = data.signature;
    }

    if (data?.datatype && data?.data) {
      this.toggleContainsData();
      this.data = data.data;
      this.datatype = data.datatype;
    }
  }

  protected serializeData() {
    return !!(this.flags.and(PartialSignData.CONTAINS_DATA).toNumber());
  }

  protected serializeAddress() {
    return !!(this.flags.and(PartialSignData.CONTAINS_ADDRESS).toNumber());
  }

  protected serializeEncrypttoAddress() {
    return !!(this.flags.and(PartialSignData.CONTAINS_ENCRYPTTOADDRESS).toNumber());
  }

  protected serializeCurrentSig() {
    return !!(this.flags.and(PartialSignData.CONTAINS_CURRENTSIG).toNumber());
  }

  protected serializePrefixString() {
    return !!(this.flags.and(PartialSignData.CONTAINS_PREFIXSTRING).toNumber());
  }

  protected serializeVdxfKeys() {
    return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYS).toNumber());
  }

  protected serializeVdxfKeyNames() {
    return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYNAMES).toNumber());
  }

  protected serializeBoundhashes() {
    return !!(this.flags.and(PartialSignData.CONTAINS_BOUNDHASHES).toNumber());
  }

  private toggleContainsData() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_DATA);
  }

  private toggleContainsAddress() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_ADDRESS);
  }

  private toggleContainsEncryptToAddress() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_ENCRYPTTOADDRESS);
  }

  private toggleContainsCurrentSig() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_CURRENTSIG);
  }

  private toggleContainsPrefixString() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_PREFIXSTRING);
  }

  private toggleContainsVdxfKeys() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_VDXFKEYS);
  }

  private toggleContainsVdxfKeyNames() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_VDXFKEYNAMES);
  }

  private toggleContainsBoundHashes() {
    this.flags = this.flags.xor(PartialSignData.CONTAINS_BOUNDHASHES);
  }

  isMMRData(): boolean {
    return this.datatype && this.datatype.eq(PartialSignData.DATA_TYPE_MMRDATA);
  }

  private getPartialSignDataByteLength(): number {
    function calculateVectorLength(items: any[], getItemLength: (item: any) => number, varlength: boolean = true): number {
      let totalLength = 0;
      totalLength += varuint.encodingLength(items.length);
    
      for (const item of items) {
        const itemLength = getItemLength(item);

        if (varlength) totalLength += varuint.encodingLength(itemLength);

        totalLength += itemLength;
      }
    
      return totalLength;
    }

    let length = 0;

    length += varint.encodingLength(this.flags);

    if (this.serializeAddress()) length += this.address!.getByteLength();

    if (this.serializePrefixString()) {
      const prefixLen = this.prefixstring!.length;

      length += varuint.encodingLength(prefixLen);
      length += prefixLen;
    }
    
    if (this.serializeVdxfKeys()) {
      length += calculateVectorLength(this.vdxfkeys!, (vdxfkey) => vdxfkey.getByteLength(), false);
    }
    
    if (this.serializeVdxfKeyNames()) {
      length += calculateVectorLength(this.vdxfkeynames!, (vdxfname) => vdxfname.length);
    }
    
    if (this.serializeBoundhashes()) {
      length += varint.encodingLength(this.hashtype);
      length += calculateVectorLength(this.boundhashes!, (hash) => hash.length);
    }

    if (this.serializeEncrypttoAddress()) {
      length += this.encrypttoaddress!.getByteLength();
    }

    length += 1; // Createmmr boolean value

    if (this.serializeData()) {
      length += varint.encodingLength(this.datatype!);

      if (this.isMMRData()) {
        length += (this.data as PartialMMRData).getByteLength();
      } else {
        const datalen = (this.data as Buffer).length;

        length += varuint.encodingLength(datalen);
        length += datalen;
      }
    }

    return length;
  }

  getByteLength(): number {
    return this.getPartialSignDataByteLength();
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.flags = reader.readVarInt();

    if (this.serializeAddress()) {
      const hash160 = new Hash160SerEnt();

      hash160.fromBuffer(reader.readSlice(HASH160_BYTE_LENGTH));

      if (hash160.version === I_ADDR_VERSION) {
        this.address = hash160 as IdentityID;
      } else if (hash160.version === R_ADDR_VERSION) {
        this.address = hash160 as KeyID;
      } else throw new Error("Unrecognized address version");
    }

    if (this.serializePrefixString()) {
      this.prefixstring = reader.readVarSlice();
    }
    
    if (this.serializeVdxfKeys()) {
      const count = reader.readCompactSize();
      this.vdxfkeys = [];

      for (let i = 0; i < count; i++) {
        const varSlice = reader.readSlice(HASH160_BYTE_LENGTH);

        const idId = new IdentityID();
        idId.fromBuffer(varSlice);

        this.vdxfkeys.push(idId);
      }
    }
    
    if (this.serializeVdxfKeyNames()) {
      this.vdxfkeynames = reader.readVector();
    }
    
    if (this.serializeBoundhashes()) {
      this.hashtype = reader.readVarInt();
      this.boundhashes = reader.readVector();
    }
    
    if (this.serializeEncrypttoAddress()) {
      const saplingAddr = new SaplingPaymentAddress();

      reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);

      this.encrypttoaddress = saplingAddr;
    }

    this.createmmr = !!reader.readUInt8();

    if (this.serializeData()) {
      this.datatype = reader.readVarInt();

      if (this.isMMRData()) {
        const partialMMRData = new PartialMMRData();
        reader.offset = partialMMRData.fromBuffer(reader.buffer, reader.offset);

        this.data = partialMMRData;
      } else {
        this.data = reader.readVarSlice();
      }
    }

    return reader.offset;
  }

  toBuffer(): Buffer {
    // Allocate the required size for partial sign data.
    // Make sure getPartialSignDataByteLength() accounts for all fields in your updated model.
    const writer = new BufferWriter(Buffer.alloc(this.getPartialSignDataByteLength()));
  
    // Serialize flags
    writer.writeVarInt(this.flags);
  
    // Address
    if (this.serializeAddress()) {
      if (!this.address) {
        throw new Error("Address is required but not provided");
      }
      writer.writeSlice(this.address.toBuffer());
    }
  
    // Prefix string
    if (this.serializePrefixString()) {
      if (!this.prefixstring) {
        throw new Error("Prefix string is required but not provided");
      }
      writer.writeVarSlice(this.prefixstring);
    }
  
    // VDXF keys
    if (this.serializeVdxfKeys()) {
      if (!this.vdxfkeys) {
        throw new Error("VDXF keys are required but not provided");
      }
      writer.writeCompactSize(this.vdxfkeys.length);
  
      for (const vdxfkey of this.vdxfkeys) {
        writer.writeSlice(vdxfkey.toBuffer());
      }
    }
  
    // VDXF key names
    if (this.serializeVdxfKeyNames()) {
      if (!this.vdxfkeynames) {
        throw new Error("VDXF key names are required but not provided");
      }
      writer.writeVector(this.vdxfkeynames);
    }
  
    // Bound hashes
    if (this.serializeBoundhashes()) {
      if (!this.boundhashes || !this.hashtype) {
        throw new Error("Bound hashes are required but not provided");
      }
      writer.writeVarInt(this.hashtype);
      writer.writeVector(this.boundhashes);
    }
  
    // Encrypt-to address (Sapling)
    if (this.serializeEncrypttoAddress()) {
      if (!this.encrypttoaddress || !(this.encrypttoaddress instanceof SaplingPaymentAddress)) {
        throw new Error("Sapling payment address is required but not provided");
      }
      writer.writeSlice(this.encrypttoaddress.toBuffer());
    }
  
    // createmmr (boolean)
    writer.writeUInt8(this.createmmr ? 1 : 0);
  
    // Data
    if (this.serializeData()) {
      if (!this.data || !this.datatype) {
        throw new Error("Data is required but not provided");
      }
      writer.writeVarInt(this.datatype);

      if (this.isMMRData()) {
        const mmrData = this.data as PartialMMRData;

        writer.writeSlice(mmrData.toBuffer());
      } else {
        writer.writeVarSlice(this.data as Buffer);
      }
    }
  
    return writer.buffer;
  }
}