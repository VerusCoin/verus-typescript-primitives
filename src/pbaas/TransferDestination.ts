import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import varuint from '../utils/varuint';
import { fromBase58Check, toBase58Check, decodeDestination, decodeEthDestination } from '../utils/address';
import { I_ADDR_VERSION, R_ADDR_VERSION, HASH160_BYTE_LENGTH } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { bnToDecimal, decimalToBn } from '../utils/numberConversion';
const { BufferReader, BufferWriter } = bufferutils

export const DEST_INVALID = new BN(0, 10)
export const DEST_PK = new BN(1, 10)
export const DEST_PKH = new BN(2, 10)
export const DEST_SH = new BN(3, 10)
export const DEST_ID = new BN(4, 10)
export const DEST_FULLID = new BN(5, 10)
export const DEST_REGISTERCURRENCY = new BN(6, 10)
export const DEST_QUANTUM = new BN(7, 10)
export const DEST_NESTEDTRANSFER = new BN(8, 10)            // used to chain transfers, enabling them to be routed through multiple systems
export const DEST_ETH = new BN(9, 10)
export const DEST_ETHNFT = new BN(10, 10)                   // used when defining a mapped NFT to gateway that uses an ETH compatible model
export const DEST_RAW = new BN(11, 10)
export const LAST_VALID_TYPE_NO_FLAGS = DEST_RAW
export const FLAG_DEST_AUX = new BN(64, 10)
export const FLAG_DEST_GATEWAY = new BN(128, 10)
export const FLAG_MASK = FLAG_DEST_AUX.add(FLAG_DEST_GATEWAY)


export type TransferDestinationJson = {
  type: number;
  address: string;
  gateway?: string;
  gatewaycode?: string;
  fees?: string;
  auxdests?: Array<TransferDestinationJson>
}

export class TransferDestination implements SerializableEntity {
  type: BigNumber;
  destinationBytes: Buffer;
  gatewayID: string;
  gatewayCode: string;
  fees: BigNumber;
  auxDests: Array<TransferDestination>;

  constructor (data?: { type?: BigNumber, destinationBytes?: Buffer, gatewayID?: string, gatewayCode?: string, fees?: BigNumber, auxDests?: Array<TransferDestination> }) {
    this.type = DEST_INVALID;
    this.destinationBytes = Buffer.alloc(0);
    this.gatewayID = null;
    this.gatewayCode = null;
    this.fees = new BN(0, 10);
    this.auxDests = [];

    if (data != null) {
      const d = data as any;
      const snakeDeprecated = ['destination_bytes', 'gateway_id', 'gateway_code', 'aux_dests'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
      if (snakeDeprecated.length > 0) {
        const map: Record<string, string> = {
          destination_bytes: 'destinationBytes',
          gateway_id: 'gatewayID',
          gateway_code: 'gatewayCode',
          aux_dests: 'auxDests',
        };
        throw new Error(`TransferDestination: snake_case property names are no longer supported. Rename: ${snakeDeprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
      if (Object.prototype.hasOwnProperty.call(d, 'gatewayId')) {
        throw new Error("TransferDestination: Use fully-capitalised ID suffix. Rename: 'gatewayId' → 'gatewayID'.");
      }
      if (data.type != null) this.type = data.type
      if (data.destinationBytes != null) this.destinationBytes = data.destinationBytes
      if (data.gatewayID != null) this.gatewayID = data.gatewayID
      if (data.gatewayCode != null) this.gatewayCode = data.gatewayCode
      if (data.fees != null) this.fees = data.fees
      if (data.auxDests != null) this.auxDests = data.auxDests
    }
  }

  /** @deprecated Use destinationBytes instead */
  get destination_bytes(): Buffer { return this.destinationBytes; }
  /** @deprecated Use gatewayID instead */
  get gatewayId(): string { return this.gatewayID; }
  /** @deprecated Use gatewayID instead */
  get gateway_id(): string { return this.gatewayID; }
  /** @deprecated Use gatewayCode instead */
  get gateway_code(): string { return this.gatewayCode; }
  /** @deprecated Use auxDests instead */
  get aux_dests(): Array<TransferDestination> { return this.auxDests; }

  isGateway() {
    return !!(this.type.and(FLAG_DEST_GATEWAY).toNumber())
  }

  hasAuxDests() {
    return !!(this.type.and(FLAG_DEST_AUX).toNumber())
  }

  isIAddr() {
    return this.typeNoFlags().eq(DEST_ID)
  }

  isPKH() {
    return this.typeNoFlags().eq(DEST_PKH)
  }

  isETHAccount() {
    return this.typeNoFlags().eq(DEST_ETH)
  }

  typeNoFlags() {
    return this.type.and(FLAG_MASK.notn(FLAG_MASK.bitLength()))
  }

  getAddressString() {
    if (this.isPKH()) {
      return toBase58Check(this.destinationBytes, R_ADDR_VERSION);
    } else if (this.isIAddr()) {
      return toBase58Check(this.destinationBytes, I_ADDR_VERSION);
    } else if (this.isETHAccount()) {
      return "0x" + this.destinationBytes.toString('hex');
    } else {
      throw new Error("Cannot get address for unsupported transfer destination type.");
    }
  }

  getByteLength() {
    let length = 0;

    length += 1; // type
    length += varuint.encodingLength(this.destinationBytes.length) // destinationBytes compact size
    length += this.destinationBytes.length; // destinationBytes

    if (this.isGateway()) {
      length += fromBase58Check(this.gatewayID).hash.length; // gatewayId
      if (this.gatewayCode) {
        length += fromBase58Check(this.gatewayCode).hash.length; // gatewayCode
      } else {
        length += HASH160_BYTE_LENGTH
      }
      length += 8 // fees int64
    }

    if (this.hasAuxDests()) {
      length += varuint.encodingLength(this.auxDests.length) // aux dests compact size

      for (const dest of this.auxDests) {
        const destLength = dest.getByteLength()

        length += varuint.encodingLength(destLength) // one aux dest compact size
        length += destLength // one aux dest compact size
      }
    }

    return length;
  }

  toBuffer () {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeUInt8(this.type.toNumber());
    writer.writeVarSlice(this.destinationBytes);

    if (this.isGateway()) {
      writer.writeSlice(fromBase58Check(this.gatewayID).hash);
      if (this.gatewayCode) {
        writer.writeSlice(fromBase58Check(this.gatewayCode).hash);
      } else {
        writer.writeSlice(Buffer.alloc(HASH160_BYTE_LENGTH));
      }
      writer.writeInt64(this.fees);
    }

    if (this.hasAuxDests()) {
      writer.writeCompactSize(this.auxDests.length);
      this.auxDests.forEach((auxDest) => writer.writeVarSlice(auxDest.toBuffer()));
    }

    return writer.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.type = new BN(reader.readUInt8(), 10);
    this.destinationBytes = reader.readVarSlice();

    if (this.isGateway()) {
      this.gatewayID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      this.gatewayCode = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      this.fees = reader.readInt64();
    }

    if (this.hasAuxDests()) {
      const numAuxDests = reader.readCompactSize();

      for (let i = 0; i < numAuxDests; i++) {
        const newAuxDest = new TransferDestination()

        newAuxDest.fromBuffer(reader.readVarSlice())
        this.auxDests.push(newAuxDest)
      }
    }

    return reader.offset;
  }

  static fromJson(data: TransferDestinationJson): TransferDestination {

    const type = new BN(data.type);
    let destination = null;

    switch (type.and(FLAG_MASK.notn(FLAG_MASK.bitLength())).toString()) {
      case DEST_PKH.toString():
      case DEST_SH.toString():
      case DEST_ID.toString():
      case DEST_QUANTUM.toString():
        destination = decodeDestination(data.address);
        break;
      case DEST_ETH.toString():
        destination = decodeEthDestination(data.address);
        break;
      default:
        throw new Error("Unknown destination type: " + type + "\nNote: Only DEST_PKH, DEST_SH, DEST_ID, DEST_QUANTUM and DEST_ETH are supported for now.");
    }

    let auxDests = [];
    let fees = null;
    if (type.and(FLAG_DEST_AUX).gt(new BN(0)) && data.auxdests.length > 0) {
      auxDests = data.auxdests.map(x => TransferDestination.fromJson(x));
    }

    if (type.and(FLAG_DEST_GATEWAY).gt(new BN(0)) && data.fees) {
      fees = decimalToBn(data.fees);
    }

    return new TransferDestination({
      type: type,
      destinationBytes: destination,
      gatewayCode: data.gatewaycode,
      fees: fees,
      auxDests: auxDests
    })
  }

  toJson(): TransferDestinationJson {

    let destVal: TransferDestinationJson = {
      type: this.type.toNumber(),
      address: ''
    };

    switch (this.typeNoFlags().toString()) {
      case DEST_PKH.toString():
      case DEST_SH.toString():
      case DEST_ID.toString():
      case DEST_QUANTUM.toString():
      case DEST_ETH.toString():
        destVal.address = this.getAddressString();
        break;
      default:
        throw new Error("Unknown destination type: " + this.typeNoFlags() + "\nNote: Only DEST_PKH, DEST_SH, DEST_ID, DEST_QUANTUM and DEST_ETH are supported for now.");
    }

    if (this.hasAuxDests()) {
      destVal.auxdests = this.auxDests.map(auxDest => auxDest.toJson());
    }
    if (this.isGateway()) {
      destVal.gateway = this.gatewayID;
    }

    return destVal
  }

  isValid(): boolean
  {
      // verify aux dests
      let valid = (((this.type.and(FLAG_DEST_AUX).gt(new BN(0))) && this.auxDests.length > 0) || (!(this.type.and(FLAG_DEST_AUX).gt(new BN(0))) && !(this.auxDests.length > 0)));
      if (valid && this.auxDests && this.auxDests.length > 0)
      {
          for (let i = 0; i < this.auxDests.length; i++)
          {
              if (!this.getAuxDest(i).isValid())
              {
                  valid = false;
                  break;
              }
          }
      }
      return !!(valid &&
             !this.typeNoFlags().eq(DEST_INVALID) &&
             this.typeNoFlags().lte(LAST_VALID_TYPE_NO_FLAGS) &&
             (((this.type.and(FLAG_DEST_GATEWAY).eq(new BN(0))) && (this.gatewayID == null)) || this.gatewayID != null));
  }

  getAuxDest(destNum)
  {
    const retVal = this.auxDests[destNum];
    if (destNum >= 0 && destNum < this.auxDests.length)
    {
        if (retVal.type.and(FLAG_DEST_AUX).gt(new BN(0)) || retVal.auxDests.length > 0)
        {
            retVal.type = DEST_INVALID;
        }
        // no gateways or flags, only simple destinations work
        switch (retVal.type.toString())
        {
            case DEST_ID.toString():
            case DEST_PK.toString():
            case DEST_PKH.toString():
            case DEST_ETH.toString():
            case DEST_SH.toString():
                break;
            default:
                retVal.type = DEST_INVALID;
        }
    }
    return retVal;
}
}
