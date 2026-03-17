"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rating = void 0;
const varuint_1 = require("../utils/varuint");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Rating {
    constructor(data = {}) {
        if (data != null) {
            if (Object.prototype.hasOwnProperty.call(data, 'trust_level')) {
                throw new Error("Rating: snake_case property names are no longer supported. Use 'trustLevel' instead of 'trust_level'.");
            }
        }
        this.version = data.version || new bn_js_1.BN(1, 10);
        this.trustLevel = data.trustLevel || new bn_js_1.BN(0, 10);
        this.ratings = new Map(data.ratings || []);
    }
    /** @deprecated Use trustLevel instead */
    get trust_level() { return this.trustLevel; }
    getByteLength() {
        let byteLength = 0;
        byteLength += 4; // version uint32
        byteLength += 1; // trustLevel uint8
        byteLength += varuint_1.default.encodingLength(this.ratings.size);
        for (const [key, value] of this.ratings) {
            byteLength += vdxf_1.HASH160_BYTE_LENGTH;
            byteLength += varuint_1.default.encodingLength(value.length);
            byteLength += value.length;
        }
        return byteLength;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.getByteLength()));
        bufferWriter.writeUInt32(this.version.toNumber());
        bufferWriter.writeUInt8(this.trustLevel.toNumber());
        bufferWriter.writeCompactSize(this.ratings.size);
        const entries = [];
        for (const [key, value] of this.ratings) {
            const { hash } = (0, address_1.fromBase58Check)(key);
            entries.push({ [hash.toString('hex')]: value });
        }
        // Sort by Buffer (vkey) value, smallest first
        entries.sort((a, b) => {
            const aKey = Object.keys(a)[0];
            const bKey = Object.keys(b)[0];
            const aBuf = Buffer.from(aKey, 'hex');
            const bBuf = Buffer.from(bKey, 'hex');
            return aBuf.compare(bBuf);
        });
        // Write sorted entries
        for (const value of entries) {
            const key = Object.keys(value)[0];
            const innervalue = value[key];
            bufferWriter.writeSlice(Buffer.from(key, 'hex'));
            bufferWriter.writeVarSlice(innervalue);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readUInt32());
        this.trustLevel = new bn_js_1.BN(reader.readUInt8());
        const count = reader.readCompactSize();
        for (let i = 0; i < count; i++) {
            const hash = reader.readSlice(20);
            const value = reader.readVarSlice();
            const base58Key = (0, address_1.toBase58Check)(hash, vdxf_1.I_ADDR_VERSION);
            this.ratings.set(base58Key, value);
        }
        return reader.offset;
    }
    isValid() {
        return this.version.gte(Rating.VERSION_FIRST) && this.version.lte(Rating.VERSION_LAST) &&
            this.trustLevel.gte(Rating.TRUST_FIRST) && this.trustLevel.lte(Rating.TRUST_LAST);
    }
    toJson() {
        const ratings = {};
        this.ratings.forEach((value, key) => {
            ratings[key] = value.toString('hex');
        });
        return {
            version: this.version.toNumber(),
            trustlevel: this.trustLevel.toNumber(),
            ratingsmap: ratings
        };
    }
    static fromJson(json) {
        const ratings = new Map();
        for (const key in json.ratingsmap) {
            ratings.set(key, Buffer.from(json.ratingsmap[key], 'hex'));
        }
        return new Rating({
            version: new bn_js_1.BN(json.version),
            trustLevel: new bn_js_1.BN(json.trustlevel),
            ratings: ratings
        });
    }
}
exports.Rating = Rating;
Rating.VERSION_INVALID = new bn_js_1.BN(0, 10);
Rating.VERSION_FIRST = new bn_js_1.BN(1, 10);
Rating.VERSION_LAST = new bn_js_1.BN(1, 10);
Rating.VERSION_CURRENT = new bn_js_1.BN(1, 10);
Rating.TRUST_UNKNOWN = new bn_js_1.BN(0, 10); // unknown and can be included in exploration
Rating.TRUST_BLOCKED = new bn_js_1.BN(1, 10); // suspected or known to be untrustworthy and should not be interacted with
Rating.TRUST_APPROVED = new bn_js_1.BN(2, 10); // explicitly believed to be trustworthy enough to interact with
Rating.TRUST_FIRST = new bn_js_1.BN(0, 10);
Rating.TRUST_LAST = new bn_js_1.BN(2, 10);
