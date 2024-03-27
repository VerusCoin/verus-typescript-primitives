import { CurrencyValueMap } from './CurrencyValueMap';
import varint from '../utils/varint'
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
const { BufferReader, BufferWriter } = bufferutils

export const VERSION_INVALID = new BN(0, 10)
export const VERSION_CURRENT = new BN(1, 10)
export const VERSION_FIRSTVALID = new BN(1, 10)
export const VERSION_LASTVALID = new BN(1, 10)
export const VERSION_MULTIVALUE = new BN('80000000', 16)

export class TokenOutput {
  version: BigNumber;
  reserve_values: CurrencyValueMap;

  constructor (data?: { values?: CurrencyValueMap, version?: BigNumber }) {
    this.version = VERSION_INVALID;
    this.reserve_values = new CurrencyValueMap();

    if (data != null) {
      if (data.values != null) this.reserve_values = data.values
      if (data.version != null) this.version = data.version
    }
  }

  getByteLength() {
    return varint.encodingLength(this.version) + this.reserve_values.getByteLength()
  }

  toBuffer () {
    const multivalue = !!(this.version.and(VERSION_MULTIVALUE).toNumber())

    if (multivalue) {
      this.reserve_values.multivalue = true
    }

    const serializedSize = this.getByteLength()

    const writer = new BufferWriter(Buffer.alloc(serializedSize))
    writer.writeVarInt(this.version)

    writer.writeSlice(this.reserve_values.toBuffer())
    return writer.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset)
    this.version = reader.readVarInt()

    const multivalue = !!(this.version.and(VERSION_MULTIVALUE).toNumber())
    this.reserve_values = new CurrencyValueMap({multivalue})
    reader.offset = this.reserve_values.fromBuffer(reader.buffer, reader.offset)

    return reader.offset
  }

  firstCurrency () {
    const iterator = this.reserve_values.value_map.entries().next()
    return iterator.done ? null : iterator.value[0]
  }

  firstValue () {
    const iterator = this.reserve_values.value_map.entries().next()
    return iterator.done ? null : iterator.value[1]
  }

  getVersion () {
    return this.version
  }

  isValid () {
    return (
      this.version.gte(VERSION_FIRSTVALID) &&
      this.version.lte(VERSION_LASTVALID)
    )
  }
}