import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varuint from '../utils/varuint';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import varint from '../utils/varint';
import { getDataKey } from '../utils/address';
import { TESTNET_VERUS_CHAINID } from '../constants/pbaas';
import { IdentityID } from './IdentityID';

const { BufferReader, BufferWriter } = bufferutils

export class DefinedKey implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  vdxfuri?: string;

  combinedVDXFKey?: IdentityID;
  combinedHash?: Buffer;
  indexNum?: BigNumber;

  static DEFINEDKEY_DEFAULT_FLAGS = new BN(0, 10);
  static DEFINEDKEY_COMBINES_KEY = new BN(1, 10);
  static DEFINEDKEY_COMBINES_HASH = new BN(2, 10);
  static DEFINEDKEY_COMBINES_INDEX_NUM = new BN(4, 10);
  static DEFINEDKEY_CONTAINS_SCHEMA = new BN(8, 10);

  static DEFINEDKEY_VERSION_INVALID = new BN(0, 10);
  static DEFINEDKEY_VERSION_CURRENT = new BN(1, 10);

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    vdxfuri?: string,

    combinedVDXFKey?: IdentityID,
    combinedHash?: Buffer,
    indexNum?: BigNumber
  }) {
    this.flags = DefinedKey.DEFINEDKEY_DEFAULT_FLAGS;
    this.version = DefinedKey.DEFINEDKEY_VERSION_INVALID;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.version != null) this.version = data.version
      if (data.vdxfuri) this.vdxfuri = data.vdxfuri;

      if (data.combinedVDXFKey || data.combinedHash || data.indexNum) {
        throw new Error("Combining keys not supported yet.")
      }
    }

    if (this.containsSchema()) throw new Error("Schema not supported yet.")
    if (this.combinesKey() || this.combinesHash() || this.combinesindexNum()) {
      throw new Error("Combining keys not supported yet.")
    }
  }

  protected containsSchema() {
    return !!(this.flags.and(DefinedKey.DEFINEDKEY_CONTAINS_SCHEMA).toNumber());
  }

  combinesKey() {
    return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_KEY).toNumber());
  }

  combinesHash() {
    return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_HASH).toNumber());
  }

  combinesindexNum() {
    return !!(this.flags.and(DefinedKey.DEFINEDKEY_COMBINES_INDEX_NUM).toNumber());
  }

  getFqnBuffer() {
    return Buffer.from(this.vdxfuri, 'utf8');
  }

  private getDataKey(testnet: boolean = false) {
    if (this.combinedVDXFKey || this.combinedHash || this.indexNum) {
      throw new Error("Combining keys not supported yet.")
    }
    
    if (this.vdxfuri == null) throw new Error("No fully qualified name provided.")
    else if (testnet) {
      return getDataKey(this.vdxfuri, null, TESTNET_VERUS_CHAINID);
    } else return getDataKey(this.vdxfuri);
  }

  getIAddr(testnet: boolean = false) {
    return this.getDataKey(testnet).id;
  }

  getNameSpaceID(testnet: boolean = false) {
    return this.getDataKey(testnet).namespace;
  }

  private getSelfByteLength() {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);
    byteLength += varint.encodingLength(this.flags);

    const fqnLen = this.getFqnBuffer().length;

    byteLength += varuint.encodingLength(fqnLen);
    byteLength += fqnLen;
    
    return byteLength
  }

  getByteLength() {
    return this.getSelfByteLength();
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()))

    writer.writeVarInt(this.version)
    writer.writeVarInt(this.flags)

    writer.writeVarSlice(this.getFqnBuffer())

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.flags = reader.readVarInt();

    this.vdxfuri = (reader.readVarSlice()).toString('utf8');

    return reader.offset;
  }
}

