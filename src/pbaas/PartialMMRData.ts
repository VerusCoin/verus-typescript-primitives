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
  HASH_TYPE_SHA256D_NAME,
} from '../constants/pbaas';
import { VdxfUniValue, VdxfUniValueJson } from './VdxfUniValue';

const { BufferReader, BufferWriter } = bufferutils;

// Recognize base64 solely to reject it with an actionable error.
const CLI_DATA_KEYS = [
  'filename',
  'serializedhex',
  'serializedbase64',
  'message',
  'datahash',
  'vdxfdata',
] as const;

// Buffer.from accepts truncated hex. Requests must not silently commit
// different bytes, so these entry points require exact encodings.
function decodeHex(value: string): Buffer {
  if (typeof value !== 'string' || !/^(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new Error('Expected complete hexadecimal bytes');
  }

  return Buffer.from(value, 'hex');
}

// Supplied salts and hashes use the fixed uint256 width.
// Enforce the fixed width at both CLI boundaries, including direct construction.
function requireUint256(value: Buffer, field: string): Buffer {
  if (!Buffer.isBuffer(value) || value.length !== 32) {
    throw new Error(`${field} must contain exactly 32 bytes`);
  }

  return value;
}

function encodeText(value: string): Buffer {
  if (typeof value !== 'string') throw new Error('Expected string data');

  const buffer = Buffer.from(value, 'utf8');
  if (buffer.toString('utf8') !== value) {
    throw new Error('Text contains an unpaired UTF-16 surrogate');
  }

  return buffer;
}

function decodeText(value: Buffer): string {
  const text = value.toString('utf8');
  if (!Buffer.from(text, 'utf8').equals(value)) {
    throw new Error('Text data must contain valid UTF-8');
  }

  return text;
}

export type PartialMMRDataUnit = {
  type: BigNumber;
  data: Buffer | VdxfUniValue;
};

export type PartialMMRDataInitData = {
  flags?: BigNumber;
  data?: Array<PartialMMRDataUnit>;
  salt?: Array<Buffer>;
  mmrhashtype?: BigNumber;
  priormmr?: Array<Buffer>;
};

export type PartialMMRDataJson = {
  flags?: string;
  data?: Array<{ type: string; data: string | VdxfUniValueJson }>;
  salt?: Array<string>;
  mmrhashtype?: string;
  priormmr?: Array<string>;
};

export type CLIMMRDataStringKey =
  | 'filename'
  | 'serializedhex'
  | 'message'
  | 'datahash';

export type CLIMMRDataKey = CLIMMRDataStringKey | 'vdxfdata';

// Ensure that each object in the array has exactly one key from CLIMMRDataKey
export type SingleKeyMMRData = {
  [K in CLIMMRDataStringKey]: { [P in K]: string };
}[CLIMMRDataStringKey];

export type PartialMMRDataCLIJson = {
  mmrdata: Array<SingleKeyMMRData | { ['vdxfdata']: VdxfUniValueJson }>;
  mmrsalt?: Array<string>;
  mmrhashtype?: AllowedHashes;
};

/**
 * Request-envelope storage, not a daemon wire class. RAWSTRING and prior-MMR
 * fields remain serializable locally, but cannot be converted to RPC requests.
 */
export class PartialMMRData
  extends SerializableEntityBase
  implements SerializableEntity
{
  flags: BigNumber;
  data: Array<PartialMMRDataUnit>;
  mmrhashtype?: BigNumber;

  salt?: Array<Buffer>;
  priormmr?: Array<Buffer>;

  static CONTAINS_SALT = new BN('1', 10);
  static CONTAINS_PRIORMMR = new BN('2', 10);

  constructor(data?: PartialMMRDataInitData) {
    super();
    this.allowRepeatedFromBuffer = true;
    this.flags = data && data.flags ? data.flags : new BN('0');
    this.data = data && data.data ? data.data : [];
    this.mmrhashtype =
      data && data.mmrhashtype ? data.mmrhashtype : DEFAULT_HASH_TYPE_MMR;

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
    return !!this.flags.and(PartialMMRData.CONTAINS_SALT).toNumber();
  }

  protected containsPriorMMR() {
    return !!this.flags.and(PartialMMRData.CONTAINS_PRIORMMR).toNumber();
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

    // Decode replacement state first, so a failed reuse preserves the request.
    const flags = reader.readVarInt();
    const entries: PartialMMRDataUnit[] = [];
    const numData = reader.readCompactSize();

    for (let i = 0; i < numData; i++) {
      const type = reader.readVarInt();
      let data: Buffer | VdxfUniValue;
      const payload = reader.readVarSlice();

      if (type.eq(DATA_TYPE_VDXFDATA)) {
        const vdxfData = new VdxfUniValue();
        if (vdxfData.fromBuffer(payload) !== payload.length) {
          throw new Error('Partial MMR VDXF payload length mismatch');
        }
        if (!vdxfData.toBuffer().equals(payload)) {
          throw new Error(
            'Partial MMR VDXF decoding would change the payload bytes'
          );
        }

        data = vdxfData;
      } else {
        data = payload;
      }

      entries.push({ type, data });
    }

    const mmrhashtype = reader.readVarInt();
    const salt = flags.and(PartialMMRData.CONTAINS_SALT).isZero()
      ? undefined
      : reader.readVector();
    const priormmr = flags.and(PartialMMRData.CONTAINS_PRIORMMR).isZero()
      ? undefined
      : reader.readVector();

    this.flags = flags;
    this.data = entries;
    this.mmrhashtype = mmrhashtype;
    this.salt = salt;
    this.priormmr = priormmr;

    return reader.offset;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(
      Buffer.alloc(this.getPartialMMRDataByteLength())
    );

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
      data: this.data
        ? this.data.map((x) => {
            if (x.type.eq(DATA_TYPE_VDXFDATA)) {
              const uni = (x.data as VdxfUniValue).toJson();

              if (Array.isArray(uni)) {
                throw new Error(
                  'VDXF univalue arrays not supported in partialmmrdata vdxfdata'
                );
              } else {
                return {
                  type: x.type.toString(10),
                  data: uni,
                };
              }
            } else {
              return {
                type: x.type.toString(10),
                data: x.data.toString('hex'),
              };
            }
          })
        : undefined,
      salt: this.salt ? this.salt.map((x) => x.toString('hex')) : undefined,
      mmrhashtype: this.mmrhashtype ? this.mmrhashtype.toString(10) : undefined,
      priormmr: this.priormmr
        ? this.priormmr.map((x) => x.toString('hex'))
        : undefined,
    };
  }

  static fromJson(json: PartialMMRDataJson): PartialMMRData {
    return new PartialMMRData({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      data: json.data
        ? json.data.map((x) => {
            const type = new BN(x.type, 10);

            if (type.eq(DATA_TYPE_VDXFDATA)) {
              return {
                type: new BN(x.type, 10),
                data: VdxfUniValue.fromJson(x.data as VdxfUniValueJson),
              };
            } else {
              return {
                type: new BN(x.type, 10),
                data: decodeHex(x.data as string),
              };
            }
          })
        : undefined,
      salt: json.salt ? json.salt.map(decodeHex) : undefined,
      mmrhashtype: json.mmrhashtype ? new BN(json.mmrhashtype, 10) : undefined,
      priormmr: json.priormmr ? json.priormmr.map(decodeHex) : undefined,
    });
  }

  toCLIJson(): PartialMMRDataCLIJson {
    // The daemon accepts this field but never combines its hashes into the MMR.
    if (this.containsPriorMMR() || this.priormmr !== undefined) {
      throw new Error('Prior-MMR combination is not implemented by the daemon');
    }

    const mmrdata: PartialMMRDataCLIJson['mmrdata'] = [];
    let mmrsalt: Array<string>;
    let mmrhashtype: string;

    for (const unit of this.data) {
      if (unit.type.eq(DATA_TYPE_RAWSTRINGDATA)) {
        throw new Error(
          'RAWSTRING data is not RPC-compatible; use serializedhex'
        );
      } else if (unit.type.eq(DATA_TYPE_FILENAME)) {
        mmrdata.push({
          filename: decodeText(unit.data as Buffer),
        });
      } else if (unit.type.eq(DATA_TYPE_MESSAGE)) {
        mmrdata.push({
          message: decodeText(unit.data as Buffer),
        });
      } else if (unit.type.eq(DATA_TYPE_VDXFDATA)) {
        const uni = (unit.data as VdxfUniValue).toDaemonJson();

        if (Array.isArray(uni)) {
          throw new Error(
            'VDXF univalue arrays not supported in partialmmrdata vdxfdata'
          );
        } else {
          mmrdata.push({
            vdxfdata: uni,
          });
        }
      } else if (unit.type.eq(DATA_TYPE_HEX)) {
        mmrdata.push({
          serializedhex: unit.data.toString('hex'),
        });
      } else if (unit.type.eq(DATA_TYPE_BASE64)) {
        throw new Error(
          'Daemon serializedbase64 decoding is defective; use serializedhex'
        );
      } else if (unit.type.eq(DATA_TYPE_DATAHASH)) {
        mmrdata.push({
          datahash: requireUint256(unit.data as Buffer, 'datahash').toString(
            'hex'
          ),
        });
      } else {
        throw new Error(
          'Unsupported partial MMR item tag: ' + unit.type.toString(10)
        );
      }
    }

    if (this.containsSalt()) {
      mmrsalt = this.salt.map((value) =>
        requireUint256(value, 'mmrsalt').toString('hex')
      );
    }

    if (this.mmrhashtype.eq(HASH_TYPE_SHA256)) {
      mmrhashtype = HASH_TYPE_SHA256_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_SHA256D)) {
      mmrhashtype = HASH_TYPE_SHA256D_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_BLAKE2B)) {
      mmrhashtype = HASH_TYPE_BLAKE2B_NAME;
    } else if (this.mmrhashtype.eq(HASH_TYPE_KECCAK256)) {
      mmrhashtype = HASH_TYPE_KECCAK256_NAME;
    } else throw new Error('Unrecognized hash type');

    const ret = {
      mmrdata,
      mmrsalt,
      mmrhashtype,
    };

    for (const key in ret) {
      if (ret[key] === undefined) delete ret[key];
    }

    return ret;
  }

  static fromCLIJson(json: PartialMMRDataCLIJson): PartialMMRData {
    const data: Array<PartialMMRDataUnit> = [];
    let salt: Array<Buffer>;
    let mmrhashtype: BigNumber;

    if ('priormmr' in json) {
      throw new Error('Prior-MMR combination is not implemented by the daemon');
    }

    if (!Array.isArray(json.mmrdata)) {
      throw new Error('mmrdata must be an array');
    }

    for (const unit of json.mmrdata) {
      if (typeof unit === 'string') {
        throw new Error(
          'Bare MMR strings are not RPC-compatible; use serializedhex'
        );
      }
      if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
        throw new Error('MMR data items must be objects');
      }

      // GetDataMessage uses fixed precedence. A single-key contract avoids
      // choosing different data based on JavaScript object insertion order.
      const keys = Object.keys(unit);
      const dataKeys = CLI_DATA_KEYS.filter((key) => keys.includes(key));
      if (dataKeys.length !== 1 || keys.length !== 1) {
        throw new Error(
          'MMR data items must contain exactly one supported data key'
        );
      }

      const dataKey = dataKeys[0];
      const dataValue = unit[dataKey];

      switch (dataKey) {
        case 'filename':
          data.push({ type: DATA_TYPE_FILENAME, data: encodeText(dataValue) });
          break;
        case 'message':
          data.push({ type: DATA_TYPE_MESSAGE, data: encodeText(dataValue) });
          break;
        case 'vdxfdata':
          data.push({
            type: DATA_TYPE_VDXFDATA,
            data: VdxfUniValue.fromDaemonJson(dataValue),
          });
          break;
        case 'serializedhex':
          data.push({ type: DATA_TYPE_HEX, data: decodeHex(dataValue) });
          break;
        case 'serializedbase64':
          throw new Error(
            'Daemon serializedbase64 decoding is defective; use serializedhex'
          );
        case 'datahash':
          data.push({
            type: DATA_TYPE_DATAHASH,
            data: requireUint256(decodeHex(dataValue), 'datahash'),
          });
          break;
      }
    }

    if (json.mmrsalt) {
      salt = json.mmrsalt.map((value) =>
        requireUint256(decodeHex(value), 'mmrsalt')
      );
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
          throw new Error('Unrecognized hash type');
      }
    }

    return new PartialMMRData({
      data,
      salt,
      mmrhashtype,
    });
  }
}
