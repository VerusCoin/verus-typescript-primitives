"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaltedData = void 0;
const varint_1 = require("../../utils/varint");
const varuint_1 = require("../../utils/varuint");
const address_1 = require("../../utils/address");
const bufferutils_1 = require("../../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../../constants/vdxf");
const __1 = require("../../");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const createHash = require("create-hash");
const vdxfdatakeys_1 = require("../vdxfdatakeys");
class SaltedData extends __1.VDXFData {
    constructor(data, salt = Buffer.alloc(0)) {
        super(data);
        if (salt.length != 0) {
            this.salt = salt;
        }
        this.vdxfkey = vdxfdatakeys_1.SaltedDataKey.vdxfid;
    }
    static fromJson(data) {
        const saltedData = new SaltedData();
        if (data) {
            if (data.version) {
                saltedData.version = new bn_js_1.BN(data.version);
            }
            else {
                saltedData.version = SaltedData.DEFAULT_VERSION;
            }
            if (data.salt)
                saltedData.salt = Buffer.from(data.salt, 'hex');
            if (data.data)
                saltedData.data = Buffer.from(data.data, 'hex');
            if (data.key)
                saltedData.vdxfkey = data.key;
        }
        return saltedData;
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += 20; //key
        byteLength += varint_1.default.encodingLength(this.version);
        byteLength += varuint_1.default.encodingLength(this.data.length + this.salt.length);
        byteLength += this.data.length + this.salt.length;
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.vdxfkey).hash);
        bufferWriter.writeVarInt(this.version);
        bufferWriter.writeVarSlice(Buffer.concat([this.data, this.salt]));
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.vdxfkey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.version = reader.readVarInt();
        this.data = reader.readVarSlice();
        this.salt = this.data.slice(this.data.length - 32);
        this.data = this.data.slice(0, this.data.length - 32);
        return reader.offset;
    }
    toJson() {
        return {
            version: this.version.toString(),
            key: this.vdxfkey,
            data: this.data.toString('hex'),
            salt: this.salt.toString('hex')
        };
    }
    getHash(hw) {
        const hash = hw(Buffer.concat([this.data, this.salt]));
        return hash;
    }
}
exports.SaltedData = SaltedData;
SaltedData.VERSION_INVALID = new bn_js_1.BN(0);
SaltedData.FIRST_VERSION = new bn_js_1.BN(1);
SaltedData.LAST_VERSION = new bn_js_1.BN(1);
SaltedData.DEFAULT_VERSION = new bn_js_1.BN(1);
