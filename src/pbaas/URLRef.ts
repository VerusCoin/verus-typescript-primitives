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

export class URLRef implements SerializableEntity {

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

    if (data != null) {
      if (Object.prototype.hasOwnProperty.call(data, 'data_hash')) {
        throw new Error("URLRef: snake_case property names are no longer supported. Use 'dataHash' instead of 'data_hash'.");
      }
    }

    if (data) {
      this.version = data.version || new BN(2, 10);
      this.url = data.url || "";
      this.flags = data.flags || new BN(0);
      this.dataHash = data.dataHash || Buffer.alloc(0);
    }
  }

  /** @deprecated Use dataHash instead */
  get data_hash(): Buffer { return this.dataHash; }

  getByteLength() {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);

    if( this.version.gte(URLRef.HASHDATA_VERSION) ) {
      // If the version is at least HASHDATA_VERSION, we include the URL length
      // as a varuint before the URL itself.
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
      // If the version is at least HASHDATA_VERSION, we include the URL length
      // as a varuint before the URL itself.
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
    return {
      version: this.version.toNumber(),
      flags: this.flags ? this.flags.toNumber() : 0,
      datahash: this.dataHash ? this.dataHash.toString('hex') : "",
      url: this.url
    }
  }

  static fromJson(data: URLRefJson): URLRef {
    return new URLRef({
      version: new BN(data.version, 10),
      flags: data.flags ? new BN(data.flags, 10) : new BN(0, 10),
      dataHash: data.datahash ? Buffer.from(data.datahash, 'hex') : Buffer.alloc(0),
      url: data.url
    });
  }
}
