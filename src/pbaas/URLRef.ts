import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export interface URLRefJson {
  version: string;
  url: string;
}

export class URLRef implements SerializableEntity {

  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);

  version: BigNumber;
  url: string;
  constructor(data?: { version?: BigNumber, url?: string }) {

    if (data) {
      this.version = data.version || new BN(1, 10);
      this.url = data.url || "";
    }
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += varint.encodingLength(this.version);
    byteLength += varuint.encodingLength(Buffer.from(this.url, 'utf8').length);
    byteLength += Buffer.from(this.url, 'utf8').length;
    if (byteLength > 4096)
      throw new Error("URLRef exceeds maximum length of 4096 bytes")
    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeVarInt(this.version);
    bufferWriter.writeVarSlice(Buffer.from(this.url, 'utf8'));

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = reader.readVarInt();
    this.url = reader.readVarSlice().toString('utf8');

    return reader.offset;
  }

  isValid(): boolean {
    return this.version.gte(URLRef.FIRST_VERSION) &&
      this.version.lte(URLRef.LAST_VERSION) &&
      !(!this.url || this.url.length === 0);
  }

  toJson() {
    return {
      version: this.version.toString(10),
      url: this.url
    }
  }

  static fromJson(data: URLRefJson): URLRef {
    return new URLRef({
      version: new BN(data.version, 10),
      url: data.url
    });
  }
}