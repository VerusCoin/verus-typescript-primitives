import createHash = require("create-hash");
import {
  VerusIDSignatureInterface,
  LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY
} from "../../";
import { R_ADDR_VERSION, VERUS_DATA_SIGNATURE_PREFIX } from "../../../constants/vdxf";
import { fromBase58Check } from "../../../utils/address";
import bufferutils from "../../../utils/bufferutils";
import { Request } from "../Request";
import { ProvisioningChallenge, ProvisioningChallengeInterface } from "./ProvisioningChallenge";

export interface ProvisioningRequestInterface {
  signing_address?: string;
  signature?: VerusIDSignatureInterface;
  challenge: ProvisioningChallengeInterface;
}

export class ProvisioningRequest extends Request {
  signing_address?: string;
  challenge: ProvisioningChallenge;

  constructor(
    request: ProvisioningRequestInterface = {
      signing_address: "",
      challenge: new ProvisioningChallenge(),
    }
  ) {
    super(
      {
        system_id: null,
        signing_id: null,
        challenge: request.challenge,
        signature: request.signature,
      },
      LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY.vdxfid
    );

    this.challenge = new ProvisioningChallenge(request.challenge);
    this.signing_address = request.signing_address;
  }

  toJson() {
    return {
      vdxfkey: this.vdxfkey,
      system_id: null,
      signing_address: this.signing_address,
      signing_id: null,
      signature: this.signature ? this.signature.toJson() : this.signature,
      challenge: this.challenge.toJson(),
    };
  }

  getChallengeHash() {
    return createHash("sha256")
      .update(VERUS_DATA_SIGNATURE_PREFIX)
      .update(this.challenge.toSha256())
      .digest();
  }

  dataByteLength(): number {
    const length = this._dataByteLength(this.signing_address);

    return length;
  }

  toDataBuffer(): Buffer {
    const buffer = this._toDataBuffer(this.signing_address);

    return buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const frameReader = new bufferutils.BufferReader(buffer, offset);
    frameReader.readVarSlice();
    const bodyEnd = frameReader.offset;
    const boundedBuffer = buffer.subarray(0, bodyEnd);
    let _offset = this._fromDataBuffer(
      boundedBuffer,
      offset
    );

    this.challenge = new ProvisioningChallenge();
    _offset = this.challenge.fromBuffer(boundedBuffer, _offset);
    this.signing_address = this.signing_id;
    this.signing_id = null;

    if (_offset !== bodyEnd) throw new Error("Provisioning request body length mismatch");
    return _offset;
  }

  toWalletDeeplinkUri(): string {
    if (this.signature == null) throw new Error("Request must be signed before it can be used as a deep link")
    
    throw new Error("Cannot create deeplink from provisioning request");
  }

  static fromWalletDeeplinkUri(uri: string): Request {
    throw new Error("Cannot create provisioning request from deeplink");
  }
}
