"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentMultiMapRemove = void 0;
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class ContentMultiMapRemove {
    constructor(data) {
        this.version = (data === null || data === void 0 ? void 0 : data.version) || new bn_js_1.BN(1, 10);
        this.action = (data === null || data === void 0 ? void 0 : data.action) || new bn_js_1.BN(0, 10);
        this.entry_key = (data === null || data === void 0 ? void 0 : data.entry_key) || "";
        this.value_hash = (data === null || data === void 0 ? void 0 : data.value_hash) || Buffer.alloc(0);
    }
    getByteLength() {
        let byteLength = 0;
        byteLength += 4; // version uint32
        byteLength += 4; // action uint32
        if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP) {
            byteLength += 20;
            if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY) {
                byteLength += 32;
            }
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeUInt32(this.version.toNumber());
        bufferWriter.writeUInt32(this.action.toNumber());
        if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP) {
            bufferWriter.writeSlice((0, address_1.fromBase58Check)(this.entry_key).hash);
            if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY) {
                bufferWriter.writeSlice(this.value_hash);
            }
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readUInt32());
        this.action = new bn_js_1.BN(reader.readUInt32());
        if (this.action != ContentMultiMapRemove.ACTION_CLEAR_MAP) {
            this.entry_key = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
            if (this.action != ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY) {
                this.value_hash = reader.readSlice(32);
            }
        }
        return reader.offset;
    }
    static fromJson(data) {
        return new ContentMultiMapRemove({
            version: new bn_js_1.BN(data.version),
            action: new bn_js_1.BN(data.action),
            entry_key: data.entrykey,
            value_hash: Buffer.from(data.valuehash, 'hex')
        });
    }
    toJson() {
        return {
            version: this.version.toNumber(),
            action: this.action.toNumber(),
            entrykey: this.entry_key,
            valuehash: this.value_hash.toString('hex')
        };
    }
    isValid() {
        if (this.version.gte(ContentMultiMapRemove.VERSION_FIRST) &&
            this.version.lte(ContentMultiMapRemove.VERSION_LAST)) {
            return (this.action.eq(ContentMultiMapRemove.ACTION_CLEAR_MAP) ||
                (this.entry_key && (this.entry_key.length > 0) &&
                    (this.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY) || this.value_hash.length > 0)));
        }
        return false;
    }
}
exports.ContentMultiMapRemove = ContentMultiMapRemove;
ContentMultiMapRemove.VERSION_INVALID = new bn_js_1.BN(0);
ContentMultiMapRemove.VERSION_FIRST = new bn_js_1.BN(1);
ContentMultiMapRemove.VERSION_LAST = new bn_js_1.BN(1);
ContentMultiMapRemove.VERSION_CURRENT = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_FIRST = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_REMOVE_ONE_KEYVALUE = new bn_js_1.BN(1);
ContentMultiMapRemove.ACTION_REMOVE_ALL_KEYVALUE = new bn_js_1.BN(2);
ContentMultiMapRemove.ACTION_REMOVE_ALL_KEY = new bn_js_1.BN(3);
ContentMultiMapRemove.ACTION_CLEAR_MAP = new bn_js_1.BN(4);
ContentMultiMapRemove.ACTION_LAST = new bn_js_1.BN(4);
