import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import bufferutils from '../utils/bufferutils';
import varuint from '../utils/varuint';
import { 
  AllowedHashes, 
  DATA_TYPE_BASE64, 
  DATA_TYPE_DATAHASH, 
  DATA_TYPE_FILENAME, 
  DATA_TYPE_HEX, 
  DATA_TYPE_MESSAGE, 
  DATA_TYPE_RAWSTRINGDATA, 
  DATA_TYPE_VDXFDATA,
  DEFAULT_HASH_TYPE_MMR, 
  HASH_TYPE_BLAKE2B, 
  HASH_TYPE_BLAKE2B_NAME, 
  HASH_TYPE_KECCAK256, 
  HASH_TYPE_KECCAK256_NAME, 
  HASH_TYPE_SHA256,
  HASH_TYPE_SHA256_NAME,
  HASH_TYPE_SHA256D,
  HASH_TYPE_SHA256D_NAME
} from '../constants/pbaas';
import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';

const { BufferReader, BufferWriter } = bufferutils;

export type PartialMMRDataUnit = { type: BigNumber, data: Buffer | VdxfUniValue };

export type PartialMMRDataInitData = {
  flags?: BigNumber;
  data?: Array<PartialMMRDataUnit>;
  salt?: Array<Buffer>;
  mmrhashtype?: BigNumber;
  priormmr?: Array<Buffer>;
}

export type PartialMMRDataJson = {
  flags?: string;
  data?: Array<{type: string, data: string | VdxfUniValueJson}>;
  salt?: Array<string>;
  mmrhashtype?: string;
  priormmr?: Array<string>;
}

export type CLIMMRDataStringKey = 
  | "filename" 
  | "serializedhex" 
  | "serializedbase64"
  | "message" 
  | "datahash";

export type CLIMMRDataKey = CLIMMRDataStringKey | "vdxfdata";

// Ensure that each object in the array has exactly one key from CLIMMRDataKey
export type SingleKeyMMRData = { 
  [K in CLIMMRDataStringKey]: { [P in K]: string } 
}[CLIMMRDataStringKey];

export type PartialMMRDataCLIJson = {
  mmrdata: Array<SingleKeyMMRData | string | { ['vdxfdata']: VdxfUniValueJson }>;
  mmrsalt?: Array<string>;
  mmrhashtype?: AllowedHashes;
  priormmr?: Array<string>;
};

export class PartialMMRData extends SerializableEntityBase implements SerializableEntity {
  flags: BigNumber;
  data: Array<PartialMMRDataUnit>;
  mmrhashtype?: BigNumber;

  salt?: Array<Buffer>;
  priormmr?: Array<Buffer>;

  static CONTAINS_SALT = new BN("1", 10);
  static CONTAINS_PRIORMMR = new BN("2", 10);
  
  constructor(data?: PartialMMRDataInitData) {
    super();
    this.flags = data && data.flags ? data.flags : new BN("0");
    this.data = data && data.data ? data.data : [];
    this.mmrhashtype = data && data.mmrhashtype ? data.mmrhashtype : DEFAULT_HASH_TYPE_MMR;
    
    if (data?.salt) {
      if (!this.containsSalt()) this.toggleContainsSalt();
      this.salt = data.salt;
    }

    if (data?.priormmr) {
      if (!this.containsPriorMMR()) this.toggleContainsPriorMMR();
      this.priormmr = data.priormmr;
    }
  }

  protected containsSalt() {
    return !!(this.flags.and(PartialMMRData.CONTAINS_SALT).toNumber());
  }

  protected containsPriorMMR() {
    return !!(this.flags.and(PartialMMRData.CONTAINS_PRIORMMR).toNumber());
  }

  private toggleContainsSalt() {
    this.flags = this.flags.xor(PartialMMRData.CONTAINS_SALT);
  }

  private toggleContainsPriorMMR() {
    this.flags = this.flags.xor(PartialMMRData.CONTAINS_PRIORMMR);
  }

  private getPartialMMRDataByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.flags);

    length += varuint.encodingLength(this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      const unit = this.data[i];

      length += varint.encodingLength(unit.type);

      if (unit.type.eq(DATA_TYPE_VDXFDATA)) {
        const vdxfdatalen = (unit.data as VdxfUniValue).getByteLength();

        length += varuint.encodingLength(vdxfdatalen);
        length += vdxfdatalen;
      } else {
        const buf = unit.data as Buffer;

        length += varuint.encodingLength(buf.length);
        length += buf.length;
      }
    }

    length += varint.encodingLength(this.mmrhashtype);

    if (this.containsSalt()) {
      length += varuint.encodingLength(this.salt.length);
      for (let i = 0; i < this.salt.length; i++) {
        const salt = this.salt[i];
  
        length += varuint.encodingLength(salt.length);
        length += salt.length;
      }
    }

    if (this.containsPriorMMR()) {
      length += varuint.encodingLength(this.priormmr.length);
      for (let i = 0; i < this.priormmr.length; i++) {
        const priormmr = this.priormmr[i];
  
        length += varuint.encodingLength(priormmr.length);
        length += priormmr.length;
      }
    }

    return length;
  }

  getByteLength(): number {
    return this.getPartialMMRDataByteLength();
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.flags = reader.readVarInt();

    const numData = reader.readCompactSize();
    for (let i = 0; i < numData; i++) {
      const type = reader.readVarInt();
      let data: Buffer | VdxfUniValue;

      if (type.eq(DATA_TYPE_VDXFDATA)) {
        const vdxfData = new VdxfUniValue();
        
        const vdxfDataBuf = reader.readVarSlice();
        vdxfData.fromBuffer(vdxfDataBuf);

        data = vdxfData;
      } else {
        data = reader.readVarSlice();
      }

      this.data.push({
        type,
        data
      })
    }

    this.mmrhashtype = reader.readVarInt();

    if (this.containsSalt()) {
      this.salt = reader.readVector();
    }

    if (this.containsPriorMMR()) {
      this.priormmr = reader.readVector();
    }

    return reader.offset;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getPartialMMRDataByteLength()));
  
    // Serialize flags
    writer.writeVarInt(this.flags);
  
    writer.writeCompactSize(this.data.length);

    for (let i = 0; i < this.data.length; i++) {
      writer.writeVarInt(this.data[i].type);

      if (this.data[i].type.eq(DATA_TYPE_VDXFDATA)) {
        const vdxfData = this.data[i].data as VdxfUniValue;

        writer.writeVarSlice(vdxfData.toBuffer());
      } else {
        writer.writeVarSlice(this.data[i].data as Buffer);
      }
    }

    writer.writeVarInt(this.mmrhashtype);

    if (this.containsSalt()) {
      writer.writeVector(this.salt);
    }

    if (this.containsPriorMMR()) {
      writer.writeVector(this.priormmr);
    }
  
    return writer.buffer;
  }

  toJson(): PartialMMRDataJson {
    return {
      flags: this.flags ? this.flags.toString(10) : undefined,
      data: this.data ? this.data.map(x => {
        if (x.type.eq(DATA_TYPE_VDXFDATA)) {
          const uni = (x.data as VdxfUniValue).toJson();

          if (Array.isArray(uni)) {
            throw new Error("VDXF univalue arrays not supported in partialmmrdata vdxfdata");
          } else {
            return {
              type: x.type.toString(10),
              data: uni
            };
          }
        } else {
          return {
            type: x.type.toString(10),
            data: x.data.toString('hex')
          };
        }
      }) : undefined,
      salt: this.salt ? this.salt.map(x => x.toString('hex')) : undefined,
      mmrhashtype: this.mmrhashtype ? this.mmrhashtype.toString(10) : undefined,
      priormmr: this.priormmr ? this.priormmr.map(x => x.toString('hex')) : undefined
    }
  }

  static fromJson(json: PartialMMRDataJson): PartialMMRData {
    return new PartialMMRData({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      data: json.data ? json.data.map(x => {
        const type = new BN(x.type, 10);

        if (type.eq(DATA_TYPE_VDXFDATA)) {
          return {
            type: new BN(x.type, 10),
            data: VdxfUniValue.fromJson(x.data as VdxfUniValueJson)
          }
        } else {
          return {
            type: new BN(x.type, 10),
            data: Buffer.from(x.data as string, 'hex')
          }
        }
      }) : undefined,
      salt: json.salt ? json.salt.map(x => Buffer.from(x, 'hex')) : undefined,
      mmrhashtype: json.mmrhashtype ? new BN(json.mmrhashtype, 10) : undefined,
      priormmr: json.priormmr ? json.priormmr.map(x => Buffer.from(x, 'hex')) : undefined,
    })
  }

  toCLIJson(): PartialMMRDataCLIJson {
    const mmrdata = [];
    let mmrsalt: Array<string>;
    let priormmr: Array<string>;
    let mmrhashtype: string;

    for (const unit of this.data) {
      if (unit.type.eq(DATA_TYPE_RAWSTRINGDATA)){
        mmrdata.push(unit.data.toString('hex'));
      } else if (unit.type.eq(DATA_TYPE_FILENAME)) {
        mmrdata.push({
          "filename": unit.data.toString('utf-8')
        });
      } else if (unit.type.eq(DATA_TYPE_MESSAGE)) {
        mmrdata.push({
          "message": unit.data.toString('utf-8')
        });
      } else if (unit.type.eq(DATA_TYPE_VDXFDATA)) {
        const uni = (unit.data as VdxfUniValue).toJson();

        if (Array.isArray(uni)) {
          throw new Error("VDXF univalue arrays not supported in partialmmrdata vdxfdata");
        } else {
          mmrdata.push({
            "vdxfdata": uni
          });
        }
      } else if (unit.type.eq(DATA_TYPE_HEX)) {
        mmrdata.push({
          "serializedhex": unit.data.toString('hex')
        });
      } else if (unit.type.eq(DATA_TYPE_BASE64)) {
        mmrdata.push({
          "serializedbase64": unit.data.toString('base64')
        });
      } else if (unit.type.eq(DATA_TYPE_DATAHASH)) {
        mmrdata.push({
          "datahash": unit.data.toString('hex')
        });
      }
    }

    if (this.containsSalt()) {
      mmrsalt = this.salt.map(x => x.toString('hex'));
    }

    if (this.containsPriorMMR()) {
      priormmr = this.priormmr.map(x => x.toString('hex'));
    }

    if (this.mmrhashtype.eq(HASH_TYPE_SHA256)){
      mmrhashtype = HASH_TYPE_SHA256_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_SHA256D)) {
      mmrhashtype = HASH_TYPE_SHA256D_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_BLAKE2B)) {
      mmrhashtype = HASH_TYPE_BLAKE2B_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_KECCAK256)) {
      mmrhashtype = HASH_TYPE_KECCAK256_NAME;
    } else throw new Error("Unrecognized hash type");

    const ret = {
      mmrdata,
      mmrsalt,
      priormmr,
      mmrhashtype
    };

    for (const key in ret) {
      if (ret[key] === undefined) delete ret[key]
    }

    return ret;
  }

  static fromCLIJson(json: PartialMMRDataCLIJson): PartialMMRData {
    const data: Array<PartialMMRDataUnit> = [];
    let salt: Array<Buffer>;
    let priormmr: Array<Buffer>;
    let mmrhashtype: BigNumber;

    for (const unit of json.mmrdata) {
      if (typeof unit === 'string') {
        data.push({ type: DATA_TYPE_RAWSTRINGDATA, data: Buffer.from(unit, 'hex') })
      } else {
        const unitMmrData = unit["vdxfdata"] ? unit as { ['vdxfdata']: VdxfUniValueJson } : unit as SingleKeyMMRData;
        const dataKey: CLIMMRDataKey = Object.keys(unitMmrData)[0] as CLIMMRDataKey;
        const dataValue = unitMmrData[dataKey];

        switch (dataKey) {
          case "filename":
            data.push({ type: DATA_TYPE_FILENAME, data: Buffer.from(dataValue, 'utf-8')});
            break;
          case "message":
            data.push({ type: DATA_TYPE_MESSAGE, data: Buffer.from(dataValue, 'utf-8')});
            break;
          case "vdxfdata":
            data.push({ type: DATA_TYPE_VDXFDATA, data: VdxfUniValue.fromJson(dataValue)});
            break;
          case "serializedhex":
            data.push({ type: DATA_TYPE_HEX, data: Buffer.from(dataValue, 'hex')});
            break;
          case "serializedbase64":
            data.push({ type: DATA_TYPE_BASE64, data: Buffer.from(dataValue, 'base64')});
            break;
          case "datahash":
            data.push({ type: DATA_TYPE_DATAHASH, data: Buffer.from(dataValue, 'hex')});
            break;
          default:
            throw new Error("Unrecognized data key type");
        }
      }
    }

    if (json.mmrsalt) {
      salt = json.mmrsalt.map(x => Buffer.from(x, 'hex'));
    }

    if (json.priormmr) {
      priormmr = json.priormmr.map(x => Buffer.from(x, 'hex'));
    }

    if (json.mmrhashtype) {
      switch (json.mmrhashtype) {
        case HASH_TYPE_SHA256_NAME:
          mmrhashtype = HASH_TYPE_SHA256;
          break;
        case HASH_TYPE_SHA256D_NAME:
          mmrhashtype = HASH_TYPE_SHA256D;
          break;
        case HASH_TYPE_BLAKE2B_NAME:
          mmrhashtype = HASH_TYPE_BLAKE2B;
          break;
        case HASH_TYPE_KECCAK256_NAME:
          mmrhashtype = HASH_TYPE_KECCAK256;
          break;
        default:
          throw new Error("Unrecognized hash type");
      }
    }

    return new PartialMMRData({
      data,
      salt,
      priormmr,
      mmrhashtype
    })
  }
}