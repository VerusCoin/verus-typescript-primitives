import varint from '../utils/varint'
import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
const { BufferReader, BufferWriter } = bufferutils

export class CurrencyValueMap {
  value_map: Map<string,BigNumber>;
  multivalue: boolean;

  constructor (data: { value_map?: Map<string,BigNumber>, multivalue?: boolean } = {}) {
    this.value_map = new Map(data.value_map || []);
    this.multivalue = !!(data.multivalue);
  }

  getNumValues () {
    return new BN(this.value_map.size, 10)
  }

  getByteLength() {
    let byteLength = 0;

    if (this.multivalue) {
      byteLength += varuint.encodingLength(this.value_map.size)
    }

    for (const [key, value] of this.value_map) {
      byteLength += 20
      byteLength += this.multivalue ? 8 : varint.encodingLength(value)
    }

    return byteLength
  }

  toBuffer () {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    if (this.multivalue) {
      bufferWriter.writeCompactSize(this.value_map.size);
    }

    for (const [key, value] of this.value_map) {
      const { hash } = fromBase58Check(key);

      bufferWriter.writeSlice(hash);

      if (this.multivalue) bufferWriter.writeInt64(value);
      else bufferWriter.writeVarInt(value);
    }

    return bufferWriter.buffer
  }

  fromBuffer (buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);
    let count: number;

    if (this.multivalue) {
      count = reader.readCompactSize();
    } else {
      count = 1;
    }

    for (let i = 0; i < count; i++) {
      const hash = reader.readSlice(20)
      const value = this.multivalue ? reader.readInt64() : reader.readVarInt()

      const base58Key = toBase58Check(hash, I_ADDR_VERSION)

      this.value_map.set(base58Key, value)
    }

    return reader.offset;
  }
}