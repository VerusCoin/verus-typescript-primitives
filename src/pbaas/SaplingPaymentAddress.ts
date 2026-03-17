import bufferutils from '../utils/bufferutils';
import { decodeSaplingAddress, encodeSaplingAddress } from '../utils/sapling';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils

export class SaplingPaymentAddress implements SerializableEntity {
  d: Buffer;
  pkD: Buffer

  constructor(data?: {
    d: Buffer,
    pkD: Buffer
  }) {
    if (data != null) {
      if ('pk_d' in (data as any)) {
        throw new Error("SaplingPaymentAddress: snake_case property names are no longer supported. Use 'pkD' instead of 'pk_d'.");
      }
      if (data.d != null) this.d = data.d;
      if (data.pkD != null) this.pkD = data.pkD;
    }
  }

  /** @deprecated Use pkD instead */
  get pk_d(): Buffer { return this.pkD; }

  getByteLength() {
    let length = 0;

    length += this.d.length;
    length += this.pkD.length;

    return length
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeSlice(this.d);
    writer.writeSlice(this.pkD);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.d = reader.readSlice(11);
    this.pkD = reader.readSlice(32);

    return reader.offset;
  }

  static fromAddressString(address: string) {
    const { d, pk_d } = decodeSaplingAddress(address);

    return new SaplingPaymentAddress({ d, pkD: pk_d });
  }

  toAddressString(): string {
    return encodeSaplingAddress({ d: this.d, pk_d: this.pkD });
  }
}
