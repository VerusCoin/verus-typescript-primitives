"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Credential = void 0;
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../utils/bufferutils");
const varuint_1 = require("../utils/varuint");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class Credential {
    constructor(data) {
        this.version = Credential.VERSION_INVALID;
        this.flags = new bn_js_1.BN(0, 10);
        this.credentialType = Credential.CREDENTIAL_UNKNOWN;
        this.credential = "";
        this.recipient = "";
        this.note = "";
        if (data) {
            if (data.flags)
                this.flags = data.flags;
            if (data.version)
                this.version = data.version;
            if (data.credentialType)
                this.credentialType = data.credentialType;
            if (data.credential)
                this.credential = data.credential;
            if (data.recipient)
                this.recipient = data.recipient;
            if (data.note)
                this.note = data.note;
            this.setFlags();
        }
    }
    getByteLength() {
        let length = 0;
        length += 4; // version (UInt32)
        length += 4; // flags (UInt32)
        length += 4; // credentialType (UInt32)
        const credentialLength = this.credential.length;
        length += varuint_1.default.encodingLength(credentialLength);
        length += credentialLength;
        const recipientLength = this.recipient.length;
        length += varuint_1.default.encodingLength(recipientLength);
        length += recipientLength;
        if (this.hasNote()) {
            length += varuint_1.default.encodingLength(this.note.length);
            length += Buffer.from(this.note).length;
        }
        return length;
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeUInt32(this.version.toNumber());
        writer.writeUInt32(this.flags.toNumber());
        writer.writeUInt32(this.credentialType.toNumber());
        writer.writeVarSlice(Buffer.from(this.credential));
        writer.writeVarSlice(Buffer.from(this.recipient));
        if (this.hasNote()) {
            writer.writeVarSlice(Buffer.from(this.note));
        }
        return writer.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new BufferReader(buffer, offset);
        this.version = new bn_js_1.BN(reader.readUInt32(), 10);
        this.flags = new bn_js_1.BN(reader.readUInt32(), 10);
        this.credentialType = new bn_js_1.BN(reader.readUInt32(), 10);
        this.credential = Buffer.from(reader.readVarSlice()).toString();
        this.recipient = Buffer.from(reader.readVarSlice()).toString();
        if (this.hasNote()) {
            this.note = Buffer.from(reader.readVarSlice()).toString();
        }
        return reader.offset;
    }
    hasNote() {
        return this.flags.and(Credential.FLAG_NOTE_PRESENT).gt(new bn_js_1.BN(0, 10));
    }
    calcFlags() {
        return this.note.length > 0 ? Credential.FLAG_NOTE_PRESENT : new bn_js_1.BN(0, 10);
    }
    setFlags() {
        this.flags = this.calcFlags();
    }
    isValid() {
        return this.version.gte(Credential.VERSION_FIRST) && this.version.lte(Credential.VERSION_LAST);
    }
    toJSON() {
        const ret = {
            version: this.version.toNumber(),
            flags: this.flags.toNumber(),
            credentialType: this.credentialType.toNumber(),
            credential: this.credential,
            recipient: this.recipient,
            note: this.hasNote() ? this.note : null
        };
        return ret;
    }
    static fromJSON(json) {
        return new Credential({
            version: json.version ? new bn_js_1.BN(json.version, 10) : undefined,
            flags: json.flags ? new bn_js_1.BN(json.flags, 10) : undefined,
            credentialType: json.credentialType ? new bn_js_1.BN(json.credentialType, 10) : undefined,
            credential: json.credential,
            recipient: json.recipient,
            note: json.note,
        });
    }
}
exports.Credential = Credential;
// Credential enum types 
Credential.VERSION_INVALID = new bn_js_1.BN(0, 10);
Credential.VERSION_FIRST = new bn_js_1.BN(1, 10);
Credential.VERSION_LAST = new bn_js_1.BN(1, 10);
Credential.VERSION_CURRENT = new bn_js_1.BN(1, 10);
Credential.FLAG_NOTE_PRESENT = new bn_js_1.BN(1, 10);
// Credential type definitions
Credential.CREDENTIAL_UNKNOWN = new bn_js_1.BN(0, 10); // unknown credential
Credential.CREDENTIAL_USERNAME = new bn_js_1.BN(1, 10);
Credential.CREDENTIAL_PASSWORD = new bn_js_1.BN(2, 10);
Credential.CREDENTIAL_CARD_NUMBER = new bn_js_1.BN(3, 10); // payment credentials
Credential.CREDENTIAL_CARD_EXPIRATION_MONTH = new bn_js_1.BN(4, 10);
Credential.CREDENTIAL_CARD_EXPIRATION_YEAR = new bn_js_1.BN(5, 10);
Credential.CREDENTIAL_CARD_SECURITY_CODE = new bn_js_1.BN(6, 10);
Credential.CREDENTIAL_ADDRESS = new bn_js_1.BN(7, 10);
Credential.CREDENTIAL_AREA_CODE = new bn_js_1.BN(8, 10);
Credential.CREDENTIAL_DATE_OF_BIRTH = new bn_js_1.BN(9, 10);
Credential.CREDENTIAL_ID = new bn_js_1.BN(10, 10);
