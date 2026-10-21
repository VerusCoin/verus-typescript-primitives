import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { HASH160_BYTE_LENGTH, HASH256_BYTE_LENGTH, I_ADDR_VERSION, VDXF_OBJECT_DEFAULT_VERSION } from '../constants/vdxf';
import { BN } from 'bn.js';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import varint from '../utils/varint';
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

function readEntityPayload(entity: SerializableEntity, buffer: Buffer): void {
  if (entity.fromBuffer(buffer, 0) !== buffer.length) {
    throw new Error("UniValue payload length mismatch");
  }
}

function readByteVectorPayload(buffer: Buffer): Buffer {
  const reader = new BufferReader(buffer);
  const value = reader.readVarSlice();
  if (reader.offset !== buffer.length) {
    throw new Error("UniValue payload length mismatch");
  }
  return value;
}

function parseByteJson(value: unknown): Buffer {
  if (typeof value !== 'number') {
    throw new Error('Daemon byte data must be a number');
  }
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error('Byte data must be an integer between 0 and 255');
  }
  return Buffer.from([value]);
}

// JSON conversion is lossless: Node's hex decoder otherwise accepts malformed
// input by silently dropping characters or partial bytes.
function daemonRawData(value: unknown): Buffer | undefined {
  if (typeof value === 'string') {
    if (!/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
      throw new Error('Daemon VDXF strings must be hex; use { message: text } for UTF-8');
    }
    return Buffer.from(value, 'hex');
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Daemon VDXF data must be an object or hex string');
  }

  const keys = ['serializedhex', 'serializedbase64', 'message'].filter(
    (key) => Object.prototype.hasOwnProperty.call(value, key)
  );
  if (keys.length === 0) return undefined;
  if (keys.length !== 1 || Object.keys(value).length !== 1) {
    throw new Error('Daemon VDXF raw data requires exactly one encoding key');
  }

  const key = keys[0];
  const data = (value as Record<string, unknown>)[key];
  if (typeof data !== 'string') throw new Error(`${key} must be a string`);

  if (key === 'serializedhex') return daemonRawData(data);
  if (key === 'serializedbase64') {
    // VectorEncodeVDXFUni tests DecodeBase64's invalid flag backwards.
    throw new Error('Daemon serializedbase64 decoding is defective; use serializedhex');
  }

  const bytes = Buffer.from(data, 'utf8');
  if (bytes.toString('utf8') !== data) {
    throw new Error('message must not contain unpaired UTF-16 surrogates');
  }
  return bytes;
}

function daemonURLRefJson(ref: URLRef) {
  // CURLRef::ToUniValue writes version into flags. Version 1 has no flags/hash
  // on the wire, so its canonical JSON is safe; version 2 is not lossless.
  if (!ref.version.eqn(1) || ref.dataHash?.some(byte => byte !== 0) ||
      (ref.dataHash?.length && ref.dataHash.length !== 32)) {
    throw new Error('Daemon URL reference JSON supports only version 1 without a data hash');
  }
  daemonRawData({ message: ref.url });

  return {
    version: 1,
    flags: 1,
    datahash: '00'.repeat(32),
    url: ref.url,
    type: CrossChainDataRef.TYPE_URL_REF,
  };
}

export type VdxfUniType = string | Buffer | BigNumber | CurrencyValueMap | Rating |
  TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData |
  DataDescriptor | MMRDescriptor | URLRef | IdentityMultimapRef | Credential;

export interface VdxfUniValueInterface {
  [key: string]: string | number | RatingJson | TransferDestinationJson |
  ContentMultiMapRemoveJson | CrossChainDataRefJson | SignatureJsonDataInterface | DataDescriptorJson | MMRDescriptorJson | VdxfUniValueInterface | undefined;
  serializedhex?: string;
  serializedbase64?: string;
  message?: string;
};

export type VdxfUniValueJson = string | VdxfUniValueInterface;

export type VdxfUniValueJsonArray = Array<VdxfUniValueJson>;

export type JsonSerializableObject = CurrencyValueMap | Rating |
  TransferDestination | ContentMultiMapRemove | CrossChainDataRef | SignatureData |
  DataDescriptor | MMRDescriptor | Credential;

export class VdxfUniValue extends SerializableEntityBase implements SerializableEntity {
  private _values: Array<{ [key: string]: VdxfUniType }>;
  version: BigNumber;

  get values(): Array<{ [key: string]: VdxfUniType }> { return this._values; }
  set values(arr: Array<{ [key: string]: VdxfUniType }>) { this._values = arr; }

  constructor(data?: { values: Array<{ [key: string]: VdxfUniType }>, version?: BigNumber }) {
    super();
    if (data?.values) this.values = data.values;
    if (data?.version) this.version = data.version;
    else this.version = VDXF_UNI_VALUE_VERSION_CURRENT;
  }

  getByteLength() {
    let length = 0;

    const totalStreamLength = (bufLen: number): number => {
      return bufLen + varuint.encodingLength(bufLen);
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
          // The string body includes its own CompactSize length prefix.
          length += totalStreamLength(valBuf.length + varuint.encodingLength(valBuf.length));
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = value as Buffer;
          length += varint.encodingLength(new BN(1));
          length += totalStreamLength(valBuf.length + varuint.encodingLength(valBuf.length));
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
          writer.writeSlice(oneHash.reverse());
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
          const valBuf = value as Buffer;
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
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataRatingsKey.vdxfid: {
            const obj = new Rating();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.CredentialKey.vdxfid: {
            const obj = new Credential();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataTransferDestinationKey.vdxfid: {
            const obj = new TransferDestination();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
            const obj = new ContentMultiMapRemove();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            reader.readVarInt(32);
            objectUni = { key: checkVal, value: readByteVectorPayload(reader.readVarSlice()).toString('utf8') };
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            reader.readVarInt(32);
            objectUni = { key: checkVal, value: readByteVectorPayload(reader.readVarSlice()) };
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid: {
            const obj = new CrossChainDataRef();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.DataDescriptorKey.vdxfid: {
            const obj = new DataDescriptor();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.MMRDescriptorKey.vdxfid: {
            const obj = new MMRDescriptor();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
          case VDXF_Data.SignatureDataKey.vdxfid: {
            const obj = new SignatureData();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) objectUni = { key: checkVal, value: obj };
            break;
          }
        }
      } catch (e) {
        objectUni = undefined;
      }

      bytesLeft = reader.buffer.length - reader.offset;

      if (objectUni?.key && objectUni.value !== undefined) {
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

  /** Parse the supported lossless daemon JSON representation. */
  static fromJson(obj): VdxfUniValue {
    const values: Array<{ [key: string]: VdxfUniType }> = [];

    for (const item of Array.isArray(obj) ? obj : [obj]) {
      const bytes = daemonRawData(item);
      if (bytes !== undefined) {
        values.push({ '': bytes });
        continue;
      }

      for (const [rawKey, input] of Object.entries(item)) {
        const key = rawKey.includes('::')
          ? CompactIAddressObject.fromFQN(rawKey).toIAddress()
          : rawKey;
        let value: VdxfUniType;

        switch (key) {
          case VDXF_Data.DataByteKey.vdxfid:
            value = parseByteJson(input);
            break;
          case VDXF_Data.DataInt16Key.vdxfid:
          case VDXF_Data.DataUint16Key.vdxfid:
          case VDXF_Data.DataInt32Key.vdxfid:
          case VDXF_Data.DataUint32Key.vdxfid:
          case VDXF_Data.DataInt64Key.vdxfid:
            value = new BN(input as string | number, 10);
            break;
          case VDXF_Data.DataUint160Key.vdxfid:
            fromBase58Check(input as string).hash;
            value = input as string;
            break;
          case VDXF_Data.DataUint256Key.vdxfid:
            if (typeof input !== 'string') {
              throw new Error('Daemon uint256 data must be hex');
            }
            value = daemonRawData(input);
            if (value.length !== 32) {
              throw new Error('Daemon uint256 data must be exactly 32 bytes');
            }
            // Keep display order; the fixed-width writer reverses it on the wire.
            break;
          case VDXF_Data.DataStringKey.vdxfid:
            daemonRawData({ message: input });
            value = input as string;
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            if (typeof input !== 'string') {
              throw new Error('Daemon byte vector data must be hex');
            }
            value = daemonRawData(input);
            break;
          case VDXF_Data.DataCurrencyMapKey.vdxfid:
            value = CurrencyValueMap.fromJson(input as { [key: string]: string }, true);
            break;
          case VDXF_Data.DataRatingsKey.vdxfid:
            value = Rating.fromJson(input as RatingJson);
            break;
          case VDXF_Data.DataTransferDestinationKey.vdxfid:
            value = TransferDestination.fromJson(input as TransferDestinationJson);
            break;
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid:
            value = ContentMultiMapRemove.fromJson(input as ContentMultiMapRemoveJson);
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid: {
            const reference = CrossChainDataRef.fromJson(input as CrossChainDataRefJson);
            if (reference.ref instanceof URLRef) {
              const source = input as Record<string, unknown>;
              if (source.version !== 1 && source.version !== '1') {
                throw new Error('Daemon URL reference JSON supports only version 1 without a data hash');
              }
              if (source.datahash != null && source.datahash !== '') {
                if (typeof source.datahash !== 'string') {
                  throw new Error('URL reference datahash must be hex');
                }
                if (daemonRawData(source.datahash).length !== 32) {
                  throw new Error('URL reference datahash must be exactly 32 bytes');
                }
              }
              daemonURLRefJson(reference.ref);
            }
            value = reference;
            break;
          }
          case VDXF_Data.DataDescriptorKey.vdxfid:
            value = DataDescriptor.fromJson(input);
            break;
          case VDXF_Data.MMRDescriptorKey.vdxfid:
            value = MMRDescriptor.fromJson(input as MMRDescriptorJson);
            break;
          case VDXF_Data.SignatureDataKey.vdxfid:
            value = SignatureData.fromJson(input);
            break;
          case VDXF_Data.CredentialKey.vdxfid:
            value = Credential.fromJson(input as CredentialJson);
            break;
          default:
            throw new Error('Unknown vdxfkey: ' + rawKey);
        }
        values.push({ [key]: value });
      }
    }

    return new VdxfUniValue({ values });
  }

  /** Explicit RPC spelling of the same JSON contract. */
  static fromDaemonJson(obj): VdxfUniValue {
    return this.fromJson(obj);
  }

  toJson(): VdxfUniValueJsonArray | VdxfUniValueJson {
    const ret = [];

    for (const inner of this.values) {
      const key = Object.keys(inner)[0];
      const value = inner[key];

      if (key === VDXF_Data.DataByteVectorKey.vdxfid) {
        // VDXFDataToUniValue emits only the payload, losing the committed tag.
        throw new Error('Daemon JSON drops the byte-vector wrapper; use binary');
      }

      if (key === VDXF_Data.DataByteKey.vdxfid) {
        if (!Buffer.isBuffer(value) || value.length !== 1) {
          throw new Error('Daemon byte data must be exactly one byte');
        }
        ret.push({ [key]: value[0] });
      } else if (key === VDXF_Data.DataUint256Key.vdxfid) {
        if (!Buffer.isBuffer(value) || value.length !== 32) {
          throw new Error('Daemon uint256 data must be exactly 32 bytes');
        }
        ret.push({ [key]: value.toString('hex') });
      } else if (key === '' && Buffer.isBuffer(value)) {
        ret.push(value.toString('hex'));
      } else if (Buffer.isBuffer(value)) {
        ret.push({ [key]: value.toString('hex') });
      } else if (typeof value === 'string') {
        if (key === VDXF_Data.DataStringKey.vdxfid) {
          daemonRawData({ message: value });
        }
        ret.push({ [key]: value });
      } else if (value instanceof BN) {
        ret.push({ [key]: value.toString(10) });
      } else if (value instanceof CrossChainDataRef) {
        ret.push({
          [key]: value.ref instanceof URLRef
            ? daemonURLRefJson(value.ref)
            : value.toJson(),
        });
      } else {
        ret.push({ [key]: (value as JsonSerializableObject).toJson() });
      }
    }

    return ret.length === 1 ? ret[0] : ret;
  }

  /** Explicit RPC spelling of the same JSON contract. */
  toDaemonJson(): VdxfUniValueJsonArray | VdxfUniValueJson {
    return this.toJson();
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

  // Expose the common VdxfUniValue value shape over FQN-keyed storage.
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
      return bufLen + varuint.encodingLength(bufLen);
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
          // The string body includes its own CompactSize length prefix.
          length += totalStreamLength(valBuf.length + varuint.encodingLength(valBuf.length));
          break;
        }
        case VDXF_Data.DataByteVectorKey.vdxfid: {
          const valBuf = value as Buffer;
          length += varint.encodingLength(new BN(1));
          length += totalStreamLength(valBuf.length + varuint.encodingLength(valBuf.length));
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
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataRatingsKey.vdxfid: {
            const obj = new Rating();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.CredentialKey.vdxfid: {
            const obj = new Credential();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataTransferDestinationKey.vdxfid: {
            const obj = new TransferDestination();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.ContentMultiMapRemoveKey.vdxfid: {
            const obj = new ContentMultiMapRemove();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataStringKey.vdxfid:
            reader.readVarInt(32);
            parsedKey = compactAddr;
            parsedValue = readByteVectorPayload(reader.readVarSlice()).toString('utf8');
            break;
          case VDXF_Data.DataByteVectorKey.vdxfid:
            reader.readVarInt(32);
            parsedKey = compactAddr;
            parsedValue = readByteVectorPayload(reader.readVarSlice());
            break;
          case VDXF_Data.CrossChainDataRefKey.vdxfid: {
            const obj = new CrossChainDataRef();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.DataDescriptorKey.vdxfid: {
            const obj = new DataDescriptor();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.MMRDescriptorKey.vdxfid: {
            const obj = new MMRDescriptor();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
            if (obj.isValid()) { parsedKey = compactAddr; parsedValue = obj; }
            break;
          }
          case VDXF_Data.SignatureDataKey.vdxfid: {
            const obj = new SignatureData();
            reader.readVarInt(32);
            readEntityPayload(obj, reader.readVarSlice());
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

  static fromJson(obj): FqnVdxfUniValue {
    const inst = new FqnVdxfUniValue();

    for (const item of Array.isArray(obj) ? obj : [obj]) {
      const bytes = daemonRawData(item);
      if (bytes !== undefined) {
        if (inst._rawBytes !== undefined) {
          throw new Error('FQN JSON supports only one raw byte chunk');
        }
        inst._rawBytes = bytes;
        continue;
      }

      for (const [rawKey, input] of Object.entries(item)) {
        // FQN storage has unique named entries followed by one raw suffix.
        // Reject input that would otherwise be reordered or overwritten.
        if (inst._rawBytes !== undefined) {
          throw new Error('FQN JSON requires raw bytes after all named entries');
        }
        const compact = FqnVdxfUniValue.compactFor(rawKey);
        if (inst._kvValues.has(compact)) {
          throw new Error('FQN JSON contains a duplicate named key: ' + rawKey);
        }
        const key = compact.toIAddress();
        const parsed = VdxfUniValue.fromJson({ [key]: input });
        inst._kvValues.set(compact, parsed.values[0][key]);
      }
    }

    return inst;
  }

  toJson(): VdxfUniValueJsonArray | VdxfUniValueJson {
    const ret = [];

    for (const [compact, value] of this._kvValues.entries()) {
      const key = compact.toIAddress();
      const json = new VdxfUniValue({ values: [{ [key]: value }] }).toJson();
      ret.push({ [compact.address]: json[key] });
    }

    if (this._rawBytes !== undefined) {
      ret.push(this._rawBytes.toString('hex'));
    }

    return ret.length === 1 ? ret[0] : ret;
  }

}
