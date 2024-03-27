import { CurrencyValueMap } from './CurrencyValueMap';
import varint from '../utils/varint'
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { TokenOutput } from './TokenOutput';
import { DEST_PKH, TransferDestination } from './TransferDestination';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { I_ADDR_VERSION } from '../constants/vdxf';
const { BufferReader, BufferWriter } = bufferutils

export const RESERVE_TRANSFER_INVALID = new BN(0, 10)
export const RESERVE_TRANSFER_VALID = new BN(1, 10)
export const RESERVE_TRANSFER_CONVERT = new BN(2, 10)
export const RESERVE_TRANSFER_PRECONVERT = new BN(4, 10)
export const RESERVE_TRANSFER_FEE_OUTPUT = new BN(8, 10)                     // one per import, amount must match total percentage of fees for exporter, no pre-convert allowed
export const RESERVE_TRANSFER_DOUBLE_SEND = new BN("10", 16)                 // this is used along with increasing the fee to send one transaction on two hops
export const RESERVE_TRANSFER_MINT_CURRENCY = new BN("20", 16)               // set when this output is being minted on import
export const RESERVE_TRANSFER_CROSS_SYSTEM = new BN("40", 16)                // if this is set, there is a systemID serialized and deserialized as well for destination
export const RESERVE_TRANSFER_BURN_CHANGE_PRICE = new BN("80", 16)           // this output is being burned on import and will change the price
export const RESERVE_TRANSFER_BURN_CHANGE_WEIGHT = new BN("100", 16)         // this output is being burned on import and will change the reserve ratio
export const RESERVE_TRANSFER_IMPORT_TO_SOURCE = new BN("200", 16)           // set when the source currency, not destination is the import currency
export const RESERVE_TRANSFER_RESERVE_TO_RESERVE = new BN("400", 16)         // for arbitrage or transient conversion, 2 stage solving (2nd from new fractional to reserves)
export const RESERVE_TRANSFER_REFUND = new BN("800", 16)                     // this transfer should be refunded, individual property when conversions exceed limits
export const RESERVE_TRANSFER_IDENTITY_EXPORT = new BN("1000", 16)           // this exports a full identity when the next cross-chain leg is processed
export const RESERVE_TRANSFER_CURRENCY_EXPORT = new BN("2000", 16)           // this exports a currency definition
export const RESERVE_TRANSFER_ARBITRAGE_ONLY = new BN("4000", 16)            // in PBaaS V1, one additional reserve transfer from the local system may be added by the importer

export const RESERVE_TRANSFER_DESTINATION = new TransferDestination({
  type: DEST_PKH,
  destination_bytes: fromBase58Check("RTqQe58LSj2yr5CrwYFwcsAQ1edQwmrkUU").hash
})

export class ReserveTransfer extends TokenOutput {
  flags: BigNumber;
  fee_currency_id: string;
  fee_amount: BigNumber;
  transfer_destination: TransferDestination;
  dest_currency_id: string;
  second_reserve_id: string;
  dest_system_id: string;
  
  constructor (data?: { 
    values?: CurrencyValueMap, 
    version?: BigNumber, 
    flags?: BigNumber, 
    fee_currency_id?: string, 
    fee_amount?: BigNumber, 
    transfer_destination?: TransferDestination, 
    dest_currency_id?: string, 
    second_reserve_id?: string, 
    dest_system_id?: string 
  }) {
    super(data)

    this.flags = RESERVE_TRANSFER_INVALID;
    this.fee_currency_id = null;
    this.fee_amount = new BN(0, 10);
    this.transfer_destination = new TransferDestination();
    this.dest_currency_id = null;
    this.second_reserve_id = null;
    this.dest_currency_id = null;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.fee_currency_id != null) this.fee_currency_id = data.fee_currency_id
      if (data.fee_amount != null) this.fee_amount = data.fee_amount
      if (data.transfer_destination != null) this.transfer_destination = data.transfer_destination
      if (data.dest_currency_id != null) this.dest_currency_id = data.dest_currency_id
      if (data.second_reserve_id != null) this.second_reserve_id = data.second_reserve_id
      if (data.dest_system_id != null) this.dest_system_id = data.dest_system_id
    }
  }

  isReserveToReserve() {
    return !!(this.flags.and(RESERVE_TRANSFER_RESERVE_TO_RESERVE).toNumber())
  }

  isCrossSystem() {
    return !!(this.flags.and(RESERVE_TRANSFER_CROSS_SYSTEM).toNumber())
  }

  isConversion() {
    return !!(this.flags.and(RESERVE_TRANSFER_CONVERT).toNumber())
  }

  isPreConversion() {
    return !!(this.flags.and(RESERVE_TRANSFER_PRECONVERT).toNumber())
  }

  isFeeOutput() {
    return !!(this.flags.and(RESERVE_TRANSFER_FEE_OUTPUT).toNumber())
  }

  isDoubleSend() {
    return !!(this.flags.and(RESERVE_TRANSFER_DOUBLE_SEND).toNumber())
  }

  isMint() {
    return !!(this.flags.and(RESERVE_TRANSFER_MINT_CURRENCY).toNumber())
  }

  isBurnChangeWeight() {
    return !!(this.flags.and(RESERVE_TRANSFER_BURN_CHANGE_WEIGHT).toNumber())
  }

  isBurnChangePrice() {
    return !!(this.flags.and(RESERVE_TRANSFER_BURN_CHANGE_PRICE).toNumber())
  }

  isImportToSource() {
    return !!(this.flags.and(RESERVE_TRANSFER_IMPORT_TO_SOURCE).toNumber())
  }

  isRefund() {
    return !!(this.flags.and(RESERVE_TRANSFER_REFUND).toNumber())
  }

  isIdentityExport() {
    return !!(this.flags.and(RESERVE_TRANSFER_IDENTITY_EXPORT).toNumber())
  }

  isCurrencyExport() {
    return !!(this.flags.and(RESERVE_TRANSFER_CURRENCY_EXPORT).toNumber())
  }

  isArbitrageOnly() {
    return !!(this.flags.and(RESERVE_TRANSFER_ARBITRAGE_ONLY).toNumber())
  }

  getByteLength(): number {
    let length = super.getByteLength();

    length += varint.encodingLength(this.flags);
    length += fromBase58Check(this.fee_currency_id).hash.length;
    length += varint.encodingLength(this.fee_amount);
    length += this.transfer_destination.getByteLength();
    length += fromBase58Check(this.dest_currency_id).hash.length;

    if (this.isReserveToReserve()) {
      length += fromBase58Check(this.second_reserve_id).hash.length;
    }

    if (this.isCrossSystem()) {
      length += fromBase58Check(this.dest_system_id).hash.length;
    }

    return length;
  }

  toBuffer () {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()))
    const ownOutput = new TokenOutput({
      values: this.reserve_values,
      version: this.version
    })

    writer.writeSlice(ownOutput.toBuffer())
    writer.writeVarInt(this.flags)
    writer.writeSlice(fromBase58Check(this.fee_currency_id).hash)
    writer.writeVarInt(this.fee_amount)
    writer.writeSlice(this.transfer_destination.toBuffer())
    writer.writeSlice(fromBase58Check(this.dest_currency_id).hash)

    if (this.isReserveToReserve()) {
      writer.writeSlice(fromBase58Check(this.second_reserve_id).hash)
    }

    if (this.isCrossSystem()) {
      writer.writeSlice(fromBase58Check(this.dest_system_id).hash)
    }

    return writer.buffer;
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const _offset = super.fromBuffer(buffer, offset)
    const reader = new BufferReader(buffer, _offset)

    this.flags = reader.readVarInt()
    this.fee_currency_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    this.fee_amount = reader.readVarInt()

    this.transfer_destination = new TransferDestination()
    reader.offset = this.transfer_destination.fromBuffer(buffer, reader.offset)

    this.dest_currency_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)

    if (this.isReserveToReserve()) {
      this.second_reserve_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    }

    if (this.isCrossSystem()) {
      this.dest_system_id = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    }

    return reader.offset;
  }
}