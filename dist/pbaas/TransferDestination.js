"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferDestination = exports.FLAG_MASK = exports.FLAG_DEST_GATEWAY = exports.FLAG_DEST_AUX = exports.LAST_VALID_TYPE_NO_FLAGS = exports.DEST_RAW = exports.DEST_ETHNFT = exports.DEST_ETH = exports.DEST_NESTEDTRANSFER = exports.DEST_QUANTUM = exports.DEST_REGISTERCURRENCY = exports.DEST_FULLID = exports.DEST_ID = exports.DEST_SH = exports.DEST_PKH = exports.DEST_PK = exports.DEST_INVALID = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const numberConversion_1 = require("../utils/numberConversion");
const { BufferReader, BufferWriter } = bufferutils_1.default;
exports.DEST_INVALID = new bn_js_1.BN(0, 10);
exports.DEST_PK = new bn_js_1.BN(1, 10);
exports.DEST_PKH = new bn_js_1.BN(2, 10);
exports.DEST_SH = new bn_js_1.BN(3, 10);
exports.DEST_ID = new bn_js_1.BN(4, 10);
exports.DEST_FULLID = new bn_js_1.BN(5, 10);
exports.DEST_REGISTERCURRENCY = new bn_js_1.BN(6, 10);
exports.DEST_QUANTUM = new bn_js_1.BN(7, 10);
exports.DEST_NESTEDTRANSFER = new bn_js_1.BN(8, 10); // used to chain transfers, enabling them to be routed through multiple systems
exports.DEST_ETH = new bn_js_1.BN(9, 10);
exports.DEST_ETHNFT = new bn_js_1.BN(10, 10); // used when defining a mapped NFT to gateway that uses an ETH compatible model
exports.DEST_RAW = new bn_js_1.BN(11, 10);
exports.LAST_VALID_TYPE_NO_FLAGS = exports.DEST_RAW;
exports.FLAG_DEST_AUX = new bn_js_1.BN(64, 10);
exports.FLAG_DEST_GATEWAY = new bn_js_1.BN(128, 10);
exports.FLAG_MASK = exports.FLAG_DEST_AUX.add(exports.FLAG_DEST_GATEWAY);
class TransferDestination {
    constructor(data) {
        this.type = exports.DEST_INVALID;
        this.destinationBytes = Buffer.alloc(0);
        this.gatewayID = null;
        this.gatewayCode = null;
        this.fees = new bn_js_1.BN(0, 10);
        this.auxDests = [];
        if (data != null) {
            const d = data;
            const snakeDeprecated = ['destination_bytes', 'gateway_id', 'gateway_code', 'aux_dests'].filter(k => Object.prototype.hasOwnProperty.call(d, k));
            if (snakeDeprecated.length > 0) {
                const map = {
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
            if (data.type != null)
                this.type = data.type;
            if (data.destinationBytes != null)
                this.destinationBytes = data.destinationBytes;
            if (data.gatewayID != null)
                this.gatewayID = data.gatewayID;
            if (data.gatewayCode != null)
                this.gatewayCode = data.gatewayCode;
            if (data.fees != null)
                this.fees = data.fees;
            if (data.auxDests != null)
                this.auxDests = data.auxDests;
        }
    }
    /** @deprecated Use destinationBytes instead */
    get destination_bytes() { return this.destinationBytes; }
    /** @deprecated Use gatewayID instead */
    get gatewayId() { return this.gatewayID; }
    /** @deprecated Use gatewayID instead */
    get gateway_id() { return this.gatewayID; }
    /** @deprecated Use gatewayCode instead */
    get gateway_code() { return this.gatewayCode; }
    /** @deprecated Use auxDests instead */
    get aux_dests() { return this.auxDests; }
    isGateway() {
        return !!(this.type.and(exports.FLAG_DEST_GATEWAY).toNumber());
    }
    hasAuxDests() {
        return !!(this.type.and(exports.FLAG_DEST_AUX).toNumber());
    }
    isIAddr() {
        return this.typeNoFlags().eq(exports.DEST_ID);
    }
    isPKH() {
        return this.typeNoFlags().eq(exports.DEST_PKH);
    }
    isETHAccount() {
        return this.typeNoFlags().eq(exports.DEST_ETH);
    }
    typeNoFlags() {
        return this.type.and(exports.FLAG_MASK.notn(exports.FLAG_MASK.bitLength()));
    }
    getAddressString() {
        if (this.isPKH()) {
            return (0, address_1.toBase58Check)(this.destinationBytes, vdxf_1.R_ADDR_VERSION);
        }
        else if (this.isIAddr()) {
            return (0, address_1.toBase58Check)(this.destinationBytes, vdxf_1.I_ADDR_VERSION);
        }
        else if (this.isETHAccount()) {
            return "0x" + this.destinationBytes.toString('hex');
        }
        else {
            throw new Error("Cannot get address for unsupported transfer destination type.");
        }
    }
    getByteLength() {
        let length = 0;
        length += 1; // type
        length += varuint_1.default.encodingLength(this.destinationBytes.length); // destinationBytes compact size
        length += this.destinationBytes.length; // destinationBytes
        if (this.isGateway()) {
            length += (0, address_1.fromBase58Check)(this.gatewayID).hash.length; // gatewayId
            if (this.gatewayCode) {
                length += (0, address_1.fromBase58Check)(this.gatewayCode).hash.length; // gatewayCode
            }
            else {
                length += vdxf_1.HASH160_BYTE_LENGTH;
            }
            length += 8; // fees int64
        }
        if (this.hasAuxDests()) {
            length += varuint_1.default.encodingLength(this.auxDests.length); // aux dests compact size
            for (const dest of this.auxDests) {
                const destLength = dest.getByteLength();
                length += varuint_1.default.encodingLength(destLength); // one aux dest compact size
                length += destLength; // one aux dest compact size
            }
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeUInt8(this.type.toNumber());
        writer.writeVarSlice(this.destinationBytes);
        if (this.isGateway()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.gatewayID).hash);
            if (this.gatewayCode) {
                writer.writeSlice((0, address_1.fromBase58Check)(this.gatewayCode).hash);
            }
            else {
                writer.writeSlice(Buffer.alloc(vdxf_1.HASH160_BYTE_LENGTH));
            }
            writer.writeInt64(this.fees);
        }
        if (this.hasAuxDests()) {
            writer.writeCompactSize(this.auxDests.length);
            this.auxDests.forEach((auxDest) => writer.writeVarSlice(auxDest.toBuffer()));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.type = new bn_js_1.BN(reader.readUInt8(), 10);
        this.destinationBytes = reader.readVarSlice();
        if (this.isGateway()) {
            this.gatewayID = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            this.gatewayCode = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            this.fees = reader.readInt64();
        }
        if (this.hasAuxDests()) {
            const numAuxDests = reader.readCompactSize();
            for (let i = 0; i < numAuxDests; i++) {
                const newAuxDest = new TransferDestination();
                newAuxDest.fromBuffer(reader.readVarSlice());
                this.auxDests.push(newAuxDest);
            }
        }
        return reader.offset;
    }
    static fromJson(data) {
        const type = new bn_js_1.BN(data.type);
        let destination = null;
        switch (type.and(exports.FLAG_MASK.notn(exports.FLAG_MASK.bitLength())).toString()) {
            case exports.DEST_PKH.toString():
            case exports.DEST_SH.toString():
            case exports.DEST_ID.toString():
            case exports.DEST_QUANTUM.toString():
                destination = (0, address_1.decodeDestination)(data.address);
                break;
            case exports.DEST_ETH.toString():
                destination = (0, address_1.decodeEthDestination)(data.address);
                break;
            default:
                throw new Error("Unknown destination type: " + type + "\nNote: Only DEST_PKH, DEST_SH, DEST_ID, DEST_QUANTUM and DEST_ETH are supported for now.");
        }
        let auxDests = [];
        let fees = null;
        if (type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0)) && data.auxdests.length > 0) {
            auxDests = data.auxdests.map(x => TransferDestination.fromJson(x));
        }
        if (type.and(exports.FLAG_DEST_GATEWAY).gt(new bn_js_1.BN(0)) && data.fees) {
            fees = (0, numberConversion_1.decimalToBn)(data.fees);
        }
        return new TransferDestination({
            type: type,
            destinationBytes: destination,
            gatewayCode: data.gatewaycode,
            fees: fees,
            auxDests: auxDests
        });
    }
    toJson() {
        let destVal = {
            type: this.type.toNumber(),
            address: ''
        };
        switch (this.typeNoFlags().toString()) {
            case exports.DEST_PKH.toString():
            case exports.DEST_SH.toString():
            case exports.DEST_ID.toString():
            case exports.DEST_QUANTUM.toString():
            case exports.DEST_ETH.toString():
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
        return destVal;
    }
    isValid() {
        // verify aux dests
        let valid = (((this.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0))) && this.auxDests.length > 0) || (!(this.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0))) && !(this.auxDests.length > 0)));
        if (valid && this.auxDests && this.auxDests.length > 0) {
            for (let i = 0; i < this.auxDests.length; i++) {
                if (!this.getAuxDest(i).isValid()) {
                    valid = false;
                    break;
                }
            }
        }
        return !!(valid &&
            !this.typeNoFlags().eq(exports.DEST_INVALID) &&
            this.typeNoFlags().lte(exports.LAST_VALID_TYPE_NO_FLAGS) &&
            (((this.type.and(exports.FLAG_DEST_GATEWAY).eq(new bn_js_1.BN(0))) && (this.gatewayID == null)) || this.gatewayID != null));
    }
    getAuxDest(destNum) {
        const retVal = this.auxDests[destNum];
        if (destNum >= 0 && destNum < this.auxDests.length) {
            if (retVal.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0)) || retVal.auxDests.length > 0) {
                retVal.type = exports.DEST_INVALID;
            }
            // no gateways or flags, only simple destinations work
            switch (retVal.type.toString()) {
                case exports.DEST_ID.toString():
                case exports.DEST_PK.toString():
                case exports.DEST_PKH.toString():
                case exports.DEST_ETH.toString():
                case exports.DEST_SH.toString():
                    break;
                default:
                    retVal.type = exports.DEST_INVALID;
            }
        }
        return retVal;
    }
}
exports.TransferDestination = TransferDestination;
