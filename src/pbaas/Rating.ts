import varuint from '../utils/varuint'
import { fromBase58Check, toBase58Check } from "../utils/address";
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
const { BufferReader, BufferWriter } = bufferutils

export interface RatingJson {
  version: number;
  trustlevel: number;
  ratingsmap: {[key: string]: string};
}
export class Rating implements SerializableEntity {

  static VERSION_INVALID = new BN(0, 10)
  static VERSION_FIRST = new BN(1, 10)
  static VERSION_LAST = new BN(1, 10)
  static VERSION_CURRENT = new BN(1, 10)

  static TRUST_UNKNOWN = new BN(0, 10)                  // unknown and can be included in exploration
  static TRUST_BLOCKED = new BN(1, 10)                  // suspected or known to be untrustworthy and should not be interacted with
  static TRUST_APPROVED = new BN(2, 10)                 // explicitly believed to be trustworthy enough to interact with
  static TRUST_FIRST = new BN(0, 10)
  static TRUST_LAST = new BN(2, 10)

  version: BigNumber;
  trust_level: BigNumber;
  ratings: Map<string, Buffer>;

  constructor(data: { version?: BigNumber, trust_level?: BigNumber, ratings?: Map<string, Buffer> } = {}) {
    this.version = data.version || new BN(1, 10);
    this.trust_level = data.trust_level || new BN(0, 10);
    this.ratings = new Map(data.ratings || []);
  }

  getByteLength() {
    let byteLength = 0;

    byteLength += 4; // version uint32
    byteLength += 1; // trust_level uint8
    byteLength += varuint.encodingLength(this.ratings.size);

    for (const [key, value] of this.ratings) {
      byteLength += 20
      byteLength += varuint.encodingLength(value.length)
      byteLength += value.length

    }

    return byteLength
  }

  toBuffer() {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()))

    bufferWriter.writeUInt32(this.version.toNumber());
    bufferWriter.writeUInt8(this.trust_level.toNumber());
    bufferWriter.writeCompactSize(this.ratings.size);

    for (const [key, value] of this.ratings) {
      const { hash } = fromBase58Check(key);

      bufferWriter.writeSlice(hash);
      bufferWriter.writeVarSlice(value);
    }

    return bufferWriter.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readUInt32());
    this.trust_level = new BN(reader.readUInt8());

    const count = reader.readCompactSize();

    for (let i = 0; i < count; i++) {
      const hash = reader.readSlice(20)
      const value = reader.readVarSlice()

      const base58Key = toBase58Check(hash, I_ADDR_VERSION)

      this.ratings.set(base58Key, value)
    }

    return reader.offset;
  }

  isValid() {
    return this.version.gte(Rating.VERSION_FIRST) && this.version.lte(Rating.VERSION_LAST) &&
      this.trust_level.gte(Rating.TRUST_FIRST) && this.trust_level.lte(Rating.TRUST_LAST);
  }
  toJson() {

    const ratings: { [key: string]: string } = {};

    this.ratings.forEach((value, key) => {
      ratings[key] = value.toString('hex');
    });

    return {
      version: this.version.toString(),
      trust_level: this.trust_level.toString(),
      ratings: ratings
    }
  }

  static fromJson(json: RatingJson) {

    const ratings = new Map<string, Buffer>();

    for (const key in json.ratingsmap) {
      ratings.set(key, Buffer.from(json.ratingsmap[key], 'hex'));
    }

    return new Rating({
      version: new BN(json.version),
      trust_level: new BN(json.trustlevel),
      ratings: ratings
    })
  }

  //TODO: implment ratings values
}