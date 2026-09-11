import { SerializableEntityBase } from '../../utils/types/SerializableEntityBase';
import bufferutils from "../../utils/bufferutils";
import { ScriptChunk, compile, decompile } from "../../utils/script";
import { SerializableEntity } from "../../utils/types/SerializableEntity";

export class VerusScript extends SerializableEntityBase implements SerializableEntity {
  chunks: Array<ScriptChunk>;

  constructor(chunks: Array<ScriptChunk> = []) {
    super();
    this.chunks = chunks;
  }

  getByteLength(): number {
    return this.internalToBuffer().length;
  }

  fromBuffer(
    buffer: Buffer,
    offset?: number,
    length?: number
  ): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const _length = length != null ? length : offset != null ? reader.buffer.length - offset : reader.buffer.length;
    
    this.chunks = decompile(reader.readSlice(_length));
    if (_length > 0 && this.chunks.length === 0) {
      throw new Error("Cannot deserialize a truncated script push");
    }

    return reader.offset;
  }

  private internalToBuffer(): Buffer {
    return compile(this.chunks);
  }
  
  toBuffer(): Buffer {
    return this.internalToBuffer();
  }
}
