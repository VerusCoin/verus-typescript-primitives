
/**
 * InformationRequest - Class for handling application requests for specific user information/data
 * 
 * This class is used when an application is requesting specific information or data from the user's
 * identity or data stores. The request includes:
 * - Search data keys (VDXF keys) to identify the specific data being requested
 * - Optional specific keys within the data object for partial data requests
 * - Signer information to identify wanted signer of the data
 * - Optional statement for boundhashes in the signature
 * 
 * The user's wallet can use these parameters to locate the signed object information and present
 * it to the user for approval before sharing with the requesting application. This enables
 * selective disclosure of personal information while maintaining user privacy and control.
 * 
 * Request type and data type are encoded as varuints (not flags):
 * - FULL_DATA vs PARTIAL_DATA vs COLLECTION: Whether complete objects, specific fields,
 *   or multiple objects are requested
 * - ATTESTATION/CLAIM/CREDENTIAL: Type of verification being requested
 *
 * Flags are reserved for optional fields only (signer, requested keys, request ID).
 */

import { BigNumber } from '../../../utils/types/BigNumber';
import { BN } from 'bn.js';
import varuint from '../../../utils/varuint';
import bufferutils from '../../../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
import { fromBase58Check, toBase58Check } from '../../../utils/address';
import { I_ADDR_VERSION, HASH160_BYTE_LENGTH } from '../../../constants/vdxf';
import { DEFAULT_HASH_TYPE, HASH_TYPE_BLAKE2B, HASH_TYPE_BLAKE2BMMR2, HASH_TYPE_KECCAK256, HASH_TYPE_SHA256, HASH_TYPE_SHA256D } from '../../../constants/pbaas';

export interface UserDataRequestInterface {
  version?: BigNumber;
  flags: BigNumber;
  dataType: BigNumber;
  requestType: BigNumber;
  searchDataKeyHashType?: BigNumber;
  searchDataKey: Array<{[key: string]: Buffer}>;
  signer?: CompactIAddressObject;
  requestedKeys?: string[];
  requestID?: CompactIAddressObject;
}

export interface UserDataRequestJson {
  version: number;
  flags: number;
  datatype: number;
  requesttype: number;
  searchdatakeyhashtype?: number;
  searchdatakey: Array<{[key: string]: Buffer}>;   // ID object of the specific information requested
  signer?: CompactAddressObjectJson;
  requestedkeys?: string[]; // Specific keys within the data object being requested
  requestid?: CompactAddressObjectJson;
}

export class UserDataRequestDetails implements SerializableEntity {
  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);
  
  static FLAG_HAS_REQUEST_ID = new BN(1);
  static FLAG_HAS_SIGNER = new BN(2);
  static FLAG_HAS_REQUESTED_KEYS = new BN(4);

  // Data type values (varuints, not flags)
  static FULL_DATA = new BN(1);
  static PARTIAL_DATA = new BN(2);
  static COLLECTION = new BN(3);

  // Request type values (varuints, not flags)
  static ATTESTATION = new BN(1);
  static CLAIM = new BN(2);
  static CREDENTIAL = new BN(3);

  version: BigNumber;
  flags: BigNumber;
  dataType: BigNumber;
  requestType: BigNumber;
  searchDataKeyHashType: BigNumber;
  searchDataKey: Array<{[key: string]: Buffer}>;
  signer?: CompactIAddressObject;
  requestedKeys?: string[];
  requestID?: CompactIAddressObject;

  constructor(data?: UserDataRequestInterface) {
    this.version = data?.version || UserDataRequestDetails.DEFAULT_VERSION;
    this.flags = data?.flags || new BN(0);
    this.dataType = data?.dataType || UserDataRequestDetails.FULL_DATA;
    this.requestType = data?.requestType || UserDataRequestDetails.ATTESTATION;
    this.searchDataKeyHashType = data?.searchDataKeyHashType || DEFAULT_HASH_TYPE;
    this.searchDataKey = data?.searchDataKey || [];
    this.signer = data?.signer;
    this.requestedKeys = data?.requestedKeys;
    this.requestID = data?.requestID;

    this.setFlags();
  }

  calcFlags(): BigNumber {
    let flags = new BN(this.flags);
    if (this.requestedKeys && this.requestedKeys.length > 0) {
      flags = flags.or(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS);
    }
    if (this.signer) {
      flags = flags.or(UserDataRequestDetails.FLAG_HAS_SIGNER);
    }
    if (this.requestID) {
      flags = flags.or(UserDataRequestDetails.FLAG_HAS_REQUEST_ID);
    }

    return flags;
  }

  setFlags(): void {
    this.flags = this.calcFlags();
  }

  hasSigner(): boolean {
    return this.flags.and(UserDataRequestDetails.FLAG_HAS_SIGNER).eq(UserDataRequestDetails.FLAG_HAS_SIGNER);
  }

  hasRequestedKeys(): boolean {
    return this.flags.and(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS).eq(UserDataRequestDetails.FLAG_HAS_REQUESTED_KEYS);
  }

  hasRequestID(): boolean {
    return this.flags.and(UserDataRequestDetails.FLAG_HAS_REQUEST_ID).eq(UserDataRequestDetails.FLAG_HAS_REQUEST_ID);
  }

  /**
   * Checks if dataType is one of the supported values (FULL_DATA, PARTIAL_DATA, COLLECTION)
   * @returns True if dataType is valid
   */
  hasDataTypeSet(): boolean {
    return this.dataType.eq(UserDataRequestDetails.FULL_DATA) ||
      this.dataType.eq(UserDataRequestDetails.PARTIAL_DATA) ||
      this.dataType.eq(UserDataRequestDetails.COLLECTION);
  }

  /**
   * Checks if requestType is one of the supported values (ATTESTATION, CLAIM, CREDENTIAL)
   * @returns True if requestType is valid
   */
  hasRequestTypeSet(): boolean {
    return this.requestType.eq(UserDataRequestDetails.ATTESTATION) ||
      this.requestType.eq(UserDataRequestDetails.CLAIM) ||
      this.requestType.eq(UserDataRequestDetails.CREDENTIAL);
  }

  hasSearchDataKeyHashTypeSet(): boolean {
    return this.searchDataKeyHashType.eq(HASH_TYPE_BLAKE2B) ||
      this.searchDataKeyHashType.eq(HASH_TYPE_BLAKE2BMMR2) ||
      this.searchDataKeyHashType.eq(HASH_TYPE_KECCAK256) ||
      this.searchDataKeyHashType.eq(HASH_TYPE_SHA256D) ||
      this.searchDataKeyHashType.eq(HASH_TYPE_SHA256);
  }

  isValid(): boolean {
    let valid = this.version.gte(UserDataRequestDetails.FIRST_VERSION) && this.version.lte(UserDataRequestDetails.LAST_VERSION);
    
    // Check that exactly one data type flag is set
    valid &&= this.hasDataTypeSet();
    
    // Check that exactly one request type flag is set
    valid &&= this.hasRequestTypeSet();

    // Check that searchDataKeyHashType is one of the supported hash types
    valid &&= this.hasSearchDataKeyHashTypeSet();
    
    // Check that searchDataKey is present
    valid &&= Object.keys(this.searchDataKey).length > 0;

    return valid;
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());
    length += varuint.encodingLength(this.dataType.toNumber());
    length += varuint.encodingLength(this.requestType.toNumber());
    length += varuint.encodingLength(this.searchDataKeyHashType.toNumber());
    length += varuint.encodingLength(this.searchDataKey.length);

    for (const item of this.searchDataKey) {
      const key = Object.keys(item)[0];
      const value = item[key];
      length += HASH160_BYTE_LENGTH;
      length += varuint.encodingLength(value.length);
      length += value.length;
    }

    if (this.hasSigner()) {
      length += this.signer.getByteLength();
    }

    if (this.hasRequestedKeys()) {
      length += varuint.encodingLength(this.requestedKeys ? this.requestedKeys.length : 0);
      if (this.requestedKeys) {
        for (const key of this.requestedKeys) {    
          length += HASH160_BYTE_LENGTH;
        }
      }
    }

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength(); 
    }
    
    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
    writer.writeCompactSize(this.flags.toNumber());
    writer.writeCompactSize(this.dataType.toNumber());
    writer.writeCompactSize(this.requestType.toNumber());
    writer.writeCompactSize(this.searchDataKeyHashType.toNumber());

    writer.writeCompactSize(this.searchDataKey.length);

    for (const item of this.searchDataKey) {
      const key = Object.keys(item)[0];
      const value = item[key];
      writer.writeSlice(fromBase58Check(key).hash); // 20-byte VDXF key
      writer.writeVarSlice(value);
    }

    if (this.hasSigner()) {
      writer.writeSlice(this.signer.toBuffer());
    }

    if(this.hasRequestedKeys()) {
      writer.writeCompactSize(this.requestedKeys.length);
        for (const key of this.requestedKeys) {
          writer.writeSlice(fromBase58Check(key).hash); // 20-byte VDXF key
        }    
    }

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }
      
    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new BufferReader(buffer, offset);
    this.flags = new BN(reader.readCompactSize());
    this.dataType = new BN(reader.readCompactSize());
    this.requestType = new BN(reader.readCompactSize());
    this.searchDataKeyHashType = new BN(reader.readCompactSize());
    
    const searchDataKeyLength = reader.readCompactSize();    
    this.searchDataKey = [];

    for (let i = 0; i < searchDataKeyLength; i++) {
      const keyHash = reader.readSlice(HASH160_BYTE_LENGTH); // 20-byte VDXF key
      const value = reader.readVarSlice();
      const key = toBase58Check(keyHash, I_ADDR_VERSION);
      this.searchDataKey.push({ [key]: value });
    }
    
    if (this.hasSigner()) {
      const signer = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = signer.fromBuffer(reader.buffer, reader.offset);
      this.signer = signer;
    }

    if (this.hasRequestedKeys()) {
      const requestedKeysLength = reader.readCompactSize();
      this.requestedKeys = [];
      for (let i = 0; i < requestedKeysLength; i++) {
        const keyHash = reader.readSlice(20); // 20-byte VDXF key
        const key = toBase58Check(keyHash, I_ADDR_VERSION);
        this.requestedKeys.push(key);
      }
    }

    if (this.hasRequestID()) {
      const requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = requestID.fromBuffer(reader.buffer, reader.offset);
      this.requestID = requestID;
    }

    return reader.offset;
  }

  toJson(): UserDataRequestJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      datatype: this.dataType.toNumber(),
      requesttype: this.requestType.toNumber(),
      searchdatakeyhashtype: this.searchDataKeyHashType.toNumber(),
      searchdatakey: this.searchDataKey,
      signer: this.signer?.toJson(),
      requestedkeys: this.requestedKeys,
      requestid: this.requestID?.toJson(),
    };
  }

  static fromJson(json: UserDataRequestJson) {
    const requestData = new UserDataRequestDetails();
    requestData.version = new BN(json.version);
    requestData.flags = new BN(json.flags);
    requestData.dataType = new BN(json.datatype);
    requestData.requestType = new BN(json.requesttype);
    requestData.searchDataKeyHashType = json.searchdatakeyhashtype == null ? DEFAULT_HASH_TYPE : new BN(json.searchdatakeyhashtype);
    requestData.searchDataKey = json.searchdatakey;
    requestData.signer = json.signer ? CompactIAddressObject.fromCompactAddressObjectJson(json.signer) : undefined;
    requestData.requestedKeys = json.requestedkeys;
    requestData.requestID = json.requestid ? CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined;

    return requestData;
  }
}
