"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerusPayInvoiceDetails = exports.VERUSPAY_IS_BURN_CHANGE_PRICE = exports.VERUSPAY_IS_TAGGED = exports.VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS = exports.VERUSPAY_IS_PRECONVERT = exports.VERUSPAY_IS_TESTNET = exports.VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN = exports.VERUSPAY_ACCEPTS_ANY_AMOUNT = exports.VERUSPAY_ACCEPTS_ANY_DESTINATION = exports.VERUSPAY_EXPIRES = exports.VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS = exports.VERUSPAY_ACCEPTS_CONVERSION = exports.VERUSPAY_VALID = exports.VERUSPAY_INVALID = void 0;
const varint_1 = require("../../../utils/varint");
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const TransferDestination_1 = require("../../../pbaas/TransferDestination");
const address_1 = require("../../../utils/address");
const vdxf_1 = require("../../../constants/vdxf");
const createHash = require("create-hash");
const veruspay_1 = require("../../../constants/vdxf/veruspay");
const pbaas_1 = require("../../../pbaas");
const CompactAddressObject_1 = require("../CompactAddressObject");
const { BufferReader, BufferWriter } = bufferutils_1.default;
// Added in V3
exports.VERUSPAY_INVALID = new bn_js_1.BN(0, 10);
exports.VERUSPAY_VALID = new bn_js_1.BN(1, 10);
exports.VERUSPAY_ACCEPTS_CONVERSION = new bn_js_1.BN(2, 10);
exports.VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS = new bn_js_1.BN(4, 10);
exports.VERUSPAY_EXPIRES = new bn_js_1.BN(8, 10);
exports.VERUSPAY_ACCEPTS_ANY_DESTINATION = new bn_js_1.BN(16, 10);
exports.VERUSPAY_ACCEPTS_ANY_AMOUNT = new bn_js_1.BN(32, 10);
exports.VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN = new bn_js_1.BN(64, 10);
exports.VERUSPAY_IS_TESTNET = new bn_js_1.BN(128, 10);
// Added in V4
exports.VERUSPAY_IS_PRECONVERT = new bn_js_1.BN(256, 10);
exports.VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS = new bn_js_1.BN(512, 10);
exports.VERUSPAY_IS_TAGGED = new bn_js_1.BN(1024, 10);
exports.VERUSPAY_IS_BURN_CHANGE_PRICE = new bn_js_1.BN(2048, 10);
class VerusPayInvoiceDetails {
    constructor(data, verusPayVersion = veruspay_1.VERUSPAY_VERSION_CURRENT) {
        this.flags = exports.VERUSPAY_VALID;
        this.amount = null;
        this.destination = null;
        this.requestedcurrencyid = null;
        this.expiryheight = null;
        this.maxestimatedslippage = null;
        this.acceptedsystems = null;
        this.verusPayVersion = verusPayVersion;
        this.tag = null;
        if (data != null) {
            if (data.flags != null)
                this.flags = data.flags;
            if (data.amount != null)
                this.amount = data.amount;
            if (data.destination != null)
                this.destination = data.destination;
            if (data.requestedcurrencyid != null)
                this.requestedcurrencyid = data.requestedcurrencyid;
            if (data.expiryheight != null)
                this.expiryheight = data.expiryheight;
            if (data.maxestimatedslippage != null)
                this.maxestimatedslippage = data.maxestimatedslippage;
            if (data.acceptedsystems != null)
                this.acceptedsystems = data.acceptedsystems;
            if (data.tag != null)
                this.tag = data.tag;
        }
    }
    setFlags(flags) {
        if (flags.acceptsConversion)
            this.flags = this.flags.or(exports.VERUSPAY_ACCEPTS_CONVERSION);
        if (flags.acceptsNonVerusSystems)
            this.flags = this.flags.or(exports.VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS);
        if (flags.expires)
            this.flags = this.flags.or(exports.VERUSPAY_EXPIRES);
        if (flags.acceptsAnyAmount)
            this.flags = this.flags.or(exports.VERUSPAY_ACCEPTS_ANY_AMOUNT);
        if (flags.acceptsAnyDestination)
            this.flags = this.flags.or(exports.VERUSPAY_ACCEPTS_ANY_DESTINATION);
        if (flags.excludesVerusBlockchain)
            this.flags = this.flags.or(exports.VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN);
        if (flags.isTestnet)
            this.flags = this.flags.or(exports.VERUSPAY_IS_TESTNET);
        if (this.isGTEV4()) {
            if (flags.isPreconvert)
                this.flags = this.flags.or(exports.VERUSPAY_IS_PRECONVERT);
            if (flags.destinationIsSaplingPaymentAddress)
                this.flags = this.flags.or(exports.VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS);
            if (flags.isTagged)
                this.flags = this.flags.or(exports.VERUSPAY_IS_TAGGED);
            if (flags.isBurnChangePrice)
                this.flags = this.flags.or(exports.VERUSPAY_IS_BURN_CHANGE_PRICE);
        }
    }
    getFlagsJson() {
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
        };
    }
    toSha256() {
        return createHash("sha256").update(this.toBuffer()).digest();
    }
    acceptsConversion() {
        return !!(this.flags.and(exports.VERUSPAY_ACCEPTS_CONVERSION).toNumber());
    }
    acceptsNonVerusSystems() {
        return !!(this.flags.and(exports.VERUSPAY_ACCEPTS_NON_VERUS_SYSTEMS).toNumber());
    }
    acceptsAnyAmount() {
        return !!(this.flags.and(exports.VERUSPAY_ACCEPTS_ANY_AMOUNT).toNumber());
    }
    acceptsAnyDestination() {
        return !!(this.flags.and(exports.VERUSPAY_ACCEPTS_ANY_DESTINATION).toNumber());
    }
    expires() {
        return !!(this.flags.and(exports.VERUSPAY_EXPIRES).toNumber());
    }
    excludesVerusBlockchain() {
        return !!(this.flags.and(exports.VERUSPAY_EXCLUDES_VERUS_BLOCKCHAIN).toNumber());
    }
    isTestnet() {
        return !!(this.flags.and(exports.VERUSPAY_IS_TESTNET).toNumber());
    }
    isPreconvert() {
        return this.isGTEV4() && !!(this.flags.and(exports.VERUSPAY_IS_PRECONVERT).toNumber());
    }
    destinationIsSaplingPaymentAddress() {
        return this.isGTEV4() && !!(this.flags.and(exports.VERUSPAY_DESTINATION_IS_SAPLING_PAYMENT_ADDRESS).toNumber());
    }
    isTagged() {
        return this.isGTEV4() && !!(this.flags.and(exports.VERUSPAY_IS_TAGGED).toNumber());
    }
    isBurnChangePrice() {
        return this.isGTEV4() && !!(this.flags.and(exports.VERUSPAY_IS_BURN_CHANGE_PRICE).toNumber());
    }
    isValid() {
        return (!!(this.flags.and(exports.VERUSPAY_VALID).toNumber()));
    }
    isGTEV4() {
        return (this.verusPayVersion.gte(veruspay_1.VERUSPAY_VERSION_4));
    }
    // Functions to deal with change in v4
    getVarUIntEncodingLength(uint) {
        return this.isGTEV4() ? varuint_1.default.encodingLength(uint.toNumber()) : varint_1.default.encodingLength(uint);
    }
    writeVarUInt(writer = new BufferWriter(Buffer.alloc(0)), uint) {
        if (this.isGTEV4()) {
            return writer.writeCompactSize(uint.toNumber());
        }
        else {
            return writer.writeVarInt(uint);
        }
    }
    readVarUInt(reader = new BufferReader(Buffer.alloc(0))) {
        if (this.isGTEV4()) {
            return new bn_js_1.BN(reader.readCompactSize());
        }
        else {
            return reader.readVarInt();
        }
    }
    getByteLength() {
        let length = 0;
        length += this.getVarUIntEncodingLength(this.flags);
        if (!this.acceptsAnyAmount()) {
            length += this.getVarUIntEncodingLength(this.amount);
        }
        if (!this.acceptsAnyDestination()) {
            length += this.destination.getByteLength();
        }
        length += (0, address_1.fromBase58Check)(this.requestedcurrencyid).hash.length;
        if (this.expires()) {
            length += this.getVarUIntEncodingLength(this.expiryheight);
        }
        if (this.acceptsConversion()) {
            length += this.getVarUIntEncodingLength(this.maxestimatedslippage);
        }
        if (this.acceptsNonVerusSystems()) {
            length += varuint_1.default.encodingLength(this.acceptedsystems.length);
            this.acceptedsystems.forEach(() => {
                length += vdxf_1.HASH160_BYTE_LENGTH;
            });
        }
        if (this.isTagged()) {
            length += this.tag.getByteLength();
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        this.writeVarUInt(writer, this.flags);
        if (!this.acceptsAnyAmount())
            this.writeVarUInt(writer, this.amount);
        if (!this.acceptsAnyDestination())
            writer.writeSlice(this.destination.toBuffer());
        writer.writeSlice((0, address_1.fromBase58Check)(this.requestedcurrencyid).hash);
        if (this.expires()) {
            this.writeVarUInt(writer, this.expiryheight);
        }
        if (this.acceptsConversion()) {
            this.writeVarUInt(writer, this.maxestimatedslippage);
        }
        if (this.acceptsNonVerusSystems()) {
            writer.writeArray(this.acceptedsystems.map(x => (0, address_1.fromBase58Check)(x).hash));
        }
        if (this.isTagged()) {
            writer.writeSlice(this.tag.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0, verusPayVersion = veruspay_1.VERUSPAY_VERSION_CURRENT, rootSystemName = 'VRSC') {
        const reader = new BufferReader(buffer, offset);
        this.verusPayVersion = verusPayVersion;
        this.flags = this.readVarUInt(reader);
        if (!this.acceptsAnyAmount())
            this.amount = this.readVarUInt(reader);
        if (!this.acceptsAnyDestination()) {
            if (this.destinationIsSaplingPaymentAddress()) {
                this.destination = new pbaas_1.SaplingPaymentAddress();
            }
            else
                this.destination = new TransferDestination_1.TransferDestination();
            reader.offset = this.destination.fromBuffer(reader.buffer, reader.offset);
        }
        this.requestedcurrencyid = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        if (this.expires()) {
            this.expiryheight = this.readVarUInt(reader);
        }
        if (this.acceptsConversion()) {
            this.maxestimatedslippage = this.readVarUInt(reader);
        }
        if (this.acceptsNonVerusSystems()) {
            const acceptedSystemsBuffers = reader.readArray(20);
            this.acceptedsystems = acceptedSystemsBuffers.map(x => (0, address_1.toBase58Check)(x, vdxf_1.I_ADDR_VERSION));
        }
        if (this.isTagged()) {
            this.tag = new CompactAddressObject_1.CompactXAddressObject({ type: CompactAddressObject_1.CompactAddressObject.TYPE_X_ADDRESS, address: '', rootSystemName });
            reader.offset = this.tag.fromBuffer(reader.buffer, reader.offset);
        }
        return reader.offset;
    }
    static fromJson(data, verusPayVersion = veruspay_1.VERUSPAY_VERSION_CURRENT) {
        return new VerusPayInvoiceDetails({
            flags: new bn_js_1.BN(data.flags),
            amount: data.amount != null ? new bn_js_1.BN(data.amount) : undefined,
            destination: data.destination != null ? typeof data.destination === 'string' ? pbaas_1.SaplingPaymentAddress.fromAddressString(data.destination) : TransferDestination_1.TransferDestination.fromJson(data.destination) : undefined,
            requestedcurrencyid: data.requestedcurrencyid,
            expiryheight: data.expiryheight != null ? new bn_js_1.BN(data.expiryheight) : undefined,
            maxestimatedslippage: data.maxestimatedslippage != null ? new bn_js_1.BN(data.maxestimatedslippage) : undefined,
            acceptedsystems: data.acceptedsystems,
            tag: data.tag ? CompactAddressObject_1.CompactAddressObject.fromJson(data.tag) : undefined
        }, verusPayVersion);
    }
    toJson() {
        return {
            flags: this.flags.toString(),
            amount: this.acceptsAnyAmount() ? undefined : this.amount.toString(),
            destination: this.acceptsAnyDestination() ? undefined : this.destinationIsSaplingPaymentAddress() ? this.destination.toAddressString() : this.destination.toJson(),
            requestedcurrencyid: this.requestedcurrencyid,
            expiryheight: this.expires() ? this.expiryheight.toString() : undefined,
            maxestimatedslippage: this.acceptsConversion() ? this.maxestimatedslippage.toString() : undefined,
            acceptedsystems: this.acceptsNonVerusSystems() ? this.acceptedsystems : undefined,
            tag: this.isTagged() ? this.tag.toJson() : undefined
        };
    }
}
exports.VerusPayInvoiceDetails = VerusPayInvoiceDetails;
