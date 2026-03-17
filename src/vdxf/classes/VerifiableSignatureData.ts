import varuint from '../../utils/varuint'
import { fromBase58Check, toBase58Check } from "../../utils/address";
import bufferutils from '../../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../../utils/types/BigNumber';
import { HASH160_BYTE_LENGTH, HASH256_BYTE_LENGTH, I_ADDR_VERSION } from '../../constants/vdxf';
import { SerializableEntity } from '../../utils/types/SerializableEntity';
import { EHashTypes } from '../../pbaas/DataDescriptor';
const { BufferReader, BufferWriter } = bufferutils
const createHash = require("create-hash");
import { VERUS_DATA_SIGNATURE_PREFIX } from "../../constants/vdxf";
import { CompactIAddressObject, CompactAddressObjectJson } from './CompactAddressObject';
import { DEFAULT_VERUS_CHAINNAME, DEFAULT_VERUS_CHAINID, TESTNET_VERUS_CHAINID, HASH_TYPE_SHA256 } from '../../constants/pbaas';
import varint from '../../utils/varint';
import { SignatureData, SignatureJsonDataInterface } from '../../pbaas';

export interface VerifiableSignatureDataJson {
  version: number;
  flags: number;
  signatureversion: number;
  hashtype: number;
  systemid: CompactAddressObjectJson;
  identityid: CompactAddressObjectJson;
  vdxfkeys?: Array<string>;
  vdxfkeynames?: Array<string>;
  boundhashes?: Array<string>;
  statements?: Array<string>;
  signature: string
}

export interface VerifiableSignatureDataInterface {
  version?: BigNumber;
  flags?: BigNumber;
  signatureVersion?: BigNumber;
  hashType?: BigNumber;
  systemID?: CompactIAddressObject;
  identityID?: CompactIAddressObject;
  vdxfKeys?: Array<string>;
  vdxfKeyNames?: Array<string>;
  boundHashes?: Array<Buffer>;
  statements?: Array<Buffer>;
  signatureAsVch?: Buffer;
  isTestnet?: boolean;
}

export interface CliSignatureData {
  signaturedata: SignatureJsonDataInterface;
  system: string;
  systemid: string;
  hashtype: string;
  hash: string;
  identity: string;
  canonicalname: string;
  address: string;
  signatureheight: number;
  signature: string;
  signatureversion: number;
  vdxfkeys?: Array<string>;
  vdxfkeynames?: Array<string>;
  boundhashes?: Array<string>;
}

export class VerifiableSignatureData implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  signatureVersion: BigNumber;
  hashType: BigNumber;
  identityID: CompactIAddressObject;
  systemID: CompactIAddressObject;
  vdxfKeys?: Array<string>;
  vdxfKeyNames?: Array<string>;
  boundHashes?: Array<Buffer>;
  statements?: Array<Buffer>;
  signatureAsVch: Buffer;
  isTestnet: boolean;

  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);
  static TYPE_VERUSID_DEFAULT = new BN(1);

  static FLAG_HAS_VDXF_KEYS = new BN(1);
  static FLAG_HAS_VDXF_KEY_NAMES = new BN(2);
  static FLAG_HAS_BOUND_HASHES = new BN(4);
  static FLAG_HAS_STATEMENTS = new BN(8);
  static FLAG_HAS_SYSTEM = new BN(16);

  constructor(data?: VerifiableSignatureDataInterface) {
    this.version = data && data.version ? data.version : new BN(0);
    this.flags = data && data.flags ? data.flags : new BN(0);
    this.signatureVersion = data && data.signatureVersion ? data.signatureVersion : new BN(2, 10);
    this.isTestnet = data && data.isTestnet ? data.isTestnet : false;

    // If systemID is provided, use it and set the FLAG_HAS_SYSTEM. Otherwise, default based on isTestnet
    if (data && data.systemID) {
      this.systemID = data.systemID;
      this.setHasSystem();
    } else {
      const defaultChainId = this.isTestnet ? TESTNET_VERUS_CHAINID : DEFAULT_VERUS_CHAINID;
      this.systemID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: defaultChainId });
    }

    this.hashType = data && data.hashType ? data.hashType : HASH_TYPE_SHA256;
    this.identityID = data ? data.identityID : undefined;
    this.vdxfKeys = data ? data.vdxfKeys : undefined;
    this.vdxfKeyNames = data ? data.vdxfKeyNames : undefined;
    this.boundHashes = data ? data.boundHashes : undefined;
    this.statements = data ? data.statements : undefined;
    this.signatureAsVch = data && data.signatureAsVch ? data.signatureAsVch : Buffer.alloc(0);

    this.setFlags();
  }

  private hasFlag(flag: BigNumber) {
    return !!(this.flags.and(flag).toNumber());
  }

  private setFlag(flag: BigNumber) {
    this.flags = this.flags.or(flag);
  }

  hasVdxfKeys() {
    return this.hasFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
  }

  hasVdxfKeyNames() {
    return this.hasFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
  }

  hasBoundHashes() {
    return this.hasFlag(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
  }

  hasStatements() {
    return this.hasFlag(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
  }

  hasSystem() {
    return this.hasFlag(VerifiableSignatureData.FLAG_HAS_SYSTEM);
  }

  setHasVdxfKeys() {
    this.setFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
  }

  setHasVdxfKeyNames() {
    this.setFlag(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
  }

  setHasBoundHashes() {
    this.setFlag(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
  }

  setHasStatements() {
    this.setFlag(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
  }

  setHasSystem() {
    this.setFlag(VerifiableSignatureData.FLAG_HAS_SYSTEM);
  }

  calcFlags(): BigNumber {
    let flags = new BN(this.flags);
    if (this.hasVdxfKeys()) flags = flags.or(VerifiableSignatureData.FLAG_HAS_VDXF_KEYS);
    if (this.hasVdxfKeyNames()) flags = flags.or(VerifiableSignatureData.FLAG_HAS_VDXF_KEY_NAMES);
    if (this.hasBoundHashes()) flags = flags.or(VerifiableSignatureData.FLAG_HAS_BOUND_HASHES);
    if (this.hasStatements()) flags = flags.or(VerifiableSignatureData.FLAG_HAS_STATEMENTS);
    if (this.hasSystem()) flags = flags.or(VerifiableSignatureData.FLAG_HAS_SYSTEM);
    return flags;
  }

  setFlags() {
    if (this.vdxfKeys) this.setHasVdxfKeys();
    if (this.vdxfKeyNames) this.setHasVdxfKeyNames();
    if (this.boundHashes) this.setHasBoundHashes();
    if (this.statements) this.setHasStatements();
  }

  private getBufferEncodingLength(buf: Buffer) {
    const bufLen = buf.byteLength;
    
    return varuint.encodingLength(bufLen) + bufLen;
  }

  private getExtraHashDataByteLength(): number {
    let byteLength = 0;

    if (this.vdxfKeys && this.vdxfKeys.length > 0) {
      byteLength += varuint.encodingLength(this.vdxfKeys.length);
      byteLength += this.vdxfKeys.length * HASH160_BYTE_LENGTH;
    }

    if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
      byteLength += varuint.encodingLength(this.vdxfKeyNames.length);
      for (const name of this.vdxfKeyNames) {
        byteLength += this.getBufferEncodingLength(Buffer.from(name, 'utf8'));
      }
    }

    if (this.boundHashes && this.boundHashes.length > 0) {
      byteLength += varuint.encodingLength(this.boundHashes.length);
      byteLength += this.boundHashes.length * HASH256_BYTE_LENGTH;
      
    }

    return byteLength;
  }

  private getExtraHashData(): Buffer {
    const byteLength = this.getExtraHashDataByteLength();
    
    if (byteLength === 0) {
      return Buffer.alloc(0);
    }

    const bufferWriter = new BufferWriter(Buffer.alloc(byteLength));

    if (this.vdxfKeys && this.vdxfKeys.length > 0) {
      // Sort vdxfKeys by their 20-byte buffer values before writing
      const keyBuffers = this.vdxfKeys.map(x => fromBase58Check(x).hash);
      const sortedBuffers = keyBuffers.sort(Buffer.compare);
      bufferWriter.writeArray(sortedBuffers);
    }

    if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
      // Sort vdxfKeyNames before writing
      const sortedNames = [...this.vdxfKeyNames].sort();
      bufferWriter.writeVector(sortedNames.map(x => Buffer.from(x, 'utf8')));
    }

    if (this.boundHashes && this.boundHashes.length > 0) {
      // Sort boundHashes before writing
      const sortedHashes = [...this.boundHashes].sort(Buffer.compare);
      bufferWriter.writeArray(sortedHashes);
    }

    return bufferWriter.buffer;
  }

  private _getByteLength(forHashing: boolean): number {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);

    byteLength += varuint.encodingLength(this.flags.toNumber());

    byteLength += varuint.encodingLength(this.signatureVersion.toNumber());

    byteLength += varuint.encodingLength(this.hashType.toNumber());

    // For hashing, always include systemID even if !hasSystem, so signature remains valid if defaults change
    // For serialization, only include systemID if hasSystem flag is set
    if (forHashing || this.hasSystem()) {
      byteLength += this.systemID.getByteLength();
    }
    byteLength += this.identityID.getByteLength();

    if (this.hasVdxfKeys()) {
      byteLength += varuint.encodingLength(this.vdxfKeys.length);

      for (const key of this.vdxfKeys) {
        byteLength += HASH160_BYTE_LENGTH
      }
    }

    if (this.hasVdxfKeyNames()) {
      byteLength += varuint.encodingLength(this.vdxfKeyNames.length);

      for (const key of this.vdxfKeyNames) {
        byteLength += this.getBufferEncodingLength(Buffer.from(key, 'utf8'))
      }
    }

    if (this.hasBoundHashes()) {
      byteLength += varuint.encodingLength(this.boundHashes.length);

      for (const hash of this.boundHashes) {
        byteLength += this.getBufferEncodingLength(hash)
      }
    }

    if (this.hasStatements()) {
      byteLength += varuint.encodingLength(this.statements.length);

      for (const statement of this.statements) {
        byteLength += this.getBufferEncodingLength(statement)
      }
    }

    byteLength += this.getBufferEncodingLength(this.signatureAsVch)

    return byteLength
  }

  getByteLength() {
    return this._getByteLength(false);
  }

  getByteLengthForHashing() {
    return this._getByteLength(true);
  }

  private _toBuffer(forHashing: boolean): Buffer {
    const bufferWriter = new BufferWriter(Buffer.alloc(this._getByteLength(forHashing)));

    bufferWriter.writeVarInt(this.version);

    bufferWriter.writeCompactSize(this.flags.toNumber());

    bufferWriter.writeCompactSize(this.signatureVersion.toNumber());

    bufferWriter.writeCompactSize(this.hashType.toNumber());

    // For hashing, always include systemID even if !hasSystem, so signature remains valid if defaults change
    // For serialization, only include systemID if hasSystem flag is set
    if (forHashing || this.hasSystem()) {
      bufferWriter.writeSlice(this.systemID.toBuffer());
    }
    bufferWriter.writeSlice(this.identityID.toBuffer());

    if (this.hasVdxfKeys()) {
      bufferWriter.writeArray(this.vdxfKeys!.map(x => fromBase58Check(x).hash));
    }

    if (this.hasVdxfKeyNames()) {
      bufferWriter.writeVector(this.vdxfKeyNames!.map(x => Buffer.from(x, 'utf8')));
    }

    if (this.hasBoundHashes()) {
      bufferWriter.writeVector(this.boundHashes!);
    }

    if (this.hasStatements()) {
      bufferWriter.writeVector(this.statements!);
    }

    bufferWriter.writeVarSlice(this.signatureAsVch);

    return bufferWriter.buffer;
  }

  toBuffer() {
    return this._toBuffer(false);
  }

  toBufferForHashing() {
    return this._toBuffer(true);
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const bufferReader = new BufferReader(buffer, offset);

    this.version = bufferReader.readVarInt();

    this.flags = new BN(bufferReader.readCompactSize());

    this.signatureVersion = new BN(bufferReader.readCompactSize());

    this.hashType = new BN(bufferReader.readCompactSize());

    if (this.hasSystem()) {
      this.systemID = new CompactIAddressObject();
      bufferReader.offset = this.systemID.fromBuffer(bufferReader.buffer, bufferReader.offset);
    }

    this.identityID = new CompactIAddressObject();
    bufferReader.offset = this.identityID.fromBuffer(bufferReader.buffer, bufferReader.offset);

    if (this.hasVdxfKeys()) {
      this.vdxfKeys = bufferReader.readArray(HASH160_BYTE_LENGTH).map(x => toBase58Check(x, I_ADDR_VERSION));
    }

    if (this.hasVdxfKeyNames()) {
      this.vdxfKeyNames = bufferReader.readVector().map((x: Buffer) => x.toString('utf8'));
    }

    if (this.hasBoundHashes()) {
      this.boundHashes = bufferReader.readVector();
    }

    if (this.hasStatements()) {
      this.statements = bufferReader.readVector();
    }

    this.signatureAsVch = bufferReader.readVarSlice();

    return bufferReader.offset;
  }

  // To fully implement, refer to VerusCoin/src/pbaas/crosschainrpc.cpp line 337, IdentitySignatureHash
  getIdentityHash(height: number, sigHash: Buffer): Buffer<ArrayBufferLike> {
    var heightBuffer = Buffer.allocUnsafe(4)
    heightBuffer.writeUInt32LE(height);

    if (!this.hashType.eq(new BN(EHashTypes.HASH_SHA256))) {
      throw new Error("Only SHA256 hash type is currently supported.");
    }

    if (this.signatureVersion.eq(new BN(0))) {
      throw new Error("Invalid sig data version")
    } else if (this.signatureVersion.eq(new BN(1))) {
      return createHash("sha256")
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(fromBase58Check(this.systemID.toIAddress()).hash)
        .update(heightBuffer)
        .update(fromBase58Check(this.identityID.toIAddress()).hash)
        .update(sigHash)
        .digest();
    } else if (this.signatureVersion.eq(new BN(2))) {
      const extraHashData = this.getExtraHashData();
      const hash = createHash("sha256");
      
      if (extraHashData.length > 0) {
        hash.update(extraHashData);
      }
      
      return hash
        .update(fromBase58Check(this.systemID.toIAddress()).hash)
        .update(heightBuffer)
        .update(fromBase58Check(this.identityID.toIAddress()).hash)
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(sigHash)
        .digest();
    } else {
      throw new Error("Unrecognized sig data version")
    }
  }

  toSignatureData(sigHash: Buffer): SignatureData {
    return new SignatureData({
      version: this.version,
      systemID: this.systemID.toIAddress(),
      hashType: this.hashType,
      signatureHash: sigHash,
      identityID: this.identityID.toIAddress(),
      sigType: SignatureData.TYPE_VERUSID_DEFAULT,
      vdxfKeys: this.vdxfKeys,
      vdxfKeyNames: this.vdxfKeyNames,
      boundHashes: this.boundHashes,
      signatureAsVch: this.signatureAsVch
    })
  }

  toJson(): VerifiableSignatureDataJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      signatureversion: this.signatureVersion.toNumber(),
      hashtype: this.hashType.toNumber(),
      systemid: this.systemID.toJson(),
      identityid: this.identityID.toJson(),
      vdxfkeys: this.vdxfKeys,
      vdxfkeynames: this.vdxfKeyNames,
      boundhashes: this.boundHashes?.map(x => x.toString('hex')),
      statements: this.statements?.map(x => x.toString('hex')),
      signature: this.signatureAsVch.toString('hex')
    };
  }

  static fromJson(json: VerifiableSignatureDataJson): VerifiableSignatureData {
    const instance = new VerifiableSignatureData();
    instance.version = new BN(json.version);
    instance.flags = new BN(json.flags);
    instance.signatureVersion = new BN(json.signatureversion);
    instance.hashType = new BN(json.hashtype);
    instance.systemID = CompactIAddressObject.fromCompactAddressObjectJson(json.systemid);
    instance.identityID = CompactIAddressObject.fromCompactAddressObjectJson(json.identityid);
    instance.vdxfKeys = json?.vdxfkeys;
    instance.vdxfKeyNames = json?.vdxfkeynames;
    instance.boundHashes = json.boundhashes?.map(x => Buffer.from(x, 'hex'));
    instance.statements = json.statements?.map(x => Buffer.from(x, 'hex'));
    instance.signatureAsVch = Buffer.from(json.signature, 'hex');
    return instance;
  }

  static fromCLIJson(json: CliSignatureData, rootSystemName = 'VRSC'): VerifiableSignatureData {
    const instance = new VerifiableSignatureData();
    instance.version = new BN(VerifiableSignatureData.TYPE_VERUSID_DEFAULT);
    instance.hashType = new BN(json.signaturedata.hashtype);
    instance.signatureVersion = new BN(json.signatureversion); //default Signature Version

    instance.systemID = CompactIAddressObject.fromAddress(json.systemid, rootSystemName);
    instance.identityID = CompactIAddressObject.fromAddress(json.address, rootSystemName);  
    
    // Set optional fields
    instance.vdxfKeys = json.vdxfkeys;
    instance.vdxfKeyNames = json.vdxfkeynames;
    instance.boundHashes = json.boundhashes?.map(x => Buffer.from(x, 'hex'));
    
    // Store the full signature (from daemon in base64 format)
    instance.signatureAsVch = Buffer.from(json.signature, 'base64');

    instance.setFlags();
    
    return instance;
  }
}