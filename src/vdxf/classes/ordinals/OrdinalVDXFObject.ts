import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import bufferutils from "../../../utils/bufferutils";
import { BN } from 'bn.js';
import { BigNumber } from "../../../utils/types/BigNumber";
import { SerializableDataEntity, SerializableEntity } from "../../../utils/types/SerializableEntity";
import varuint from "../../../utils/varuint";
import { fromBase58Check, getDataKey, toBase58Check, toIAddress } from "../../../utils/address";
import varint from "../../../utils/varint";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, NULL_ADDRESS } from "../../../constants/vdxf";
import { OrdinalVDXFObjectOrdinalMap } from "./OrdinalVDXFObjectOrdinalMap";
import { DEFAULT_VERUS_CHAINNAME } from "../../../constants/pbaas";
import { OrdinalVDXFObjectReservedData, OrdinalVDXFObjectReservedDataJson } from "../../../constants/ordinals/types";
import { 
  VDXF_OBJECT_RESERVED_BYTE_I_ADDR, 
  VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY, 
  VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING, 
  DATA_DESCRIPTOR_VDXF_ORDINAL 
} from "../../../constants/ordinals/ordinals";

export interface OrdinalVDXFObjectInterfaceTemplate<T> {
  version?: BigNumber;
  type?: BigNumber;
  key?: string;
  data?: T;
}

export type OrdinalVDXFObjectJsonTemplate<T> = {
  version: string;
  type: string;
  vdxfkey?: string;
  data?: T;
}

export type BufferOrOrdinalVDXFObjectReservedData = Buffer | OrdinalVDXFObjectReservedData;
export type StringOrOrdinalVDXFObjectReservedDataJson = string | OrdinalVDXFObjectReservedDataJson;

export type OrdinalVDXFObjectInterface = OrdinalVDXFObjectInterfaceTemplate<BufferOrOrdinalVDXFObjectReservedData>;
export type OrdinalVDXFObjectJson = OrdinalVDXFObjectJsonTemplate<StringOrOrdinalVDXFObjectReservedDataJson>;

export type OrdinalVDXFObjectDataClass = new (...args: any[]) => OrdinalVDXFObjectReservedData;
export type OrdinalVDXFObjectClass = new (...args: any[]) => OrdinalVDXFObject; 

export const getOrdinalVDXFObjectClassForType = (type: BigNumber): OrdinalVDXFObjectClass => {
  if (OrdinalVDXFObjectOrdinalMap.isRecognizedOrdinal(type.toNumber())) {
    const key = OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(type.toNumber());

    if (OrdinalVDXFObjectOrdinalMap.hasClassForVdxfKey(key)) {      
      return OrdinalVDXFObjectOrdinalMap.getClassForVdxfKey(OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(type.toNumber()));
    } else {
      throw new Error("No class found for " + key)
    }
  } else if (
    type.eq(VDXF_OBJECT_RESERVED_BYTE_I_ADDR) || 
    type.eq(VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING) || 
    type.eq(VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY)
  ) return GeneralTypeOrdinalVDXFObject;
  else throw new Error("Unrecognized vdxf ordinal object type " + type.toNumber());
}

export class OrdinalVDXFObject extends SerializableEntityBase implements SerializableEntity {
  version: BigNumber;
  type: BigNumber;
  key?: string;
  data?: BufferOrOrdinalVDXFObjectReservedData;

  static VERSION_INVALID = new BN(0, 10)
  static VERSION_FIRST = new BN(1, 10)
  static VERSION_LAST = new BN(1, 10)
  static VERSION_CURRENT = new BN(1, 10)

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<BufferOrOrdinalVDXFObjectReservedData> = {
      type: DATA_DESCRIPTOR_VDXF_ORDINAL
    }
  ) {
    super();
    if (request.key) {
      this.type = request.type ? request.type : VDXF_OBJECT_RESERVED_BYTE_I_ADDR;
      this.key = request.key;

      if (request.data) {
        this.data = request.data;
      } else this.data = Buffer.alloc(0);
    } else if (request.type == null) {
      this.type = DATA_DESCRIPTOR_VDXF_ORDINAL;
    } else {
      this.type = request.type;
    }

    if (request.version) this.version = request.version;
    else this.version = OrdinalVDXFObject.VERSION_CURRENT;
  }

  isDefinedByVdxfKey() {
    return this.type.eq(VDXF_OBJECT_RESERVED_BYTE_I_ADDR);
  }

  isDefinedByTextVdxfKey() {
    return this.type.eq(VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING);
  }

  isDefinedByIDOrCurrencyFQN() {
    return this.type.eq(VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY);
  }

  isDefinedByCustomKey() {
    return this.isDefinedByIDOrCurrencyFQN() || this.isDefinedByTextVdxfKey() || this.isDefinedByVdxfKey();
  }

  // Returns the I address vdxf key of this vdxf object
  getIAddressKey(): string {
    if (this.isDefinedByVdxfKey()) {
      return this.key;
    } else if (this.isDefinedByTextVdxfKey()) {
      return getDataKey(this.key).id;
    } else if (this.isDefinedByIDOrCurrencyFQN()) {
      return toIAddress(this.key);
    } else if (OrdinalVDXFObjectOrdinalMap.isRecognizedOrdinal(this.type.toNumber())) {
      return OrdinalVDXFObjectOrdinalMap.getVdxfKeyForOrdinal(this.type.toNumber())
    } else throw new Error("Could not get I address for ordinal VDXF object")
  }

  getDataByteLength(): number {
    return 0;
  }

  toDataBuffer(): Buffer {
    return Buffer.alloc(0);
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {}

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.type.toNumber());

    if (this.isDefinedByVdxfKey()) {
      length += fromBase58Check(this.key).hash.length;
    } else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
      const utf8Key = Buffer.from(this.key, 'utf8');

      length += varuint.encodingLength(utf8Key.length);
      length += utf8Key.length;
    }

    length += varint.encodingLength(this.version);

    const dataLength = this.getDataByteLength();

    length += varuint.encodingLength(dataLength);
    length += dataLength;

    return length;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getByteLength())
    );

    writer.writeCompactSize(this.type.toNumber());

    if (this.isDefinedByVdxfKey()) {
      writer.writeSlice(fromBase58Check(this.key).hash);
    } else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
      writer.writeVarSlice(Buffer.from(this.key, 'utf8'));
    }

    writer.writeVarInt(this.version);

    writer.writeVarSlice(this.toDataBuffer());

    return writer.buffer;
  }

  fromBufferOptionalType(buffer: Buffer, offset?: number, type?: BigNumber, key?: string, rootSystemName?: string): number {
    if (buffer.length == 0) throw new Error("Cannot create request from empty buffer");

    const reader = new bufferutils.BufferReader(buffer, offset);

    if (!type) {
      this.type = new BN(reader.readCompactSize());
    } else this.type = type;

    if (!key) {
      if (this.isDefinedByVdxfKey()) {
        this.key = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
      } else if (this.isDefinedByTextVdxfKey() || this.isDefinedByIDOrCurrencyFQN()) {
        this.key = reader.readVarSlice().toString('utf8');
      }
    } else {
      this.key = key;
    }

    this.version = reader.readVarInt();
    const dataBuf = reader.readVarSlice();

    this.fromDataBuffer(dataBuf, rootSystemName);

    return reader.offset;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    return this.fromBufferOptionalType(buffer, offset);
  }

  toJson(): OrdinalVDXFObjectJson {
    return {
      type: this.type ? this.type.toString() : undefined,
      version: this.version ? this.version.toString() : undefined,
      vdxfkey: this.key,
      data: this.data ? this.isDefinedByCustomKey() ? this.data.toString('hex') : (this.data as OrdinalVDXFObjectReservedData).toJson() : undefined
    };
  }

  static createFromBuffer(
    buffer: Buffer, 
    offset?: number, 
    optimizeWithOrdinal: boolean = false, 
    rootSystemName: string = DEFAULT_VERUS_CHAINNAME
  ): { offset: number, obj: OrdinalVDXFObject } {
    if (buffer.length == 0) throw new Error("Cannot create request from empty buffer");
    
    const reader = new bufferutils.BufferReader(buffer, offset);
    let type = new BN(reader.readCompactSize());
    const rootSystemId = toIAddress(rootSystemName);

    let Entity = getOrdinalVDXFObjectClassForType(type);
    let ord = new Entity({ type });
    
    let key: string;

    if (optimizeWithOrdinal) {
      let vdxfKey: string;

      if (ord.isDefinedByVdxfKey()) {
        key = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
        vdxfKey = key;
      } else if (ord.isDefinedByTextVdxfKey() || ord.isDefinedByIDOrCurrencyFQN()) {
        key = reader.readVarSlice().toString('utf8');

        if (ord.isDefinedByTextVdxfKey()) {
          vdxfKey = getDataKey(key, undefined, rootSystemId).id;
        } else {
          vdxfKey = toIAddress(key, rootSystemName);
        }
      }

      if (OrdinalVDXFObjectOrdinalMap.vdxfKeyHasOrdinal(vdxfKey)) {
        type = new BN(OrdinalVDXFObjectOrdinalMap.getOrdinalForVdxfKey(vdxfKey));

        Entity = getOrdinalVDXFObjectClassForType(type);
        ord = new Entity({ type });
      }
    }

    reader.offset = ord.fromBufferOptionalType(buffer, reader.offset, type, key, rootSystemName);

    return { offset: reader.offset, obj: ord };
  }
}

export class GeneralTypeOrdinalVDXFObject extends OrdinalVDXFObject implements SerializableDataEntity {
  data: Buffer;
  key: string;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<Buffer> = {
      type: VDXF_OBJECT_RESERVED_BYTE_I_ADDR,
      data: Buffer.alloc(0),
      key: NULL_ADDRESS
    }
  ) {
    super({
      type: request.type,
      data: request.data,
      key: request.key
    })
  }

  getDataByteLength(): number {
    return this.data.length;
  }

  toDataBuffer(): Buffer {
    return this.data;
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = Buffer.from(buffer)
  }

  static fromJson(details: OrdinalVDXFObjectJson): GeneralTypeOrdinalVDXFObject {
    return new GeneralTypeOrdinalVDXFObject({
      key: details.vdxfkey,
      data: details.data ? Buffer.from(details.data as string, 'hex') : undefined,
      type: details.type ? new BN(details.type) : VDXF_OBJECT_RESERVED_BYTE_I_ADDR
    });
  }
}