/**
 * DataPacketRequestDetails - Class for sending personal data to user or requesting the user
 * signature on personal data
 * 
 * This class is used when an application is requesting to transfer or receive personal
 * user data. The request includes:
 * - Data objects as DataDescriptor instances containing the user's personal data
 * - Optional statements array for additional context or transfer conditions
 * - Optional signature data for verification of the transfer
 * - Flags indicating transfer direction and optional components
 * 
 * The user's wallet can use these parameters to present the data transfer request
 * to the user, showing what personal data is being transferred, any associated
 * statements or conditions, and whether it's for the user's signature or being
 * transmitted to/from the user. This enables secure, user-controlled personal
 * data sharing with clear visibility into what data is being transferred.
 * 

 */

import { BigNumber } from '../../../utils/types/BigNumber';
import { BN } from 'bn.js';
import varuint from '../../../utils/varuint';
import bufferutils from '../../../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { DataDescriptor, DataDescriptorJson } from '../../../pbaas';
import { VerifiableSignatureData, VerifiableSignatureDataJson } from '../VerifiableSignatureData';
import { CompactAddressObjectJson, CompactIAddressObject } from '../CompactAddressObject';

export interface DataPacketRequestDetailsInterface {
  version?: BigNumber;
  flags: BigNumber;
  signableObjects: Array<DataDescriptor>;
  statements?: Array<string>;
  signature?: VerifiableSignatureData;
  requestID?: CompactIAddressObject;
  salt?: Buffer;
}

export interface DataPacketRequestDetailsJson {
  version: number;
  flags: number;
  signableobjects: Array<DataDescriptorJson>;   // Array of signable data objects
  statements?: Array<string>;
  signature?: VerifiableSignatureDataJson;
  requestid?: CompactAddressObjectJson;
  salt?: string;
}

export class DataPacketRequestDetails implements SerializableEntity {
  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);

  // types of data to sign
  static FLAG_HAS_REQUEST_ID = new BN(1);
  static FLAG_HAS_STATEMENTS = new BN(2);
  static FLAG_HAS_SIGNATURE = new BN(4);
  static FLAG_FOR_USERS_SIGNATURE = new BN(8);
  static FLAG_FOR_TRANSMITTAL_TO_USER = new BN(16);
  static FLAG_HAS_URL_FOR_DOWNLOAD = new BN(32);
  static FLAG_HAS_SALT = new BN(64);
  static FLAG_STATEMENTS_ARE_DATA_DESCRIPTORS = new BN(128);

  version: BigNumber;
  flags: BigNumber;
  signableObjects: Array<DataDescriptor>;
  statements?: Array<string>;
  signature?: VerifiableSignatureData;
  requestID?: CompactIAddressObject;
  salt?: Buffer;

  constructor(data?: DataPacketRequestDetailsInterface) {
    this.version = data?.version || DataPacketRequestDetails.DEFAULT_VERSION;
    this.flags = data?.flags || new BN(0);
    this.signableObjects = data?.signableObjects || [];
    this.statements = data?.statements || [];
    this.signature = data?.signature || undefined;
    this.requestID = data?.requestID;
    this.salt = data?.salt;
    this.setFlags();
  }

  setFlags(): void {  
    this.flags = this.calcFlags();
  }

  calcFlags(): BigNumber {
    let flags = new BN(this.flags);
    
    if (this.statements && this.statements.length > 0) {
      flags = flags.or(DataPacketRequestDetails.FLAG_HAS_STATEMENTS);
    }

    if (this.signature ) {
      flags = flags.or(DataPacketRequestDetails.FLAG_HAS_SIGNATURE);
    }

    if (this.requestID) {
      flags = flags.or(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID);
    }
    if (this.salt) {
      flags = flags.or(DataPacketRequestDetails.FLAG_HAS_SALT);
    }

    return flags;
  }

  hasStatements(): boolean {
    return this.flags.and(DataPacketRequestDetails.FLAG_HAS_STATEMENTS).eq(DataPacketRequestDetails.FLAG_HAS_STATEMENTS);
  }

  hasSignature(): boolean {
    return this.flags.and(DataPacketRequestDetails.FLAG_HAS_SIGNATURE).eq(DataPacketRequestDetails.FLAG_HAS_SIGNATURE);
  }

  hasRequestID(): boolean {
    return this.flags.and(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID).eq(DataPacketRequestDetails.FLAG_HAS_REQUEST_ID);
  }

  hasSalt(): boolean {
    return this.flags.and(DataPacketRequestDetails.FLAG_HAS_SALT).eq(DataPacketRequestDetails.FLAG_HAS_SALT);
  }

  isValid(): boolean {
    let valid = this.version.gte(DataPacketRequestDetails.FIRST_VERSION) &&
      this.version.lte(DataPacketRequestDetails.LAST_VERSION);

    // Check that we have signable objects
    valid &&= this.signableObjects.length > 0;
    if (this.hasStatements()) {
      valid &&= this.statements !== undefined && this.statements.length > 0;
    }

    if (this.hasSignature()) {
      valid &&= this.signature !== undefined; // TODO: && this.signature.isValid();
    }
    if (this.hasSalt()) {
      valid &&= this.salt !== undefined && Buffer.isBuffer(this.salt) && this.salt.length > 0;
    }

    return valid;
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    // Add length for signableObjects array
    length += varuint.encodingLength(this.signableObjects.length);

    for (const obj of this.signableObjects) {

      length += obj.getByteLength();
    }

    // Add signer length if present
    if (this.hasStatements()) {
      length += varuint.encodingLength(this.statements.length);
      for (const stmt of this.statements) {
        length += varuint.encodingLength(Buffer.byteLength(stmt, 'utf8'));
        length += Buffer.byteLength(stmt, 'utf8');
      }
    }
    if (this.hasSignature() && this.signature) {
      length += this.signature.getByteLength();
    }

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength();
    }

    if (this.hasSalt() && this.salt) {
      length += varuint.encodingLength(this.salt.length);
      length += this.salt.length;
    }

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.flags.toNumber());

    // Write signableObjects array
    writer.writeCompactSize(this.signableObjects.length);

    for (const obj of this.signableObjects) {
      writer.writeSlice(obj.toBuffer());
    }

    // Write statements if present    
    if (this.hasStatements()) {
      writer.writeCompactSize(this.statements.length);
      for (const stmt of this.statements) {
        writer.writeVarSlice(Buffer.from(stmt, 'utf8'));
      }
    }

    if (this.hasSignature() && this.signature) {
      writer.writeSlice(this.signature.toBuffer());
    }

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }

    if (this.hasSalt()) {
      writer.writeVarSlice(this.salt);
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize());

    // Read signableObjects array
    const objectCount = reader.readCompactSize();
    this.signableObjects = [];

    for (let i = 0; i < objectCount; i++) {
      const obj = new DataDescriptor();
      reader.offset = obj.fromBuffer(reader.buffer, reader.offset);
      this.signableObjects.push(obj);
    }

    // Read statements if flag is set
    if (this.hasStatements()) {
      this.statements = [];
      const statementCount = reader.readCompactSize();
      for (let i = 0; i < statementCount; i++) {
        const stmt = reader.readVarSlice().toString('utf8');
        this.statements.push(stmt);
      }
    }

    if (this.hasSignature()) {
      const signature = new VerifiableSignatureData();
      reader.offset = signature.fromBuffer(reader.buffer, reader.offset);
      this.signature = signature;
    }

    if (this.hasRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    if (this.hasSalt()) {
      this.salt = reader.readVarSlice();
    }

    return reader.offset;
  }

  toJson(): DataPacketRequestDetailsJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      signableobjects: this.signableObjects.map(obj => obj.toJson()),
      statements: this.statements,
      signature: this.signature ? this.signature.toJson() : undefined,
      requestid: this.requestID ? this.requestID.toJson() : undefined,
      salt: this.salt ? this.salt.toString('hex') : undefined
    };
  }

  static fromJson(json: DataPacketRequestDetailsJson): DataPacketRequestDetails {
    const instance = new DataPacketRequestDetails();
    instance.version = new BN(json.version);
    instance.flags = new BN(json.flags);

    const dataDescriptorObjects: Array<DataDescriptor> = [];

    for (const objJson of json.signableobjects) {
      const dataDescriptor = DataDescriptor.fromJson(objJson);
      dataDescriptorObjects.push(dataDescriptor);
    }
    
    instance.signableObjects = dataDescriptorObjects;
    instance.statements = json.statements || [];
    instance.signature = json.signature ? VerifiableSignatureData.fromJson(json.signature) : undefined;
    instance.requestID = json.requestid ? CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined;
    instance.salt = json.salt ? Buffer.from(json.salt, 'hex') : undefined;
    return instance;
  }
}