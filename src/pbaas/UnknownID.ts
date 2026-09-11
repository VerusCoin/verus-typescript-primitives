import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import bufferutils from "../utils/bufferutils";
import { SerializableEntity } from "../utils/types/SerializableEntity";

export class UnknownID extends SerializableEntityBase implements SerializableEntity {
  bytes: Buffer;

  constructor(
    bytes: Buffer = Buffer.alloc(0)
  ) {
    super();
    this.bytes = bytes;
  }

  getByteLength(): number {
    return this.bytes.length;
  }

  fromBuffer(
    buffer: Buffer,
    offset?: number,
    length: number = 0
  ): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.bytes = reader.readSlice(length);

    return reader.offset;
  }
  
  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.getByteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    writer.writeSlice(this.bytes);

    return writer.buffer;
  }
}