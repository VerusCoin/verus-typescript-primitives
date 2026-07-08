import { BN } from 'bn.js';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import varuint from '../../../utils/varuint';
import bufferutils from '../../../utils/bufferutils';
import createHash = require('create-hash');
import { BigNumber } from '../../../utils/types/BigNumber';

const { BufferReader, BufferWriter } = bufferutils;

export type MarketplaceCloseOfferParamsJson = {
  offertxid: string;
}

export type MarketplaceCloseOfferRequestDetailsJson = {
  flags?: string;
  offerDescription?: string;
  closeOfferParams?: MarketplaceCloseOfferParamsJson;
}

/**
 * Identifies the on-chain listing a wallet should unlist by reclaiming its own
 * listing deposit (a `closeoffers`-equivalent spend of the deposit output back
 * to its owner). offerTxid is the txid of the on-chain listing transaction
 * (the wallet-published or `publishoffer`-published deposit tx), not the raw
 * offer transaction itself.
 */
export class MarketplaceCloseOfferParams implements SerializableEntity {
  offerTxid: string;

  constructor(data?: {
    offerTxid?: string
  }) {
    this.offerTxid = data?.offerTxid;
  }

  getByteLength(): number {
    return 32;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeSlice(Buffer.from(this.offerTxid, 'hex'));

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.offerTxid = reader.readSlice(32).toString('hex');

    return reader.offset;
  }

  isValid(): boolean {
    return typeof this.offerTxid === 'string' && /^[0-9a-fA-F]{64}$/.test(this.offerTxid);
  }

  toJson(): MarketplaceCloseOfferParamsJson {
    return {
      offertxid: this.offerTxid
    }
  }

  static fromJson(json: MarketplaceCloseOfferParamsJson): MarketplaceCloseOfferParams {
    return new MarketplaceCloseOfferParams({
      offerTxid: json.offertxid
    })
  }
}

export class MarketplaceCloseOfferRequestDetails implements SerializableEntity {
  flags?: BigNumber;
  offerDescription?: string;
  closeOfferParams?: MarketplaceCloseOfferParams;

  static MARKETPLACE_CLOSEOFFER_REQUEST_VALID = new BN(0, 10);
  static MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_DESC = new BN(1, 10);
  static MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_CLOSE_PARAMS = new BN(2, 10);

  constructor (data?: {
    flags?: BigNumber,
    offerDescription?: string,
    closeOfferParams?: MarketplaceCloseOfferParams
  }) {
    this.flags = data && data.flags ? data.flags : new BN("0", 10);

    if (data?.offerDescription) {
      if (!this.containsDesc()) this.toggleContainsDesc();
      this.offerDescription = data.offerDescription;
    }

    if (data?.closeOfferParams) {
      if (!this.containsCloseOfferParams()) this.toggleContainsCloseOfferParams();
      this.closeOfferParams = data.closeOfferParams;
    }
  }

  containsDesc() {
    return !!(this.flags.and(MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_DESC).toNumber());
  }

  containsCloseOfferParams() {
    return !!(this.flags.and(MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_CLOSE_PARAMS).toNumber());
  }

  toggleContainsDesc() {
    this.flags = this.flags.xor(MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_DESC);
  }

  toggleContainsCloseOfferParams() {
    this.flags = this.flags.xor(MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_CLOSE_PARAMS);
  }

  isValid(): boolean {
    // The request must always identify which offer to close.
    if (!this.containsCloseOfferParams()) return false;
    if (this.containsDesc() && !this.offerDescription) return false;
    if (this.closeOfferParams == null || !this.closeOfferParams.isValid()) {
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

    if (this.containsDesc()) {
      length += varuint.encodingLength(Buffer.from(this.offerDescription, 'utf8').length);
      length += Buffer.from(this.offerDescription, 'utf8').length;
    }

    if (this.containsCloseOfferParams()) {
      const paramsLength = this.closeOfferParams.getByteLength();
      length += varuint.encodingLength(paramsLength);
      length += paramsLength;
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.flags.toNumber());

    if (this.containsDesc()) {
      writer.writeVarSlice(Buffer.from(this.offerDescription, 'utf8'));
    }

    if (this.containsCloseOfferParams()) {
      writer.writeVarSlice(this.closeOfferParams.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize());

    if (this.containsDesc()) {
      this.offerDescription = reader.readVarSlice().toString('utf8');
    }

    if (this.containsCloseOfferParams()) {
      this.closeOfferParams = new MarketplaceCloseOfferParams();
      this.closeOfferParams.fromBuffer(reader.readVarSlice(), 0);
    }

    return reader.offset;
  }

  toJson(): MarketplaceCloseOfferRequestDetailsJson {
    return {
      flags: this.flags ? this.flags.toString(10) : undefined,
      offerDescription: this.containsDesc() ? this.offerDescription : undefined,
      closeOfferParams: this.containsCloseOfferParams() ? this.closeOfferParams.toJson() : undefined
    }
  }

  static fromJson(json: MarketplaceCloseOfferRequestDetailsJson): MarketplaceCloseOfferRequestDetails {
    return new MarketplaceCloseOfferRequestDetails({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      offerDescription: json.offerDescription,
      closeOfferParams: json.closeOfferParams ? MarketplaceCloseOfferParams.fromJson(json.closeOfferParams) : undefined
    })
  }
}
