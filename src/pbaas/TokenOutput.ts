import { CurrencyValueMap } from './CurrencyValueMap';
import varint from '../utils/varint'
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
const { BufferReader, BufferWriter } = bufferutils

export const TOKEN_OUTPUT_VERSION_INVALID = new BN(0, 10)
export const TOKEN_OUTPUT_VERSION_CURRENT = new BN(1, 10)
export const TOKEN_OUTPUT_VERSION_FIRSTVALID = new BN(1, 10)
export const TOKEN_OUTPUT_VERSION_LASTVALID = new BN(1, 10)
export const TOKEN_OUTPUT_VERSION_MULTIVALUE = new BN('80000000', 16)

export class TokenOutput implements SerializableEntity {
  version: BigNumber;
  reserveValues: CurrencyValueMap;

  constructor (data?: { values?: CurrencyValueMap, version?: BigNumber }) {
    if (data != null) {
      if (Object.prototype.hasOwnProperty.call(data, 'reserve_values')) {
        throw new Error("TokenOutput: snake_case property names are no longer supported. Use 'reserveValues' instead of 'reserve_values'.");
      }
    }
    this.version = TOKEN_OUTPUT_VERSION_INVALID;
    this.reserveValues = new CurrencyValueMap();

    if (data != null) {
      if (data.values != null) this.reserveValues = data.values
      if (data.version != null) this.version = data.version
    }
  }

  /** @deprecated Use reserveValues instead */
  get reserve_values(): CurrencyValueMap { return this.reserveValues; }

  getByteLength() {
    return varint.encodingLength(this.version) + this.reserveValues.getByteLength()
  }

  toBuffer () {
    const multivalue = !!(this.version.and(TOKEN_OUTPUT_VERSION_MULTIVALUE).toNumber())

    if (multivalue) {
      this.reserveValues.multivalue = true
    }

    const serializedSize = this.getByteLength()

    const writer = new BufferWriter(Buffer.alloc(serializedSize))
    writer.writeVarInt(this.version)

    writer.writeSlice(this.reserveValues.toBuffer())
    return writer.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset)
    this.version = reader.readVarInt()

    const multivalue = !!(this.version.and(TOKEN_OUTPUT_VERSION_MULTIVALUE).toNumber())
    this.reserveValues = new CurrencyValueMap({multivalue})
    reader.offset = this.reserveValues.fromBuffer(reader.buffer, reader.offset)

    return reader.offset
  }

  firstCurrency () {
    const iterator = this.reserveValues.valueMap.entries().next()
    return iterator.done ? null : iterator.value[0]
  }

  firstValue () {
    const iterator = this.reserveValues.valueMap.entries().next()
    return iterator.done ? null : iterator.value[1]
  }

  getVersion () {
    return this.version
  }

  isValid () {
    return (
      this.version.gte(TOKEN_OUTPUT_VERSION_FIRSTVALID) &&
      this.version.lte(TOKEN_OUTPUT_VERSION_LASTVALID)
    )
  }
}
