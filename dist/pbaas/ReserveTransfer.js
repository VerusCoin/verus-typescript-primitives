"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReserveTransfer = exports.RESERVE_TRANSFER_DESTINATION = exports.RESERVE_TRANSFER_ARBITRAGE_ONLY = exports.RESERVE_TRANSFER_CURRENCY_EXPORT = exports.RESERVE_TRANSFER_IDENTITY_EXPORT = exports.RESERVE_TRANSFER_REFUND = exports.RESERVE_TRANSFER_RESERVE_TO_RESERVE = exports.RESERVE_TRANSFER_IMPORT_TO_SOURCE = exports.RESERVE_TRANSFER_BURN_CHANGE_WEIGHT = exports.RESERVE_TRANSFER_BURN_CHANGE_PRICE = exports.RESERVE_TRANSFER_CROSS_SYSTEM = exports.RESERVE_TRANSFER_MINT_CURRENCY = exports.RESERVE_TRANSFER_DOUBLE_SEND = exports.RESERVE_TRANSFER_FEE_OUTPUT = exports.RESERVE_TRANSFER_PRECONVERT = exports.RESERVE_TRANSFER_CONVERT = exports.RESERVE_TRANSFER_VALID = exports.RESERVE_TRANSFER_INVALID = void 0;
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const TokenOutput_1 = require("./TokenOutput");
const TransferDestination_1 = require("./TransferDestination");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
exports.RESERVE_TRANSFER_INVALID = new bn_js_1.BN(0, 10);
exports.RESERVE_TRANSFER_VALID = new bn_js_1.BN(1, 10);
exports.RESERVE_TRANSFER_CONVERT = new bn_js_1.BN(2, 10);
exports.RESERVE_TRANSFER_PRECONVERT = new bn_js_1.BN(4, 10);
exports.RESERVE_TRANSFER_FEE_OUTPUT = new bn_js_1.BN(8, 10); // one per import, amount must match total percentage of fees for exporter, no pre-convert allowed
exports.RESERVE_TRANSFER_DOUBLE_SEND = new bn_js_1.BN("10", 16); // this is used along with increasing the fee to send one transaction on two hops
exports.RESERVE_TRANSFER_MINT_CURRENCY = new bn_js_1.BN("20", 16); // set when this output is being minted on import
exports.RESERVE_TRANSFER_CROSS_SYSTEM = new bn_js_1.BN("40", 16); // if this is set, there is a systemID serialized and deserialized as well for destination
exports.RESERVE_TRANSFER_BURN_CHANGE_PRICE = new bn_js_1.BN("80", 16); // this output is being burned on import and will change the price
exports.RESERVE_TRANSFER_BURN_CHANGE_WEIGHT = new bn_js_1.BN("100", 16); // this output is being burned on import and will change the reserve ratio
exports.RESERVE_TRANSFER_IMPORT_TO_SOURCE = new bn_js_1.BN("200", 16); // set when the source currency, not destination is the import currency
exports.RESERVE_TRANSFER_RESERVE_TO_RESERVE = new bn_js_1.BN("400", 16); // for arbitrage or transient conversion, 2 stage solving (2nd from new fractional to reserves)
exports.RESERVE_TRANSFER_REFUND = new bn_js_1.BN("800", 16); // this transfer should be refunded, individual property when conversions exceed limits
exports.RESERVE_TRANSFER_IDENTITY_EXPORT = new bn_js_1.BN("1000", 16); // this exports a full identity when the next cross-chain leg is processed
exports.RESERVE_TRANSFER_CURRENCY_EXPORT = new bn_js_1.BN("2000", 16); // this exports a currency definition
exports.RESERVE_TRANSFER_ARBITRAGE_ONLY = new bn_js_1.BN("4000", 16); // in PBaaS V1, one additional reserve transfer from the local system may be added by the importer
exports.RESERVE_TRANSFER_DESTINATION = new TransferDestination_1.TransferDestination({
    type: TransferDestination_1.DEST_PKH,
    destinationBytes: (0, address_1.fromBase58Check)("RTqQe58LSj2yr5CrwYFwcsAQ1edQwmrkUU").hash
});
class ReserveTransfer extends TokenOutput_1.TokenOutput {
    constructor(data) {
        super(data);
        if (data != null) {
            const d = data;
            const snakeDeprecated = ['fee_currency_id', 'fee_amount', 'transfer_destination', 'dest_currency_id', 'second_reserve_id', 'dest_system_id'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
            if (snakeDeprecated.length > 0) {
                const map = {
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
        this.flags = exports.RESERVE_TRANSFER_INVALID;
        this.feeCurrencyID = null;
        this.feeAmount = new bn_js_1.BN(0, 10);
        this.transferDestination = new TransferDestination_1.TransferDestination();
        this.destCurrencyID = null;
        this.secondReserveID = null;
        this.destCurrencyID = null;
        if (data != null) {
            if (data.flags != null)
                this.flags = data.flags;
            if (data.feeCurrencyID != null)
                this.feeCurrencyID = data.feeCurrencyID;
            if (data.feeAmount != null)
                this.feeAmount = data.feeAmount;
            if (data.transferDestination != null)
                this.transferDestination = data.transferDestination;
            if (data.destCurrencyID != null)
                this.destCurrencyID = data.destCurrencyID;
            if (data.secondReserveID != null)
                this.secondReserveID = data.secondReserveID;
            if (data.destSystemID != null)
                this.destSystemID = data.destSystemID;
        }
    }
    /** @deprecated Use feeCurrencyID instead */
    get fee_currency_id() { return this.feeCurrencyID; }
    /** @deprecated Use feeAmount instead */
    get fee_amount() { return this.feeAmount; }
    /** @deprecated Use transferDestination instead */
    get transfer_destination() { return this.transferDestination; }
    /** @deprecated Use destCurrencyID instead */
    get dest_currency_id() { return this.destCurrencyID; }
    /** @deprecated Use secondReserveID instead */
    get second_reserve_id() { return this.secondReserveID; }
    /** @deprecated Use destSystemID instead */
    get dest_system_id() { return this.destSystemID; }
    isReserveToReserve() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_RESERVE_TO_RESERVE).toNumber());
    }
    isCrossSystem() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_CROSS_SYSTEM).toNumber());
    }
    isConversion() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_CONVERT).toNumber());
    }
    isPreConversion() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_PRECONVERT).toNumber());
    }
    isFeeOutput() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_FEE_OUTPUT).toNumber());
    }
    isDoubleSend() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_DOUBLE_SEND).toNumber());
    }
    isMint() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_MINT_CURRENCY).toNumber());
    }
    isBurnChangeWeight() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_BURN_CHANGE_WEIGHT).toNumber());
    }
    isBurnChangePrice() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_BURN_CHANGE_PRICE).toNumber());
    }
    isImportToSource() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_IMPORT_TO_SOURCE).toNumber());
    }
    isRefund() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_REFUND).toNumber());
    }
    isIdentityExport() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_IDENTITY_EXPORT).toNumber());
    }
    isCurrencyExport() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_CURRENCY_EXPORT).toNumber());
    }
    isArbitrageOnly() {
        return !!(this.flags.and(exports.RESERVE_TRANSFER_ARBITRAGE_ONLY).toNumber());
    }
    getByteLength() {
        let length = super.getByteLength();
        length += varint_1.default.encodingLength(this.flags);
        length += (0, address_1.fromBase58Check)(this.feeCurrencyID).hash.length;
        length += varint_1.default.encodingLength(this.feeAmount);
        length += this.transferDestination.getByteLength();
        length += (0, address_1.fromBase58Check)(this.destCurrencyID).hash.length;
        if (this.isReserveToReserve()) {
            length += (0, address_1.fromBase58Check)(this.secondReserveID).hash.length;
        }
        if (this.isCrossSystem()) {
            length += (0, address_1.fromBase58Check)(this.destSystemID).hash.length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        const ownOutput = new TokenOutput_1.TokenOutput({
            values: this.reserveValues,
            version: this.version
        });
        writer.writeSlice(ownOutput.toBuffer());
        writer.writeVarInt(this.flags);
        writer.writeSlice((0, address_1.fromBase58Check)(this.feeCurrencyID).hash);
        writer.writeVarInt(this.feeAmount);
        writer.writeSlice(this.transferDestination.toBuffer());
        writer.writeSlice((0, address_1.fromBase58Check)(this.destCurrencyID).hash);
        if (this.isReserveToReserve()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.secondReserveID).hash);
        }
        if (this.isCrossSystem()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.destSystemID).hash);
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const _offset = super.fromBuffer(buffer, offset);
        const reader = new BufferReader(buffer, _offset);
        this.flags = reader.readVarInt();
        this.feeCurrencyID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.feeAmount = reader.readVarInt();
        this.transferDestination = new TransferDestination_1.TransferDestination();
        reader.offset = this.transferDestination.fromBuffer(buffer, reader.offset);
        this.destCurrencyID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        if (this.isReserveToReserve()) {
            this.secondReserveID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        if (this.isCrossSystem()) {
            this.destSystemID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        }
        return reader.offset;
    }
}
exports.ReserveTransfer = ReserveTransfer;
