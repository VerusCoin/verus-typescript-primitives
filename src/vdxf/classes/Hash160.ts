import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from "../../constants/vdxf";
import { fromBase58Check, toBase58Check } from "../../utils/address";
import bufferutils from "../../utils/bufferutils";
import varuint from "../../utils/varuint";

export class Hash160 {
  hash: Buffer;
  version: number;
  varlength: boolean;

  constructor(
    hash: Buffer = Buffer.alloc(0),
    version: number = I_ADDR_VERSION,
    varlength: boolean = false
  ) {
    this.hash = hash;
    this.version = version;
    this.varlength = varlength;
  }

  static getEmpty(): Hash160 {
    return new Hash160(Buffer.alloc(0), 0, true);
  }

  static fromAddress(address: string, varlength: boolean = false): Hash160 {
    const base58 = fromBase58Check(address);

    return new Hash160(base58.hash, base58.version, varlength);
  }

  toAddress(): string | null {
    if (this.hash.length == 0) {
      return null;
    } else return toBase58Check(this.hash, this.version);
  }

  byteLength(): number {
    let length = 0;

    if (this.varlength) {
      length += varuint.encodingLength(this.hash.length);
      length += this.hash.length;
    } else {
      length += this.hash.length;
    }

    return length;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.byteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    if (this.varlength) {
      writer.writeVarSlice(this.hash);
    } else {
      writer.writeSlice(this.hash);
    }

    return writer.buffer;
  }

  fromBuffer(
    buffer: Buffer,
    varlength: boolean = false,
    offset: number = 0
  ): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    if (varlength) {
      this.hash = reader.readVarSlice();
    } else {
      this.hash = reader.readSlice(HASH160_BYTE_LENGTH);
    }

    this.version = I_ADDR_VERSION;
    this.varlength = varlength;

    return reader.offset;
  }

  toJson() {
    return {
      hash: this.hash,
      version: this.version,
    };
  }
}