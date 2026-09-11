"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignedSessionObject = void 0;
const __1 = require("../../");
const keys_1 = require("../../keys");
const Hash160_1 = require("../Hash160");
const bufferutils_1 = require("../../../utils/bufferutils");
const vdxf_1 = require("../../../constants/vdxf");
const address_1 = require("../../../utils/address");
const createHash = require("create-hash");
const SignedSessionObjectData_1 = require("./SignedSessionObjectData");
/**
 * @deprecated Disabled and scheduled for removal in a future release. Construction always throws.
 */
class SignedSessionObject extends __1.VDXFObject {
    constructor(request = {
        system_id: "",
        signing_id: "",
        data: new SignedSessionObjectData_1.SignedSessionObjectData(),
    }) {
        super(keys_1.SIGNED_SESSION_OBJECT.vdxfid);
        throw new Error("SignedSessionObject is deprecated and disabled; it will be removed in a future release.");
    }
    getDataHash(signedBlockheight, signatureVersion = 2) {
        var heightBufferWriter = new bufferutils_1.default.BufferWriter(Buffer.allocUnsafe(4));
        heightBufferWriter.writeUInt32(signedBlockheight);
        if (signatureVersion === 1) {
            return createHash("sha256")
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(this.data.toSha256())
                .digest();
        }
        else {
            return createHash("sha256")
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update(this.data.toSha256())
                .digest();
        }
    }
    toJson() {
        return {
            vdxfkey: this.vdxfkey,
            system_id: this.system_id,
            signing_id: this.signing_id,
            signature: this.signature ? this.signature.toJson() : this.signature,
            challenge: this.data.toJson(),
        };
    }
    _dataByteLength(signer = this.signing_id) {
        let length = 0;
        const _signing_id = Hash160_1.Hash160.fromAddress(signer);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY);
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        length += _system_id.byteLength();
        length += _signing_id.byteLength();
        length += _signature.byteLength();
        length += this.data.byteLength();
        return length;
    }
    _toDataBuffer(signer = this.signing_id) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.dataByteLength()));
        const _signing_id = Hash160_1.Hash160.fromAddress(signer);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY);
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        writer.writeSlice(_system_id.toBuffer());
        writer.writeSlice(_signing_id.toBuffer());
        writer.writeSlice(_signature.toBuffer());
        writer.writeSlice(this.data.toBuffer());
        return writer.buffer;
    }
    dataByteLength() {
        return this._dataByteLength();
    }
    toDataBuffer() {
        return this._toDataBuffer();
    }
    _fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const reqLength = reader.readCompactSize();
        if (reqLength == 0) {
            throw new Error("Cannot create signed session object from empty buffer");
        }
        else {
            this.system_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            this.signing_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            const _sig = new __1.VerusIDSignature();
            reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
            this.signature = _sig;
            const _data = new SignedSessionObjectData_1.SignedSessionObjectData();
            reader.offset = _data.fromBuffer(reader.buffer, reader.offset);
            this.data = _data;
        }
        return reader.offset;
    }
    fromDataBuffer(buffer, offset) {
        return this._fromDataBuffer(buffer, offset);
    }
    getHeaders() {
        return {
            ['VDXF-Key']: this.vdxfkey, // VDXF key of signed session object (SSO), denoting that this is a SSO
            ['VDXF-Version']: this.version.toString(), // SSO version
            ['VerusID-Session-ID']: this.data.session_id, // Session ID of original response made
            ['VerusID-Timestamp-Micro']: this.data.timestamp_micro.toString(), // Microsecond timestamp
            ['VerusID-Signature']: this.signature.signature // Signature of this SSO serialized
        };
    }
    static fromHttpRequest(headers, body, system_id, signing_id) {
        return new SignedSessionObject({
            system_id,
            signing_id,
            signature: new __1.VerusIDSignature({ signature: headers['VerusID-Signature'] }, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY),
            data: new SignedSessionObjectData_1.SignedSessionObjectData({
                session_id: headers['VerusID-Session-ID'],
                timestamp_micro: Number(headers['VerusID-Timestamp-Micro']),
                body
            })
        });
    }
}
exports.SignedSessionObject = SignedSessionObject;
