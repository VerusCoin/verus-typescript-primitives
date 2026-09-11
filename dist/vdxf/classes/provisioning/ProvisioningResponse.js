"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningResponse = void 0;
const __1 = require("../../");
const ProvisioningDecision_1 = require("./ProvisioningDecision");
const Response_1 = require("../Response");
const bufferutils_1 = require("../../../utils/bufferutils");
class ProvisioningResponse extends Response_1.Response {
    constructor(response = {
        system_id: "",
        signing_id: "",
        decision: new ProvisioningDecision_1.ProvisioningDecision(),
    }) {
        super({
            system_id: response.system_id,
            signing_id: response.signing_id,
            signature: response.signature,
            decision: response.decision,
        }, __1.LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY.vdxfid);
        this.decision = new ProvisioningDecision_1.ProvisioningDecision(response.decision);
    }
    fromDataBuffer(buffer, offset) {
        const frameReader = new bufferutils_1.default.BufferReader(buffer, offset);
        frameReader.readVarSlice();
        const bodyEnd = frameReader.offset;
        const boundedBuffer = buffer.subarray(0, bodyEnd);
        let _offset = super.fromDataBuffer(boundedBuffer, offset);
        this.decision = new ProvisioningDecision_1.ProvisioningDecision();
        _offset = this.decision.fromBuffer(boundedBuffer, _offset);
        if (_offset !== bodyEnd)
            throw new Error("Provisioning response body length mismatch");
        return _offset;
    }
}
exports.ProvisioningResponse = ProvisioningResponse;
