"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterIdentityRequestDetails = exports.RegisterIdentityParams = void 0;
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../../utils/varuint");
const bufferutils_1 = require("../../../utils/bufferutils");
const createHash = require("create-hash");
const address_1 = require("../../../utils/address");
const vdxf_1 = require("../../../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
/**
 * Parameters a wallet needs to review / co-sign a registeridentity returntx:
 *   - identity leaf name + parent namespace
 *   - primaryaddresses the new ID will be controlled by
 *   - revocation/recovery authorities
 *   - commitment outpoint being spent
 * The unsigned (or partially signed) returntx hex lives on the outer Details.
 */
class RegisterIdentityParams {
    constructor(data) {
        this.name = data === null || data === void 0 ? void 0 : data.name;
        this.parent = data === null || data === void 0 ? void 0 : data.parent;
        this.primaryAddresses = (data === null || data === void 0 ? void 0 : data.primaryAddresses) ? data.primaryAddresses.slice() : [];
        this.revocationAuthority = data === null || data === void 0 ? void 0 : data.revocationAuthority;
        this.recoveryAuthority = data === null || data === void 0 ? void 0 : data.recoveryAuthority;
        this.commitmentTxid = data === null || data === void 0 ? void 0 : data.commitmentTxid;
        this.commitmentVout = (data === null || data === void 0 ? void 0 : data.commitmentVout) != null ? data.commitmentVout : 0;
    }
    getByteLength() {
        let length = 0;
        const nameBuf = Buffer.from(this.name || '', 'utf8');
        length += varuint_1.default.encodingLength(nameBuf.length) + nameBuf.length;
        length += vdxf_1.HASH160_BYTE_LENGTH; // parent i-addr
        length += varuint_1.default.encodingLength(this.primaryAddresses.length);
        length += this.primaryAddresses.length * vdxf_1.HASH160_BYTE_LENGTH;
        length += vdxf_1.HASH160_BYTE_LENGTH; // revocation
        length += vdxf_1.HASH160_BYTE_LENGTH; // recovery
        length += 32; // commitment txid
        length += 4; // commitment vout uint32 LE
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarSlice(Buffer.from(this.name || '', 'utf8'));
        writer.writeSlice((0, address_1.fromBase58Check)(this.parent).hash);
        writer.writeCompactSize(this.primaryAddresses.length);
        for (const addr of this.primaryAddresses) {
            writer.writeSlice((0, address_1.fromBase58Check)(addr).hash);
        }
        writer.writeSlice((0, address_1.fromBase58Check)(this.revocationAuthority).hash);
        writer.writeSlice((0, address_1.fromBase58Check)(this.recoveryAuthority).hash);
        const txidBuf = Buffer.from(this.commitmentTxid, 'hex').reverse();
        writer.writeSlice(txidBuf);
        const voutBuf = Buffer.alloc(4);
        voutBuf.writeUInt32LE(this.commitmentVout >>> 0, 0);
        writer.writeSlice(voutBuf);
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.name = reader.readVarSlice().toString('utf8');
        this.parent = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        const count = reader.readCompactSize();
        this.primaryAddresses = [];
        for (let i = 0; i < count; i++) {
            // Primary addresses are typically R-addrs (version 60).
            const hash = reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH);
            this.primaryAddresses.push((0, address_1.toBase58Check)(hash, vdxf_1.R_ADDR_VERSION));
        }
        this.revocationAuthority = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        this.recoveryAuthority = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
        this.commitmentTxid = Buffer.from(reader.readSlice(32)).reverse().toString('hex');
        this.commitmentVout = reader.readSlice(4).readUInt32LE(0);
        return reader.offset;
    }
    isValid() {
        return (typeof this.name === 'string' &&
            this.name.length > 0 &&
            typeof this.parent === 'string' &&
            this.parent.length > 0 &&
            Array.isArray(this.primaryAddresses) &&
            this.primaryAddresses.length > 0 &&
            typeof this.revocationAuthority === 'string' &&
            this.revocationAuthority.length > 0 &&
            typeof this.recoveryAuthority === 'string' &&
            this.recoveryAuthority.length > 0 &&
            typeof this.commitmentTxid === 'string' &&
            this.commitmentTxid.length === 64 &&
            Number.isInteger(this.commitmentVout) &&
            this.commitmentVout >= 0);
    }
    toJson() {
        return {
            name: this.name,
            parent: this.parent,
            primaryaddresses: this.primaryAddresses,
            revocationauthority: this.revocationAuthority,
            recoveryauthority: this.recoveryAuthority,
            commitmenttxid: this.commitmentTxid,
            commitmentvout: this.commitmentVout
        };
    }
    static fromJson(json) {
        return new RegisterIdentityParams({
            name: json.name,
            parent: json.parent,
            primaryAddresses: json.primaryaddresses,
            revocationAuthority: json.revocationauthority,
            recoveryAuthority: json.recoveryauthority,
            commitmentTxid: json.commitmenttxid,
            commitmentVout: json.commitmentvout
        });
    }
}
exports.RegisterIdentityParams = RegisterIdentityParams;
class RegisterIdentityRequestDetails {
    constructor(data) {
        this.flags = data && data.flags ? data.flags : new bn_js_1.BN('0', 10);
        if (data === null || data === void 0 ? void 0 : data.returnTxHex) {
            if (!this.containsReturnTx())
                this.toggleContainsReturnTx();
            this.returnTxHex = data.returnTxHex;
        }
        if (data === null || data === void 0 ? void 0 : data.description) {
            if (!this.containsDesc())
                this.toggleContainsDesc();
            this.description = data.description;
        }
        if (data === null || data === void 0 ? void 0 : data.registerParams) {
            if (!this.containsRegisterParams())
                this.toggleContainsRegisterParams();
            this.registerParams = data.registerParams;
        }
    }
    containsReturnTx() {
        return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX).toNumber());
    }
    containsDesc() {
        return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_DESC).toNumber());
    }
    containsRegisterParams() {
        return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS).toNumber());
    }
    toggleContainsReturnTx() {
        this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX);
    }
    toggleContainsDesc() {
        this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_DESC);
    }
    toggleContainsRegisterParams() {
        this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS);
    }
    isValid() {
        if (!this.containsReturnTx() && !this.containsRegisterParams())
            return false;
        if (this.containsReturnTx() && !this.returnTxHex)
            return false;
        if (this.containsDesc() && !this.description)
            return false;
        if (this.containsRegisterParams() && (this.registerParams == null || !this.registerParams.isValid())) {
            return false;
        }
        return true;
    }
    toSha256() {
        return createHash('sha256').update(this.toBuffer()).digest();
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.flags.toNumber());
        if (this.containsReturnTx()) {
            length += varuint_1.default.encodingLength(Buffer.from(this.returnTxHex, 'hex').length);
            length += Buffer.from(this.returnTxHex, 'hex').length;
        }
        if (this.containsDesc()) {
            length += varuint_1.default.encodingLength(Buffer.from(this.description, 'utf8').length);
            length += Buffer.from(this.description, 'utf8').length;
        }
        if (this.containsRegisterParams()) {
            const paramsLength = this.registerParams.getByteLength();
            length += varuint_1.default.encodingLength(paramsLength);
            length += paramsLength;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.flags.toNumber());
        if (this.containsReturnTx()) {
            writer.writeVarSlice(Buffer.from(this.returnTxHex, 'hex'));
        }
        if (this.containsDesc()) {
            writer.writeVarSlice(Buffer.from(this.description, 'utf8'));
        }
        if (this.containsRegisterParams()) {
            writer.writeVarSlice(this.registerParams.toBuffer());
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.flags = new bn_js_1.BN(reader.readCompactSize());
        if (this.containsReturnTx()) {
            this.returnTxHex = reader.readVarSlice().toString('hex');
        }
        if (this.containsDesc()) {
            this.description = reader.readVarSlice().toString('utf8');
        }
        if (this.containsRegisterParams()) {
            this.registerParams = new RegisterIdentityParams();
            this.registerParams.fromBuffer(reader.readVarSlice(), 0);
        }
        return reader.offset;
    }
    toJson() {
        return {
            flags: this.flags ? this.flags.toString(10) : undefined,
            returnTxHex: this.containsReturnTx() ? this.returnTxHex : undefined,
            description: this.containsDesc() ? this.description : undefined,
            registerParams: this.containsRegisterParams() ? this.registerParams.toJson() : undefined
        };
    }
    static fromJson(json) {
        return new RegisterIdentityRequestDetails({
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            returnTxHex: json.returnTxHex,
            description: json.description,
            registerParams: json.registerParams ? RegisterIdentityParams.fromJson(json.registerParams) : undefined
        });
    }
}
exports.RegisterIdentityRequestDetails = RegisterIdentityRequestDetails;
RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_VALID = new bn_js_1.BN(0, 10);
RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX = new bn_js_1.BN(1, 10);
RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_DESC = new bn_js_1.BN(2, 10);
RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS = new bn_js_1.BN(4, 10);
