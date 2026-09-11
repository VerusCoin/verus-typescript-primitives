"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const __1 = require("../");
const keys_1 = require("../keys");
const Challenge_1 = require("./Challenge");
const Hash160_1 = require("./Hash160");
const bufferutils_1 = require("../../utils/bufferutils");
const vdxf_1 = require("../../constants/vdxf");
const address_1 = require("../../utils/address");
const createHash = require("create-hash");
const base64url_1 = require("base64url");
class Request extends __1.VDXFObject {
    constructor(request = {
        system_id: "",
        signing_id: "",
        challenge: new Challenge_1.Challenge(),
    }, vdxfkey = __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
        super(vdxfkey);
        this.system_id = request.system_id;
        this.signing_id = request.signing_id;
        this.signature = request.signature
            ? new __1.VerusIDSignature(request.signature, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY)
            : undefined;
        this.challenge = new Challenge_1.Challenge(request.challenge);
    }
    getChallengeHash(signedBlockheight, signatureVersion = 2) {
        var heightBufferWriter = new bufferutils_1.default.BufferWriter(Buffer.allocUnsafe(4));
        heightBufferWriter.writeUInt32(signedBlockheight);
        if (signatureVersion === 1) {
            return createHash("sha256")
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(this.challenge.toSha256())
                .digest();
        }
        else {
            return createHash("sha256")
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update(this.challenge.toSha256())
                .digest();
        }
    }
    toJson() {
        return {
            vdxfkey: this.vdxfkey,
            system_id: this.system_id,
            signing_id: this.signing_id,
            signature: this.signature ? this.signature.toJson() : this.signature,
            challenge: this.challenge.toJson(),
        };
    }
    _dataByteLength(signer = this.signing_id) {
        let length = 0;
        const _signing_id = Hash160_1.Hash160.fromAddress(signer);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY);
        if (this.vdxfkey === __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
            const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
            length += _system_id.byteLength();
        }
        length += _signing_id.byteLength();
        length += _signature.byteLength();
        length += this.challenge.byteLength();
        return length;
    }
    _toDataBuffer(signer = this.signing_id) {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.dataByteLength()));
        const _signing_id = Hash160_1.Hash160.fromAddress(signer);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.IDENTITY_AUTH_SIG_VDXF_KEY);
        if (this.vdxfkey === __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
            const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
            writer.writeSlice(_system_id.toBuffer());
        }
        writer.writeSlice(_signing_id.toBuffer());
        writer.writeSlice(_signature.toBuffer());
        writer.writeSlice(this.challenge.toBuffer());
        return writer.buffer;
    }
    dataByteLength() {
        return this._dataByteLength();
    }
    toDataBuffer() {
        return this._toDataBuffer();
    }
    _fromDataBuffer(buffer, offset) {
        const frameReader = new bufferutils_1.default.BufferReader(buffer, offset);
        const reqLength = frameReader.readCompactSize();
        const bodyOffset = frameReader.offset;
        const reader = new bufferutils_1.default.BufferReader(frameReader.readSlice(reqLength));
        if (reqLength == 0) {
            throw new Error("Cannot create request from empty buffer");
        }
        else {
            if (this.vdxfkey === __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
                this.system_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            }
            this.signing_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), this.vdxfkey === __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid
                ? vdxf_1.I_ADDR_VERSION
                : vdxf_1.R_ADDR_VERSION);
            const _sig = new __1.VerusIDSignature();
            reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
            this.signature = _sig;
            if (this.vdxfkey === __1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
                const _challenge = new Challenge_1.Challenge();
                reader.offset = _challenge.fromBuffer(reader.buffer, reader.offset);
                this.challenge = _challenge;
            }
        }
        // ProvisioningRequest consumes its challenge after this shared prefix.
        if (this.vdxfkey !== __1.LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY.vdxfid && reader.offset !== reqLength) {
            throw new Error("Request body length mismatch");
        }
        return bodyOffset + reader.offset;
    }
    fromDataBuffer(buffer, offset) {
        return this._fromDataBuffer(buffer, offset);
    }
    toWalletDeeplinkUri() {
        if (this.signature == null)
            throw new Error("Request must be signed before it can be used as a deep link");
        return `${__1.WALLET_VDXF_KEY.vdxfid.toLowerCase()}://x-callback-url/${__1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid}/?${__1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid}=${this.toString()}`;
    }
    static fromWalletDeeplinkUri(uri) {
        const split = uri.split(`${__1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid}=`);
        const req = new Request();
        req.fromBuffer(base64url_1.default.toBuffer(split[1]));
        return req;
    }
    toQrString() {
        if (this.signature == null)
            throw new Error("Request must be signed before it can be used as a deep link");
        return this.toString(true);
    }
    static fromQrString(qrstring) {
        const req = new Request();
        req.fromBuffer(base64url_1.default.toBuffer(qrstring));
        return req;
    }
}
exports.Request = Request;
