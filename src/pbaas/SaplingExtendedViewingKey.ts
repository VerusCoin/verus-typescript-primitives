import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import bufferutils from '../utils/bufferutils';
import { decodeSaplingExtendedViewingKey, encodeSaplingExtendedViewingKey, SaplingExtendedViewingKeyData } from '../utils/sapling';
import { SerializableEntity } from '../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils;

export class SaplingExtendedViewingKey extends SerializableEntityBase implements SerializableEntity, SaplingExtendedViewingKeyData {
  depth: number;
  parentFVKTag: Buffer; // 4 bytes
  childIndex: Buffer; // 4 bytes
  chainCode: Buffer; // 32 bytes
  ak: Buffer; // 32 bytes
  nk: Buffer; // 32 bytes
  ovk: Buffer; // 32 bytes
  dk: Buffer; // 32 bytes

  constructor(data?: SaplingExtendedViewingKeyData) {
    super();
    if (data != null) {
      this.depth = data.depth ?? 0;
      this.parentFVKTag = data.parentFVKTag ?? Buffer.alloc(4);
      this.childIndex = data.childIndex ?? Buffer.alloc(4);
      this.chainCode = data.chainCode ?? Buffer.alloc(32);
      this.ak = data.ak ?? Buffer.alloc(32);
      this.nk = data.nk ?? Buffer.alloc(32);
      this.ovk = data.ovk ?? Buffer.alloc(32);
      this.dk = data.dk ?? Buffer.alloc(32);
    }
  }

  getByteLength() {
    return 1 + 4 + 4 + 32 + 32 + 32 + 32 + 32; // 169 bytes total
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeUInt8(this.depth);
    writer.writeSlice(this.parentFVKTag);
    writer.writeSlice(this.childIndex);
    writer.writeSlice(this.chainCode);
    writer.writeSlice(this.ak);
    writer.writeSlice(this.nk);
    writer.writeSlice(this.ovk);
    writer.writeSlice(this.dk);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.depth = reader.readUInt8();
    this.parentFVKTag = reader.readSlice(4);
    this.childIndex = reader.readSlice(4);
    this.chainCode = reader.readSlice(32);
    this.ak = reader.readSlice(32);
    this.nk = reader.readSlice(32);
    this.ovk = reader.readSlice(32);
    this.dk = reader.readSlice(32);

    return reader.offset;
  }

  static fromKeyString(key: string): SaplingExtendedViewingKey {
    const decoded = decodeSaplingExtendedViewingKey(key);
    return new SaplingExtendedViewingKey(decoded);
  }

  toKeyString(testnet: boolean = false): string {
    return encodeSaplingExtendedViewingKey({
      depth: this.depth,
      parentFVKTag: this.parentFVKTag,
      childIndex: this.childIndex,
      chainCode: this.chainCode,
      ak: this.ak,
      nk: this.nk,
      ovk: this.ovk,
      dk: this.dk
    }, testnet);
  }
}
