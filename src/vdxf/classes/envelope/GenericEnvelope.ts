import bufferutils from "../../../utils/bufferutils";
import base64url from "base64url";
import { BN } from 'bn.js';
import { BigNumber } from "../../../utils/types/BigNumber";
import { OrdinalVDXFObject, OrdinalVDXFObjectJson } from "../ordinals/OrdinalVDXFObject";
import varuint from "../../../utils/varuint";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { createHash } from "crypto";
import { VerifiableSignatureData, VerifiableSignatureDataJson } from "../VerifiableSignatureData";
import { CompactAddressObjectJson, CompactIAddressObject } from "../CompactAddressObject";

export interface GenericEnvelopeInterface {
  version?: BigNumber;
  flags?: BigNumber;
  signature?: VerifiableSignatureData;
  requestID?: CompactIAddressObject;
  createdAt?: BigNumber;
  salt?: Buffer;
  appOrDelegatedID?: CompactIAddressObject;
  details: Array<OrdinalVDXFObject>;
}

export type GenericEnvelopeJson = {
  version: string;
  flags?: string;
  signature?: VerifiableSignatureDataJson;
  requestid?: CompactAddressObjectJson;
  createdat?: string;
  salt?: string;
  appOrDelegatedID?: CompactAddressObjectJson;
  details: Array<OrdinalVDXFObjectJson>;
}

export type GenericRequestHandlerIdentifier = 0 | 1;

export class GenericEnvelope implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  signature?: VerifiableSignatureData;
  requestID?: CompactIAddressObject;
  createdAt?: BigNumber;
  salt?: Buffer; // var length buffer
  appOrDelegatedID?: CompactIAddressObject;
  details: Array<OrdinalVDXFObject>;

  static VERSION_CURRENT = new BN(1, 10)
  static VERSION_FIRSTVALID = new BN(1, 10)
  static VERSION_LASTVALID = new BN(1, 10)

  static BASE_FLAGS = new BN(0, 10)
  static FLAG_SIGNED = new BN(1, 10)
  static FLAG_HAS_REQUEST_ID = new BN(2, 10)
  static FLAG_HAS_CREATED_AT = new BN(4, 10)
  static FLAG_MULTI_DETAILS = new BN(8, 10)
  static FLAG_IS_TESTNET = new BN(16, 10)
  static FLAG_HAS_SALT = new BN(32, 10)
  static FLAG_HAS_APP_OR_DELEGATED_ID = new BN(64, 10);

  constructor(
    envelope: GenericEnvelopeInterface = {
      details: [],
      flags: GenericEnvelope.BASE_FLAGS
    }
  ) {
    this.signature = envelope?.signature;
    this.requestID = envelope?.requestID;
    this.details = envelope?.details;
    this.createdAt = envelope?.createdAt;
    this.salt = envelope?.salt;
    this.appOrDelegatedID = envelope?.appOrDelegatedID;

    if (envelope?.flags) this.flags = envelope.flags;
    else this.flags = GenericEnvelope.BASE_FLAGS;

    if (envelope?.version) this.version = envelope.version;
    else this.version = GenericEnvelope.VERSION_CURRENT;

    this.setFlags();
  }

  isValidVersion(): boolean {
    return this.version.gte(GenericEnvelope.VERSION_FIRSTVALID) && this.version.lte(GenericEnvelope.VERSION_LASTVALID);
  }

  isSigned() {
    return !!(this.flags.and(GenericEnvelope.FLAG_SIGNED).toNumber());
  }

  hasRequestID() {
    return !!(this.flags.and(GenericEnvelope.FLAG_HAS_REQUEST_ID).toNumber());
  }

  hasMultiDetails() {
    return !!(this.flags.and(GenericEnvelope.FLAG_MULTI_DETAILS).toNumber());
  }

  hasCreatedAt() {
    return !!(this.flags.and(GenericEnvelope.FLAG_HAS_CREATED_AT).toNumber());
  }

  hasSalt() {
    return !!(this.flags.and(GenericEnvelope.FLAG_HAS_SALT).toNumber());
  }

  hasAppOrDelegatedID() {
    return !!(this.flags.and(GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID).toNumber());
  }

  isTestnet() {
    return !!(this.flags.and(GenericEnvelope.FLAG_IS_TESTNET).toNumber());
  }

  setSigned() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_SIGNED);
  }

  setHasRequestID() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_REQUEST_ID);
  }

  setHasMultiDetails() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_MULTI_DETAILS);
  }

  setHasCreatedAt() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_CREATED_AT);
  }

  setHasSalt() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_SALT);
  }

  setHasAppOrDelegatedID() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_HAS_APP_OR_DELEGATED_ID);
  }

  setIsTestnet() {
    this.flags = this.flags.or(GenericEnvelope.FLAG_IS_TESTNET);
  }

  setFlags() {
    if (this.signature) this.setSigned();
    if (this.requestID) this.setHasRequestID();
    if (this.createdAt) this.setHasCreatedAt();
    if (this.salt) this.setHasSalt();
    if (this.appOrDelegatedID) this.setHasAppOrDelegatedID();
    if (this.details && this.details.length > 1) this.setHasMultiDetails();
  }

  getRawDataSha256(includeSig = false) {
    return createHash("sha256").update(this.toBufferOptionalSig(includeSig, true)).digest();
  }

  getDetailsIdentitySignatureHash(signedBlockheight: number): Buffer<ArrayBufferLike> {
    if (this.isSigned()) {
      return this.signature.getIdentityHash(signedBlockheight, this.getRawDataSha256());
    } else throw new Error("Must contain verifiable signature with at least systemID and identityID to generate details identity signature hash")
  }

  getDetails(index = 0): OrdinalVDXFObject {
    return this.details[index];
  }

  getDetailsBufferLength(): number {
    let length = 0;

    if (this.hasMultiDetails()) {
      length += varuint.encodingLength(this.details.length);

      for (const detail of this.details) {
        length += detail.getByteLength();
      }
    } else {
      length += this.getDetails().getByteLength();
    }

    return length;
  }

  getDetailsBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getDetailsBufferLength())
    );

    if (this.hasMultiDetails()) {
      writer.writeCompactSize(this.details.length);

      for (const detail of this.details) {
        writer.writeSlice(detail.toBuffer());
      }
    } else {
      writer.writeSlice(this.getDetails().toBuffer());
    }

    return writer.buffer;
  }

  setDetailsFromBuffer(buffer: Buffer, offset = 0): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const rootSystemName = this.isTestnet() ? 'VRSCTEST' : 'VRSC';

    if (this.hasMultiDetails()) {
      this.details = [];

      const numItems = reader.readCompactSize();

      for (let i = 0; i < numItems; i++) {
        const ord = OrdinalVDXFObject.createFromBuffer(reader.buffer, reader.offset, false, rootSystemName);

        reader.offset = ord.offset;
        this.details.push(ord.obj);
      }
    } else {
      const ord = OrdinalVDXFObject.createFromBuffer(reader.buffer, reader.offset, false, rootSystemName);

      reader.offset = ord.offset;
      this.details = [ord.obj];
    }

    return reader.offset;
  }

  protected getDataBufferLengthAfterSig(): number {
    let length = 0;

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength();
    }

    if (this.hasCreatedAt()) {
      length += varuint.encodingLength(this.createdAt.toNumber());
    }

    if (this.hasSalt()) {
      const saltLen = this.salt.length;

      length += varuint.encodingLength(saltLen);
      length += saltLen;
    }

    if (this.hasAppOrDelegatedID()) {
      length += this.appOrDelegatedID.getByteLength();
    }

    length += this.getDetailsBufferLength();

    return length;
  }

  protected getDataBufferAfterSig(): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getDataBufferLengthAfterSig())
    );

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }

    if (this.hasCreatedAt()) {
      writer.writeCompactSize(this.createdAt.toNumber());
    }

    if (this.hasSalt()) {
      writer.writeVarSlice(this.salt);
    }

    if (this.hasAppOrDelegatedID()) {
      writer.writeSlice(this.appOrDelegatedID.toBuffer());
    }

    writer.writeSlice(this.getDetailsBuffer());

    return writer.buffer;
  }

  private internalGetByteLength(includeSig = true, forHashing = false): number {
    let length = 0;

    length += varuint.encodingLength(this.version.toNumber());
    length += varuint.encodingLength(this.flags.toNumber());

    if (this.isSigned() && includeSig) {
      length += forHashing ? this.signature!.getByteLengthForHashing() : this.signature!.getByteLength();
    }

    length += this.getDataBufferLengthAfterSig();

    return length;
  }

  protected getByteLengthOptionalSig(includeSig?: boolean, forHashing?: boolean): number {
    return this.internalGetByteLength(includeSig, forHashing);
  }

  getByteLength(): number {
    return this.getByteLengthOptionalSig(true);
  }

  protected toBufferOptionalSig(includeSig = true, forHashing = false) {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.internalGetByteLength(includeSig, forHashing))
    );

    writer.writeCompactSize(this.version.toNumber());
    writer.writeCompactSize(this.flags.toNumber());

    if (this.isSigned() && includeSig) {
      writer.writeSlice(forHashing ? this.signature!.toBufferForHashing() : this.signature!.toBuffer());
    }

    writer.writeSlice(this.getDataBufferAfterSig());

    return writer.buffer;
  }

  toBuffer(): Buffer {
    return this.toBufferOptionalSig(true);
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    if (buffer.length == 0) throw new Error("Cannot create envelope from empty buffer");

    const reader = new bufferutils.BufferReader(buffer, offset);

    this.version = new BN(reader.readCompactSize());
    this.flags = new BN(reader.readCompactSize());

    if (this.isSigned()) {
      const _sig = new VerifiableSignatureData({ isTestnet: this.isTestnet() });
      reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
      this.signature = _sig;
    }

    const rootSystemName = this.isTestnet() ? 'VRSCTEST' : 'VRSC';

    if (this.hasRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    if (this.hasCreatedAt()) {
      this.createdAt = new BN(reader.readCompactSize());
    }

    if (this.hasSalt()) {
      this.salt = reader.readVarSlice();
    }

    if (this.hasAppOrDelegatedID()) {
      this.appOrDelegatedID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.appOrDelegatedID.fromBuffer(reader.buffer, reader.offset);
    }

    reader.offset = this.setDetailsFromBuffer(reader.buffer, reader.offset);

    return reader.offset;
  }

  toString() {
    return base64url.encode(this.toBuffer());
  }

  toJson(): GenericEnvelopeJson {
    const details = [];

    if (this.details != null) {
      for (const detail of this.details) {
        details.push(detail.toJson())
      }
    }
    
    return {
      version: this.version.toString(),
      flags: this.flags.toString(),
      signature: this.isSigned() ? this.signature.toJson() : undefined,
      requestid: this.hasRequestID() ? this.requestID.toJson() : undefined,
      createdat: this.hasCreatedAt() ? this.createdAt.toString() : undefined,
      salt: this.hasSalt() ? this.salt.toString('hex') : undefined,
      appOrDelegatedID: this.hasAppOrDelegatedID() ? this.appOrDelegatedID.toJson() : undefined,
      details: details
    };
  }
}