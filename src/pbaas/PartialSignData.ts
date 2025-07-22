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
import { PartialMMRData, PartialMMRDataJson, SingleKeyMMRData } from './PartialMMRData';
import { AllowedHashes, DATA_TYPE_BASE64, DATA_TYPE_DATAHASH, DATA_TYPE_FILENAME, DATA_TYPE_HEX, DATA_TYPE_MESSAGE, DATA_TYPE_MMRDATA, DATA_TYPE_RAWSTRINGDATA, DATA_TYPE_VDXFDATA, DEFAULT_HASH_TYPE, HASH_TYPE_BLAKE2B, HASH_TYPE_BLAKE2B_NAME, HASH_TYPE_KECCAK256, HASH_TYPE_KECCAK256_NAME, HASH_TYPE_SHA256, HASH_TYPE_SHA256_NAME, HASH_TYPE_SHA256D, HASH_TYPE_SHA256D_NAME } from '../constants/pbaas';
import { fromBase58Check } from '../utils/address';
import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';

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
  data?: Buffer | PartialMMRData | VdxfUniValue;
}

export type PartialSignDataJson = {
  flags?: string;
  address?: string;
  prefixstring?: string;
  vdxfkeys?: Array<string>;
  vdxfkeynames?: Array<string>;
  boundhashes?: Array<string>;
  hashtype?: string;
  encrypttoaddress?: string;
  createmmr?: boolean;
  signature?: string;
  datatype?: string;
  data?: string | PartialMMRDataJson | VdxfUniValueJson;
}

export type CLISignDataKey = 
  | "filename" 
  | "message" 
  | "messagehex" 
  | "messagebase64" 
  | "datahash"
  | "mmrdata"
  | "vdxfdata";

// Utility type to enforce at least one key from T
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

// Define SignDataKeys where mmrdata is an Array
type SignDataKeys = {
  filename?: string;
  message?: string;
  messagehex?: string;
  messagebase64?: string;
  datahash?: string;
  vdxfdata?: VdxfUniValueJson;
  mmrdata?: Array<SingleKeyMMRData | string | { ['vdfxdata']: VdxfUniValueJson }>;
};

// Base fields (always optional)
type BaseFields = {
  address?: string;
  prefixstring?: string;
  vdxfkeys?: Array<string>;
  vdxfkeynames?: Array<string>;
  boundhashes?: Array<string>;
  hashtype?: string;
  encrypttoaddress?: string;
  createmmr?: boolean;
  signature?: string;
  datatype?: string;
  data?: string;
};

// MMR fields (only allowed if mmrdata is present)
type MMRFields = {
  mmrsalt?: Array<string>;
  mmrhashtype?: AllowedHashes;
  priormmr?: Array<string>;
};

// Conditional combination:
// - If mmrdata exists, MMRFields are allowed
// - If mmrdata does not exist, MMRFields are not allowed
export type PartialSignDataCLIJson = (
  | (AtLeastOne<Omit<SignDataKeys, 'mmrdata'>> & BaseFields) // No mmrdata, so no MMRFields
  | (AtLeastOne<SignDataKeys> & MMRFields & BaseFields)     // mmrdata exists, MMRFields allowed
);

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
  data?: Buffer | PartialMMRData | VdxfUniValue;

  static CONTAINS_DATA = new BN("1", 10);
  static CONTAINS_ADDRESS = new BN("2", 10);
  static CONTAINS_ENCRYPTTOADDRESS = new BN("4", 10);
  static CONTAINS_CURRENTSIG = new BN("8", 10);
  static CONTAINS_PREFIXSTRING = new BN("16", 10);
  static CONTAINS_VDXFKEYS = new BN("32", 10);
  static CONTAINS_VDXFKEYNAMES = new BN("64", 10);
  static CONTAINS_BOUNDHASHES = new BN("128", 10);
  
  constructor(data?: PartialSignDataInitData) {
    this.flags = data && data.flags ? data.flags : new BN("0");
    this.createmmr = data && data.createmmr ? data.createmmr : false;
    
    if (data?.address) {
      if (!this.containsAddress()) this.toggleContainsAddress();
      this.address = data.address;
    }

    if (data?.prefixstring) {
      if (!this.containsPrefixString()) this.toggleContainsPrefixString();
      this.prefixstring = data.prefixstring;
    }

    if (data?.vdxfkeys) {
      if (!this.containsVdxfKeys()) this.toggleContainsVdxfKeys();
      this.vdxfkeys = data.vdxfkeys;
    }

    if (data?.vdxfkeynames) {
      if (!this.containsVdxfKeyNames()) this.toggleContainsVdxfKeyNames();
      this.vdxfkeynames = data.vdxfkeynames;
    }

    if (data?.hashtype) {
      this.hashtype = data.hashtype;
    } else this.hashtype = DEFAULT_HASH_TYPE;

    if (data?.boundhashes) {
      if (!this.containsBoundhashes()) this.toggleContainsBoundHashes();
      this.boundhashes = data.boundhashes;
    }

    if (data?.encrypttoaddress) {
      if (!this.containsEncrypttoAddress()) this.toggleContainsEncryptToAddress();
      this.encrypttoaddress = data.encrypttoaddress;
    }
    
    if (data?.signature) {
      if (!this.containsCurrentSig()) this.toggleContainsCurrentSig();
      this.signature = data.signature;
    }

    if (data?.datatype && data?.data) {
      if (!this.containsData()) this.toggleContainsData();
      this.data = data.data;
      this.datatype = data.datatype;
    }
  }

  protected containsData() {
    return !!(this.flags.and(PartialSignData.CONTAINS_DATA).toNumber());
  }

  protected containsAddress() {
    return !!(this.flags.and(PartialSignData.CONTAINS_ADDRESS).toNumber());
  }

  protected containsEncrypttoAddress() {
    return !!(this.flags.and(PartialSignData.CONTAINS_ENCRYPTTOADDRESS).toNumber());
  }

  protected containsCurrentSig() {
    return !!(this.flags.and(PartialSignData.CONTAINS_CURRENTSIG).toNumber());
  }

  protected containsPrefixString() {
    return !!(this.flags.and(PartialSignData.CONTAINS_PREFIXSTRING).toNumber());
  }

  protected containsVdxfKeys() {
    return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYS).toNumber());
  }

  protected containsVdxfKeyNames() {
    return !!(this.flags.and(PartialSignData.CONTAINS_VDXFKEYNAMES).toNumber());
  }

  protected containsBoundhashes() {
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
    return this.datatype && this.datatype.eq(DATA_TYPE_MMRDATA);
  }

  isVdxfData(): boolean {
    return this.datatype && this.datatype.eq(DATA_TYPE_VDXFDATA);
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

    if (this.containsAddress()) length += this.address!.getByteLength();

    if (this.containsPrefixString()) {
      const prefixLen = this.prefixstring!.length;

      length += varuint.encodingLength(prefixLen);
      length += prefixLen;
    }
    
    if (this.containsVdxfKeys()) {
      length += calculateVectorLength(this.vdxfkeys!, (vdxfkey) => vdxfkey.getByteLength(), false);
    }
    
    if (this.containsVdxfKeyNames()) {
      length += calculateVectorLength(this.vdxfkeynames!, (vdxfname) => vdxfname.length);
    }

    length += varint.encodingLength(this.hashtype);
    
    if (this.containsBoundhashes()) {
      length += calculateVectorLength(this.boundhashes!, (hash) => hash.length);
    }

    if (this.containsEncrypttoAddress()) {
      length += this.encrypttoaddress!.getByteLength();
    }

    length += 1; // Createmmr boolean value

    if (this.containsData()) {
      length += varint.encodingLength(this.datatype!);

      if (this.isMMRData()) {
        length += (this.data as PartialMMRData).getByteLength();
      } else if (this.isVdxfData()) {
        const vdxfDataLen = (this.data as VdxfUniValue).getByteLength();

        length += varuint.encodingLength(vdxfDataLen);
        length += vdxfDataLen;
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

    if (this.containsAddress()) {
      const hash160 = new Hash160SerEnt();

      hash160.fromBuffer(reader.readSlice(HASH160_BYTE_LENGTH));

      if (hash160.version === I_ADDR_VERSION) {
        this.address = hash160 as IdentityID;
      } else if (hash160.version === R_ADDR_VERSION) {
        this.address = hash160 as KeyID;
      } else throw new Error("Unrecognized address version");
    }

    if (this.containsPrefixString()) {
      this.prefixstring = reader.readVarSlice();
    }
    
    if (this.containsVdxfKeys()) {
      const count = reader.readCompactSize();
      this.vdxfkeys = [];

      for (let i = 0; i < count; i++) {
        const varSlice = reader.readSlice(HASH160_BYTE_LENGTH);

        const idId = new IdentityID();
        idId.fromBuffer(varSlice);

        this.vdxfkeys.push(idId);
      }
    }
    
    if (this.containsVdxfKeyNames()) {
      this.vdxfkeynames = reader.readVector();
    }

    this.hashtype = reader.readVarInt();
    
    if (this.containsBoundhashes()) {
      this.boundhashes = reader.readVector();
    }
    
    if (this.containsEncrypttoAddress()) {
      const saplingAddr = new SaplingPaymentAddress();

      reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);

      this.encrypttoaddress = saplingAddr;
    }

    this.createmmr = !!reader.readUInt8();

    if (this.containsData()) {
      this.datatype = reader.readVarInt();

      if (this.isMMRData()) {
        const partialMMRData = new PartialMMRData();
        reader.offset = partialMMRData.fromBuffer(reader.buffer, reader.offset);

        this.data = partialMMRData;
      } else if (this.isVdxfData()) {
        const vdxfData = new VdxfUniValue();

        const vdxfDataBuf = reader.readVarSlice();
        vdxfData.fromBuffer(vdxfDataBuf);

        this.data = vdxfData;
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
    if (this.containsAddress()) {
      if (!this.address) {
        throw new Error("Address is required but not provided");
      }
      writer.writeSlice(this.address.toBuffer());
    }
  
    // Prefix string
    if (this.containsPrefixString()) {
      if (!this.prefixstring) {
        throw new Error("Prefix string is required but not provided");
      }
      writer.writeVarSlice(this.prefixstring);
    }
  
    // VDXF keys
    if (this.containsVdxfKeys()) {
      if (!this.vdxfkeys) {
        throw new Error("VDXF keys are required but not provided");
      }
      writer.writeCompactSize(this.vdxfkeys.length);
  
      for (const vdxfkey of this.vdxfkeys) {
        writer.writeSlice(vdxfkey.toBuffer());
      }
    }
  
    // VDXF key names
    if (this.containsVdxfKeyNames()) {
      if (!this.vdxfkeynames) {
        throw new Error("VDXF key names are required but not provided");
      }
      writer.writeVector(this.vdxfkeynames);
    }

    writer.writeVarInt(this.hashtype);
  
    // Bound hashes
    if (this.containsBoundhashes()) {
      if (!this.boundhashes) {
        throw new Error("Bound hashes are required but not provided");
      }

      writer.writeVector(this.boundhashes);
    }
  
    // Encrypt-to address (Sapling)
    if (this.containsEncrypttoAddress()) {
      if (!this.encrypttoaddress || !(this.encrypttoaddress instanceof SaplingPaymentAddress)) {
        throw new Error("Sapling payment address is required but not provided");
      }
      writer.writeSlice(this.encrypttoaddress.toBuffer());
    }
  
    // createmmr (boolean)
    writer.writeUInt8(this.createmmr ? 1 : 0);
  
    // Data
    if (this.containsData()) {
      if (!this.data || !this.datatype) {
        throw new Error("Data is required but not provided");
      }
      writer.writeVarInt(this.datatype);

      if (this.isMMRData()) {
        const mmrData = this.data as PartialMMRData;

        writer.writeSlice(mmrData.toBuffer());
      } else if (this.isVdxfData()) {
        const vdxfData = this.data as VdxfUniValue;

        writer.writeVarSlice(vdxfData.toBuffer());
      } else {
        writer.writeVarSlice(this.data as Buffer);
      }
    }
  
    return writer.buffer;
  }

  toJson(): PartialSignDataJson {
    return {
      flags: this.flags ? this.flags.toString(10) : undefined,
      address: this.address ? this.address.toAddress() : undefined,
      prefixstring: this.prefixstring ? this.prefixstring.toString('utf-8') : undefined,
      vdxfkeys: this.vdxfkeys ? this.vdxfkeys.map(x => x.toAddress()) : undefined,
      vdxfkeynames: this.vdxfkeynames ? this.vdxfkeynames.map(x => x.toString('utf-8')) : undefined,
      boundhashes: this.boundhashes ? this.boundhashes.map(x => x.toString('hex')) : undefined,
      hashtype: this.hashtype ? this.hashtype.toString(10) : undefined,
      encrypttoaddress: this.encrypttoaddress ? this.encrypttoaddress.toAddressString() : undefined,
      createmmr: this.createmmr,
      signature: this.signature ? this.signature.toString('base64') : undefined,
      datatype: this.datatype ? this.datatype.toString(10) : undefined,
      data: this.data ? this.data instanceof PartialMMRData ? this.data.toJson() : this.data.toString('hex') : undefined
    }
  }

  static fromJson(json: PartialSignDataJson): PartialSignData {
    let addr: IdentityID | KeyID;

    if (json.address) {
      const { version, hash } = fromBase58Check(json.address);

      if (version === I_ADDR_VERSION) {
        addr = new IdentityID(hash);
      } else if (version === R_ADDR_VERSION) {
        addr = new KeyID(hash);
      } else throw new Error("Unrecognized address version");
    }

    const datatype = json.datatype ? new BN(json.datatype, 10) : undefined;

    return new PartialSignData({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      address: addr,
      prefixstring: json.prefixstring ? Buffer.from(json.prefixstring, 'utf-8') : undefined,
      vdxfkeys: json.vdxfkeys ? json.vdxfkeys.map(x => IdentityID.fromAddress(x)) : undefined,
      vdxfkeynames: json.vdxfkeynames ? json.vdxfkeynames.map(x => Buffer.from(x, 'utf-8')) : undefined,
      boundhashes: json.boundhashes ? json.boundhashes.map(x => Buffer.from(x, 'hex')) : undefined,
      hashtype: json.hashtype ? new BN(json.hashtype, 10) : undefined,
      encrypttoaddress: json.encrypttoaddress ? SaplingPaymentAddress.fromAddressString(json.encrypttoaddress) : undefined,
      createmmr: json.createmmr,
      signature: json.signature ? Buffer.from(json.signature, 'base64') : undefined,
      datatype: json.datatype ? new BN(json.datatype, 10) : undefined,
      data: json.data ? 
        typeof json.data === 'string' ? 
          Buffer.from(json.data, 'hex') 
          : 
          datatype && datatype.eq(DATA_TYPE_MMRDATA) ? 
            PartialMMRData.fromJson(json.data as PartialMMRDataJson) 
            : 
            VdxfUniValue.fromJson(json.data as VdxfUniValueJson) 
              : 
              undefined
    })
  }

  toCLIJson(): PartialSignDataCLIJson {
    const ret: PartialSignDataCLIJson = {
      address: this.address ? this.address.toAddress() : undefined,
      prefixstring: this.prefixstring ? this.prefixstring.toString('utf-8') : undefined,
      vdxfkeys: this.vdxfkeys ? this.vdxfkeys.map(x => x.toAddress()) : undefined,
      vdxfkeynames: this.vdxfkeynames ? this.vdxfkeynames.map(x => x.toString('utf-8')) : undefined,
      boundhashes: this.boundhashes ? this.boundhashes.map(x => x.toString('hex')) : undefined,
      encrypttoaddress: this.encrypttoaddress ? this.encrypttoaddress.toAddressString() : undefined,
      createmmr: this.createmmr,
      signature: this.signature ? this.signature.toString('base64') : undefined
    };

    if (this.containsData() && this.data && this.datatype) {
      if (this.datatype.eq(DATA_TYPE_MMRDATA)) {
        const mmrCLIJson = (this.data as PartialMMRData).toCLIJson();
  
        ret['mmrdata'] = mmrCLIJson.mmrdata;
        ret['mmrsalt'] = mmrCLIJson.mmrsalt;
        ret['mmrhashtype'] = mmrCLIJson.mmrhashtype;
        ret['priormmr'] = mmrCLIJson.priormmr;
      } else if (this.datatype.eq(DATA_TYPE_VDXFDATA)) {
        const uniJson = (this.data as VdxfUniValue).toJson();

        if (Array.isArray(uniJson)) throw new Error("VDXF univalue arrays not supported as sign data param")

        ret['vdxfdata'] = (this.data as VdxfUniValue).toJson() as VdxfUniValueJson;
      } else {
        const dataBuf = this.data as Buffer;
  
        if (this.datatype.eq(DATA_TYPE_FILENAME)){
          ret['filename'] = dataBuf.toString('utf-8');
        } else if (this.datatype.eq(DATA_TYPE_MESSAGE)) {
          ret['message'] = dataBuf.toString('utf-8');
        } else if (this.datatype.eq(DATA_TYPE_HEX)) {
          ret['messagehex'] = dataBuf.toString('hex');
        } else if (this.datatype.eq(DATA_TYPE_BASE64)) {
          ret['messagebase64'] = dataBuf.toString('base64');
        } else if (this.datatype.eq(DATA_TYPE_DATAHASH)) {
          ret['datahash'] = dataBuf.toString('hex');
        } else throw new Error("Unrecognized datatype");
      }
    }

    if (this.hashtype.eq(HASH_TYPE_SHA256)){
      ret['hashtype'] = HASH_TYPE_SHA256_NAME;
    } else if (this.hashtype.eq(HASH_TYPE_SHA256D)) {
      ret['hashtype'] = HASH_TYPE_SHA256D_NAME;
    } else if (this.hashtype.eq(HASH_TYPE_BLAKE2B)) {
      ret['hashtype'] = HASH_TYPE_BLAKE2B_NAME;
    } else if (this.hashtype.eq(HASH_TYPE_KECCAK256)) {
      ret['hashtype'] = HASH_TYPE_KECCAK256_NAME;
    } else throw new Error("Unrecognized hash type");

    for (const key in ret) {
      if (ret[key] === undefined) delete ret[key]
    }

    return ret;
  }

  static fromCLIJson(json: PartialSignDataCLIJson): PartialSignData {
    let addr: IdentityID | KeyID;

    if (json.address) {
      const { version, hash } = fromBase58Check(json.address);

      if (version === I_ADDR_VERSION) {
        addr = new IdentityID(hash);
      } else if (version === R_ADDR_VERSION) {
        addr = new KeyID(hash);
      } else throw new Error("Unrecognized address version");
    }

    const config: PartialSignDataInitData = {
      address: addr,
      prefixstring: json.prefixstring ? Buffer.from(json.prefixstring, 'utf-8') : undefined,
      vdxfkeys: json.vdxfkeys ? json.vdxfkeys.map(x => IdentityID.fromAddress(x)) : undefined,
      vdxfkeynames: json.vdxfkeynames ? json.vdxfkeynames.map(x => Buffer.from(x, 'utf-8')) : undefined,
      boundhashes: json.boundhashes ? json.boundhashes.map(x => Buffer.from(x, 'hex')) : undefined,
      encrypttoaddress: json.encrypttoaddress ? SaplingPaymentAddress.fromAddressString(json.encrypttoaddress) : undefined,
      createmmr: json.createmmr,
      signature: json.signature ? Buffer.from(json.signature, 'base64') : undefined
    };

    if ('mmrdata' in json) {
      const pmd = PartialMMRData.fromCLIJson({
        mmrdata: json.mmrdata,
        mmrsalt: json.mmrsalt,
        mmrhashtype: json.mmrhashtype,
        priormmr: json.priormmr
      })

      config.data = pmd;
      config.datatype = DATA_TYPE_MMRDATA;
    } else if (json.filename) {
      config.data = Buffer.from(json.filename, 'utf-8');
      config.datatype = DATA_TYPE_FILENAME;
    } else if (json.message) {
      config.data = Buffer.from(json.message, 'utf-8');
      config.datatype = DATA_TYPE_MESSAGE;
    } else if (json.vdxfdata) {
      config.data = VdxfUniValue.fromJson(json.vdxfdata);
      config.datatype = DATA_TYPE_VDXFDATA;
    } else if (json.messagehex) {
      config.data = Buffer.from(json.messagehex, 'hex');
      config.datatype = DATA_TYPE_HEX;
    } else if (json.messagebase64) {
      config.data = Buffer.from(json.messagebase64, 'base64');
      config.datatype = DATA_TYPE_BASE64;
    } else if (json.datahash) {
      config.data = Buffer.from(json.datahash, 'hex');
      config.datatype = DATA_TYPE_DATAHASH;
    }

    if (json.hashtype) {
      switch (json.hashtype) {
        case HASH_TYPE_SHA256_NAME:
          config.hashtype = HASH_TYPE_SHA256;
          break;
        case HASH_TYPE_SHA256D_NAME:
          config.hashtype = HASH_TYPE_SHA256D;
          break;
        case HASH_TYPE_BLAKE2B_NAME:
          config.hashtype = HASH_TYPE_BLAKE2B;
          break;
        case HASH_TYPE_KECCAK256_NAME:
          config.hashtype = HASH_TYPE_KECCAK256;
          break;
        default:
          throw new Error("Unrecognized hash type");
      }
    }

    return new PartialSignData(config);
  }
}