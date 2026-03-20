import { BN } from 'bn.js';
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { GenericEnvelope, GenericEnvelopeInterface, GenericEnvelopeJson, GenericRequestHandlerIdentifier } from "../envelope/GenericEnvelope";
import { SaplingPaymentAddress } from '../../../pbaas/SaplingPaymentAddress';
import bufferutils from '../../../utils/bufferutils';
import base64url from 'base64url';
import { DEEPLINK_PROTOCOL_URL_CURRENT_VERSION, DEEPLINK_PROTOCOL_URL_STRING } from '../../../constants/deeplink';
import { ResponseURI, ResponseURIJson } from '../ResponseURI';
import varuint from '../../../utils/varuint';

export type GenericRequestJson = GenericEnvelopeJson & {
  responseuris?: Array<ResponseURIJson>;
  encryptresponsetoaddress?: string;
  preferredhandler?: number;
};

export type GenericRequestInterface = GenericEnvelopeInterface & {
  responseURIs?: Array<ResponseURI>;
  encryptResponseToAddress?: SaplingPaymentAddress;
  preferredHandler?: GenericRequestHandlerIdentifier;
}

export class GenericRequest extends GenericEnvelope implements SerializableEntity {
  responseURIs?: Array<ResponseURI>; 
  encryptResponseToAddress?: SaplingPaymentAddress;
  preferredHandler: GenericRequestHandlerIdentifier;

  static VERSION_CURRENT = new BN(1, 10);
  static VERSION_FIRSTVALID = new BN(1, 10);
  static VERSION_LASTVALID = new BN(1, 10);

  static BASE_FLAGS = GenericEnvelope.BASE_FLAGS;
  static FLAG_SIGNED = GenericEnvelope.FLAG_SIGNED;
  static FLAG_HAS_CREATED_AT = GenericEnvelope.FLAG_HAS_CREATED_AT;
  static FLAG_MULTI_DETAILS = GenericEnvelope.FLAG_MULTI_DETAILS;
  static FLAG_IS_TESTNET = GenericEnvelope.FLAG_IS_TESTNET;
  static FLAG_HAS_SALT = GenericEnvelope.FLAG_HAS_SALT;
  static FLAG_HAS_APP_OR_DELEGATED_ID = GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID;

  static FLAG_HAS_RESPONSE_URIS = new BN(128, 10);
  static FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS = new BN(256, 10);
  static FLAG_HAS_PREFERRED_HANDLER = new BN(512, 10);

  constructor(
    envelope: GenericRequestInterface = {
      details: [],
      flags: GenericRequest.BASE_FLAGS
    }
  ) {
    super(envelope)

    this.responseURIs = envelope?.responseURIs;
    this.encryptResponseToAddress = envelope?.encryptResponseToAddress;
    this.preferredHandler = envelope?.preferredHandler;

    this.setFlags();
  }

  hasResponseURIs() {
    return !!(this.flags.and(GenericRequest.FLAG_HAS_RESPONSE_URIS).toNumber());
  }

  hasEncryptResponseToAddress() {
    return !!(this.flags.and(GenericRequest.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS).toNumber());
  }

  hasPreferredHandler() {
    return !!(this.flags.and(GenericRequest.FLAG_HAS_PREFERRED_HANDLER).toNumber());
  }

  setHasResponseURIs() {
    this.flags = this.flags.or(GenericRequest.FLAG_HAS_RESPONSE_URIS);
  }

  setHasEncryptResponseToAddress() {
    this.flags = this.flags.or(GenericRequest.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS);
  }

  setHasPreferredHandler() {
    this.flags = this.flags.or(GenericRequest.FLAG_HAS_PREFERRED_HANDLER);
  }

  setFlags() {
    super.setFlags();

    if (this.responseURIs) this.setHasResponseURIs();
    if (this.encryptResponseToAddress) this.setHasEncryptResponseToAddress();
    if (this.preferredHandler != null) this.setHasPreferredHandler();
  }

  protected getByteLengthOptionalSig(includeSig = true, forHashing = false): number {
    let length = super.getByteLengthOptionalSig(includeSig, forHashing);

    if (this.hasResponseURIs()) {
      length += varuint.encodingLength(this.responseURIs.length);

      for (let i = 0; i < this.responseURIs.length; i++) {
        length += this.responseURIs[i].getByteLength();
      }
    }

    if (this.hasEncryptResponseToAddress()) {
      length += this.encryptResponseToAddress.getByteLength();
    }

    if (this.hasPreferredHandler()) {
      length += varuint.encodingLength(this.preferredHandler);
    }

    return length;
  }

  protected toBufferOptionalSig(includeSig = true, forHashing = false) {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getByteLengthOptionalSig(includeSig, forHashing))
    );

    const superBuf = super.toBufferOptionalSig(includeSig, forHashing);

    writer.writeSlice(superBuf);

    if (this.hasResponseURIs()) {
      writer.writeCompactSize(this.responseURIs.length);

      for (let i = 0; i < this.responseURIs.length; i++) {
        writer.writeSlice(this.responseURIs[i].toBuffer());
      }
    }

    if (this.hasEncryptResponseToAddress()) {
      writer.writeSlice(this.encryptResponseToAddress.toBuffer());
    }

    if (this.hasPreferredHandler()) {
      writer.writeCompactSize(this.preferredHandler);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    if (buffer.length == 0) throw new Error("Cannot create request from empty buffer");

    const reader = new bufferutils.BufferReader(buffer, offset);

    reader.offset = super.fromBuffer(reader.buffer, reader.offset);

    if (this.hasResponseURIs()) {
      this.responseURIs = [];
      const callbackURIsLength = reader.readCompactSize();

      for (let i = 0; i < callbackURIsLength; i++) {
        const newURI = new ResponseURI();
        reader.offset = newURI.fromBuffer(reader.buffer, reader.offset);
        this.responseURIs.push(newURI);
      }
    }

    if (this.hasEncryptResponseToAddress()) {
      this.encryptResponseToAddress = new SaplingPaymentAddress();

      reader.offset = this.encryptResponseToAddress.fromBuffer(reader.buffer, reader.offset);
    }

    if (this.hasPreferredHandler()) {
      this.preferredHandler = reader.readCompactSize() as GenericRequestHandlerIdentifier;
    }

    return reader.offset;
  }

  toJson(): GenericRequestJson {
    const parentJson = super.toJson();

    if (this.hasResponseURIs()) {
      parentJson["responseuris"] = this.responseURIs.map(x => x.toJson())
    }

    if (this.hasEncryptResponseToAddress()) {
      parentJson["encryptresponsetoaddress"] = this.encryptResponseToAddress.toAddressString();
    }

    if (this.hasPreferredHandler()) {
      parentJson["preferredhandler"] = this.preferredHandler;
    }

    return parentJson;
  }

  static fromWalletDeeplinkUri(uri: string): GenericRequest {
    const urlProtocol = `${DEEPLINK_PROTOCOL_URL_STRING}:`;
    
    const split = uri.split(`/`);

    if (split.length !== 4 || split.some(x => x == null)) throw new Error("Unrecognized URL format");

    if (split[0] !== urlProtocol) throw new Error("Unrecognized URL protocol");
    else if (isNaN(Number(split[2])) || !(new BN(split[2], 10).eq(DEEPLINK_PROTOCOL_URL_CURRENT_VERSION))) {
      throw new Error("Unrecognized or incompatible generic request protocol version")
    }

    const inv = new GenericRequest();
    inv.fromBuffer(base64url.toBuffer(split[3]), 0);

    return inv;
  }

  static fromQrString(qrstring: string): GenericRequest {
    const inv = new GenericRequest();
    inv.fromBuffer(base64url.toBuffer(qrstring), 0);

    return inv;
  }

  toWalletDeeplinkUri(): string {
    return `${DEEPLINK_PROTOCOL_URL_STRING}://${DEEPLINK_PROTOCOL_URL_CURRENT_VERSION.toString()}/${this.toString()}`;
  }

  toQrString(): string {
    return this.toString();
  }
}