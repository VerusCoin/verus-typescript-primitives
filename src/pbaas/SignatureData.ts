import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { EHashTypes } from './DataDescriptor';
const { BufferReader, BufferWriter } = bufferutils
const createHash = require("create-hash");
import { VERUS_DATA_SIGNATURE_PREFIX } from "../constants/vdxf";

export interface SignatureJsonDataInterface {
  version: number;
  systemid: string;
  hashtype: number;
  signaturehash: string;
  identityid: string;
  signaturetype: number;
  vdxfkeys?: Array<string>;
  vdxfkeynames?: Array<string>;
  boundhashes?: Array<string>;
  signature: string;
}

export class SignatureData implements SerializableEntity {
  version: BigNumber;
  systemID: string;
  hashType: BigNumber;
  signatureHash: Buffer;
  identityID: string;
  sigType: BigNumber;
  vdxfKeys: Array<string>;
  vdxfKeyNames: Array<string>;
  boundHashes: Array<Buffer>;
  signatureAsVch: Buffer;

  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);
  static TYPE_VERUSID_DEFAULT = new BN(1);

  constructor(data?: { version?: BigNumber, systemID?: string, hashType?: BigNumber, signatureHash?: Buffer,
    identityID?: string, sigType?: BigNumber, vdxfKeys?: Array<string>, vdxfKeyNames?: Array<string>,
    boundHashes?: Array<Buffer>, signatureAsVch?: Buffer }) {

    if (data != null) {
      const d = data as any;
      const deprecated = ['system_ID', 'hash_type', 'signature_hash', 'identity_ID', 'sig_type', 'vdxf_keys', 'vdxf_key_names', 'bound_hashes', 'signature_as_vch'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
      if (deprecated.length > 0) {
        const map: Record<string, string> = {
          system_ID: 'systemID',
          hash_type: 'hashType',
          signature_hash: 'signatureHash',
          identity_ID: 'identityID',
          sig_type: 'sigType',
          vdxf_keys: 'vdxfKeys',
          vdxf_key_names: 'vdxfKeyNames',
          bound_hashes: 'boundHashes',
          signature_as_vch: 'signatureAsVch',
        };
        throw new Error(`SignatureData: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
    }

    if (data) {
      this.version = data.version || new BN(1, 10);
      this.systemID = data.systemID || "";
      this.hashType = data.hashType || new BN(0);
      this.signatureHash = data.signatureHash || Buffer.alloc(0);
      this.identityID = data.identityID || "";
      this.sigType = data.sigType || new BN(0);
      this.vdxfKeys = data.vdxfKeys || [];
      this.vdxfKeyNames = data.vdxfKeyNames || [];
      this.boundHashes = data.boundHashes || [];
      this.signatureAsVch = data.signatureAsVch || Buffer.alloc(0);
    }
  }

  /** @deprecated Use systemID instead */
  get system_ID(): string { return this.systemID; }
  /** @deprecated Use hashType instead */
  get hash_type(): BigNumber { return this.hashType; }
  /** @deprecated Use signatureHash instead */
  get signature_hash(): Buffer { return this.signatureHash; }
  /** @deprecated Use identityID instead */
  get identity_ID(): string { return this.identityID; }
  /** @deprecated Use sigType instead */
  get sig_type(): BigNumber { return this.sigType; }
  /** @deprecated Use vdxfKeys instead */
  get vdxf_keys(): Array<string> { return this.vdxfKeys; }
  /** @deprecated Use vdxfKeyNames instead */
  get vdxf_key_names(): Array<string> { return this.vdxfKeyNames; }
  /** @deprecated Use boundHashes instead */
  get bound_hashes(): Array<Buffer> { return this.boundHashes; }
  /** @deprecated Use signatureAsVch instead */
  get signature_as_vch(): Buffer { return this.signatureAsVch; }

  static fromJson(data: SignatureJsonDataInterface | any) {

    const signatureData = new SignatureData();

    if (data) {
      signatureData.version = new BN(data.version);
      signatureData.systemID = data.systemid;
      signatureData.hashType = new BN(data.hashtype);
      signatureData.identityID = data.identityid;
      signatureData.sigType = new BN(data.signaturetype);

      if (signatureData.hashType.eq(new BN(Number(EHashTypes.HASH_SHA256)))) {
        signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex');
      } else {
        signatureData.signatureHash = Buffer.from(data.signaturehash, 'hex').reverse();
      }

      signatureData.signatureAsVch = Buffer.from(data.signature, 'base64');
      signatureData.vdxfKeys = data.vdxfkeys || [];
      signatureData.vdxfKeyNames = data.vdxfkeynames || [];
      signatureData.boundHashes = data.boundhashes?.map((hash) => Buffer.from(hash, 'hex').reverse()) || [];

    }

    return signatureData;
  }

  /**
   * Determines the signature hash type based on the input buffer.
   *
   * @param {Buffer} input - The input buffer containing signature data.
   * @returns {number} - The hash type. If the version byte is `2`, the next byte
   *                     in the buffer is returned as the hash type. Otherwise,
   *                     it defaults to `EHashTypes.HASH_SHA256`.
   *
   * The method reads the first byte of the input buffer as the version. If the
   * version is `2`, it reads the next byte as the hash type. This logic is used
   * to support multiple versions of signature data formats, where version `2`
   * introduces a new hash type. For all other versions, the default hash type
   * is `EHashTypes.HASH_SHA256`.
   */
  static getSignatureHashType(input: Buffer) {

    var bufferReader = new bufferutils.BufferReader(input, 0);
    let version = bufferReader.readUInt8();
    if (version === 2)
      return bufferReader.readUInt8();
    else
      return EHashTypes.HASH_SHA256;
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);
    byteLength += HASH160_BYTE_LENGTH; // systemID uint160
    byteLength += varint.encodingLength(this.hashType);
    byteLength += varuint.encodingLength(this.signatureHash.length);
    byteLength += this.signatureHash.length;
    byteLength += HASH160_BYTE_LENGTH; // identityID uint160
    byteLength += varint.encodingLength(this.sigType);
    byteLength += varuint.encodingLength(this.vdxfKeys.length);
    byteLength += this.vdxfKeys.length * 20;
    byteLength += varuint.encodingLength(this.vdxfKeyNames.length);

    for (const keyName of this.vdxfKeyNames) {
      byteLength += varuint.encodingLength(Buffer.from(keyName, 'utf8').length);
      byteLength += Buffer.from(keyName, 'utf8').length;
    }

    byteLength += varuint.encodingLength(this.boundHashes.length);
    byteLength += this.boundHashes.length * 32;
    byteLength += varuint.encodingLength(this.signatureAsVch.length);
    byteLength += this.signatureAsVch.length;

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeSlice(fromBase58Check(this.systemID).hash);
    bufferWriter.writeVarInt(this.hashType);
    bufferWriter.writeVarSlice(this.signatureHash);
    bufferWriter.writeSlice(fromBase58Check(this.identityID).hash);
    bufferWriter.writeVarInt(this.sigType);
    bufferWriter.writeCompactSize(this.vdxfKeys.length);

    for (const key of this.vdxfKeys) {
      bufferWriter.writeSlice(fromBase58Check(key).hash);
    }

    bufferWriter.writeCompactSize(this.vdxfKeyNames.length);
    for (const keyName of this.vdxfKeyNames) {
      bufferWriter.writeVarSlice(Buffer.from(keyName, 'utf8'));
    }
    bufferWriter.writeCompactSize(this.boundHashes.length);
    for (const boundHash of this.boundHashes) {
      bufferWriter.writeSlice(boundHash);
    }
    bufferWriter.writeVarSlice(this.signatureAsVch);

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.systemID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.hashType = reader.readVarInt();
    this.signatureHash = reader.readVarSlice();
    this.identityID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    this.sigType = reader.readVarInt();
    const vdxfKeysLength = reader.readCompactSize();
    this.vdxfKeys = [];

    for (let i = 0; i < vdxfKeysLength; i++) {
      this.vdxfKeys.push(toBase58Check(reader.readSlice(20), I_ADDR_VERSION));
    }

    const vdxfKeyNamesLength = reader.readCompactSize();
    this.vdxfKeyNames = [];

    for (let i = 0; i < vdxfKeyNamesLength; i++) {
      this.vdxfKeyNames.push(reader.readVarSlice().toString('utf8'));
    }

    const boundHashesLength = reader.readCompactSize();
    this.boundHashes = [];

    for (let i = 0; i < boundHashesLength; i++) {
      this.boundHashes.push(reader.readSlice(32));
    }

    this.signatureAsVch = reader.readVarSlice();

    return reader.offset;
  }

  isValid() {
    return !!(this.version.gte(SignatureData.FIRST_VERSION) &&
      this.version.lte(SignatureData.LAST_VERSION) &&
      this.systemID);
  }

  toJson(): SignatureJsonDataInterface {

    const returnObj: SignatureJsonDataInterface = {
      version: this.version.toNumber(),
      systemid: this.systemID,
      hashtype: this.hashType.toNumber(),
      signaturehash: '', // Will be set below
      identityid: this.identityID,
      signaturetype: this.sigType.toNumber(),
      signature: this.signatureAsVch.toString('base64')
    };

    if (this.hashType.eq(new BN(Number(EHashTypes.HASH_SHA256)))) {
      returnObj.signaturehash = Buffer.from(this.signatureHash).toString('hex');
    } else {
      returnObj.signaturehash = Buffer.from(this.signatureHash).reverse().toString('hex');
    }

    if (this.vdxfKeys && this.vdxfKeys.length > 0) {
      returnObj.vdxfkeys = this.vdxfKeys;
    }

    if (this.vdxfKeyNames && this.vdxfKeyNames.length > 0) {
      returnObj.vdxfkeynames = this.vdxfKeyNames;
    }

    if (this.boundHashes && this.boundHashes.length > 0) {
      returnObj.boundhashes = this.boundHashes.map((hash) => Buffer.from(hash).reverse().toString('hex'));
    }

    return returnObj;
  }

  // To fully implement, refer to VerusCoin/src/pbaas/crosschainrpc.cpp line 337, IdentitySignatureHash
  // missing bound hashes and vdxf keys
  getIdentityHash(sigObject: { version: number, hash_type: number, height: number }): Buffer<ArrayBufferLike> {
    var heightBuffer = Buffer.allocUnsafe(4)
    heightBuffer.writeUInt32LE(sigObject.height);

    if (sigObject.hash_type != Number(EHashTypes.HASH_SHA256)) {
      throw new Error("Invalid signature type for identity hash");
    }

    if (sigObject.version == 1) {
      return createHash("sha256")
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(fromBase58Check(this.systemID).hash)
        .update(heightBuffer)
        .update(fromBase58Check(this.identityID).hash)
        .update(this.signatureHash)
        .digest();
    } else {
      return createHash("sha256")
        .update(fromBase58Check(this.systemID).hash)
        .update(heightBuffer)
        .update(fromBase58Check(this.identityID).hash)
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(this.signatureHash)
        .digest();
    }
  }
}
