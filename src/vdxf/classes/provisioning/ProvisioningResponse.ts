import { LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY, VerusIDSignatureInterface } from "../../";
import { ProvisioningDecision, ProvisioningDecisionInterface } from "./ProvisioningDecision";
import { Response } from "../Response";
import bufferutils from "../../../utils/bufferutils";

export interface ProvisioningResponseInterface {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignatureInterface;
  decision: ProvisioningDecisionInterface;
}

export class ProvisioningResponse extends Response {
  constructor(
    response: ProvisioningResponseInterface = {
      system_id: "",
      signing_id: "",
      decision: new ProvisioningDecision(),
    }
  ) {
    super(
      {
        system_id: response.system_id,
        signing_id: response.signing_id,
        signature: response.signature,
        decision: response.decision,
      },
      LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY.vdxfid
    );

    this.decision = new ProvisioningDecision(response.decision);
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const frameReader = new bufferutils.BufferReader(buffer, offset);
    frameReader.readVarSlice();
    const bodyEnd = frameReader.offset;
    const boundedBuffer = buffer.subarray(0, bodyEnd);
    let _offset = super.fromDataBuffer(boundedBuffer, offset);

    this.decision = new ProvisioningDecision();
    _offset = this.decision.fromBuffer(boundedBuffer, _offset);

    if (_offset !== bodyEnd) throw new Error("Provisioning response body length mismatch");
    return _offset;
  }
}