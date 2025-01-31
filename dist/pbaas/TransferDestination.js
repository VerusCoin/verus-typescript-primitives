"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferDestination = exports.FLAG_MASK = exports.FLAG_DEST_GATEWAY = exports.FLAG_DEST_AUX = exports.LAST_VALID_TYPE_NO_FLAGS = exports.DEST_RAW = exports.DEST_ETHNFT = exports.DEST_ETH = exports.DEST_NESTEDTRANSFER = exports.DEST_QUANTUM = exports.DEST_REGISTERCURRENCY = exports.DEST_FULLID = exports.DEST_ID = exports.DEST_SH = exports.DEST_PKH = exports.DEST_PK = exports.DEST_INVALID = void 0;
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
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
        this.destination_bytes = Buffer.alloc(0);
        this.gateway_id = null;
        this.gateway_code = null;
        this.fees = new bn_js_1.BN(0, 10);
        this.aux_dests = [];
        if (data != null) {
            if (data.type != null)
                this.type = data.type;
            if (data.destination_bytes != null)
                this.destination_bytes = data.destination_bytes;
            if (data.gateway_id != null)
                this.gateway_id = data.gateway_id;
            if (data.gateway_code != null)
                this.gateway_code = data.gateway_code;
            if (data.fees != null)
                this.fees = data.fees;
            if (data.aux_dests != null)
                this.aux_dests = data.aux_dests;
        }
    }
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
            return (0, address_1.toBase58Check)(this.destination_bytes, vdxf_1.R_ADDR_VERSION);
        }
        else if (this.isIAddr()) {
            return (0, address_1.toBase58Check)(this.destination_bytes, vdxf_1.I_ADDR_VERSION);
        }
        else if (this.isETHAccount()) {
            return "0x" + this.destination_bytes.toString('hex');
        }
        else {
            throw new Error("Cannot get address for unsupported transfer destination type.");
        }
    }
    getByteLength() {
        let length = 0;
        length += 1; // type
        length += varuint_1.default.encodingLength(this.destination_bytes.length); // destination_bytes compact size
        length += this.destination_bytes.length; // destination_bytes
        if (this.isGateway()) {
            length += (0, address_1.fromBase58Check)(this.gateway_id).hash.length; // gateway_id
            if (this.gateway_code) {
                length += (0, address_1.fromBase58Check)(this.gateway_code).hash.length; // gateway_code
            }
            else {
                length += vdxf_1.HASH160_BYTE_LENGTH;
            }
            length += 8; // fees int64
        }
        if (this.hasAuxDests()) {
            length += varuint_1.default.encodingLength(this.aux_dests.length); // aux dests compact size
            for (const dest of this.aux_dests) {
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
        writer.writeVarSlice(this.destination_bytes);
        if (this.isGateway()) {
            writer.writeSlice((0, address_1.fromBase58Check)(this.gateway_id).hash);
            if (this.gateway_code) {
                writer.writeSlice((0, address_1.fromBase58Check)(this.gateway_code).hash);
            }
            else {
                writer.writeSlice(Buffer.alloc(vdxf_1.HASH160_BYTE_LENGTH));
            }
            writer.writeInt64(this.fees);
        }
        if (this.hasAuxDests()) {
            writer.writeCompactSize(this.aux_dests.length);
            this.aux_dests.forEach((aux_dest) => writer.writeVarSlice(aux_dest.toBuffer()));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.type = new bn_js_1.BN(reader.readUInt8(), 10);
        this.destination_bytes = reader.readVarSlice();
        if (this.isGateway()) {
            this.gateway_id = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            this.gateway_code = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            this.fees = reader.readInt64();
        }
        if (this.hasAuxDests()) {
            const numAuxDests = reader.readCompactSize();
            for (let i = 0; i < numAuxDests; i++) {
                const newAuxDest = new TransferDestination();
                newAuxDest.fromBuffer(reader.readVarSlice());
                this.aux_dests.push(newAuxDest);
            }
        }
        return reader.offset;
    }
    static fromJson(data) {
        return new TransferDestination({
            type: new bn_js_1.BN(data.type),
            destination_bytes: Buffer.from(data.destination_bytes, 'hex'),
            gateway_id: data.gateway_id,
            gateway_code: data.gateway_code,
            fees: new bn_js_1.BN(data.fees),
            aux_dests: data.aux_dests.map(x => TransferDestination.fromJson(x))
        });
    }
    toJson() {
        return {
            type: this.type.toString(),
            destination_bytes: this.destination_bytes.toString('hex'),
            gateway_id: this.gateway_id,
            gateway_code: this.gateway_code,
            fees: this.fees.toString(),
            aux_dests: this.aux_dests.map(x => x.toJson())
        };
    }
    isValid() {
        // verify aux dests
        let valid = (((this.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0))) && this.aux_dests.length > 0) || (!(this.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0))) && !(this.aux_dests.length > 0)));
        if (valid && this.aux_dests && this.aux_dests.length > 0) {
            for (let i = 0; i < this.aux_dests.length; i++) {
                if (!this.getAuxDest(i).isValid()) {
                    valid = false;
                    break;
                }
            }
        }
        return !!(valid &&
            !this.typeNoFlags().eq(exports.DEST_INVALID) &&
            this.typeNoFlags().lte(exports.LAST_VALID_TYPE_NO_FLAGS) &&
            (((this.type.and(exports.FLAG_DEST_GATEWAY).eq(new bn_js_1.BN(0))) && (this.gateway_id == null)) || this.gateway_id != null));
    }
    getAuxDest(destNum) {
        const retVal = this.aux_dests[destNum];
        if (destNum >= 0 && destNum < this.aux_dests.length) {
            if (retVal.type.and(exports.FLAG_DEST_AUX).gt(new bn_js_1.BN(0)) || retVal.aux_dests.length > 0) {
                retVal.type = exports.DEST_INVALID;
            }
            // no gateways or flags, only simple destinations work
            switch (retVal.type) {
                case exports.DEST_ID:
                case exports.DEST_PK:
                case exports.DEST_PKH:
                case exports.DEST_ETH:
                case exports.DEST_SH:
                    break;
                default:
                    retVal.type = exports.DEST_INVALID;
            }
        }
        return retVal;
    }
}
exports.TransferDestination = TransferDestination;
