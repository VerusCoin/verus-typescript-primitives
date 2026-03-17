import { CurrencyValueMap } from './CurrencyValueMap';
import varint from '../utils/varint'
import bufferutils from '../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { TokenOutput } from './TokenOutput';
import { DEST_PKH, TransferDestination } from './TransferDestination';
import { fromBase58Check, toBase58Check } from '../utils/address';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { SerializableEntity } from '../utils/types/SerializableEntity';
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
  destinationBytes: fromBase58Check("RTqQe58LSj2yr5CrwYFwcsAQ1edQwmrkUU").hash
})

export class ReserveTransfer extends TokenOutput implements SerializableEntity {
  flags: BigNumber;
  feeCurrencyID: string;
  feeAmount: BigNumber;
  transferDestination: TransferDestination;
  destCurrencyID: string;
  secondReserveID: string;
  destSystemID: string;

  constructor (data?: {
    values?: CurrencyValueMap,
    version?: BigNumber,
    flags?: BigNumber,
    feeCurrencyID?: string,
    feeAmount?: BigNumber,
    transferDestination?: TransferDestination,
    destCurrencyID?: string,
    secondReserveID?: string,
    destSystemID?: string
  }) {
    super(data)

    if (data != null) {
      const d = data as any;
      const snakeDeprecated = ['fee_currency_id', 'fee_amount', 'transfer_destination', 'dest_currency_id', 'second_reserve_id', 'dest_system_id'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
      if (snakeDeprecated.length > 0) {
        const map: Record<string, string> = {
          fee_currency_id: 'feeCurrencyID',
          fee_amount: 'feeAmount',
          transfer_destination: 'transferDestination',
          dest_currency_id: 'destCurrencyID',
          second_reserve_id: 'secondReserveID',
          dest_system_id: 'destSystemID',
        };
        throw new Error(`ReserveTransfer: snake_case property names are no longer supported. Rename: ${snakeDeprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
    }

    this.flags = RESERVE_TRANSFER_INVALID;
    this.feeCurrencyID = null;
    this.feeAmount = new BN(0, 10);
    this.transferDestination = new TransferDestination();
    this.destCurrencyID = null;
    this.secondReserveID = null;
    this.destCurrencyID = null;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.feeCurrencyID != null) this.feeCurrencyID = data.feeCurrencyID
      if (data.feeAmount != null) this.feeAmount = data.feeAmount
      if (data.transferDestination != null) this.transferDestination = data.transferDestination
      if (data.destCurrencyID != null) this.destCurrencyID = data.destCurrencyID
      if (data.secondReserveID != null) this.secondReserveID = data.secondReserveID
      if (data.destSystemID != null) this.destSystemID = data.destSystemID
    }
  }

  /** @deprecated Use feeCurrencyID instead */
  get fee_currency_id(): string { return this.feeCurrencyID; }
  /** @deprecated Use feeAmount instead */
  get fee_amount(): BigNumber { return this.feeAmount; }
  /** @deprecated Use transferDestination instead */
  get transfer_destination(): TransferDestination { return this.transferDestination; }
  /** @deprecated Use destCurrencyID instead */
  get dest_currency_id(): string { return this.destCurrencyID; }
  /** @deprecated Use secondReserveID instead */
  get second_reserve_id(): string { return this.secondReserveID; }
  /** @deprecated Use destSystemID instead */
  get dest_system_id(): string { return this.destSystemID; }

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
    length += fromBase58Check(this.feeCurrencyID).hash.length;
    length += varint.encodingLength(this.feeAmount);
    length += this.transferDestination.getByteLength();
    length += fromBase58Check(this.destCurrencyID).hash.length;

    if (this.isReserveToReserve()) {
      length += fromBase58Check(this.secondReserveID).hash.length;
    }

    if (this.isCrossSystem()) {
      length += fromBase58Check(this.destSystemID).hash.length;
    }

    return length;
  }

  toBuffer () {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()))
    const ownOutput = new TokenOutput({
      values: this.reserveValues,
      version: this.version
    })

    writer.writeSlice(ownOutput.toBuffer())
    writer.writeVarInt(this.flags)
    writer.writeSlice(fromBase58Check(this.feeCurrencyID).hash)
    writer.writeVarInt(this.feeAmount)
    writer.writeSlice(this.transferDestination.toBuffer())
    writer.writeSlice(fromBase58Check(this.destCurrencyID).hash)

    if (this.isReserveToReserve()) {
      writer.writeSlice(fromBase58Check(this.secondReserveID).hash)
    }

    if (this.isCrossSystem()) {
      writer.writeSlice(fromBase58Check(this.destSystemID).hash)
    }

    return writer.buffer;
  }

  fromBuffer (buffer: Buffer, offset: number = 0) {
    const _offset = super.fromBuffer(buffer, offset)
    const reader = new BufferReader(buffer, _offset)

    this.flags = reader.readVarInt()
    this.feeCurrencyID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    this.feeAmount = reader.readVarInt()

    this.transferDestination = new TransferDestination()
    reader.offset = this.transferDestination.fromBuffer(buffer, reader.offset)

    this.destCurrencyID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)

    if (this.isReserveToReserve()) {
      this.secondReserveID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    }

    if (this.isCrossSystem()) {
      this.destSystemID = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
    }

    return reader.offset;
  }
}
