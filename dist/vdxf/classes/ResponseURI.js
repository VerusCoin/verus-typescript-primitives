"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseURI = void 0;
const SerializableEntityBase_1 = require("../../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../../utils/varuint");
const bufferutils_1 = require("../../utils/bufferutils");
class ResponseURI extends SerializableEntityBase_1.SerializableEntityBase {
    // TODO: Add TYPE_Z_ADDR_REF where response is encrypted and sent to encoded sapling address, 
    // with optional amount specified
    constructor(data) {
        super();
        if (data) {
            if (data.uri != null) {
                this.uri = data.uri;
            }
            if (data.type != null) {
                this.type = data.type;
            }
        }
    }
    getUriString() {
        return this.uri.toString('utf-8');
    }
    static fromUriString(str, type = ResponseURI.TYPE_REDIRECT) {
        return new ResponseURI({ uri: Buffer.from(str, 'utf-8'), type });
    }
    getByteLength() {
        let length = 0;
        length += varuint_1.default.encodingLength(this.type.toNumber());
        let uriBufLen = this.uri.length;
        length += varuint_1.default.encodingLength(uriBufLen);
        length += uriBufLen;
        return length;
    }
    toBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.type.toNumber());
        writer.writeVarSlice(this.uri);
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        this.type = new bn_js_1.BN(reader.readCompactSize());
        this.uri = reader.readVarSlice();
        return reader.offset;
    }
    toJson() {
        return {
            type: this.type.toString(10),
            uri: this.getUriString()
        };
    }
    static fromJson(json) {
        return new ResponseURI({
            type: new bn_js_1.BN(json.type, 10),
            uri: Buffer.from(json.uri, 'utf-8')
        });
    }
}
exports.ResponseURI = ResponseURI;
ResponseURI.TYPE_INVALID = new bn_js_1.BN(0, 10);
ResponseURI.TYPE_POST = new bn_js_1.BN(1, 10);
ResponseURI.TYPE_REDIRECT = new bn_js_1.BN(2, 10);
