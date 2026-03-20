import { BN } from 'bn.js';
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { GenericEnvelope, GenericEnvelopeInterface, GenericEnvelopeJson, GenericRequestHandlerIdentifier } from "../envelope/GenericEnvelope";
import bufferutils from '../../../utils/bufferutils';
import { BigNumber } from '../../../utils/types/BigNumber';
import { EHashTypes } from '../../../pbaas/DataDescriptor';
import varuint from '../../../utils/varuint';

export type GenericResponseJson = GenericEnvelopeJson & {
  requesthash?: string,
  requesthashtype?: number,
  handledby?: number
}

export type GenericResponseInterface = GenericEnvelopeInterface & {
  requestHash?: Buffer,
  requestHashType?: BigNumber,
  handledBy?: GenericRequestHandlerIdentifier
}

export class GenericResponse extends GenericEnvelope implements SerializableEntity {
  requestHash?: Buffer;
  requestHashType?: BigNumber;
  handledBy: GenericRequestHandlerIdentifier;

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

  static FLAG_HAS_REQUEST_HASH = new BN(128, 10);
  static FLAG_HAS_HANDLED_BY = new BN(256, 10);

  constructor(
    envelope: GenericResponseInterface = {
      details: [],
      flags: GenericResponse.BASE_FLAGS
    }
  ) {
    super(envelope)

    this.requestHash = envelope.requestHash;
    this.handledBy = envelope.handledBy;

    this.setFlags();

    this.requestHashType = envelope.requestHashType;

    if (this.requestHashType == null && this.hasRequestHash()) {
      this.requestHashType = new BN(EHashTypes.HASH_SHA256)
    }
  }

  hasRequestHash() {
    return !!(this.flags.and(GenericResponse.FLAG_HAS_REQUEST_HASH).toNumber());
  }

  hasHandledBy() {
    return !!(this.flags.and(GenericResponse.FLAG_HAS_HANDLED_BY).toNumber());
  }

  setHasRequestHash() {
    this.flags = this.flags.or(GenericResponse.FLAG_HAS_REQUEST_HASH);
  }

  setHasHandledBy() {
    this.flags = this.flags.or(GenericResponse.FLAG_HAS_HANDLED_BY);
  }

  setFlags() {
    super.setFlags();

    if (this.requestHash) this.setHasRequestHash();
    if (this.handledBy != null) this.setHasHandledBy();
  }

  protected getByteLengthOptionalSig(includeSig = true, forHashing = false): number {
    let length = super.getByteLengthOptionalSig(includeSig, forHashing);

    if (this.hasRequestHash()) {
      const hashLen = this.requestHash.length;

      length += varuint.encodingLength(this.requestHashType.toNumber());

      length += varuint.encodingLength(this.requestHash.length);
      length += hashLen;
    }

    if (this.hasHandledBy()) {
      length += varuint.encodingLength(this.handledBy);
    }

    return length;
  }

  protected toBufferOptionalSig(includeSig = true, forHashing = false) {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getByteLengthOptionalSig(includeSig, forHashing))
    );

    const superBuf = super.toBufferOptionalSig(includeSig, forHashing);

    writer.writeSlice(superBuf);

    if (this.hasRequestHash()) {
      writer.writeCompactSize(this.requestHashType.toNumber());
      writer.writeVarSlice(this.requestHash);
    }

    if (this.hasHandledBy()) {
      writer.writeCompactSize(this.handledBy);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    if (buffer.length == 0) throw new Error("Cannot create response from empty buffer");

    const reader = new bufferutils.BufferReader(buffer, offset);

    reader.offset = super.fromBuffer(reader.buffer, reader.offset);

    if (this.hasRequestHash()) {
      this.requestHashType = new BN(reader.readCompactSize());
      this.requestHash = reader.readVarSlice();
    }

    if (this.hasHandledBy()) {
      this.handledBy = reader.readCompactSize() as GenericRequestHandlerIdentifier;
    }

    return reader.offset;
  }

  toJson(): GenericResponseJson {
    const parentJson = super.toJson();

    if (this.hasRequestHash()) {
      parentJson["requesthash"] = this.requestHash.toString('hex');
      parentJson["requesthashtype"] = this.requestHashType.toNumber();
    }

    if (this.hasHandledBy()) {
      parentJson["handledby"] = this.handledBy;
    }

    return parentJson;
  }
}