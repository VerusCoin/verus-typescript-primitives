"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Request = void 0;
const __1 = require("../");
const keys_1 = require("../keys");
const Challenge_1 = require("./Challenge");
class Request extends __1.VDXFObject {
    constructor(request) {
        super(__1.LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid);
        this.chain_id = request.chain_id;
        this.signing_id = request.signing_id;
        this.signature = new __1.VerusIDSignature(request.signature, keys_1.LOGIN_CONSENT_REQUEST_SIG_VDXF_KEY);
        this.challenge = new Challenge_1.Challenge(request.challenge);
    }
    getSignedData() {
        return this.challenge.toString();
    }
    stringable() {
        return {
            vdxfkey: this.vdxfkey,
            chain_id: this.chain_id,
            signing_id: this.signing_id,
            signature: this.signature.stringable(),
            challenge: this.challenge.stringable(),
        };
    }
}
exports.Request = Request;
