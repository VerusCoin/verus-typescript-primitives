import bufferutils from "../../../utils/bufferutils";
import { Decision } from "../Decision";
import { Context } from "../Context";
import { ProvisioningRequest } from "./ProvisioningRequest";
import {
  LOGIN_CONSENT_PROVISIONING_RESULT_STATE_FAILED,
  LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY,
} from "../../";
import { ProvisioningResult } from "./ProvisioningResult";

export interface ProvisioningDecisionInterface {
  // Decision specific VDXF key
  decision_id: string;

  // String of unix representation of date string
  created_at: number;

  // Random hash string
  salt?: string;

  // Result of provisioning request
  result?: ProvisioningResult;

  // Provisioning request
  request: ProvisioningRequest;

  context?: Context;
}

export class ProvisioningDecision
  extends Decision
  implements ProvisioningDecisionInterface
{
  result?: ProvisioningResult;
  salt?: string;
  request: ProvisioningRequest;

  constructor(
    decision: ProvisioningDecisionInterface = {
      decision_id: "",
      created_at: 0,
      request: new ProvisioningRequest(),
    }
  ) {
    super(
      {
        decision_id: decision.decision_id,
        created_at: decision.created_at,
        salt: decision.salt,
        context: decision.context,
        request: decision.request,
      },
      LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY.vdxfid
    );

    this.result =
      decision.result != null
        ? new ProvisioningResult(decision.result)
        : decision.result;

    this.request = new ProvisioningRequest(decision.request)
  }

  dataByteLength(): number {
    return super.dataByteLength() + this.result.byteLength();
  }

  toDataBuffer(): Buffer {
    const superBuf = super.toDataBuffer();

    const resultBuf = this.result
      ? this.result.toBuffer()
      : new ProvisioningResult({
          state: LOGIN_CONSENT_PROVISIONING_RESULT_STATE_FAILED.vdxfid,
        }).toBuffer();

    const writer = new bufferutils.BufferWriter(
      superBuf,
      super.dataByteLength()
    );

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

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const decision = new Decision(
      undefined,
      LOGIN_CONSENT_PROVISIONING_DECISION_VDXF_KEY.vdxfid
    );
    let _offset = decision.fromDataBuffer(buffer, offset, false);
    const reader = new bufferutils.BufferReader(buffer, _offset);

    this.request = new ProvisioningRequest()
    reader.offset = this.request.fromBuffer(buffer, _offset)

    const _result = new ProvisioningResult();
    reader.offset = _result.fromBuffer(reader.buffer, reader.offset);
    this.result = _result;

    this.decision_id = decision.decision_id;
    this.created_at = decision.created_at;
    this.salt = decision.salt;
    this.context = decision.context;

    return reader.offset;
  }
}
