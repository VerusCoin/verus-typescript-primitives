import { Decision, DecisionInterface } from "./Decision";
import { LOGIN_CONSENT_RESPONSE_VDXF_KEY, VDXFObject, VerusIDSignature, VerusIDSignatureInterface } from "../";
import { LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY, LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY } from "../keys";
import { Hash160 } from "./Hash160";
import bufferutils from "../../utils/bufferutils";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, VERUS_DATA_SIGNATURE_PREFIX } from "../../constants/vdxf";
import { fromBase58Check, toBase58Check } from "../../utils/address";
import createHash = require("create-hash");

export interface ResponseInterface {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignatureInterface;
  decision: DecisionInterface;
}

export class Response extends VDXFObject {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignature;
  decision: Decision;

  constructor(
    response: ResponseInterface = {
      system_id: "",
      signing_id: "",
      decision: new Decision(),
    },
    vdxfkey: string = LOGIN_CONSENT_RESPONSE_VDXF_KEY.vdxfid
  ) {
    super(vdxfkey);

    this.system_id = response.system_id;
    this.signing_id = response.signing_id;
    this.decision = new Decision(response.decision);

    if (response.signature) {
      this.signature = new VerusIDSignature(
        response.signature,
        LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY
      );
    }
  }

  getDecisionHash(signedBlockheight: number, signatureVersion: number = 2) {
    var heightBufferWriter = new bufferutils.BufferWriter(
      Buffer.allocUnsafe(4)
    );
    heightBufferWriter.writeUInt32(signedBlockheight);

    if (signatureVersion === 1) {
      return createHash("sha256")
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(fromBase58Check(this.system_id).hash)
        .update(heightBufferWriter.buffer)
        .update(fromBase58Check(this.signing_id).hash)
        .update(this.decision.toSha256())
        .digest();
    } else {
      return createHash("sha256")
        .update(fromBase58Check(this.system_id).hash)
        .update(heightBufferWriter.buffer)
        .update(fromBase58Check(this.signing_id).hash)
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(this.decision.toSha256())
        .digest();
    }
  }

  dataByteLength(): number {
    let length = 0;
    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
          { signature: "" },
          LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY
        );

    length += _system_id.byteLength();
    length += _signing_id.byteLength();
    length += _signature.byteLength();
    length += this.decision.byteLength();

    return length;
  }

  toDataBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.dataByteLength())
    );
    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
          { signature: "" },
          LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY
        );

    writer.writeSlice(_system_id.toBuffer());

    writer.writeSlice(_signing_id.toBuffer());

    writer.writeSlice(_signature.toBuffer());

    writer.writeSlice(this.decision.toBuffer());

    return writer.buffer;
  }

  fromDataBuffer(
    buffer: Buffer,
    offset?: number
  ): number {
    const frameReader = new bufferutils.BufferReader(buffer, offset);
    const reqLength = frameReader.readCompactSize();
    const bodyOffset = frameReader.offset;
    const reader = new bufferutils.BufferReader(frameReader.readSlice(reqLength));

    if (reqLength == 0) {
      throw new Error("Cannot create request from empty buffer");
    } else {
      this.system_id = toBase58Check(
        reader.readSlice(HASH160_BYTE_LENGTH),
        I_ADDR_VERSION
      );

      this.signing_id = toBase58Check(
        reader.readSlice(HASH160_BYTE_LENGTH),
        I_ADDR_VERSION
      );

      const _sig = new VerusIDSignature();
      reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
      this.signature = _sig;

      if (this.vdxfkey === LOGIN_CONSENT_RESPONSE_VDXF_KEY.vdxfid) {
        const _decision = new Decision();
        reader.offset = _decision.fromBuffer(reader.buffer, reader.offset);
        this.decision = _decision;
      }
    }

    // ProvisioningResponse consumes its decision after this shared prefix.
    if (this.vdxfkey !== LOGIN_CONSENT_PROVISIONING_RESPONSE_VDXF_KEY.vdxfid && reader.offset !== reqLength) {
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