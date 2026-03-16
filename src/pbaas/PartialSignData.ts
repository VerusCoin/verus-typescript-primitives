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
import { FqnVdxfUniValue, VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';

const { BufferReader, BufferWriter } = bufferutils;

export type PartialSignDataInitData = {
  flags?: BigNumber;
  address?: IdentityID | KeyID;
  prefixString?: Buffer;
  vdxfKeys?: Array<IdentityID>;
  vdxfKeyNames?: Array<Buffer>;
  boundHashes?: Array<Buffer>;
  hashType?: BigNumber;
  encryptToAddress?: SaplingPaymentAddress;
  createMMR?: boolean;
  signature?: Buffer;
  dataType?: BigNumber;
  data?: Buffer | PartialMMRData | FqnVdxfUniValue;
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
  mmrdata?: Array<SingleKeyMMRData | string | { vdxfdata: VdxfUniValueJson }>;
};

// Base fields (always optional)
type BaseFields = {
  address?: string;
  prefixString?: string;
  vdxfKeys?: Array<string>;
  vdxfKeyNames?: Array<string>;
  boundHashes?: Array<string>;
  hashType?: string;
  encryptToAddress?: string;
  createMMR?: boolean;
  signature?: string;
  dataType?: string;
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
  prefixString?: Buffer; // UTF-8 Encoded prefix string
  vdxfKeys?: Array<IdentityID>;
  vdxfKeyNames?: Array<Buffer>; // UTF-8 Encoded vdxf key names
  boundHashes?: Array<Buffer>;
  hashType?: BigNumber;
  encryptToAddress?: SaplingPaymentAddress;
  createMMR?: boolean;
  signature?: Buffer;

  dataType?: BigNumber;
  data?: Buffer | PartialMMRData | FqnVdxfUniValue;

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
    this.createMMR = data && data.createMMR ? data.createMMR : false;
    
    if (data?.address) {
      if (!this.containsAddress()) this.toggleContainsAddress();
      this.address = data.address;
    }

    if (data?.prefixString) {
      if (!this.containsPrefixString()) this.toggleContainsPrefixString();
      this.prefixString = data.prefixString;
    }

    if (data?.vdxfKeys) {
      if (!this.containsVdxfKeys()) this.toggleContainsVdxfKeys();
      this.vdxfKeys = data.vdxfKeys;
    }

    if (data?.vdxfKeyNames) {
      if (!this.containsVdxfKeyNames()) this.toggleContainsVdxfKeyNames();
      this.vdxfKeyNames = data.vdxfKeyNames;
    }

    if (data?.hashType) {
      this.hashType = data.hashType;
    } else this.hashType = DEFAULT_HASH_TYPE;

    if (data?.boundHashes) {
      if (!this.containsBoundhashes()) this.toggleContainsBoundHashes();
      this.boundHashes = data.boundHashes;
    }

    if (data?.encryptToAddress) {
      if (!this.containsEncrypttoAddress()) this.toggleContainsEncryptToAddress();
      this.encryptToAddress = data.encryptToAddress;
    }
    
    if (data?.signature) {
      if (!this.containsCurrentSig()) this.toggleContainsCurrentSig();
      this.signature = data.signature;
    }

    if (data?.dataType && data?.data) {
      if (!this.containsData()) this.toggleContainsData();
      this.data = data.data;
      this.dataType = data.dataType;
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
    return this.dataType && this.dataType.eq(DATA_TYPE_MMRDATA);
  }

  isVdxfData(): boolean {
    return this.dataType && this.dataType.eq(DATA_TYPE_VDXFDATA);
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

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.containsAddress()) length += this.address!.getByteLength();

    if (this.containsPrefixString()) {
      const prefixLen = this.prefixString!.length;

      length += varuint.encodingLength(prefixLen);
      length += prefixLen;
    }
    
    if (this.containsVdxfKeys()) {
      length += calculateVectorLength(this.vdxfKeys!, (vdxfkey) => vdxfkey.getByteLength(), false);
    }
    
    if (this.containsVdxfKeyNames()) {
      length += calculateVectorLength(this.vdxfKeyNames!, (vdxfname) => vdxfname.length);
    }

    length += varuint.encodingLength(this.hashType.toNumber());
    
    if (this.containsBoundhashes()) {
      length += calculateVectorLength(this.boundHashes!, (hash) => hash.length);
    }

    if (this.containsEncrypttoAddress()) {
      length += this.encryptToAddress!.getByteLength();
    }

    length += 1; // Createmmr boolean value

    if (this.containsData()) {
      length += varuint.encodingLength(this.dataType!.toNumber());

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

    this.flags = new BN(reader.readCompactSize());

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
      this.prefixString = reader.readVarSlice();
    }
    
    if (this.containsVdxfKeys()) {
      const count = reader.readCompactSize();
      this.vdxfKeys = [];

      for (let i = 0; i < count; i++) {
        const varSlice = reader.readSlice(HASH160_BYTE_LENGTH);

        const idId = new IdentityID();
        idId.fromBuffer(varSlice);

        this.vdxfKeys.push(idId);
      }
    }
    
    if (this.containsVdxfKeyNames()) {
      this.vdxfKeyNames = reader.readVector();
    }

    this.hashType = new BN(reader.readCompactSize());
    
    if (this.containsBoundhashes()) {
      this.boundHashes = reader.readVector();
    }
    
    if (this.containsEncrypttoAddress()) {
      const saplingAddr = new SaplingPaymentAddress();

      reader.offset = saplingAddr.fromBuffer(reader.buffer, reader.offset);

      this.encryptToAddress = saplingAddr;
    }

    this.createMMR = !!reader.readUInt8();

    if (this.containsData()) {
      this.dataType = new BN(reader.readCompactSize());

      if (this.isMMRData()) {
        const partialMMRData = new PartialMMRData();
        reader.offset = partialMMRData.fromBuffer(reader.buffer, reader.offset);

        this.data = partialMMRData;
      } else if (this.isVdxfData()) {
        const vdxfData = new FqnVdxfUniValue();

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
    writer.writeCompactSize(this.flags.toNumber());
  
    // Address
    if (this.containsAddress()) {
      if (!this.address) {
        throw new Error("Address is required but not provided");
      }
      writer.writeSlice(this.address.toBuffer());
    }
  
    // Prefix string
    if (this.containsPrefixString()) {
      if (!this.prefixString) {
        throw new Error("Prefix string is required but not provided");
      }
      writer.writeVarSlice(this.prefixString);
    }
  
    // VDXF keys
    if (this.containsVdxfKeys()) {
      if (!this.vdxfKeys) {
        throw new Error("VDXF keys are required but not provided");
      }
      writer.writeCompactSize(this.vdxfKeys.length);
  
      for (const vdxfkey of this.vdxfKeys) {
        writer.writeSlice(vdxfkey.toBuffer());
      }
    }
  
    // VDXF key names
    if (this.containsVdxfKeyNames()) {
      if (!this.vdxfKeyNames) {
        throw new Error("VDXF key names are required but not provided");
      }
      writer.writeVector(this.vdxfKeyNames);
    }

    writer.writeCompactSize(this.hashType.toNumber());
  
    // Bound hashes
    if (this.containsBoundhashes()) {
      if (!this.boundHashes) {
        throw new Error("Bound hashes are required but not provided");
      }

      writer.writeVector(this.boundHashes);
    }
  
    // Encrypt-to address (Sapling)
    if (this.containsEncrypttoAddress()) {
      if (!this.encryptToAddress || !(this.encryptToAddress instanceof SaplingPaymentAddress)) {
        throw new Error("Sapling payment address is required but not provided");
      }
      writer.writeSlice(this.encryptToAddress.toBuffer());
    }
  
    // createMMR (boolean)
    writer.writeUInt8(this.createMMR ? 1 : 0);
  
    // Data
    if (this.containsData()) {
      if (!this.data || !this.dataType) {
        throw new Error("Data is required but not provided");
      }
      writer.writeCompactSize(this.dataType.toNumber());

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
      prefixstring: this.prefixString ? this.prefixString.toString('utf-8') : undefined,
      vdxfkeys: this.vdxfKeys ? this.vdxfKeys.map(x => x.toAddress()) : undefined,
      vdxfkeynames: this.vdxfKeyNames ? this.vdxfKeyNames.map(x => x.toString('utf-8')) : undefined,
      boundhashes: this.boundHashes ? this.boundHashes.map(x => x.toString('hex')) : undefined,
      hashtype: this.hashType ? this.hashType.toString(10) : undefined,
      encrypttoaddress: this.encryptToAddress ? this.encryptToAddress.toAddressString() : undefined,
      createmmr: this.createMMR,
      signature: this.signature ? this.signature.toString('base64') : undefined,
      datatype: this.dataType ? this.dataType.toString(10) : undefined,
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

    const dataType = json.datatype ? new BN(json.datatype, 10) : undefined;

    return new PartialSignData({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      address: addr,
      prefixString: json.prefixstring ? Buffer.from(json.prefixstring, 'utf-8') : undefined,
      vdxfKeys: json.vdxfkeys ? json.vdxfkeys.map(x => IdentityID.fromAddress(x)) : undefined,
      vdxfKeyNames: json.vdxfkeynames ? json.vdxfkeynames.map(x => Buffer.from(x, 'utf-8')) : undefined,
      boundHashes: json.boundhashes ? json.boundhashes.map(x => Buffer.from(x, 'hex')) : undefined,
      hashType: json.hashtype ? new BN(json.hashtype, 10) : undefined,
      encryptToAddress: json.encrypttoaddress ? SaplingPaymentAddress.fromAddressString(json.encrypttoaddress) : undefined,
      createMMR: json.createmmr,
      signature: json.signature ? Buffer.from(json.signature, 'base64') : undefined,
      dataType: json.datatype ? new BN(json.datatype, 10) : undefined,
      data: json.data ? 
        typeof json.data === 'string' ? 
          Buffer.from(json.data, 'hex') 
          : 
          dataType && dataType.eq(DATA_TYPE_MMRDATA) ? 
            PartialMMRData.fromJson(json.data as PartialMMRDataJson) 
            : 
            FqnVdxfUniValue.fromJson(json.data as VdxfUniValueJson)
              : 
              undefined
    })
  }

  toCLIJson(): PartialSignDataCLIJson {
    const ret: PartialSignDataCLIJson = {
      address: this.address ? this.address.toAddress() : undefined,
      prefixString: this.prefixString ? this.prefixString.toString('utf-8') : undefined,
      vdxfKeys: this.vdxfKeys ? this.vdxfKeys.map(x => x.toAddress()) : undefined,
      vdxfKeyNames: this.vdxfKeyNames ? this.vdxfKeyNames.map(x => x.toString('utf-8')) : undefined,
      boundHashes: this.boundHashes ? this.boundHashes.map(x => x.toString('hex')) : undefined,
      encryptToAddress: this.encryptToAddress ? this.encryptToAddress.toAddressString() : undefined,
      createMMR: this.createMMR,
      signature: this.signature ? this.signature.toString('base64') : undefined
    };

    if (this.containsData() && this.data && this.dataType) {
      if (this.dataType.eq(DATA_TYPE_MMRDATA)) {
        const mmrCLIJson = (this.data as PartialMMRData).toCLIJson();
  
        ret['mmrdata'] = mmrCLIJson.mmrdata;
        ret['mmrsalt'] = mmrCLIJson.mmrsalt;
        ret['mmrhashtype'] = mmrCLIJson.mmrhashtype;
        ret['priormmr'] = mmrCLIJson.priormmr;
      } else if (this.dataType.eq(DATA_TYPE_VDXFDATA)) {
        const uniJson = (this.data as VdxfUniValue).toJson();

        if (Array.isArray(uniJson)) throw new Error("VDXF univalue arrays not supported as sign data param")

        ret['vdxfdata'] = (this.data as VdxfUniValue).toJson() as VdxfUniValueJson;
      } else {
        const dataBuf = this.data as Buffer;
  
        if (this.dataType.eq(DATA_TYPE_FILENAME)){
          ret['filename'] = dataBuf.toString('utf-8');
        } else if (this.dataType.eq(DATA_TYPE_MESSAGE)) {
          ret['message'] = dataBuf.toString('utf-8');
        } else if (this.dataType.eq(DATA_TYPE_HEX)) {
          ret['messagehex'] = dataBuf.toString('hex');
        } else if (this.dataType.eq(DATA_TYPE_BASE64)) {
          ret['messagebase64'] = dataBuf.toString('base64');
        } else if (this.dataType.eq(DATA_TYPE_DATAHASH)) {
          ret['datahash'] = dataBuf.toString('hex');
        } else throw new Error("Unrecognized dataType");
      }
    }

    if (this.hashType.eq(HASH_TYPE_SHA256)){
      ret['hashType'] = HASH_TYPE_SHA256_NAME;
    } else if (this.hashType.eq(HASH_TYPE_SHA256D)) {
      ret['hashType'] = HASH_TYPE_SHA256D_NAME;
    } else if (this.hashType.eq(HASH_TYPE_BLAKE2B)) {
      ret['hashType'] = HASH_TYPE_BLAKE2B_NAME;
    } else if (this.hashType.eq(HASH_TYPE_KECCAK256)) {
      ret['hashType'] = HASH_TYPE_KECCAK256_NAME;
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
      prefixString: json.prefixString ? Buffer.from(json.prefixString, 'utf-8') : undefined,
      vdxfKeys: json.vdxfKeys ? json.vdxfKeys.map(x => IdentityID.fromAddress(x)) : undefined,
      vdxfKeyNames: json.vdxfKeyNames ? json.vdxfKeyNames.map(x => Buffer.from(x, 'utf-8')) : undefined,
      boundHashes: json.boundHashes ? json.boundHashes.map(x => Buffer.from(x, 'hex')) : undefined,
      encryptToAddress: json.encryptToAddress ? SaplingPaymentAddress.fromAddressString(json.encryptToAddress) : undefined,
      createMMR: json.createMMR,
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
      config.dataType = DATA_TYPE_MMRDATA;
    } else if (json.filename) {
      config.data = Buffer.from(json.filename, 'utf-8');
      config.dataType = DATA_TYPE_FILENAME;
    } else if (json.message) {
      config.data = Buffer.from(json.message, 'utf-8');
      config.dataType = DATA_TYPE_MESSAGE;
    } else if (json.vdxfdata) {
      config.data = FqnVdxfUniValue.fromJson(json.vdxfdata);
      config.dataType = DATA_TYPE_VDXFDATA;
    } else if (json.messagehex) {
      config.data = Buffer.from(json.messagehex, 'hex');
      config.dataType = DATA_TYPE_HEX;
    } else if (json.messagebase64) {
      config.data = Buffer.from(json.messagebase64, 'base64');
      config.dataType = DATA_TYPE_BASE64;
    } else if (json.datahash) {
      config.data = Buffer.from(json.datahash, 'hex');
      config.dataType = DATA_TYPE_DATAHASH;
    }

    if (json.hashType) {
      switch (json.hashType) {
        case HASH_TYPE_SHA256_NAME:
          config.hashType = HASH_TYPE_SHA256;
          break;
        case HASH_TYPE_SHA256D_NAME:
          config.hashType = HASH_TYPE_SHA256D;
          break;
        case HASH_TYPE_BLAKE2B_NAME:
          config.hashType = HASH_TYPE_BLAKE2B;
          break;
        case HASH_TYPE_KECCAK256_NAME:
          config.hashType = HASH_TYPE_KECCAK256;
          break;
        default:
          throw new Error("Unrecognized hash type");
      }
    }

    return new PartialSignData(config);
  }
}