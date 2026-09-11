import {
  VDXFObject,
  VerusIDSignature,
  VerusIDSignatureInterface,
} from "../../";
import { SIGNED_SESSION_OBJECT, IDENTITY_AUTH_SIG_VDXF_KEY } from "../../keys";
import { Hash160 } from "../Hash160";
import bufferutils from "../../../utils/bufferutils";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, VERUS_DATA_SIGNATURE_PREFIX } from "../../../constants/vdxf";
import { fromBase58Check, toBase58Check } from "../../../utils/address";
import createHash = require("create-hash");
import { SignedSessionObjectData } from "./SignedSessionObjectData";

export interface AuthorizedWebRequestInterface {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignatureInterface;
  data: SignedSessionObjectData;
}

/**
 * @deprecated Disabled and scheduled for removal in a future release. Construction always throws.
 */
export class SignedSessionObject extends VDXFObject {
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignature;
  data: SignedSessionObjectData;

  constructor(
    request: AuthorizedWebRequestInterface = {
      system_id: "",
      signing_id: "",
      data: new SignedSessionObjectData(),
    }
  ) {
    super(SIGNED_SESSION_OBJECT.vdxfid);

    throw new Error("SignedSessionObject is deprecated and disabled; it will be removed in a future release.");
  }

  getDataHash(signedBlockheight: number, signatureVersion: number = 2) {
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
        .update(this.data.toSha256())
        .digest();
    } else {
      return createHash("sha256")
        .update(fromBase58Check(this.system_id).hash)
        .update(heightBufferWriter.buffer)
        .update(fromBase58Check(this.signing_id).hash)
        .update(VERUS_DATA_SIGNATURE_PREFIX)
        .update(this.data.toSha256())
        .digest();
    }
  }

  toJson() {
    return {
      vdxfkey: this.vdxfkey,
      system_id: this.system_id,
      signing_id: this.signing_id,
      signature: this.signature ? this.signature.toJson() : this.signature,
      challenge: this.data.toJson(),
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

    const _system_id = Hash160.fromAddress(this.system_id);
    length += _system_id.byteLength();

    length += _signing_id.byteLength();
    length += _signature.byteLength();
    length += this.data.byteLength();

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

    const _system_id = Hash160.fromAddress(this.system_id);
    writer.writeSlice(_system_id.toBuffer());

    writer.writeSlice(_signing_id.toBuffer());

    writer.writeSlice(_signature.toBuffer());

    writer.writeSlice(this.data.toBuffer());

    return writer.buffer;
  }

  dataByteLength(): number {
    return this._dataByteLength();
  }

  toDataBuffer(): Buffer {
    return this._toDataBuffer();
  }

  protected _fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const reqLength = reader.readCompactSize();

    if (reqLength == 0) {
      throw new Error("Cannot create signed session object from empty buffer");
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

      const _data = new SignedSessionObjectData();
      reader.offset = _data.fromBuffer(reader.buffer, reader.offset);
      this.data = _data;
    }

    return reader.offset;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    return this._fromDataBuffer(buffer, offset);
  }

  getHeaders() {
    return {
      ['VDXF-Key']: this.vdxfkey, // VDXF key of signed session object (SSO), denoting that this is a SSO
      ['VDXF-Version']: this.version.toString(), // SSO version
      ['VerusID-Session-ID']: this.data.session_id, // Session ID of original response made
      ['VerusID-Timestamp-Micro']: this.data.timestamp_micro.toString(), // Microsecond timestamp
      ['VerusID-Signature']: this.signature!.signature // Signature of this SSO serialized
    }
  }

  static fromHttpRequest(headers: { [key: string]: string }, body: string, system_id: string, signing_id: string): SignedSessionObject {
    return new SignedSessionObject({
      system_id,
      signing_id,
      signature: new VerusIDSignature(
        { signature: headers['VerusID-Signature'] },
        IDENTITY_AUTH_SIG_VDXF_KEY
      ),
      data: new SignedSessionObjectData({
        session_id: headers['VerusID-Session-ID'],
        timestamp_micro: Number(headers['VerusID-Timestamp-Micro']),
        body
      })
    })
  }
}
