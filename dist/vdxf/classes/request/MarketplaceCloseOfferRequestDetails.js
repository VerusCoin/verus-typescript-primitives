"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceCloseOfferRequestDetails = exports.MarketplaceCloseOfferParams = void 0;
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const createHash = require("create-hash");
const { BufferReader, BufferWriter } = bufferutils_1.default;
/**
 * Identifies the on-chain listing a wallet should unlist by reclaiming its own
 * listing deposit (a `closeoffers`-equivalent spend of the deposit output back
 * to its owner). offerTxid is the txid of the on-chain listing transaction
 * (the wallet-published or `publishoffer`-published deposit tx), not the raw
 * offer transaction itself.
 */
class MarketplaceCloseOfferParams {
    constructor(data) {
        this.offerTxid = data === null || data === void 0 ? void 0 : data.offerTxid;
    }
    getByteLength() {
        return 32;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeSlice(Buffer.from(this.offerTxid, 'hex'));
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.offerTxid = reader.readSlice(32).toString('hex');
        return reader.offset;
    }
    isValid() {
        return typeof this.offerTxid === 'string' && /^[0-9a-fA-F]{64}$/.test(this.offerTxid);
    }
    toJson() {
        return {
            offertxid: this.offerTxid
        };
    }
    static fromJson(json) {
        return new MarketplaceCloseOfferParams({
            offerTxid: json.offertxid
        });
    }
}
exports.MarketplaceCloseOfferParams = MarketplaceCloseOfferParams;
class MarketplaceCloseOfferRequestDetails {
    constructor(data) {
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN("0", 10);
        if (data === null || data === void 0 ? void 0 : data.offerDescription) {
            if (!this.containsDesc())
                this.toggleContainsDesc();
            this.offerDescription = data.offerDescription;
        }
        if (data === null || data === void 0 ? void 0 : data.closeOfferParams) {
            if (!this.containsCloseOfferParams())
                this.toggleContainsCloseOfferParams();
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
    isValid() {
        // The request must always identify which offer to close.
        if (!this.containsCloseOfferParams())
            return false;
        if (this.containsDesc() && !this.offerDescription)
            return false;
        if (this.closeOfferParams == null || !this.closeOfferParams.isValid()) {
            return false;
        }
        return true;
    }
    toSha256() {
        return createHash("sha256").update(this.toBuffer()).digest();
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.containsDesc()) {
            length += varuint_1.default.encodingLength(Buffer.from(this.offerDescription, 'utf8').length);
            length += Buffer.from(this.offerDescription, 'utf8').length;
        }
        if (this.containsCloseOfferParams()) {
            const paramsLength = this.closeOfferParams.getByteLength();
            length += varuint_1.default.encodingLength(paramsLength);
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
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (this.containsDesc()) {
            this.offerDescription = reader.readVarSlice().toString('utf8');
        }
        if (this.containsCloseOfferParams()) {
            this.closeOfferParams = new MarketplaceCloseOfferParams();
            this.closeOfferParams.fromBuffer(reader.readVarSlice(), 0);
        }
        return reader.offset;
    }
    toJson() {
        return {
            flags: this.flags ? this.flags.toString(10) : undefined,
            offerDescription: this.containsDesc() ? this.offerDescription : undefined,
            closeOfferParams: this.containsCloseOfferParams() ? this.closeOfferParams.toJson() : undefined
        };
    }
    static fromJson(json) {
        return new MarketplaceCloseOfferRequestDetails({
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            offerDescription: json.offerDescription,
            closeOfferParams: json.closeOfferParams ? MarketplaceCloseOfferParams.fromJson(json.closeOfferParams) : undefined
        });
    }
}
exports.MarketplaceCloseOfferRequestDetails = MarketplaceCloseOfferRequestDetails;
MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_VALID = new bn_js_1.BN(0, 10);
MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_DESC = new bn_js_1.BN(1, 10);
MarketplaceCloseOfferRequestDetails.MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_CLOSE_PARAMS = new bn_js_1.BN(2, 10);
