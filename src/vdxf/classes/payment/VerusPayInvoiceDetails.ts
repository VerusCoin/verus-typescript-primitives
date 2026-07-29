import varint from '../../../utils/varint'
import varuint from '../../../utils/varuint'
import bufferutils from '../../../utils/bufferutils'
import { BN } from 'bn.js';
import { BigNumber } from '../../../utils/types/BigNumber';
import { TransferDestination, TransferDestinationJson } from '../../../pbaas/TransferDestination';
import { fromBase58Check, toBase58Check } from '../../../utils/address';
import { I_ADDR_VERSION, HASH160_BYTE_LENGTH } from '../../../constants/vdxf';
import createHash = require('create-hash');
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { VERUSPAY_VERSION_4, VERUSPAY_VERSION_CURRENT } from '../../../constants/vdxf/veruspay';
import { SaplingPaymentAddress } from '../../../pbaas';
import { CompactAddressObject, CompactAddressObjectJson, CompactXAddressObject } from '../CompactAddressObject';
const { BufferReader, BufferWriter } = bufferutils;

// Added in V3
export const VERUSPAY_INVALID = new BN(0, 10)
export const VERUSPAY_VALID = new BN(1, 10)
export const VERUSPAY_ACCEPTS_CONVERSION = new BN(2, 10)
export const VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS = new BN(4, 10)
export const VERUSPAY_EXPIRES = new BN(8, 10)
export const VERUSPAY_ACCEPTS_ANY_DESTINATION = new BN(16, 10)
export const VERUSPAY_ACCEPTS_ANY_AMOUNT = new BN(32, 10)
export const VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN = new BN(64, 10)
export const VERUSPAY_IS_TESTNET = new BN(128, 10)

// Added in V4
export const VERUSPAY_IS_PRECONVERT = new BN(256, 10)
export const VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS = new BN(512, 10)
export const VERUSPAY_IS_TAGGED = new BN(1024, 10)
export const VERUSPAY_IS_BURN_CHANGE_PRICE = new BN(2048, 10)

export type VerusPayInvoiceDetailsJson = {
  flags?: string,
  amount?: string,
  destination?: TransferDestinationJson | string,
  requestedcurrencyid: string,
  expiryheight?: string,
  maxestimatedslippage?: string,
  acceptedsystems?: Array<string>,
  tag?: CompactAddressObjectJson
}

export class VerusPayInvoiceDetails implements SerializableEntity {
  verusPayVersion: BigNumber;

  flags: BigNumber;
  amount: BigNumber;
  destination: TransferDestination | SaplingPaymentAddress;
  requestedcurrencyid: string;
  expiryheight: BigNumber;
  maxestimatedslippage: BigNumber;
  acceptedsystems: Array<string>;
  tag: CompactXAddressObject;
  
  constructor (data?: {
    flags?: BigNumber,
    amount?: BigNumber,
    destination?: TransferDestination | SaplingPaymentAddress,
    requestedcurrencyid: string,
    expiryheight?: BigNumber,
    maxestimatedslippage?: BigNumber,
    acceptedsystems?: Array<string>,
    tag?: CompactXAddressObject
  }, verusPayVersion: BigNumber = VERUSPAY_VERSION_CURRENT) {
    this.flags = VERUSPAY_VALID;
    this.amount = null;
    this.destination = null;
    this.requestedcurrencyid = null;
    this.expiryheight = null;
    this.maxestimatedslippage = null;
    this.acceptedsystems = null;
    this.verusPayVersion = verusPayVersion;
    this.tag = null;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.amount != null) this.amount = data.amount
      if (data.destination != null) this.destination = data.destination
      if (data.requestedcurrencyid != null) this.requestedcurrencyid = data.requestedcurrencyid
      if (data.expiryheight != null) this.expiryheight = data.expiryheight
      if (data.maxestimatedslippage != null) this.maxestimatedslippage = data.maxestimatedslippage
      if (data.acceptedsystems != null) this.acceptedsystems = data.acceptedsystems
      if (data.tag != null) this.tag = data.tag
    }
  }

  setFlags(flags: {
    acceptsConversion?: boolean,
    acceptsNonVerusSystems?: boolean,
    expires?: boolean,
    acceptsAnyAmount?: boolean,
    acceptsAnyDestination?: boolean,
    excludesVerusBlockchain?: boolean,
    isTestnet?: boolean,
    isPreconvert?: boolean,
    destinationIsSaplingPaymentAddress?: boolean,
    isTagged?: boolean,
    isBurnChangePrice?: boolean
  }) {
    if (flags.acceptsConversion) this.flags = this.flags.or(VERUSPAY_ACCEPTS_CONVERSION);
    if (flags.acceptsNonVerusSystems) this.flags = this.flags.or(VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS);
    if (flags.expires) this.flags = this.flags.or(VERUSPAY_EXPIRES);
    if (flags.acceptsAnyAmount) this.flags = this.flags.or(VERUSPAY_ACCEPTS_ANY_AMOUNT);
    if (flags.acceptsAnyDestination) this.flags = this.flags.or(VERUSPAY_ACCEPTS_ANY_DESTINATION);
    if (flags.excludesVerusBlockchain) this.flags = this.flags.or(VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN);
    if (flags.isTestnet) this.flags = this.flags.or(VERUSPAY_IS_TESTNET);

    if (this.isGTEV4()) {
      if (flags.isPreconvert) this.flags = this.flags.or(VERUSPAY_IS_PRECONVERT);
      if (flags.destinationIsSaplingPaymentAddress) this.flags = this.flags.or(VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS);
      if (flags.isTagged) this.flags = this.flags.or(VERUSPAY_IS_TAGGED);
      if (flags.isBurnChangePrice) this.flags = this.flags.or(VERUSPAY_IS_BURN_CHANGE_PRICE);
    }
  }

  getFlagsJson(): { [key: string]: boolean } {
    return {
      acceptsConversion: this.acceptsConversion(),
      acceptsNonVerusSystems: this.acceptsNonVerusSystems(),
      expires: this.expires(),
      acceptsAnyAmount: this.acceptsAnyAmount(),
      acceptsAnyDestination: this.acceptsAnyDestination(),
      excludesVerusBlockchain: this.excludesVerusBlockchain(),
      isTestnet: this.isTestnet(),
      isPreconvert: this.isPreconvert(),
      destinationIsSaplingPaymentAddress: this.destinationIsSaplingPaymentAddress(),
      isTagged: this.isTagged(),
      isBurnChangePrice: this.isBurnChangePrice()
    }
  }

  toSha256() {
    return createHash("sha256").update(this.toBuffer()).digest();
  }

  acceptsConversion() {
    return !!(this.flags.and(VERUSPAY_ACCEPTS_CONVERSION).toNumber())
  }

  acceptsNonVerusSystems() {
    return !!(this.flags.and(VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS).toNumber())
  }

  acceptsAnyAmount() {
    return !!(this.flags.and(VERUSPAY_ACCEPTS_ANY_AMOUNT).toNumber())
  }

  acceptsAnyDestination() {
    return !!(this.flags.and(VERUSPAY_ACCEPTS_ANY_DESTINATION).toNumber())
  }

  expires() {
    return !!(this.flags.and(VERUSPAY_EXPIRES).toNumber())
  }

  excludesVerusBlockchain() {
    return !!(this.flags.and(VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN).toNumber())
  }

  isTestnet() {
    return !!(this.flags.and(VERUSPAY_IS_TESTNET).toNumber())
  }

  isPreconvert() {
    return this.isGTEV4() && !!(this.flags.and(VERUSPAY_IS_PRECONVERT).toNumber())
  }

  destinationIsSaplingPaymentAddress() {
    return this.isGTEV4() && !!(this.flags.and(VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS).toNumber())
  }

  isTagged() {
    return this.isGTEV4() && !!(this.flags.and(VERUSPAY_IS_TAGGED).toNumber())
  }

  isBurnChangePrice() {
    return this.isGTEV4() && !!(this.flags.and(VERUSPAY_IS_BURN_CHANGE_PRICE).toNumber())
  }

  isValid () {
    return (
      !!(this.flags.and(VERUSPAY_VALID).toNumber())
    )
  }

  isGTEV4() {
    return (this.verusPayVersion.gte(VERUSPAY_VERSION_4))
  }

  // Functions to deal with change in v4
  private getVarUIntEncodingLength(uint: BigNumber): number {
    return this.isGTEV4() ? varuint.encodingLength(uint.toNumber()) : varint.encodingLength(uint);
  }

  private writeVarUInt(writer = new BufferWriter(Buffer.alloc(0)), uint: BigNumber): void {
    if (this.isGTEV4()) {
      return writer.writeCompactSize(uint.toNumber());
    } else {
      return writer.writeVarInt(uint);
    }
  }

  private readVarUInt(reader = new BufferReader(Buffer.alloc(0))): BigNumber {
    if (this.isGTEV4()) {
      return new BN(reader.readCompactSize());
    } else {
      return reader.readVarInt();
    }
  }

  getByteLength(): number {
    let length = 0;

    length += this.getVarUIntEncodingLength(this.flags);

    if (!this.acceptsAnyAmount()) {
      length += this.getVarUIntEncodingLength(this.amount);
    }
    
    if (!this.acceptsAnyDestination()) {
      length += this.destination.getByteLength();
    }
    
    length += fromBase58Check(this.requestedcurrencyid).hash.length;

    if (this.expires()) {
      length += this.getVarUIntEncodingLength(this.expiryheight);
    }
    
    if (this.acceptsConversion()) {
      length += this.getVarUIntEncodingLength(this.maxestimatedslippage);
    }

    if (this.acceptsNonVerusSystems()) {
      length += varuint.encodingLength(this.acceptedsystems.length);

      this.acceptedsystems.forEach(() => {
        length += HASH160_BYTE_LENGTH
      })
    }

    if (this.isTagged()) {
      length += this.tag.getByteLength();
    }

    return length;
  }

  toBuffer () {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
    
    this.writeVarUInt(writer, this.flags);

    if (!this.acceptsAnyAmount()) this.writeVarUInt(writer, this.amount);
    if (!this.acceptsAnyDestination()) writer.writeSlice(this.destination.toBuffer());

    writer.writeSlice(fromBase58Check(this.requestedcurrencyid).hash);

    if (this.expires()) {
      this.writeVarUInt(writer, this.expiryheight);
    }

    if (this.acceptsConversion()) {
      this.writeVarUInt(writer, this.maxestimatedslippage);
    }

    if (this.acceptsNonVerusSystems()) {
      writer.writeArray(this.acceptedsystems.map(x => fromBase58Check(x).hash));
    }

    if (this.isTagged()) {
      writer.writeSlice(this.tag.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer (buffer: Buffer, offset: number = 0, verusPayVersion: BigNumber = VERUSPAY_VERSION_CURRENT, rootSystemName: string = 'VRSC') {
    const reader = new BufferReader(buffer, offset);

    this.verusPayVersion = verusPayVersion;

    this.flags = this.readVarUInt(reader);
    
    if (!this.acceptsAnyAmount()) this.amount = this.readVarUInt(reader);

    if (!this.acceptsAnyDestination()) {
      if (this.destinationIsSaplingPaymentAddress()) {
        this.destination = new SaplingPaymentAddress();
      } else this.destination = new TransferDestination();
      
      reader.offset = this.destination.fromBuffer(reader.buffer, reader.offset);
    }
    
    this.requestedcurrencyid = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

    if (this.expires()) {
      this.expiryheight = this.readVarUInt(reader);
    }

    if (this.acceptsConversion()) {
      this.maxestimatedslippage = this.readVarUInt(reader);
    }

    if (this.acceptsNonVerusSystems()) {
      const acceptedSystemsBuffers = reader.readArray(20);

      this.acceptedsystems = acceptedSystemsBuffers.map(x => toBase58Check(x, I_ADDR_VERSION));
    }

    if (this.isTagged()) {
      this.tag = new CompactXAddressObject({ type: CompactAddressObject.TYPE_X_ADDRESS, address: '', rootSystemName });

      reader.offset = this.tag.fromBuffer(reader.buffer, reader.offset);
    }

    return reader.offset;
  }

  static fromJson(data: VerusPayInvoiceDetailsJson, verusPayVersion: BigNumber = VERUSPAY_VERSION_CURRENT): VerusPayInvoiceDetails {
    return new VerusPayInvoiceDetails({
      flags: new BN(data.flags),
      amount: data.amount != null ? new BN(data.amount) : undefined,
      destination: data.destination != null ? typeof data.destination === 'string' ? SaplingPaymentAddress.fromAddressString(data.destination) : TransferDestination.fromJson(data.destination) : undefined,
      requestedcurrencyid: data.requestedcurrencyid,
      expiryheight: data.expiryheight != null ? new BN(data.expiryheight) : undefined,
      maxestimatedslippage: data.maxestimatedslippage != null ? new BN(data.maxestimatedslippage) : undefined,
      acceptedsystems: data.acceptedsystems,
      tag: data.tag ? CompactAddressObject.fromJson(data.tag) as CompactXAddressObject : undefined
    }, verusPayVersion)
  }

  toJson(): VerusPayInvoiceDetailsJson {
    return {
      flags: this.flags.toString(),
      amount: this.acceptsAnyAmount() ? undefined : this.amount.toString(),
      destination: this.acceptsAnyDestination() ? undefined : this.destinationIsSaplingPaymentAddress() ? (this.destination as SaplingPaymentAddress).toAddressString() : (this.destination as TransferDestination).toJson(),
      requestedcurrencyid: this.requestedcurrencyid,
      expiryheight: this.expires() ? this.expiryheight.toString() : undefined,
      maxestimatedslippage: this.acceptsConversion() ? this.maxestimatedslippage.toString() : undefined,
      acceptedsystems: this.acceptsNonVerusSystems() ? this.acceptedsystems : undefined,
      tag: this.isTagged() ? this.tag.toJson() : undefined
    }
  }
}
