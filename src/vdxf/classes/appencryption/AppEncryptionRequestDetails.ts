
/**
 * AppEncryptionRequestDetails - Class for handling application requests for encrypted derived seeds
 * 
 * This class is used when an application is requesting an encrypted derived seed from the user's master seed,
 * using specific parameters passed by the application. The request includes:
 * - App or delegated ID making the request (mandatory)
 * - A target encryption key (zaddress format) for encrypting the reply
 * - Derivation number for seed generation
 * - Optional derivation ID (defaults to Z-address from ID signing if not present)
 * - Optional request ID for tracking
 * 
 * The user's wallet can use these parameters to derive a specific seed from their master seed
 * and encrypt it using the provided encryption key, ensuring the application receives only
 * the specific derived seed it needs without exposing the master seed.
 * 
 * The FLAG_RETURN_ESK flag can be set to signal that the Extended Spending Key should be returned.
 */

import { BigNumber } from '../../../utils/types/BigNumber';
import { BN } from 'bn.js';
import bufferutils from '../../../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
import varuint from '../../../utils/varuint';
import { SaplingPaymentAddress } from '../../../pbaas';

export interface AppEncryptionRequestDetailsInterface {
  version?: BigNumber;
  flags: BigNumber;
  encryptResponseToAddress?: SaplingPaymentAddress;
  derivationNumber: BigNumber;
  derivationID?: CompactIAddressObject;
  requestID?: CompactIAddressObject;
}

export interface AppEncryptionRequestDetailsJson {
  version: number;
  flags: number;
  encryptresponsetoaddress: string;
  derivationnumber: number;
  derivationid?: CompactAddressObjectJson;
  requestid?: CompactAddressObjectJson;
}

export class AppEncryptionRequestDetails implements SerializableEntity {
  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);

  static FLAG_HAS_REQUEST_ID = new BN(1);
  static FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS = new BN(2);
  static FLAG_HAS_DERIVATION_ID = new BN(4);
  static FLAG_RETURN_ESK = new BN(8); //flag to signal to return the Extended Spending Key

  version: BigNumber;
  flags: BigNumber;
  encryptResponseToAddress?: SaplingPaymentAddress;                  // zaddress reply is encrypted to
  derivationNumber: BigNumber;
  derivationID?: CompactIAddressObject;      // Defaults to choosing the Z-address from the ID signing if not present
  requestID?: CompactIAddressObject;                         // Unique identifier for the request

  constructor(data?: AppEncryptionRequestDetailsInterface) {
    this.version = data?.version || AppEncryptionRequestDetails.DEFAULT_VERSION;
    this.flags = data?.flags || new BN(0);
    this.encryptResponseToAddress = data?.encryptResponseToAddress || null;
    this.derivationNumber = data?.derivationNumber || new BN(0);
    this.derivationID = data?.derivationID;
    this.requestID = data?.requestID;

    this.setFlags();
  }

  setFlags(): void {
    this.flags = this.calcFlags();
  }

  calcFlags(): BigNumber {
    let flags = new BN(this.flags);

    if (this.requestID != null) {
      flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID);
    }

    if (this.encryptResponseToAddress != null) {
      flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS);
    }

    if (this.derivationID != null) {
      flags = flags.or(AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID);
    }

    return flags;
  }

  isValid(): boolean {
    let valid = true;
    
    valid &&= this.derivationNumber != null && this.derivationNumber.gte(new BN(0));

    return valid;
  }

  hasDerivationID(flags: BigNumber = this.flags): boolean {
    return flags.and(AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID).gt(new BN(0));
  }

  hasRequestID(flags: BigNumber = this.flags): boolean {
    return flags.and(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID).gt(new BN(0));
  }

  hasEncryptResponseToAddress(flags: BigNumber = this.flags): boolean {
    return flags.and(AppEncryptionRequestDetails.FLAG_HAS_ENCRYPT_RESPONSE_TO_ADDRESS).gt(new BN(0));
  }

  returnESK(flags: BigNumber = this.flags): boolean {
    return flags.and(AppEncryptionRequestDetails.FLAG_RETURN_ESK).gt(new BN(0));
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.hasEncryptResponseToAddress()) {
      length += this.encryptResponseToAddress.getByteLength();
    }

    length += varuint.encodingLength(this.derivationNumber.toNumber());

    if (this.hasDerivationID()) {
      length += this.derivationID.getByteLength();
    }

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength();
    }

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    // Write flags
    writer.writeCompactSize(this.flags.toNumber());

    if (this.hasEncryptResponseToAddress()) {
      writer.writeSlice(this.encryptResponseToAddress.toBuffer());
    }

    // Write mandatory derivation number
    writer.writeVarInt(this.derivationNumber);

    if (this.hasDerivationID()) {
      writer.writeSlice(this.derivationID.toBuffer());
    }

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new BufferReader(buffer, offset);

    // Read flags
    this.flags = new BN(reader.readCompactSize());

    // Read encryptToAddress as 43-byte sapling data and encode as sapling address
    if (this.hasEncryptResponseToAddress()) {
      this.encryptResponseToAddress = new SaplingPaymentAddress();

      reader.offset = this.encryptResponseToAddress.fromBuffer(reader.buffer, reader.offset);
    }

    // Read mandatory derivation number
    this.derivationNumber = reader.readVarInt();

    if (this.hasDerivationID()) {
      const derivationIDObj = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
      reader.offset = derivationIDObj.fromBuffer(reader.buffer, reader.offset);
      this.derivationID = derivationIDObj;
    }

    if (this.hasRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    return reader.offset;
  }

  toJson(): AppEncryptionRequestDetailsJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      encryptresponsetoaddress: this.encryptResponseToAddress.toAddressString(),
      derivationnumber: this.derivationNumber.toNumber(),
      derivationid: this.derivationID?.toJson(),
      requestid: this.requestID?.toJson()
    };
  }

  static fromJson(json: AppEncryptionRequestDetailsJson): AppEncryptionRequestDetails {
    const instance = new AppEncryptionRequestDetails();
    instance.version = new BN(json.version);
    instance.flags = new BN(json.flags);

    if (instance.hasEncryptResponseToAddress()) {
      instance.encryptResponseToAddress = SaplingPaymentAddress.fromAddressString(json.encryptresponsetoaddress);
    }
  
    instance.derivationNumber = new BN(json.derivationnumber);
    
    if(instance.hasDerivationID()) {
      instance.derivationID = CompactIAddressObject.fromCompactAddressObjectJson(json?.derivationid);
    }
    
    if(instance.hasRequestID()) {
      instance.requestID = CompactIAddressObject.fromCompactAddressObjectJson(json?.requestid);
    }
    
    return instance;
  }
}
