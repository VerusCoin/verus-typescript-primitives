"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = void 0;
const Decision_1 = require("./Decision");
const __1 = require("../");
const keys_1 = require("../keys");
const Hash160_1 = require("./Hash160");
const bufferutils_1 = require("../../utils/bufferutils");
const vdxf_1 = require("../../constants/vdxf");
const address_1 = require("../../utils/address");
const createHash = require("create-hash");
class Response extends __1.VDXFObject {
    constructor(response = {
        system_id: "",
        signing_id: "",
        decision: new Decision_1.Decision(),
    }, vdxfkey = __1.LOGIN_CONSENT_RESPONSE_VDXF_KEY.vdxfid) {
        super(vdxfkey);
        this.system_id = response.system_id;
        this.signing_id = response.signing_id;
        this.decision = new Decision_1.Decision(response.decision);
        if (response.signature) {
            this.signature = new __1.VerusIDSignature(response.signature, keys_1.LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY);
        }
    }
    getDecisionHash(signedBlockheight, signatureVersion = 2) {
        var heightBufferWriter = new bufferutils_1.default.BufferWriter(Buffer.allocUnsafe(4));
        heightBufferWriter.writeUInt32(signedBlockheight);
        if (signatureVersion === 1) {
            return createHash("sha256")
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(this.decision.toSha256())
                .digest();
        }
        else {
            return createHash("sha256")
                .update((0, address_1.fromBase58Check)(this.system_id).hash)
                .update(heightBufferWriter.buffer)
                .update((0, address_1.fromBase58Check)(this.signing_id).hash)
                .update(vdxf_1.VERUS_DATA_SIGNATURE_PREFIX)
                .update(this.decision.toSha256())
                .digest();
        }
    }
    dataByteLength() {
        let length = 0;
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY);
        length += _system_id.byteLength();
        length += _signing_id.byteLength();
        length += _signature.byteLength();
        length += this.decision.byteLength();
        return length;
    }
    toDataBuffer() {
        const writer = new bufferutils_1.default.BufferWriter(Buffer.alloc(this.dataByteLength()));
        const _system_id = Hash160_1.Hash160.fromAddress(this.system_id);
        const _signing_id = Hash160_1.Hash160.fromAddress(this.signing_id);
        const _signature = this.signature
            ? this.signature
            : new __1.VerusIDSignature({ signature: "" }, keys_1.LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY);
        writer.writeSlice(_system_id.toBuffer());
        writer.writeSlice(_signing_id.toBuffer());
        writer.writeSlice(_signature.toBuffer());
        writer.writeSlice(this.decision.toBuffer());
        return writer.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const frameReader = new bufferutils_1.default.BufferReader(buffer, offset);
        const reqLength = frameReader.readCompactSize();
        const bodyOffset = frameReader.offset;
        const reader = new bufferutils_1.default.BufferReader(frameReader.readSlice(reqLength));
        if (reqLength == 0) {
            throw new Error("Cannot create request from empty buffer");
        }
        else {
            this.system_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            this.signing_id = (0, address_1.toBase58Check)(reader.readSlice(vdxf_1.HASH160_BYTE_LENGTH), vdxf_1.I_ADDR_VERSION);
            const _sig = new __1.VerusIDSignature();
            reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
            this.signature = _sig;
            if (this.vdxfkey === __1.LOGIN_CONSENT_RESPONSE_VDXF_KEY.vdxfid) {
                const _decision = new Decision_1.Decision();
                reader.offset = _decision.fromBuffer(reader.buffer, reader.offset);
                this.decision = _decision;
            }
        }
        // ProvisioningResponse consumes its decision after this shared prefix.
        if (this.vdxfkey !== keys_1.LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY.vdxfid && reader.offset !== reqLength) {
            throw new Error("Response body length mismatch");
        }
        return bodyOffset + reader.offset;
    }
    toJson() {
        return {
            vdxfkey: this.vdxfkey,
            system_id: this.system_id,
            signature: this.signature,
            signing_id: this.signing_id,
            decision: this.decision.toJson(),
        };
    }
}
exports.Response = Response;
