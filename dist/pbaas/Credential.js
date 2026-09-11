"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../utils/bufferutils");
const varuint_1 = require("../utils/varuint");
const vdxf_1 = require("../constants/vdxf");
const varint_1 = require("../utils/varint");
const string_1 = require("../utils/string");
const address_1 = require("../utils/address");
const { BufferReader, BufferWriter } = bufferutils_1.default;
function hasValidTextLengths(data) {
    return Buffer.byteLength(JSON.stringify(data.credential), 'utf8') <= Credential.MAX_JSON_STRING_LENGTH
        && Buffer.byteLength(JSON.stringify(data.scopes), 'utf8') <= Credential.MAX_JSON_STRING_LENGTH
        && Buffer.byteLength(data.label, 'utf8') <= Credential.MAX_JSON_STRING_LENGTH;
}
class Credential extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        this.version = Credential.VERSION_INVALID;
        this.flags = new bn_js_1.BN(0, 10);
        this.credentialKey = "";
        this.credential = {};
        this.scopes = {};
        this.label = "";
        if (data) {
            if (data.flags)
                this.flags = new bn_js_1.BN(data.flags);
            if (data.version)
                this.version = new bn_js_1.BN(data.version);
            if (data.credentialKey)
                this.credentialKey = data.credentialKey;
            if (data.credential)
                this.credential = data.credential;
            if (data.scopes)
                this.scopes = data.scopes;
            if (data.label)
                this.label = data.label;
            if (!hasValidTextLengths(this)) {
                this.version = Credential.VERSION_INVALID;
            }
            this.setFlags();
        }
    }
    getByteLength() {
        if (!hasValidTextLengths(this)) {
            throw new Error('Credential text exceeds the 512-byte limit');
        }
        let length = 0;
        length += varint_1.default.encodingLength(this.version);
        length += varint_1.default.encodingLength(this.flags);
        length += vdxf_1.HASH160_BYTE_LENGTH; // Credential key
        // Both the credential and scopes are serialized as JSON strings.
        const credStr = JSON.stringify(this.credential);
        const credentialLength = Buffer.byteLength(credStr, 'utf8');
        length += varuint_1.default.encodingLength(credentialLength);
        length += credentialLength;
        const scopesStr = JSON.stringify(this.scopes);
        const scopesLength = Buffer.byteLength(scopesStr, 'utf8');
        length += varuint_1.default.encodingLength(scopesLength);
        length += scopesLength;
        if (this.hasLabel()) {
            const labelLength = Buffer.byteLength(this.label, 'utf8');
            length += varuint_1.default.encodingLength(labelLength);
            length += labelLength;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeVarInt(this.version);
        writer.writeVarInt(this.flags);
        writer.writeSlice((0, address_1.fromBase58Check)(this.credentialKey).hash);
        writer.writeVarSlice(Buffer.from(JSON.stringify(this.credential)));
        writer.writeVarSlice(Buffer.from(JSON.stringify(this.scopes)));
        if (this.hasLabel()) {
            writer.writeVarSlice(Buffer.from(this.label));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readVarInt(), 10);
        this.flags = new bn_js_1.BN(reader.readVarInt(), 10);
        this.credentialKey = (0, address_1.toBase58Check)(reader.readSlice(20), vdxf_1.I_ADDR_VERSION);
        this.credential = JSON.parse(Buffer.from((0, string_1.readLimitedString)(reader, Credential.MAX_JSON_STRING_LENGTH)).toString());
        this.scopes = JSON.parse(Buffer.from((0, string_1.readLimitedString)(reader, Credential.MAX_JSON_STRING_LENGTH)).toString());
        if (this.hasLabel()) {
            this.label = Buffer.from((0, string_1.readLimitedString)(reader, Credential.MAX_JSON_STRING_LENGTH)).toString();
        }
        return reader.offset;
    }
    hasLabel() {
        return this.flags.and(Credential.FLAG_LABEL_PRESENT).gt(new bn_js_1.BN(0, 10));
    }
    calcFlags() {
        return this.label.length > 0 ? Credential.FLAG_LABEL_PRESENT : new bn_js_1.BN(0, 10);
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    // The credential is invalid if its version, key, or serialized text lengths are invalid.
    isValid() {
        return this.version.gte(Credential.VERSION_FIRST) && this.version.lte(Credential.VERSION_LAST)
            && this.credentialKey !== vdxf_1.NULL_ADDRESS && hasValidTextLengths(this);
    }
    toJson() {
        const ret = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            credentialkey: this.credentialKey,
            credential: this.credential,
            scopes: this.scopes,
            label: this.hasLabel() ? this.label : null
        };
        return ret;
    }
    static fromJson(json) {
        return new Credential({
            version: json.version ? new bn_js_1.BN(json.version, 10) : undefined,
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            credentialKey: json.credentialkey,
            credential: json.credential,
            scopes: json.scopes,
            label: json.label,
        });
    }
}
exports.Credential = Credential;
// Credential enum types 
Credential.VERSION_INVALID = new bn_js_1.BN(0, 10);
Credential.VERSION_FIRST = new bn_js_1.BN(1, 10);
Credential.VERSION_LAST = new bn_js_1.BN(1, 10);
Credential.VERSION_CURRENT = new bn_js_1.BN(1, 10);
Credential.FLAG_LABEL_PRESENT = new bn_js_1.BN(1, 10);
Credential.MAX_JSON_STRING_LENGTH = 512;
