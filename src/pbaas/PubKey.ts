import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import bufferutils from "../utils/bufferutils";
import { SerializableEntity } from "../utils/types/SerializableEntity";

export class PubKey extends SerializableEntityBase implements SerializableEntity {
  static PUBLIC_KEY_SIZE = 65
  static COMPRESSED_PUBLIC_KEY_SIZE = 33;

  bytes: Buffer;
  compressed: boolean;

  constructor(
    bytes: Buffer = Buffer.alloc(0),
    compressed: boolean = true
  ) {
    super();
    this.bytes = bytes;
    this.compressed = compressed;
  }

  getByteLength(): number {
    return this.compressed ? PubKey.COMPRESSED_PUBLIC_KEY_SIZE : PubKey.PUBLIC_KEY_SIZE
  }

  fromBuffer(
    buffer: Buffer,
    offset: number = 0
  ): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    
    const header = buffer[offset];
    this.compressed = (header === 2 || header === 3);

    this.bytes = reader.readSlice(this.compressed ? PubKey.COMPRESSED_PUBLIC_KEY_SIZE : PubKey.PUBLIC_KEY_SIZE);

    return reader.offset;
  }
  
  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.getByteLength());
    const writer = new bufferutils.BufferWriter(buffer);

    writer.writeSlice(this.bytes);

    return writer.buffer;
  }
}