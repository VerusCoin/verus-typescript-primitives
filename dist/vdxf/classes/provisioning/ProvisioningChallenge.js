"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningChallenge = void 0;
const bufferutils_1 = require("../../../utils/bufferutils");
const varuint_1 = require("../../../utils/varuint");
const keys_1 = require("../../keys");
const Challenge_1 = require("../Challenge");
const Hash160_1 = require("../Hash160");
class ProvisioningChallenge extends Challenge_1.Challenge {
    constructor(challenge = { challenge_id: "", created_at: 0 }) {
        super({
            challenge_id: challenge.challenge_id,
            created_at: challenge.created_at,
            salt: challenge.salt,
            context: challenge.context,
        }, keys_1.LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY.vdxfid);
        this.name = challenge.name;
        this.system_id = challenge.system_id;
        this.parent = challenge.parent;
    }
    dataByteLength() {
        const nameBuf = Buffer.from(this.name, 'utf-8');
        let length = 0;
        length += nameBuf.length;
        length += varuint_1.default.encodingLength(nameBuf.length);
        length += this.system_id ? Hash160_1.Hash160.fromAddress(this.system_id, true).byteLength()
            : Hash160_1.Hash160.getEmpty().byteLength();
        length += this.parent ? Hash160_1.Hash160.fromAddress(this.parent, true).byteLength()
            : Hash160_1.Hash160.getEmpty().byteLength();
        return super.dataByteLength() + length;
    }
    toDataBuffer() {
        const superBuf = super.toDataBuffer();
        const writer = new bufferutils_1.default.BufferWriter(superBuf, super.dataByteLength());
        writer.writeVarSlice(Buffer.from(this.name, 'utf-8'));
        writer.writeSlice(this.system_id
            ? Hash160_1.Hash160.fromAddress(this.system_id, true).toBuffer()
            : Hash160_1.Hash160.getEmpty().toBuffer());
        writer.writeSlice(this.parent
            ? Hash160_1.Hash160.fromAddress(this.parent, true).toBuffer()
            : Hash160_1.Hash160.getEmpty().toBuffer());
        return writer.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const frameReader = new bufferutils_1.default.BufferReader(buffer, offset);
        frameReader.readVarSlice();
        const bodyEnd = frameReader.offset;
        const boundedBuffer = buffer.subarray(0, bodyEnd);
        const challenge = new Challenge_1.Challenge(undefined, keys_1.LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY.vdxfid);
        let _offset = challenge.fromDataBuffer(boundedBuffer, offset);
        const reader = new bufferutils_1.default.BufferReader(boundedBuffer, _offset);
        this.name = reader.readVarSlice().toString('utf-8');
        const _system_id = new Hash160_1.Hash160();
        reader.offset = _system_id.fromBuffer(reader.buffer, true, reader.offset);
        this.system_id = _system_id.toAddress();
        const _parent = new Hash160_1.Hash160();
        reader.offset = _parent.fromBuffer(reader.buffer, true, reader.offset);
        this.parent = _parent.toAddress();
        this.challenge_id = challenge.challenge_id;
        this.created_at = challenge.created_at;
        this.salt = challenge.salt;
        this.context = challenge.context;
        if (reader.offset !== bodyEnd)
            throw new Error("Provisioning challenge body length mismatch");
        return reader.offset;
    }
    // toJson
    toJson() {
        this.validateSupportedFields();
        return {
            vdxfkey: this.vdxfkey,
            challenge_id: this.challenge_id,
            created_at: this.created_at,
            salt: this.salt,
            name: this.name,
            system_id: this.system_id,
            parent: this.parent,
            context: this.context,
            requested_access: undefined,
            requested_access_audience: undefined,
            subject: undefined,
            provisioning_info: undefined,
            alt_auth_factors: undefined,
            session_id: undefined,
            attestations: undefined,
            skip: undefined,
            redirect_uris: undefined
        };
    }
}
exports.ProvisioningChallenge = ProvisioningChallenge;
