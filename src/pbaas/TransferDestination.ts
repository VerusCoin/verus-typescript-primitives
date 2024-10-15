import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import varuint from '../utils/varuint';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
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

const UINT160_BYTE_SIZE = 20;

export type TransferDestinationJson = {
  type: string;
  destination_bytes: string;
  gateway_id?: string;
  gateway_code?: string;
  fees: string;
  aux_dests: Array<TransferDestinationJson>
}

export class TransferDestination implements SerializableEntity {
  type: BigNumber;
  destination_bytes: Buffer;
  gateway_id: string;
  gateway_code: string;
  fees: BigNumber;
  aux_dests: Array<TransferDestination>;

  constructor (data?: { type?: BigNumber, destination_bytes?: Buffer, gateway_id?: string, gateway_code?: string, fees?: BigNumber, aux_dests?: Array<TransferDestination> }) {
    this.type = DEST_INVALID;
    this.destination_bytes = Buffer.alloc(0);
    this.gateway_id = null;
    this.gateway_code = null;
    this.fees = new BN(0, 10);
    this.aux_dests = [];

    if (data != null) {
      if (data.type != null) this.type = data.type
      if (data.destination_bytes != null) this.destination_bytes = data.destination_bytes
      if (data.gateway_id != null) this.gateway_id = data.gateway_id
      if (data.gateway_code != null) this.gateway_code = data.gateway_code
      if (data.fees != null) this.fees = data.fees
      if (data.aux_dests != null) this.aux_dests = data.aux_dests
    }
  }

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
      return toBase58Check(this.destination_bytes, R_ADDR_VERSION);
    } else if (this.isIAddr()) {
      return toBase58Check(this.destination_bytes, I_ADDR_VERSION);
    } else if (this.isETHAccount()) {
      return "0x" + this.destination_bytes.toString('hex');
    } else {
      throw new Error("Cannot get address for unsupported transfer destination type.");
    }
  }

  getByteLength() {
    let length = 0;

    length += 1; // type
    length += varuint.encodingLength(this.destination_bytes.length) // destination_bytes compact size
    length += this.destination_bytes.length; // destination_bytes

    if (this.isGateway()) {
      length += fromBase58Check(this.gateway_id).hash.length; // gateway_id
      if (this.gateway_code) {
        length += fromBase58Check(this.gateway_code).hash.length; // gateway_code
      } else {
        length += UINT160_BYTE_SIZE
      }
      length += 8 // fees int64
    }

    if (this.hasAuxDests()) {
      length += varuint.encodingLength(this.aux_dests.length) // aux dests compact size

      for (const dest of this.aux_dests) {
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
    writer.writeVarSlice(this.destination_bytes);

    if (this.isGateway()) {
      writer.writeSlice(fromBase58Check(this.gateway_id).hash);
      if (this.gateway_code) {
        writer.writeSlice(fromBase58Check(this.gateway_code).hash);
      } else {
        writer.writeSlice(Buffer.alloc(UINT160_BYTE_SIZE));
      }
      writer.writeInt64(this.fees);
    }

    if (this.hasAuxDests()) {
      writer.writeCompactSize(this.aux_dests.length);
      this.aux_dests.forEach((aux_dest) => writer.writeVarSlice(aux_dest.toBuffer()));
    }

    return writer.buffer
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.type = new BN(reader.readUInt8(), 10);
    this.destination_bytes = reader.readVarSlice();

    if (this.isGateway()) {
      this.gateway_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      this.gateway_code = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      this.fees = reader.readInt64();
    }

    if (this.hasAuxDests()) {
      const numAuxDests = reader.readCompactSize();

      for (let i = 0; i < numAuxDests; i++) {
        const newAuxDest = new TransferDestination()

        newAuxDest.fromBuffer(reader.readVarSlice())
        this.aux_dests.push(newAuxDest)
      }
    }

    return reader.offset;
  }

  static fromJson(data: TransferDestinationJson): TransferDestination {
    return new TransferDestination({
      type: new BN(data.type),
      destination_bytes: Buffer.from(data.destination_bytes, 'hex'),
      gateway_id: data.gateway_id,
      gateway_code: data.gateway_code,
      fees: new BN(data.fees),
      aux_dests: data.aux_dests.map(x => TransferDestination.fromJson(x))
    })
  }

  toJson(): TransferDestinationJson {
    return {
      type: this.type.toString(),
      destination_bytes: this.destination_bytes.toString('hex'),
      gateway_id: this.gateway_id,
      gateway_code: this.gateway_code,
      fees: this.fees.toString(),
      aux_dests: this.aux_dests.map(x => x.toJson())
    }
  }

  isValid(): boolean
  {
      // verify aux dests
      let valid = (((this.type.and(FLAG_DEST_AUX).gt(new BN(0))) && this.aux_dests.length > 0) || (!(this.type.and(FLAG_DEST_AUX).gt(new BN(0))) && !(this.aux_dests.length > 0)));
      if (valid && this.aux_dests && this.aux_dests.length > 0)
      {
          for (let i = 0; i < this.aux_dests.length; i++)
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
             (((this.type.and(FLAG_DEST_GATEWAY).eq(new BN(0))) && (this.gateway_id == null)) || this.gateway_id != null));
  }

  getAuxDest(destNum)
  {
    const retVal = this.aux_dests[destNum];
    if (destNum >= 0 && destNum < this.aux_dests.length)
    {
        if (retVal.type.and(FLAG_DEST_AUX).gt(new BN(0)) || retVal.aux_dests.length > 0)
        {
            retVal.type = DEST_INVALID;
        }
        // no gateways or flags, only simple destinations work
        switch (retVal.type)
        {
            case DEST_ID:
            case DEST_PK:
            case DEST_PKH:
            case DEST_ETH:
            case DEST_SH:
                break;
            default:
                retVal.type = DEST_INVALID;
        }
    }
    return retVal;
}
}
