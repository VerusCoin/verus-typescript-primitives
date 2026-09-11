import {
  LOGIN_CONSENT_REQUEST_VDXF_KEY,
  LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY,
  WALLET_VDXF_KEY,
  VDXFObject,
  VerusIDSignature,
  VerusIDSignatureInterface,
} from "../";
import { IDENTITY_AUTH_SIG_VDXF_KEY } from "../keys";
import { Challenge, ChallengeInterface } from "./Challenge";
import { Hash160 } from "./Hash160";
import bufferutils from "../../utils/bufferutils";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, R_ADDR_VERSION, VERUS_DATA_SIGNATURE_PREFIX } from "../../constants/vdxf";
import { fromBase58Check, toBase58Check } from "../../utils/address";
import createHash = require("create-hash");
import base64url from "base64url";

export interface RequestInterface {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignatureInterface;
  challenge: ChallengeInterface;
}

export class Request extends VDXFObject {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignature;
  challenge: Challenge;

  constructor(
    request: RequestInterface = {
      system_id: "",
      signing_id: "",
      challenge: new Challenge(),
    },
    vdxfkey: string = LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid
  ) {
    super(vdxfkey);

    this.system_id = request.system_id;
    this.signing_id = request.signing_id;
    this.signature = request.signature
      ? new VerusIDSignature(
          request.signature,
          IDENTITY_AUTH_SIG_VDXF_KEY
        )
      : undefined;
    this.challenge = new Challenge(request.challenge);
  }

  getChallengeHash(signedBlockheight: number, signatureVersion: number = 2) {
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
        .update(this.challenge.toSha256())
        .digest();
    } else {
      return createHash("sha256")
        .update(fromBase58Check(this.system_id).hash)
        .update(heightBufferWriter.buffer)
        .update(fromBase58Check(this.signing_id).hash)
        .update(VERUS_DATA_SIGNATURE_PREFIX)
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

  protected _dataByteLength(signer: string = this.signing_id): number {
    let length = 0;
    const _signing_id = Hash160.fromAddress(signer);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
          { signature: "" },
          IDENTITY_AUTH_SIG_VDXF_KEY
        );

    if (this.vdxfkey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
      const _system_id = Hash160.fromAddress(this.system_id);
      length += _system_id.byteLength();
    }

    length += _signing_id.byteLength();
    length += _signature.byteLength();
    length += this.challenge.byteLength();

    return length;
  }

  protected _toDataBuffer(signer: string = this.signing_id): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.dataByteLength())
    );
    const _signing_id = Hash160.fromAddress(signer);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
          { signature: "" },
          IDENTITY_AUTH_SIG_VDXF_KEY
        );

    if (this.vdxfkey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
      const _system_id = Hash160.fromAddress(this.system_id);
      writer.writeSlice(_system_id.toBuffer());
    }

    writer.writeSlice(_signing_id.toBuffer());

    writer.writeSlice(_signature.toBuffer());

    writer.writeSlice(this.challenge.toBuffer());

    return writer.buffer;
  }

  dataByteLength(): number {
    return this._dataByteLength();
  }

  toDataBuffer(): Buffer {
    return this._toDataBuffer();
  }

  protected _fromDataBuffer(buffer: Buffer, offset?: number): number {
    const frameReader = new bufferutils.BufferReader(buffer, offset);
    const reqLength = frameReader.readCompactSize();
    const bodyOffset = frameReader.offset;
    const reader = new bufferutils.BufferReader(frameReader.readSlice(reqLength));

    if (reqLength == 0) {
      throw new Error("Cannot create request from empty buffer");
    } else {
      if (this.vdxfkey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
        this.system_id = toBase58Check(
          reader.readSlice(HASH160_BYTE_LENGTH),
          I_ADDR_VERSION
        );
      }

      this.signing_id = toBase58Check(
        reader.readSlice(HASH160_BYTE_LENGTH),
        this.vdxfkey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid
          ? I_ADDR_VERSION
          : R_ADDR_VERSION
      );

      const _sig = new VerusIDSignature();
      reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
      this.signature = _sig;

      if (this.vdxfkey === LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid) {
        const _challenge = new Challenge();
        reader.offset = _challenge.fromBuffer(reader.buffer, reader.offset);
        this.challenge = _challenge;
      }
    }

    // ProvisioningRequest consumes its challenge after this shared prefix.
    if (this.vdxfkey !== LOGIN_CONSENT_PROVISIONING_REQUEST_VDXF_KEY.vdxfid && reader.offset !== reqLength) {
      throw new Error("Request body length mismatch");
    }
    return bodyOffset + reader.offset;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    return this._fromDataBuffer(buffer, offset);
  }

  toWalletDeeplinkUri(): string {
    if (this.signature == null) throw new Error("Request must be signed before it can be used as a deep link")

    return `${WALLET_VDXF_KEY.vdxfid.toLowerCase()}://x-callback-url/${
      LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid
    }/?${LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid}=${this.toString()}`;
  }

  static fromWalletDeeplinkUri(uri: string): Request {
    const split = uri.split(`${LOGIN_CONSENT_REQUEST_VDXF_KEY.vdxfid}=`);
    const req = new Request();
    req.fromBuffer(base64url.toBuffer(split[1]));

    return req;
  }

  toQrString(): string {
    if (this.signature == null) throw new Error("Request must be signed before it can be used as a deep link")

    return this.toString(true);
  }

  static fromQrString(qrstring: string): Request {
    const req = new Request();
    req.fromBuffer(base64url.toBuffer(qrstring));

    return req;
  }
}
