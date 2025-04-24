"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = void 0;
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../utils/bufferutils");
const varuint_1 = require("../utils/varuint");
const vdxf_1 = require("../constants/vdxf");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Credential {
    constructor(data) {
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
            this.setFlags();
        }
    }
    getByteLength() {
        let length = 0;
        length += 4; // version (UInt32)
        length += 4; // flags (UInt32)
        const credentialKeyLength = this.credentialKey.length;
        length += varuint_1.default.encodingLength(credentialKeyLength);
        length += credentialKeyLength;
        // Both the credential and scopes are serialized as JSON strings.
        const credStr = JSON.stringify(this.credential);
        const credentialLength = credStr.length;
        length += varuint_1.default.encodingLength(credentialLength);
        length += credentialLength;
        const scopesStr = JSON.stringify(this.scopes);
        const scopesLength = scopesStr.length;
        length += varuint_1.default.encodingLength(scopesLength);
        length += scopesLength;
        if (this.hasLabel()) {
            length += varuint_1.default.encodingLength(this.label.length);
            length += Buffer.from(this.label).length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeUInt32(this.version.toNumber());
        writer.writeUInt32(this.flags.toNumber());
        writer.writeVarSlice(Buffer.from(this.credentialKey));
        writer.writeVarSlice(Buffer.from(JSON.stringify(this.credential)));
        writer.writeVarSlice(Buffer.from(JSON.stringify(this.scopes)));
        if (this.hasLabel()) {
            writer.writeVarSlice(Buffer.from(this.label));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readUInt32(), 10);
        this.flags = new bn_js_1.BN(reader.readUInt32(), 10);
        this.credentialKey = Buffer.from(reader.readVarSlice()).toString();
        this.credential = JSON.parse(Buffer.from(reader.readVarSlice()).toString());
        this.scopes = JSON.parse(Buffer.from(reader.readVarSlice()).toString());
        if (this.hasLabel()) {
            this.label = Buffer.from(reader.readVarSlice()).toString();
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
    // The credentials is invalid if the version is not within the valid range or the key is null.
    isValid() {
        return this.version.gte(Credential.VERSION_FIRST) && this.version.lte(Credential.VERSION_LAST)
            && this.credentialKey !== vdxf_1.NULL_ADDRESS;
    }
    toJSON() {
        const ret = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            credentialKey: this.credentialKey,
            credential: this.credential,
            scopes: this.scopes,
            label: this.hasLabel() ? this.label : null
        };
        return ret;
    }
    static fromJSON(json) {
        return new Credential({
            version: json.version ? new bn_js_1.BN(json.version, 10) : undefined,
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            credentialKey: json.credentialKey,
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
