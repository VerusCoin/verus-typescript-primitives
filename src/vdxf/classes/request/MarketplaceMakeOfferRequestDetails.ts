import { BN } from 'bn.js';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import varuint from '../../../utils/varuint';
import varint from '../../../utils/varint';
import bufferutils from '../../../utils/bufferutils';
import createHash = require('create-hash');
import { BigNumber } from '../../../utils/types/BigNumber';
import { TransferDestination, TransferDestinationJson } from '../../../pbaas/TransferDestination';
import { fromBase58Check, toBase58Check } from '../../../utils/address';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../../../constants/vdxf';

const { BufferReader, BufferWriter } = bufferutils;

export type MarketplaceMakeOfferParamsJson = {
  offeredidentityid: string;
  payoutdestination: TransferDestinationJson;
  forcurrencyid: string;
  foramount: string;
  expiryheight: string;
}

export type MarketplaceMakeOfferRequestDetailsJson = {
  flags?: string;
  rawTransactionHex?: string;
  offerDescription?: string;
  offerParams?: MarketplaceMakeOfferParamsJson;
}

/**
 * Parameters a wallet needs to construct a Verus marketplace sell offer (makeoffer)
 * (partial makeoffer transaction) entirely client-side:
 *   vin[0]  = the offered identity's current definition UTXO (looked up on-chain
 *             by the wallet from offeredIdentityId via getidentity)
 *   vout[0] = forAmountSats of forCurrencyId paid to payoutDestination
 * signed SIGHASH_SINGLE | SIGHASH_ANYONECANPAY over the identity input.
 */
export class MarketplaceMakeOfferParams implements SerializableEntity {
  offeredIdentityId: string;
  payoutDestination: TransferDestination;
  forCurrencyId: string;
  forAmountSats: BigNumber;
  expiryHeight: BigNumber;

  constructor(data?: {
    offeredIdentityId?: string,
    payoutDestination?: TransferDestination,
    forCurrencyId?: string,
    forAmountSats?: BigNumber,
    expiryHeight?: BigNumber
  }) {
    this.offeredIdentityId = data?.offeredIdentityId;
    this.payoutDestination = data?.payoutDestination;
    this.forCurrencyId = data?.forCurrencyId;
    this.forAmountSats = data?.forAmountSats ? data.forAmountSats : new BN(0, 10);
    this.expiryHeight = data?.expiryHeight ? data.expiryHeight : new BN(0, 10);
  }

  getByteLength(): number {
    let length = 0;

    length += HASH160_BYTE_LENGTH; // offeredIdentityId
    length += this.payoutDestination.getByteLength();
    length += HASH160_BYTE_LENGTH; // forCurrencyId
    length += varint.encodingLength(this.forAmountSats);
    length += varint.encodingLength(this.expiryHeight);

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeSlice(fromBase58Check(this.offeredIdentityId).hash);
    writer.writeSlice(this.payoutDestination.toBuffer());
    writer.writeSlice(fromBase58Check(this.forCurrencyId).hash);
    writer.writeVarInt(this.forAmountSats);
    writer.writeVarInt(this.expiryHeight);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.offeredIdentityId = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);

    this.payoutDestination = new TransferDestination();
    reader.offset = this.payoutDestination.fromBuffer(reader.buffer, reader.offset);

    this.forCurrencyId = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
    this.forAmountSats = reader.readVarInt();
    this.expiryHeight = reader.readVarInt();

    return reader.offset;
  }

  isValid(): boolean {
    return (
      typeof this.offeredIdentityId === 'string' &&
      this.offeredIdentityId.length > 0 &&
      this.payoutDestination != null &&
      this.payoutDestination.isValid() &&
      typeof this.forCurrencyId === 'string' &&
      this.forCurrencyId.length > 0 &&
      this.forAmountSats.gt(new BN(0, 10)) &&
      this.expiryHeight.gt(new BN(0, 10))
    );
  }

  toJson(): MarketplaceMakeOfferParamsJson {
    return {
      offeredidentityid: this.offeredIdentityId,
      payoutdestination: this.payoutDestination.toJson(),
      forcurrencyid: this.forCurrencyId,
      foramount: this.forAmountSats.toString(10),
      expiryheight: this.expiryHeight.toString(10)
    }
  }

  static fromJson(json: MarketplaceMakeOfferParamsJson): MarketplaceMakeOfferParams {
    return new MarketplaceMakeOfferParams({
      offeredIdentityId: json.offeredidentityid,
      payoutDestination: TransferDestination.fromJson(json.payoutdestination),
      forCurrencyId: json.forcurrencyid,
      forAmountSats: new BN(json.foramount, 10),
      expiryHeight: new BN(json.expiryheight, 10)
    })
  }
}

export class MarketplaceMakeOfferRequestDetails implements SerializableEntity {
  flags?: BigNumber;
  rawTransactionHex?: string;
  offerDescription?: string;
  offerParams?: MarketplaceMakeOfferParams;

  static MARKETPLACE_MAKEOFFER_REQUEST_VALID = new BN(0, 10);
  static MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_RAW_TX = new BN(1, 10);
  static MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_DESC = new BN(2, 10);
  static MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_OFFER_PARAMS = new BN(4, 10);

  constructor (data?: {
    flags?: BigNumber,
    rawTransactionHex?: string,
    offerDescription?: string,
    offerParams?: MarketplaceMakeOfferParams
  }) {
    this.flags = data && data.flags ? data.flags : new BN("0", 10);

    if (data?.rawTransactionHex) {
      if (!this.containsRawTx()) this.toggleContainsRawTx();
      this.rawTransactionHex = data.rawTransactionHex;
    }

    if (data?.offerDescription) {
      if (!this.containsDesc()) this.toggleContainsDesc();
      this.offerDescription = data.offerDescription;
    }

    if (data?.offerParams) {
      if (!this.containsOfferParams()) this.toggleContainsOfferParams();
      this.offerParams = data.offerParams;
    }
  }

  containsRawTx() {
    return !!(this.flags.and(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_RAW_TX).toNumber());
  }

  containsDesc() {
    return !!(this.flags.and(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_DESC).toNumber());
  }

  containsOfferParams() {
    return !!(this.flags.and(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_OFFER_PARAMS).toNumber());
  }

  toggleContainsRawTx() {
    this.flags = this.flags.xor(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_RAW_TX);
  }

  toggleContainsDesc() {
    this.flags = this.flags.xor(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_DESC);
  }

  toggleContainsOfferParams() {
    this.flags = this.flags.xor(MarketplaceMakeOfferRequestDetails.MARKETPLACE_MAKEOFFER_REQUEST_CONTAINS_OFFER_PARAMS);
  }

  isValid(): boolean {
    // The request must carry something actionable: either a pre-built raw
    // transaction or the parameters to construct one.
    if (!this.containsRawTx() && !this.containsOfferParams()) return false;
    if (this.containsRawTx() && !this.rawTransactionHex) return false;
    if (this.containsDesc() && !this.offerDescription) return false;
    if (this.containsOfferParams() && (this.offerParams == null || !this.offerParams.isValid())) {
      return false;
    }
    return true;
  }

  toSha256() {
    return createHash("sha256").update(this.toBuffer()).digest();
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.containsRawTx()) {
      length += varuint.encodingLength(Buffer.from(this.rawTransactionHex, 'hex').length);
      length += Buffer.from(this.rawTransactionHex, 'hex').length;
    }

    if (this.containsDesc()) {
      length += varuint.encodingLength(Buffer.from(this.offerDescription, 'utf8').length);
      length += Buffer.from(this.offerDescription, 'utf8').length;
    }

    if (this.containsOfferParams()) {
      const paramsLength = this.offerParams.getByteLength();
      length += varuint.encodingLength(paramsLength);
      length += paramsLength;
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.flags.toNumber());

    if (this.containsRawTx()) {
      writer.writeVarSlice(Buffer.from(this.rawTransactionHex, 'hex'));
    }

    if (this.containsDesc()) {
      writer.writeVarSlice(Buffer.from(this.offerDescription, 'utf8'));
    }

    if (this.containsOfferParams()) {
      writer.writeVarSlice(this.offerParams.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize());

    if (this.containsRawTx()) {
      this.rawTransactionHex = reader.readVarSlice().toString('hex');
    }

    if (this.containsDesc()) {
      this.offerDescription = reader.readVarSlice().toString('utf8');
    }

    if (this.containsOfferParams()) {
      this.offerParams = new MarketplaceMakeOfferParams();
      this.offerParams.fromBuffer(reader.readVarSlice(), 0);
    }

    return reader.offset;
  }

  toJson(): MarketplaceMakeOfferRequestDetailsJson {
    return {
      flags: this.flags ? this.flags.toString(10) : undefined,
      rawTransactionHex: this.containsRawTx() ? this.rawTransactionHex : undefined,
      offerDescription: this.containsDesc() ? this.offerDescription : undefined,
      offerParams: this.containsOfferParams() ? this.offerParams.toJson() : undefined
    }
  }

  static fromJson(json: MarketplaceMakeOfferRequestDetailsJson): MarketplaceMakeOfferRequestDetails {
    return new MarketplaceMakeOfferRequestDetails({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      rawTransactionHex: json.rawTransactionHex,
      offerDescription: json.offerDescription,
      offerParams: json.offerParams ? MarketplaceMakeOfferParams.fromJson(json.offerParams) : undefined
    })
  }
}
