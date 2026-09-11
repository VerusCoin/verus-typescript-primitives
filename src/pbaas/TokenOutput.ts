import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
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

function getSerializationData (version: BigNumber, reserveValues: CurrencyValueMap) {
  const multivalue = reserveValues.valueMap.size !== 1
  const multivalueFlag = version.and(TOKEN_OUTPUT_VERSION_MULTIVALUE)
  const semanticVersion = version.xor(multivalueFlag)

  return {
    version: multivalue
      ? semanticVersion.or(TOKEN_OUTPUT_VERSION_MULTIVALUE)
      : semanticVersion,
    reserveValues: new CurrencyValueMap({
      valueMap: reserveValues.valueMap,
      multivalue
    })
  }
}

export class TokenOutput extends SerializableEntityBase implements SerializableEntity {
  version: BigNumber;
  reserveValues: CurrencyValueMap;

  constructor (data?: { values?: CurrencyValueMap, version?: BigNumber }) {
    super();
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
    const { version, reserveValues } = getSerializationData(this.version, this.reserveValues)
    return varint.encodingLength(version) + reserveValues.getByteLength()
  }

  toBuffer () {
    const { version, reserveValues } = getSerializationData(this.version, this.reserveValues)
    const serializedSize = varint.encodingLength(version) + reserveValues.getByteLength()

    const writer = new BufferWriter(Buffer.alloc(serializedSize))
    writer.writeVarInt(version)

    writer.writeSlice(reserveValues.toBuffer())
    return writer.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset)
    const wireVersion = reader.readVarInt()
    const multivalueFlag = wireVersion.and(TOKEN_OUTPUT_VERSION_MULTIVALUE)
    const multivalue = !multivalueFlag.isZero()

    this.version = wireVersion.xor(multivalueFlag)
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
