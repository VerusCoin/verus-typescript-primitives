import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { HASH256_BYTE_LENGTH } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export interface URLRefJson {
  version: string;
  flags?: string;
  datahash?: string;
  url: string;
}

export class URLRef extends SerializableEntityBase implements SerializableEntity {

  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(2);
  static HASHDATA_VERSION = new BN(2);
  static DEFAULT_VERSION = new BN(2);
  static FLAG_HAS_HASH = new BN(1);


  version: BigNumber;
  flags: BigNumber;
  dataHash: Buffer;
  url: string;

  constructor(data?: { version?: BigNumber, url?: string, flags?: BigNumber, dataHash?: Buffer }) {
    super();

    if (data != null) {
      if (Object.prototype.hasOwnProperty.call(data, 'data_hash')) {
        throw new Error("URLRef: snake_case property names are no longer supported. Use 'dataHash' instead of 'data_hash'.");
      }
    }

    this.version = data?.version || new BN(2, 10);
    this.url = data?.url || "";
    this.flags = data?.flags || new BN(0);
    this.dataHash = data?.dataHash || Buffer.alloc(HASH256_BYTE_LENGTH);
    this.validateDataHashLength();
  }

  /** @deprecated Use dataHash instead */
  get data_hash(): Buffer { return this.dataHash; }

  private validateDataHashLength() {
    if (!Buffer.isBuffer(this.dataHash) || this.dataHash.length !== HASH256_BYTE_LENGTH) {
      throw new Error(`URLRef dataHash must be exactly ${HASH256_BYTE_LENGTH} bytes`);
    }
  }

  getByteLength() {
    this.validateDataHashLength();
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);

    if( this.version.gte(URLRef.HASHDATA_VERSION) ) {
      // Version 2 adds flags and an optional hash before the URL string.
      byteLength += varint.encodingLength(this.flags);

      if( this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH) ) {
        // If the FLAG_HAS_HASH is set, we include the data hash
        byteLength += HASH256_BYTE_LENGTH; // 32 bytes for the hash
      }
    }

    byteLength += varuint.encodingLength(Buffer.from(this.url, 'utf8').length);
    byteLength += Buffer.from(this.url, 'utf8').length;
    if (byteLength > 4096)
      throw new Error("URLRef exceeds maximum length of 4096 bytes")
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    if (this.version.gte(URLRef.HASHDATA_VERSION)) {
      bufferWriter.writeVarInt(this.flags);

      if (this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH)) {
        // If the FLAG_HAS_HASH is set, we include the data hash
        bufferWriter.writeSlice(this.dataHash);
      }
    }
    bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(0);
    this.dataHash = Buffer.alloc(HASH256_BYTE_LENGTH);
    this.version = reader.readVarInt();
    if (this.version.gte(URLRef.HASHDATA_VERSION)) {
      // If the version is at least HASHDATA_VERSION, we read the flags
      this.flags = reader.readVarInt();

      if (this.flags.and(URLRef.FLAG_HAS_HASH).eq(URLRef.FLAG_HAS_HASH)) {
        // If the FLAG_HAS_HASH is set, we read the data hash
        this.dataHash = reader.readSlice(32);
      }
    }

    this.url = reader.readVarSlice().toString('utf8');

    return reader.offset;
  }

  isValid(): boolean {
    return this.version.gte(URLRef.FIRST_VERSION) &&
      this.version.lte(URLRef.LAST_VERSION) &&
      this.url.length > 0;
  }

  toJson() {
    this.validateDataHashLength();
    return {
      version: this.version.toNumber(),
      flags: this.flags ? this.flags.toNumber() : 0,
      datahash: Buffer.from(this.dataHash).reverse().toString('hex'),
      url: this.url
    }
  }

  static fromJson(data: URLRefJson): URLRef {
    let dataHash = Buffer.alloc(HASH256_BYTE_LENGTH);
    if (data.datahash != null && data.datahash !== '') {
      if (!/^[0-9a-fA-F]{64}$/.test(data.datahash)) {
        throw new Error(`URLRef datahash must be exactly ${HASH256_BYTE_LENGTH} bytes of hexadecimal data`);
      }
      // uint256 JSON is display order; the serialized value uses wire order.
      dataHash = Buffer.from(data.datahash, 'hex').reverse();
    }

    return new URLRef({
      version: new BN(data.version, 10),
      flags: data.flags ? new BN(data.flags, 10) : new BN(0, 10),
      dataHash,
      url: data.url
    });
  }
}
