import varuint from '../utils/varuint';
import bufferutils from '../utils/bufferutils';
import { fromBase58Check, toBase58Check } from '../utils/address';
import {  I_ADDR_VERSION } from '../constants/vdxf';
import { FqnVdxfUniValue, VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';
import { isHexString } from '../utils/string';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { CompactIAddressObject } from '../vdxf/classes/CompactAddressObject';
import { KvMap } from '../utils/KvMap';

const { BufferReader, BufferWriter } = bufferutils

export type ContentMultiMapPrimitive = VdxfUniValue | Buffer;
export type ContentMultiMapPrimitiveJson = VdxfUniValueJson | string;
export type ContentMultiMapJsonValue = ContentMultiMapPrimitiveJson | Array<ContentMultiMapPrimitiveJson>;
export type ContentMultiMapJson = { [key: string]: ContentMultiMapJsonValue };

export type KvValueArrayItem = Buffer | ContentMultiMapJson;

export function isKvValueArrayItemVdxfUniValueJson(x: ContentMultiMapJsonValue): x is VdxfUniValueJson {
  return x != null && typeof x === 'object' && !Array.isArray(x) && Object.keys(x).every((key) => {
    const val = x[key];

    try {
      const { version, hash } = fromBase58Check(key);

      return version === I_ADDR_VERSION && (Buffer.isBuffer(val) || typeof val === 'string')
    } catch(e) {return false}
  })
}

/**
 * KvContent is KvMap specialized for ContentMultiMap values.
 * Keys are CompactIAddressObject; values are arrays of ContentMultiMapPrimitive.
 */
export class KvContent extends KvMap<Array<ContentMultiMapPrimitive>> {}

export class ContentMultiMap implements SerializableEntity {
  kvContent: KvContent;

  constructor(data?: { kvContent: KvContent }) {
    if (data?.kvContent) this.kvContent = data.kvContent;
  }

  getByteLength() {
    let length = 0;

    length += varuint.encodingLength(this.kvContent.size);

    for (const [key, value] of this.kvContent.entries()) {
      length += fromBase58Check(key.toIAddress()).hash.length;

      if (Array.isArray(value)) {
        const valueArr = value as Array<ContentMultiMapPrimitive>;
        length += varuint.encodingLength(valueArr.length);

        for (const n of value) {
          if (n instanceof VdxfUniValue) {
            const nCMMNOLength = n.getByteLength();

            length += varuint.encodingLength(nCMMNOLength);
            length += nCMMNOLength;
          } else if (Buffer.isBuffer(n)) {
            const nBuf = n as Buffer;

            length += varuint.encodingLength(nBuf.length);
            length += nBuf.length;
          } else throw new Error("Unknown ContentMultiMap data, can't calculate ByteLength")
        }
      } else throw new Error("Unknown ContentMultiMap data, can't calculate ByteLength")
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.kvContent.size);

    for (const [key, value] of this.kvContent.entries()) {
      writer.writeSlice(fromBase58Check(key.toIAddress()).hash);

      if (Array.isArray(value)) {
        writer.writeCompactSize(value.length);

        for (const n of value) {
          if (n instanceof VdxfUniValue) {
            const nCMMNOBuf = n.toBuffer();

            writer.writeVarSlice(nCMMNOBuf);
          } else if (Buffer.isBuffer(n)) {
            const nBuf = n as Buffer;

            writer.writeVarSlice(nBuf);
          } else throw new Error("Unknown ContentMultiMap data, can't toBuffer");
        }
      } else throw new Error("Unknown ContentMultiMap data, can't toBuffer")
    }

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0, parseVdxfObjects: boolean = false) {
    const reader = new BufferReader(buffer, offset);

    const contentMultiMapSize = reader.readCompactSize();
    this.kvContent = new KvContent();

    for (var i = 0; i < contentMultiMapSize; i++) {
      const iaddr = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      const contentMapKey = CompactIAddressObject.fromAddress(iaddr);

      const vector: Array<ContentMultiMapPrimitive> = [];
      const count = reader.readCompactSize();

      for (let j = 0; j < count; j++) {
        if (parseVdxfObjects) {
          const unival = new VdxfUniValue();
          unival.fromBuffer(reader.readVarSlice(), 0);

          vector.push(unival);
        } else {
          vector.push(reader.readVarSlice());
        }
      }

      this.kvContent.set(contentMapKey, vector);
    }

    return reader.offset;
  }

  static fromJson(obj: { [key: string]: ContentMultiMapJsonValue }): ContentMultiMap {
    const content = new KvContent();

    for (const keyStr in obj) {
      const compactKey = keyStr.includes('::')
        ? CompactIAddressObject.fromFQN(keyStr)
        : CompactIAddressObject.fromAddress(keyStr);

      // Validate that the key resolves to a real iaddress
      const resolvedIAddr = compactKey.toIAddress();
      const keybytes = fromBase58Check(resolvedIAddr).hash;
      const value = obj[keyStr];

      if (keybytes && value != null) {
        const valueArray = Array.isArray(value) ? value : [value];

        if (typeof value === 'string' && isHexString(value)) {
          content.set(compactKey, [Buffer.from(value, 'hex')]);
        } else if (Array.isArray(value) || typeof value === 'object') {
          const items = [];

          for (const x of valueArray) {
            if (typeof x === 'string') {
              items.push(Buffer.from(x, 'hex'));
            } else if (typeof x === 'object' && x != null) {
              const uniVal = VdxfUniValue.fromJson(x as VdxfUniValueJson);

              if (uniVal.toBuffer().length > 0) {
                items.push(uniVal);
              }
            }
          }

          content.set(compactKey, items);
        } else {
          throw new Error("Invalid data in multimap")
        }
      }
    }

    return new ContentMultiMap({ kvContent: content })
  }

  toJson(): ContentMultiMapJson {
    const ret: ContentMultiMapJson = {};

    for (const [key, value] of this.kvContent.entries()) {
      if (Array.isArray(value)) {
        const items = [];

        for (const n of value) {
          if (n instanceof VdxfUniValue) {
            items.push(n.toJson());
          } else if (Buffer.isBuffer(n)) {
            items.push(n.toString('hex'));
          } else throw new Error("Unknown ContentMultiMap data, can't toBuffer");
        }

        ret[key.toString()] = items;
      } else throw new Error("Unknown ContentMultiMap data, can't toBuffer")
    }

    return ret;
  }
}

/**
 * FqnContentMultiMap is a ContentMultiMap variant used exclusively in PartialIdentity.
 * It serializes keys as full CompactIAddressObjects (preserving TYPE_FQN through binary
 * round-trips) rather than the daemon-compatible 20-byte iaddress hash format used by
 * ContentMultiMap. These two formats are not interchangeable.
 */
export class FqnContentMultiMap extends ContentMultiMap {
  getByteLength() {
    let length = 0;

    length += varuint.encodingLength(this.kvContent.size);

    for (const [key, value] of this.kvContent.entries()) {
      length += key.getByteLength();

      if (Array.isArray(value)) {
        const valueArr = value as Array<ContentMultiMapPrimitive>;
        length += varuint.encodingLength(valueArr.length);

        for (const n of value) {
          if (n instanceof VdxfUniValue) {
            const nCMMNOLength = n.getByteLength();

            length += varuint.encodingLength(nCMMNOLength);
            length += nCMMNOLength;
          } else if (Buffer.isBuffer(n)) {
            const nBuf = n as Buffer;

            length += varuint.encodingLength(nBuf.length);
            length += nBuf.length;
          } else throw new Error("Unknown FqnContentMultiMap data, can't calculate ByteLength")
        }
      } else throw new Error("Unknown FqnContentMultiMap data, can't calculate ByteLength")
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.kvContent.size);

    for (const [key, value] of this.kvContent.entries()) {
      writer.writeSlice(key.toBuffer());

      if (Array.isArray(value)) {
        writer.writeCompactSize(value.length);

        for (const n of value) {
          if (n instanceof VdxfUniValue) {
            const nCMMNOBuf = n.toBuffer();

            writer.writeVarSlice(nCMMNOBuf);
          } else if (Buffer.isBuffer(n)) {
            const nBuf = n as Buffer;

            writer.writeVarSlice(nBuf);
          } else throw new Error("Unknown FqnContentMultiMap data, can't toBuffer");
        }
      } else throw new Error("Unknown FqnContentMultiMap data, can't toBuffer")
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0, parseVdxfObjects: boolean = false) {
    const reader = new BufferReader(buffer, offset);

    const contentMultiMapSize = reader.readCompactSize();
    this.kvContent = new KvContent();

    for (let i = 0; i < contentMultiMapSize; i++) {
      const contentMapKey = new CompactIAddressObject();
      reader.offset = contentMapKey.fromBuffer(reader.buffer, reader.offset);

      const vector: Array<ContentMultiMapPrimitive> = [];
      const count = reader.readCompactSize();

      for (let j = 0; j < count; j++) {
        if (parseVdxfObjects) {
          const unival = new FqnVdxfUniValue();
          unival.fromBuffer(reader.readVarSlice(), 0);

          vector.push(unival);
        } else {
          vector.push(reader.readVarSlice());
        }
      }

      this.kvContent.set(contentMapKey, vector);
    }

    return reader.offset;
  }

  static fromJson(obj: { [key: string]: ContentMultiMapJsonValue }): FqnContentMultiMap {
    const content = new KvContent();

    for (const keyStr in obj) {
      const compactKey = keyStr.includes('::')
        ? CompactIAddressObject.fromFQN(keyStr)
        : CompactIAddressObject.fromAddress(keyStr);

      const resolvedIAddr = compactKey.toIAddress();
      const keybytes = fromBase58Check(resolvedIAddr).hash;
      const value = obj[keyStr];

      if (keybytes && value != null) {
        const valueArray = Array.isArray(value) ? value : [value];

        if (typeof value === 'string' && isHexString(value)) {
          content.set(compactKey, [Buffer.from(value, 'hex')]);
        } else if (Array.isArray(value) || typeof value === 'object') {
          const items = [];

          for (const x of valueArray) {
            if (typeof x === 'string') {
              items.push(Buffer.from(x, 'hex'));
            } else if (typeof x === 'object' && x != null) {
              const uniVal = FqnVdxfUniValue.fromJson(x as VdxfUniValueJson);

              if (uniVal.toBuffer().length > 0) {
                items.push(uniVal);
              }
            }
          }

          content.set(compactKey, items);
        } else {
          throw new Error("Invalid data in multimap")
        }
      }
    }

    const inst = new FqnContentMultiMap();
    inst.kvContent = content;
    return inst;
  }
}
