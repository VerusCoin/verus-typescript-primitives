"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningDecision = void 0;
const bufferutils_1 = require("../../../utils/bufferutils");
const Decision_1 = require("../Decision");
const ProvisioningRequest_1 = require("./ProvisioningRequest");
const __1 = require("../../");
const ProvisioningResult_1 = require("./ProvisioningResult");
class ProvisioningDecision extends Decision_1.Decision {
    constructor(decision = {
        decision_id: "",
        created_at: 0,
        request: new ProvisioningRequest_1.ProvisioningRequest(),
    }) {
        super({
            decision_id: decision.decision_id,
            created_at: decision.created_at,
            salt: decision.salt,
            context: decision.context,
            request: decision.request,
        }, __1.LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY.vdxfid);
        this.result =
            decision.result != null
                ? new ProvisioningResult_1.ProvisioningResult(decision.result)
                : decision.result;
        this.request = new ProvisioningRequest_1.ProvisioningRequest(decision.request);
    }
    dataByteLength() {
        return super.dataByteLength() + this.result.byteLength();
    }
    toDataBuffer() {
        const superBuf = super.toDataBuffer();
        const resultBuf = this.result
            ? this.result.toBuffer()
            : new ProvisioningResult_1.ProvisioningResult({
                state: __1.LOGIN_CONSENT_PROVISIONING_RESULT_STATE_FAILED.vdxfid,
            }).toBuffer();
        const writer = new bufferutils_1.default.BufferWriter(superBuf, super.dataByteLength());
        writer.writeSlice(resultBuf);
        return writer.buffer;
    }
    toJson() {
        this.validateSupportedFields();
        return {
            vdxfkey: this.vdxfkey,
            decision_id: this.decision_id,
            created_at: this.created_at,
            salt: this.salt,
            result: this.result ? this.result.toJson() : null,
            request: this.request.toJson(),
            context: this.context ? this.context.toJson() : null,
        };
    }
    fromDataBuffer(buffer, offset) {
        const decision = new Decision_1.Decision(undefined, __1.LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY.vdxfid);
        let _offset = decision.fromDataBuffer(buffer, offset, false);
        const reader = new bufferutils_1.default.BufferReader(buffer, _offset);
        this.request = new ProvisioningRequest_1.ProvisioningRequest();
        reader.offset = this.request.fromBuffer(buffer, _offset);
        const _result = new ProvisioningResult_1.ProvisioningResult();
        reader.offset = _result.fromBuffer(reader.buffer, reader.offset);
        this.result = _result;
        this.decision_id = decision.decision_id;
        this.created_at = decision.created_at;
        this.salt = decision.salt;
        this.context = decision.context;
        return reader.offset;
    }
}
exports.ProvisioningDecision = ProvisioningDecision;
