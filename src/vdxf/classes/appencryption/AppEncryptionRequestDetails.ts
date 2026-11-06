
/**
 * Requests a derived Sapling address and channel keys for encrypted communication
 * and data sharing between a user and an app. Identity uploads are one use of
 * the channel, not a requirement.
 *
 * The enclosing GenericRequest must have a verified signature. Its optional
 * appOrDelegatorID defines the app scope; otherwise the signer defines the scope.
 * An explicit appOrDelegatorID requires a signer whose signing authority the user
 * fully controls, or an approved delegate once the delegate handshake is supported.
 * Delegate authorization is currently unsupported and must be rejected by clients.
 * Serialization and isValid() do not establish signature validity or authorization.
 *
 * First derive with fromId = the user's ID, toId = the authorized app scope, and
 * the wallet's key material. Without derivationID, return this address and keys.
 * With derivationID, derive again using the first result's extended spending key,
 * fromId = the same user's ID, and toId = derivationID. Return only the second
 * address and keys. derivationID can be any ID and never replaces the app scope
 * in the first derivation. Clients perform these operations with zGetEncryptionAddress.
 * The first call uses derivationNumber as its encryption index; the second uses
 * secondaryDerivationNumber, which defaults to zero when omitted.
 *
 * encryptResponseToAddress optionally protects the returned channel details;
 * it is distinct from the derived channel address. FLAG_RETURN_ESK requests the
 * final extended spending key, not an intermediate scope key. An intermediate
 * spending key is required internally for double derivation even without this flag.
 */

import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BN } from 'bn.js';
import bufferutils from '../../../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
import varuint from '../../../utils/varuint';
import varint from '../../../utils/varint';
import { SaplingPaymentAddress } from '../../../pbaas';

export interface AppEncryptionRequestDetailsInterface {
  version?: BigNumber;
  flags: BigNumber;
  encryptResponseToAddress?: SaplingPaymentAddress;
  derivationNumber: BigNumber;
  /** Optional second-stage target within the authorized app scope. */
  derivationID?: CompactIAddressObject;
  /** Second-stage encryption index, defaulting to zero. Used only with derivationID. */
  secondaryDerivationNumber?: BigNumber;
  requestID?: CompactIAddressObject;
}

export interface AppEncryptionRequestDetailsJson {
  version: number;
  flags: number;
  encryptresponsetoaddress?: string;
  derivationnumber: number;
  derivationid?: CompactAddressObjectJson;
  secondaryderivationnumber?: number;
  requestid?: CompactAddressObjectJson;
}

export class AppEncryptionRequestDetails extends SerializableEntityBase implements SerializableEntity {
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
  derivationID?: CompactIAddressObject;      // Optional second derivation within the app scope
  secondaryDerivationNumber: BigNumber;     // Second-stage encryption index; defaults to zero
  requestID?: CompactIAddressObject;                         // Unique identifier for the request

  constructor(data?: AppEncryptionRequestDetailsInterface) {
    super();
    this.version = data?.version || AppEncryptionRequestDetails.DEFAULT_VERSION;
    this.flags = data?.flags || new BN(0);
    this.encryptResponseToAddress = data?.encryptResponseToAddress || null;
    this.derivationNumber = data?.derivationNumber || new BN(0);
    this.derivationID = data?.derivationID;
    this.secondaryDerivationNumber = data?.secondaryDerivationNumber ?? new BN(0);
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
    valid &&= this.secondaryDerivationNumber != null && this.secondaryDerivationNumber.gte(new BN(0));

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

    length += varint.encodingLength(this.derivationNumber);

    if (this.hasDerivationID()) {
      length += this.derivationID.getByteLength();
      length += varint.encodingLength(this.secondaryDerivationNumber);
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
      writer.writeVarInt(this.secondaryDerivationNumber);
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
      this.secondaryDerivationNumber = reader.readVarInt();
    } else {
      this.derivationID = undefined;
      this.secondaryDerivationNumber = new BN(0);
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
      encryptresponsetoaddress: this.hasEncryptResponseToAddress() ? this.encryptResponseToAddress.toAddressString() : undefined,
      derivationnumber: this.derivationNumber.toNumber(),
      derivationid: this.hasDerivationID() ? this.derivationID.toJson() : undefined,
      secondaryderivationnumber: this.hasDerivationID() ? this.secondaryDerivationNumber.toNumber() : undefined,
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
      instance.secondaryDerivationNumber = new BN(json.secondaryderivationnumber ?? 0);
    }
    
    if(instance.hasRequestID()) {
      instance.requestID = CompactIAddressObject.fromCompactAddressObjectJson(json?.requestid);
    }
    
    return instance;
  }
}
