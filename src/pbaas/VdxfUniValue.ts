import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { HASH160_BYTE_LENGTH, HASH256_BYTE_LENGTH, I_ADDR_VERSION, VDXF_OBJECT_DEFAULT_VERSION } from '../constants/vdxf';
import { BN } from 'bn.js';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import varint from '../utils/varint';
import { isHexString } from '../utils/string';
import { CurrencyValueMap } from './CurrencyValueMap';
import { Rating, RatingJson } from './Rating';
import { TransferDestination, TransferDestinationJson } from './TransferDestination';
import { ContentMultiMapRemove, ContentMultiMapRemoveJson } from './ContentMultiMapRemove';
import { CrossChainDataRef, CrossChainDataRefJson } from './CrossChainDataRef';
import { SignatureData, SignatureJsonDataInterface } from './SignatureData';
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { MMRDescriptor, MMRDescriptorJson } from './MMRDescriptor';
import { Credential, CredentialJson } from './Credential';
import { URLRef } from './URLRef';
import { IdentityMultimapRef } from './IdentityMultimapRef';
import { CompactIAddressObject } from '../vdxf/classes/CompactAddressObject';
import * as VDXF_Data from '../vdxf/vdxfdatakeys';
import { KvMap } from '../utils/KvMap';

export const VDXF_UNI_VALUE_VERSION_INVALID = new BN(0, 10);
export const VDXF_UNI_VALUE_VERSION_CURRENT = new BN(1, 10);

const { BufferWriter, BufferReader } = bufferutils;

export type VdxfUniType = string | Buffer | BigNumber | CurrencyValueMap | Rating |
  TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData |
  DataDescriptor | MMRDescriptor | URLRef | IdentityMultimapRef | Credential;

export interface VdxfUniValueInterface {
  [key: string]: string | number | RatingJson | TransferDestinationJson |
  ContentMultiMapRemoveJson | CrossChainDataRefJson | SignatureJsonDataInterface | DataDescriptorJson | MMRDescriptorJson | VdxfUniValueInterface;
  serializedhex?: string;
  serializedbase64?: string;
  message?: string;
};

export type VdxfUniValueJson = string | VdxfUniValueInterface;

export type VdxfUniValueJsonArray = Array<VdxfUniValueJson>;

export type JsonSerializableObject = CurrencyValueMap | Rating |
  TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData |
  DataDescriptor | MMRDescriptor | Credential;

// This UniValue class was adapted from C++ code for encoding JSON objects into bytes. It is not serialization and
// therefore doesn't have a fromBuffer function, as you can't reliably decode it, only encode.
export class VdxfUniValue implements SerializableEntity {
  private _values: Array<{ [key: string]: VdxfUniType }>;
  version: BigNumber;

  get values(): Array<{ [key: string]: VdxfUniType }> { return this._values; }
  set values(arr: Array<{ [key: string]: VdxfUniType }>) { this._values = arr; }

  constructor(data?: { values: Array<{ [key: string]: VdxfUniType }>, version?: BigNumber }) {
    if (data?.values) this.values = data.values;
    if (data?.version) this.version = data.version;
    else this.version = VDXF_UNI_VALUE_VERSION_CURRENT;
  }

  getByteLength() {
    let length = 0;

    const totalStreamLength = (bufLen: number): number => {
      const encodeStreamLen = varuint.encodingLength(bufLen + varuint.encodingLength(bufLen));
      return bufLen + encodeStreamLen;
    };

    for (const inner of this.values) {
      const key = Object.keys(inner)[0];
      const value = inner[key];

      if (key === "") {
        length += Buffer.from(value as string, "hex").length;
        continue;
      }

      // Fixed-size primitive types: no HASH160 prefix, just raw bytes
      switch (key) {
        case VDXF_Data.DataByteKey.vdxfid:    length += 1; continue;
        case VDXF_Data.DataUint16Key.vdxfid:
        case VDXF_Data.DataInt16Key.vdxfid:   length += 2; continue;
        case VDXF_Data.DataInt32Key.vdxfid:
        case VDXF_Data.DataUint32Key.vdxfid:  length += 4; continue;
        case VDXF_Data.DataInt64Key.vdxfid:   length += 8; continue;
        case VDXF_Data.DataUint160Key.vdxfid: length += HASH160_BYTE_LENGTH; continue;
        case VDXF_Data.DataUint256Key.vdxfid: length += HASH256_BYTE_LENGTH; continue;
      }

      // All remaining types are prefixed with a HASH160 key
      length += HASH160_BYTE_LENGTH;

      switch (key) {
        case VDXF_Data.DataStringKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "utf-8");
          length += varint.encodingLength(new BN(1));
          // NOTE: 3 is from ss type + ver + vdxfIdVersion
          length += varuint.encodingLength(valBuf.length);
          length += totalStreamLength(valBuf.length);
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "hex");
          length += varint.encodingLength(new BN(1));
          length += varuint.encodingLength(valBuf.length);
          length += totalStreamLength(valBuf.length);
          break;
        }
        case VDXF_Data.DataCurrencyMapKey.vdxfid: {
          const oneCurMap = new CurrencyValueMap({ ...value as object, multivalue: true } as CurrencyValueMap);
          length += varint.encodingLength(new BN(1));
          length += totalStreamLength(oneCurMap.getByteLength());
          break;
        }
        case VDXF_Data.DataRatingsKey.vdxfid: {
          const obj = new Rating(value as Rating);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.CredentialKey.vdxfid: {
          const obj = new Credential(value as Credential);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.DataTransferDestinationKey.vdxfid: {
          const obj = new TransferDestination(value as TransferDestination);
          length += varint.encodingLength(obj.typeNoFlags());
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
          const obj = new ContentMultiMapRemove(value as ContentMultiMapRemove);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.CrossChainDataRefKey.vdxfid: {
          const obj = value as CrossChainDataRef;
          length += varint.encodingLength(VDXF_OBJECT_DEFAULT_VERSION);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.DataDescriptorKey.vdxfid: {
          const obj = new DataDescriptor(value as DataDescriptor);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.MMRDescriptorKey.vdxfid: {
          const obj = new MMRDescriptor(value as MMRDescriptor);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.SignatureDataKey.vdxfid: {
          const obj = new SignatureData(value as SignatureData);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        default:
          throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
      }
    }
    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    for (const inner of this.values) {
      const key = Object.keys(inner)[0];
      const value = inner[key];

      if (key === "") {
        writer.writeSlice(value as Buffer);
        continue;
      }

      switch (key) {
        case VDXF_Data.DataByteKey.vdxfid: {
          const oneByte = Buffer.from(value as string, "hex");
          if (oneByte.length != 1) throw new Error("contentmap: byte data must be exactly one byte");
          writer.writeSlice(oneByte);
          break;
        }
        case VDXF_Data.DataInt16Key.vdxfid: {
          const buf = Buffer.alloc(2);
          buf.writeInt16LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          break;
        }
        case VDXF_Data.DataUint16Key.vdxfid: {
          const buf = Buffer.alloc(2);
          buf.writeUInt16LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          break;
        }
        case VDXF_Data.DataInt32Key.vdxfid: {
          const buf = Buffer.alloc(4);
          buf.writeInt32LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          break;
        }
        case VDXF_Data.DataUint32Key.vdxfid: {
          const buf = Buffer.alloc(4);
          buf.writeUInt32LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          break;
        }
        case VDXF_Data.DataInt64Key.vdxfid: {
          const buf = Buffer.alloc(8);
          buf.writeBigInt64LE(BigInt((value as BigNumber).toString()));
          writer.writeSlice(buf);
          break;
        }
        case VDXF_Data.DataUint160Key.vdxfid:
          writer.writeSlice(fromBase58Check(value as string).hash);
          break;
        case VDXF_Data.DataUint256Key.vdxfid: {
          const oneHash = Buffer.from(value as string, "hex");
          if (oneHash.length != HASH256_BYTE_LENGTH) throw new Error("contentmap: hash data must be exactly 32 bytes");
          writer.writeVarSlice(oneHash.reverse());
          break;
        }
        case VDXF_Data.DataStringKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "utf-8");
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(valBuf.length + varuint.encodingLength(valBuf.length));
          writer.writeVarSlice(valBuf);
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "hex");
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(varuint.encodingLength(valBuf.length) + valBuf.length);
          writer.writeVarSlice(valBuf);
          break;
        }
        case VDXF_Data.DataCurrencyMapKey.vdxfid: {
          const obj = new CurrencyValueMap({ ...value as object, multivalue: true } as CurrencyValueMap);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataRatingsKey.vdxfid: {
          const obj = new Rating(value as Rating);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.CredentialKey.vdxfid: {
          const obj = value as Credential;
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataTransferDestinationKey.vdxfid: {
          const obj = new TransferDestination(value as TransferDestination);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.typeNoFlags());
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
          const obj = new ContentMultiMapRemove(value as ContentMultiMapRemove);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.CrossChainDataRefKey.vdxfid: {
          const obj = value as CrossChainDataRef;
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(VDXF_OBJECT_DEFAULT_VERSION);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataDescriptorKey.vdxfid: {
          const obj = new DataDescriptor(value as DataDescriptor);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.MMRDescriptorKey.vdxfid: {
          const obj = new MMRDescriptor(value as MMRDescriptor);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.SignatureDataKey.vdxfid: {
          const obj = new SignatureData(value as SignatureData);
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        default:
          throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + key);
      }
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.values = [];

    let bytesLeft = reader.buffer.length - reader.offset;

    while (bytesLeft > HASH160_BYTE_LENGTH) {
      let objectUni: { key: string, value: VdxfUniType } | undefined;
      const initialOffset = reader.offset;

      try {
        const checkVal = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);

        switch (checkVal) {
          case VDXF_Data.DataCurrencyMapKey.vdxfid: {
            const obj = new CurrencyValueMap({ multivalue: true });
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataRatingsKey.vdxfid: {
            const obj = new Rating();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.CredentialKey.vdxfid: {
            const obj = new Credential();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataTransferDestinationKey.vdxfid: {
            const obj = new TransferDestination();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
            const obj = new ContentMultiMapRemove();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            reader.readVarInt();
            reader.readCompactSize();
            objectUni = { key: checkVal, value: reader.readVarSlice().toString('utf8') };
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            reader.readVarInt();
            reader.readCompactSize();
            objectUni = { key: checkVal, value: reader.readVarSlice().toString('hex') };
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid: {
            const obj = new CrossChainDataRef();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataDescriptorKey.vdxfid: {
            const obj = new DataDescriptor();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.MMRDescriptorKey.vdxfid: {
            const obj = new MMRDescriptor();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.SignatureDataKey.vdxfid: {
            const obj = new SignatureData();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
        }
      } catch (e) {
        objectUni = undefined;
      }

      bytesLeft = reader.buffer.length - reader.offset;

      if (objectUni?.key && objectUni?.value) {
        this.values.push({ [objectUni.key]: objectUni.value });
      } else {
        // add the remaining data as a hex string
        reader.offset = initialOffset;
        this.values.push({ [""]: reader.readSlice(reader.buffer.length - reader.offset) });
        bytesLeft = 0;
        break;
      }
    }

    if (bytesLeft && bytesLeft <= HASH160_BYTE_LENGTH) {
      this.values.push({ [""]: reader.readSlice(bytesLeft) });
    }
    return reader.offset;
  }

  static fromJson(obj): VdxfUniValue {
    const arrayItem: Array<{ [key: string]: VdxfUniType }> = [];

    if (!Array.isArray(obj)) {
      if (typeof obj != 'object') {
        if (typeof obj != 'string') throw new Error('Not JSON string as expected');
        return new VdxfUniValue({ values: [{ [""]: isHexString(obj)
          ? Buffer.from(obj, "hex")
          : Buffer.from(obj, "utf-8") }] });
      }

      if (obj.serializedhex) {
        if (!isHexString(obj.serializedhex)) {
          throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
        }
        return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.serializedhex, "hex") }] });
      }

      if (obj.serializedbase64) {
        try {
          return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.serializedbase64, "base64") }] });
        } catch (e) {
          throw new Error("contentmap: If the \"serializedbase64\" key is present, it's data must be only valid base64 and complete");
        }
      }

      if (obj.message) {
        return new VdxfUniValue({ values: [{ [""]: Buffer.from(obj.message, "utf-8") }] });
      }

      obj = [obj];
    }

    // obj is now guaranteed to be an array
    for (const item of obj) {
      if (typeof item != 'object') {
        if (typeof item != 'string') throw new Error('Not JSON string as expected');
        arrayItem.push({ [""]: isHexString(item as string)
          ? Buffer.from(item as string, "hex")
          : Buffer.from(item as string, "utf-8") });
        continue;
      }

      for (const [rawKey, val] of Object.entries(item)) {
        const objTypeKey = rawKey.includes('::')
          ? CompactIAddressObject.fromFQN(rawKey).toIAddress()
          : rawKey;

        switch (objTypeKey) {
          case VDXF_Data.DataByteKey.vdxfid: {
            const oneByte = Buffer.from(val as string, "hex");
            if (oneByte.length != 1) throw new Error("contentmap: byte data must be exactly one byte");
            arrayItem.push({ [objTypeKey]: oneByte });
            break;
          }
          case VDXF_Data.DataInt16Key.vdxfid: {
            const buf = Buffer.alloc(2);
            buf.writeInt16LE(val as number);
            arrayItem.push({ [objTypeKey]: buf });
            break;
          }
          case VDXF_Data.DataUint16Key.vdxfid: {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(val as number);
            arrayItem.push({ [objTypeKey]: buf });
            break;
          }
          case VDXF_Data.DataInt32Key.vdxfid: {
            const buf = Buffer.alloc(4);
            buf.writeInt32LE(val as number);
            arrayItem.push({ [objTypeKey]: buf });
            break;
          }
          case VDXF_Data.DataUint32Key.vdxfid: {
            const buf = Buffer.alloc(4);
            buf.writeUInt32LE(val as number);
            arrayItem.push({ [objTypeKey]: buf });
            break;
          }
          case VDXF_Data.DataInt64Key.vdxfid: {
            const buf = Buffer.alloc(8);
            buf.writeIntLE(val as number, 0, 8);
            arrayItem.push({ [objTypeKey]: buf });
            break;
          }
          case VDXF_Data.DataUint160Key.vdxfid:
            fromBase58Check(val as string).hash;
            arrayItem.push({ [objTypeKey]: val as string });
            break;
          case VDXF_Data.DataUint256Key.vdxfid: {
            const oneHash = Buffer.from(val as string, "hex");
            if (oneHash.length != HASH256_BYTE_LENGTH) throw new Error("contentmap: hash data must be exactly 32 bytes");
            arrayItem.push({ [objTypeKey]: oneHash });
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            arrayItem.push({ [objTypeKey]: val as string });
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            if (!isHexString(val as string)) throw new Error("contentmap: bytevector data must be valid hex");
            arrayItem.push({ [objTypeKey]: Buffer.from(val as string, "hex") });
            break;
          case VDXF_Data.DataCurrencyMapKey.vdxfid:
            arrayItem.push({ [objTypeKey]: CurrencyValueMap.fromJson(val as { [key: string]: string }, true) });
            break;
          case VDXF_Data.DataRatingsKey.vdxfid:
            arrayItem.push({ [objTypeKey]: Rating.fromJson(val as RatingJson) });
            break;
          case VDXF_Data.DataTransferDestinationKey.vdxfid:
            arrayItem.push({ [objTypeKey]: TransferDestination.fromJson(val as TransferDestinationJson) });
            break;
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
            arrayItem.push({ [objTypeKey]: ContentMultiMapRemove.fromJson(val as ContentMultiMapRemoveJson) });
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid:
            arrayItem.push({ [objTypeKey]: CrossChainDataRef.fromJson(val as CrossChainDataRefJson) });
            break;
          case VDXF_Data.DataDescriptorKey.vdxfid:
            arrayItem.push({ [objTypeKey]: DataDescriptor.fromJson(val) });
            break;
          case VDXF_Data.MMRDescriptorKey.vdxfid:
            arrayItem.push({ [objTypeKey]: MMRDescriptor.fromJson(val as MMRDescriptorJson) });
            break;
          case VDXF_Data.SignatureDataKey.vdxfid:
            arrayItem.push({ [objTypeKey]: SignatureData.fromJson(val) });
            break;
          case VDXF_Data.CredentialKey.vdxfid:
            arrayItem.push({ [objTypeKey]: Credential.fromJson(val as CredentialJson) });
            break;
          default:
            throw new Error("Unknown vdxfkey: " + val);
        }
      }
    }

    return new VdxfUniValue({ values: arrayItem });
  }

  toJson(): VdxfUniValueJsonArray | VdxfUniValueJson {
    const ret = [];

    for (const inner of this.values) {
      const key = Object.keys(inner)[0];
      const value = inner[key];

      if (key === "" && Buffer.isBuffer(value)) {
        ret.push((value as Buffer).toString('hex'));
      } else if (Buffer.isBuffer(value)) {
        ret.push({ [key]: (value as Buffer).toString('hex') });
      } else if (typeof value === 'string') {
        ret.push({ [key]: value });
      } else if (value instanceof BN) {
        ret.push({ [key]: (value as BigNumber).toString(10) });
      } else {
        ret.push({ [key]: (value as JsonSerializableObject).toJson() });
      }
    }

    return ret.length === 1 ? ret[0] : ret;
  }
}

/**
 * FqnVdxfUniValue is a VdxfUniValue variant used exclusively within FqnContentMultiMap.
 * It serializes all complex-type keys as CompactIAddressObjects so that FQN keys survive
 * toBuffer/fromBuffer round-trips. Named entries are stored in a KvMap<VdxfUniType> keyed
 * by CompactIAddressObject; raw/unparsed bytes are stored separately in _rawBytes.
 *
 * Wire format for complex-type entries:
 *   [CompactIAddressObject (variable)][varint version][compact size][data bytes]
 *
 * fromBuffer always expects CompactIAddressObject format — no legacy 20-byte hash support.
 */
export class FqnVdxfUniValue extends VdxfUniValue {
  private _kvValues: KvMap<VdxfUniType>;
  private _rawBytes: Buffer | undefined;

  constructor(data?: { values?: Array<{ [key: string]: VdxfUniType }>, version?: BigNumber }) {
    super();
    this._kvValues = new KvMap<VdxfUniType>();
    if (data?.values) this.values = data.values;
    this.version = data?.version ?? VDXF_UNI_VALUE_VERSION_CURRENT;
  }

  // Backwards-compatible array view over the internal KvMap + _rawBytes
  get values(): Array<{ [key: string]: VdxfUniType }> {
    const result: Array<{ [key: string]: VdxfUniType }> = [];
    for (const [key, value] of this._kvValues.entries()) {
      result.push({ [key.toBuffer().toString('hex')]: value });
    }
    if (this._rawBytes !== undefined) {
      result.push({ [""]: this._rawBytes });
    }
    return result;
  }

  entries(): IterableIterator<[CompactIAddressObject, VdxfUniType]> {
    return this._kvValues.entries();
  }

  set values(arr: Array<{ [key: string]: VdxfUniType }>) {
    this._kvValues = new KvMap<VdxfUniType>();
    this._rawBytes = undefined;
    if (!arr) return;
    for (const inner of arr) {
      const key = Object.keys(inner)[0];
      if (key === '') {
        this._rawBytes = inner[key] as Buffer;
      } else {
        const compact = new CompactIAddressObject();
        compact.fromBuffer(Buffer.from(key, 'hex'), 0);
        this._kvValues.set(compact, inner[key]);
      }
    }
  }

  private static compactFor(rawKey: string): CompactIAddressObject {
    return rawKey.includes('::')
      ? CompactIAddressObject.fromFQN(rawKey)
      : CompactIAddressObject.fromAddress(rawKey);
  }

  static fromVdxfUniValue(v: VdxfUniValue): FqnVdxfUniValue {
    const inst = new FqnVdxfUniValue({ version: v.version });
    for (const inner of v.values) {
      const key = Object.keys(inner)[0];
      if (key === '') {
        inst._rawBytes = inner[key] as Buffer;
      } else {
        inst._kvValues.set(CompactIAddressObject.fromAddress(key), inner[key]);
      }
    }
    return inst;
  }

  getByteLength(): number {
    let length = 0;

    const totalStreamLength = (bufLen: number): number => {
      const encodeStreamLen = varuint.encodingLength(bufLen + varuint.encodingLength(bufLen));
      return bufLen + encodeStreamLen;
    };

    for (const [compact, value] of this._kvValues.entries()) {
      const switchKey = compact.toIAddress();

      // Fixed-size primitive types: no key prefix
      switch (switchKey) {
        case VDXF_Data.DataByteKey.vdxfid:    length += 1; continue;
        case VDXF_Data.DataUint16Key.vdxfid:
        case VDXF_Data.DataInt16Key.vdxfid:   length += 2; continue;
        case VDXF_Data.DataInt32Key.vdxfid:
        case VDXF_Data.DataUint32Key.vdxfid:  length += 4; continue;
        case VDXF_Data.DataInt64Key.vdxfid:   length += 8; continue;
        case VDXF_Data.DataUint160Key.vdxfid: length += HASH160_BYTE_LENGTH; continue;
        case VDXF_Data.DataUint256Key.vdxfid: length += HASH256_BYTE_LENGTH; continue;
      }

      // Complex types: key is a CompactIAddressObject
      length += compact.getByteLength();

      switch (switchKey) {
        case VDXF_Data.DataStringKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "utf-8");
          length += varint.encodingLength(new BN(1));
          length += varuint.encodingLength(valBuf.length);
          length += totalStreamLength(valBuf.length);
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = value as Buffer;
          length += varint.encodingLength(new BN(1));
          length += varuint.encodingLength(valBuf.length);
          length += totalStreamLength(valBuf.length);
          break;
        }
        case VDXF_Data.DataCurrencyMapKey.vdxfid: {
          const oneCurMap = new CurrencyValueMap({ ...value as object, multivalue: true } as CurrencyValueMap);
          length += varint.encodingLength(new BN(1));
          length += totalStreamLength(oneCurMap.getByteLength());
          break;
        }
        case VDXF_Data.DataRatingsKey.vdxfid: {
          const obj = new Rating(value as Rating);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.CredentialKey.vdxfid: {
          const obj = new Credential(value as Credential);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.DataTransferDestinationKey.vdxfid: {
          const obj = new TransferDestination(value as TransferDestination);
          length += varint.encodingLength(obj.typeNoFlags());
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
          const obj = new ContentMultiMapRemove(value as ContentMultiMapRemove);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.CrossChainDataRefKey.vdxfid: {
          const obj = value as CrossChainDataRef;
          length += varint.encodingLength(VDXF_OBJECT_DEFAULT_VERSION);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.DataDescriptorKey.vdxfid: {
          const obj = new DataDescriptor(value as DataDescriptor);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.MMRDescriptorKey.vdxfid: {
          const obj = new MMRDescriptor(value as MMRDescriptor);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        case VDXF_Data.SignatureDataKey.vdxfid: {
          const obj = new SignatureData(value as SignatureData);
          length += varint.encodingLength(obj.version);
          length += totalStreamLength(obj.getByteLength());
          break;
        }
        default:
          throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + switchKey);
      }
    }

    if (this._rawBytes !== undefined) {
      length += this._rawBytes.length;
    }

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    for (const [compact, value] of this._kvValues.entries()) {
      const switchKey = compact.toIAddress();

      // Fixed-size primitive types: no key prefix
      switch (switchKey) {
        case VDXF_Data.DataByteKey.vdxfid: {
          const oneByte = value as Buffer;
          if (oneByte.length != 1) throw new Error("contentmap: byte data must be exactly one byte");
          writer.writeSlice(oneByte);
          continue;
        }
        case VDXF_Data.DataInt16Key.vdxfid: {
          const buf = Buffer.alloc(2);
          buf.writeInt16LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          continue;
        }
        case VDXF_Data.DataUint16Key.vdxfid: {
          const buf = Buffer.alloc(2);
          buf.writeUInt16LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          continue;
        }
        case VDXF_Data.DataInt32Key.vdxfid: {
          const buf = Buffer.alloc(4);
          buf.writeInt32LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          continue;
        }
        case VDXF_Data.DataUint32Key.vdxfid: {
          const buf = Buffer.alloc(4);
          buf.writeUInt32LE((value as BigNumber).toNumber());
          writer.writeSlice(buf);
          continue;
        }
        case VDXF_Data.DataInt64Key.vdxfid: {
          const buf = Buffer.alloc(8);
          buf.writeBigInt64LE(BigInt((value as BigNumber).toString()));
          writer.writeSlice(buf);
          continue;
        }
        case VDXF_Data.DataUint160Key.vdxfid:
          writer.writeSlice(fromBase58Check(value as string).hash);
          continue;
        case VDXF_Data.DataUint256Key.vdxfid: {
          const oneHash = value as Buffer;
          if (oneHash.length != HASH256_BYTE_LENGTH) throw new Error("contentmap: hash data must be exactly 32 bytes");
          writer.writeSlice(Buffer.from(oneHash).reverse());
          continue;
        }
      }

      // Complex types: write CompactIAddressObject key prefix
      writer.writeSlice(compact.toBuffer());

      switch (switchKey) {
        case VDXF_Data.DataStringKey.vdxfid: {
          const valBuf = Buffer.from(value as string, "utf-8");
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(valBuf.length + varuint.encodingLength(valBuf.length));
          writer.writeVarSlice(valBuf);
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = value as Buffer;
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(varuint.encodingLength(valBuf.length) + valBuf.length);
          writer.writeVarSlice(valBuf);
          break;
        }
        case VDXF_Data.DataCurrencyMapKey.vdxfid: {
          const obj = new CurrencyValueMap({ ...value as object, multivalue: true } as CurrencyValueMap);
          writer.writeVarInt(new BN(1));
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataRatingsKey.vdxfid: {
          const obj = new Rating(value as Rating);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.CredentialKey.vdxfid: {
          const obj = value as Credential;
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataTransferDestinationKey.vdxfid: {
          const obj = new TransferDestination(value as TransferDestination);
          writer.writeVarInt(obj.typeNoFlags());
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
          const obj = new ContentMultiMapRemove(value as ContentMultiMapRemove);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.CrossChainDataRefKey.vdxfid: {
          const obj = value as CrossChainDataRef;
          writer.writeVarInt(VDXF_OBJECT_DEFAULT_VERSION);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.DataDescriptorKey.vdxfid: {
          const obj = new DataDescriptor(value as DataDescriptor);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.MMRDescriptorKey.vdxfid: {
          const obj = new MMRDescriptor(value as MMRDescriptor);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        case VDXF_Data.SignatureDataKey.vdxfid: {
          const obj = new SignatureData(value as SignatureData);
          writer.writeVarInt(obj.version);
          writer.writeCompactSize(obj.getByteLength());
          writer.writeSlice(obj.toBuffer());
          break;
        }
        default:
          throw new Error("contentmap invalid or unrecognized vdxfkey for object type: " + switchKey);
      }
    }

    if (this._rawBytes !== undefined) {
      writer.writeSlice(this._rawBytes);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this._kvValues = new KvMap<VdxfUniType>();
    this._rawBytes = undefined;

    let bytesLeft = reader.buffer.length - reader.offset;

    while (bytesLeft > 0) {
      let parsedKey: CompactIAddressObject | undefined;
      let parsedValue: VdxfUniType | undefined;
      const initialOffset = reader.offset;

      try {
        const compactAddr = new CompactIAddressObject();
        reader.offset = compactAddr.fromBuffer(reader.buffer, reader.offset);
        const switchKey = compactAddr.toIAddress();

        switch (switchKey) {
          case VDXF_Data.DataCurrencyMapKey.vdxfid: {
            const obj = new CurrencyValueMap({ multivalue: true });
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataRatingsKey.vdxfid: {
            const obj = new Rating();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.CredentialKey.vdxfid: {
            const obj = new Credential();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataTransferDestinationKey.vdxfid: {
            const obj = new TransferDestination();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
            const obj = new ContentMultiMapRemove();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            reader.readVarInt();
            reader.readCompactSize();
            parsedKey = compactAddr;
            parsedValue = reader.readVarSlice().toString('utf8');
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            reader.readVarInt();
            reader.readCompactSize();
            parsedKey = compactAddr;
            parsedValue = reader.readVarSlice();
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid: {
            const obj = new CrossChainDataRef();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataDescriptorKey.vdxfid: {
            const obj = new DataDescriptor();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.MMRDescriptorKey.vdxfid: {
            const obj = new MMRDescriptor();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.SignatureDataKey.vdxfid: {
            const obj = new SignatureData();
            reader.readVarInt();
            reader.readCompactSize();
            reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
        }
      } catch (e) {
        parsedKey = undefined;
        parsedValue = undefined;
      }

      bytesLeft = reader.buffer.length - reader.offset;

      if (parsedKey && parsedValue !== undefined) {
        this._kvValues.set(parsedKey, parsedValue);
      } else {
        reader.offset = initialOffset;
        this._rawBytes = reader.readSlice(reader.buffer.length - reader.offset);
        bytesLeft = 0;
        break;
      }
    }

    return reader.offset;
  }

  static fromJson(obj: VdxfUniValueJson | VdxfUniValueJson[]): FqnVdxfUniValue {
    if (!Array.isArray(obj)) {
      if (typeof obj != 'object') {
        if (typeof obj != 'string') throw new Error('Not JSON string as expected');
        const inst = new FqnVdxfUniValue();
        inst._rawBytes = isHexString(obj) ? Buffer.from(obj, "hex") : Buffer.from(obj, "utf-8");
        return inst;
      }

      if (obj.serializedhex) {
        if (!isHexString(obj.serializedhex)) {
          throw new Error("contentmap: If the \"serializedhex\" key is present, it's data must be only valid hex and complete");
        }
        const inst = new FqnVdxfUniValue();
        inst._rawBytes = Buffer.from(obj.serializedhex, "hex");
        return inst;
      }

      if (obj.serializedbase64) {
        try {
          const inst = new FqnVdxfUniValue();
          inst._rawBytes = Buffer.from(obj.serializedbase64, "base64");
          return inst;
        } catch (e) {
          throw new Error("contentmap: If the \"serializedbase64\" key is present, it's data must be only valid base64 and complete");
        }
      }

      if (obj.message) {
        const inst = new FqnVdxfUniValue();
        inst._rawBytes = Buffer.from(obj.message, "utf-8");
        return inst;
      }

      obj = [obj];
    }

    const inst = new FqnVdxfUniValue();

    for (const item of obj) {
      if (typeof item != 'object') {
        if (typeof item != 'string') throw new Error('Not JSON string as expected');
        inst._rawBytes = isHexString(item as string)
          ? Buffer.from(item as string, "hex")
          : Buffer.from(item as string, "utf-8");
        continue;
      }

      for (const [rawKey, val] of Object.entries(item)) {
        const compact = FqnVdxfUniValue.compactFor(rawKey);
        const switchKey = compact.toIAddress();

        switch (switchKey) {
          case VDXF_Data.DataByteKey.vdxfid: {
            const oneByte = Buffer.from(val as string, "hex");
            if (oneByte.length != 1) throw new Error("contentmap: byte data must be exactly one byte");
            inst._kvValues.set(compact, oneByte);
            break;
          }
          case VDXF_Data.DataInt16Key.vdxfid: {
            const buf = Buffer.alloc(2);
            buf.writeInt16LE(val as number);
            inst._kvValues.set(compact, buf);
            break;
          }
          case VDXF_Data.DataUint16Key.vdxfid: {
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(val as number);
            inst._kvValues.set(compact, buf);
            break;
          }
          case VDXF_Data.DataInt32Key.vdxfid: {
            const buf = Buffer.alloc(4);
            buf.writeInt32LE(val as number);
            inst._kvValues.set(compact, buf);
            break;
          }
          case VDXF_Data.DataUint32Key.vdxfid: {
            const buf = Buffer.alloc(4);
            buf.writeUInt32LE(val as number);
            inst._kvValues.set(compact, buf);
            break;
          }
          case VDXF_Data.DataInt64Key.vdxfid: {
            const buf = Buffer.alloc(8);
            buf.writeIntLE(val as number, 0, 8);
            inst._kvValues.set(compact, buf);
            break;
          }
          case VDXF_Data.DataUint160Key.vdxfid:
            fromBase58Check(val as string).hash;
            inst._kvValues.set(compact, val as string);
            break;
          case VDXF_Data.DataUint256Key.vdxfid: {
            const oneHash = Buffer.from(val as string, "hex");
            if (oneHash.length != HASH256_BYTE_LENGTH) throw new Error("contentmap: hash data must be exactly 32 bytes");
            inst._kvValues.set(compact, oneHash);
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            inst._kvValues.set(compact, val as string);
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            if (!isHexString(val as string)) throw new Error("contentmap: bytevector data must be valid hex");
            inst._kvValues.set(compact, Buffer.from(val as string, "hex"));
            break;
          case VDXF_Data.DataCurrencyMapKey.vdxfid:
            inst._kvValues.set(compact, CurrencyValueMap.fromJson(val as { [key: string]: string }, true));
            break;
          case VDXF_Data.DataRatingsKey.vdxfid:
            inst._kvValues.set(compact, Rating.fromJson(val as RatingJson));
            break;
          case VDXF_Data.DataTransferDestinationKey.vdxfid:
            inst._kvValues.set(compact, TransferDestination.fromJson(val as TransferDestinationJson));
            break;
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
            inst._kvValues.set(compact, ContentMultiMapRemove.fromJson(val as ContentMultiMapRemoveJson));
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid:
            inst._kvValues.set(compact, CrossChainDataRef.fromJson(val as CrossChainDataRefJson));
            break;
          case VDXF_Data.DataDescriptorKey.vdxfid:
            inst._kvValues.set(compact, DataDescriptor.fromJson(val));
            break;
          case VDXF_Data.MMRDescriptorKey.vdxfid:
            inst._kvValues.set(compact, MMRDescriptor.fromJson(val as MMRDescriptorJson));
            break;
          case VDXF_Data.SignatureDataKey.vdxfid:
            inst._kvValues.set(compact, SignatureData.fromJson(val));
            break;
          case VDXF_Data.CredentialKey.vdxfid:
            inst._kvValues.set(compact, Credential.fromJson(val as CredentialJson));
            break;
          default:
            throw new Error("Unknown vdxfkey: " + rawKey);
        }
      }
    }

    return inst;
  }

  toJson(): VdxfUniValueJsonArray | VdxfUniValueJson {
    const ret = [];

    for (const [compact, value] of this._kvValues.entries()) {
      const jsonKey = compact.address;

      if (Buffer.isBuffer(value)) {
        ret.push({ [jsonKey]: (value as Buffer).toString('hex') });
      } else if (typeof value === 'string') {
        ret.push({ [jsonKey]: value });
      } else if (value instanceof BN) {
        ret.push({ [jsonKey]: (value as BigNumber).toString(10) });
      } else {
        ret.push({ [jsonKey]: (value as any).toJson() });
      }
    }

    if (this._rawBytes !== undefined) {
      ret.push(this._rawBytes.toString('hex'));
    }

    return ret.length === 1 ? ret[0] : ret;
  }
}
