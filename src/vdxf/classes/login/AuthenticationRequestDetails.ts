
/**
 * AuthenticationRequestDetails - Class for handling application login and authentication requests
 * 
 * This class is used when an application is requesting authentication or login from the user,
 * including specific recipientConstraints and callback information. The request includes:
 * - Request ID for tracking the authentication session
 * - Permission sets defining what access the application is requesting
 * - Optional expiry time for the authentication session
 * 
 * The user's wallet can use these parameters to present a clear authentication request
 * to the user, showing exactly what recipientConstraints are being requested and where they will
 * be redirected after successful authentication. This enables secure, user-controlled
 * authentication flows with granular permission management.
 */

import bufferutils from "../../../utils/bufferutils";
import { BigNumber } from "../../../utils/types/BigNumber";
import { BN } from "bn.js";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import varuint from "../../../utils/varuint";
import { CompactIAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
import {
  RecipientConstraint,
  RecipientConstraintInterface,
  RecipientConstraintJson,
} from "./RecipientConstraint";

export interface AuthenticationRequestDetailsInterface {
  flags?: BigNumber;  
  requestID?: CompactIAddressObject;
  recipientConstraints?: Array<RecipientConstraint | RecipientConstraintInterface>;
  expiryTime?: BigNumber; // UNIX Timestamp
}

export interface AuthenticationRequestDetailsJson {
  requestid?: CompactAddressObjectJson;
  flags: number;
  recipientconstraints?: Array<RecipientConstraintJson>;
  expirytime?: number;
}

export class AuthenticationRequestDetails implements SerializableEntity {
  flags?: BigNumber;
  requestID?: CompactIAddressObject;
  recipientConstraints?: Array<RecipientConstraint>;
  expiryTime?: BigNumber; // UNIX Timestamp

  static FLAG_HAS_REQUEST_ID = new BN(1, 10);
  static FLAG_HAS_RECIPIENT_CONSTRAINTS = new BN(2, 10);
  static FLAG_HAS_EXPIRY_TIME = new BN(4, 10);

  constructor(
    request?: AuthenticationRequestDetailsInterface 
  ) {
    this.flags = request?.flags || new BN(0, 10);
    this.requestID = request?.requestID || null;
    this.recipientConstraints = request?.recipientConstraints ? request.recipientConstraints.map(RecipientConstraint.fromData) : null;
    this.expiryTime = request?.expiryTime || null;

    this.setFlags();
  }

  hasRequestID(): boolean {
    return this.flags.and(AuthenticationRequestDetails.FLAG_HAS_REQUEST_ID).eq(AuthenticationRequestDetails.FLAG_HAS_REQUEST_ID);
  }

  hasRecipentConstraints(): boolean {   
    return this.flags.and(AuthenticationRequestDetails.FLAG_HAS_RECIPIENT_CONSTRAINTS).eq(AuthenticationRequestDetails.FLAG_HAS_RECIPIENT_CONSTRAINTS);
  }

  hasExpiryTime(): boolean {
    return this.flags.and(AuthenticationRequestDetails.FLAG_HAS_EXPIRY_TIME).eq(AuthenticationRequestDetails.FLAG_HAS_EXPIRY_TIME);
  }

  calcFlags(flags: BigNumber = this.flags): BigNumber {
    if (this.requestID) {
      flags = flags.or(AuthenticationRequestDetails.FLAG_HAS_REQUEST_ID);
    }
    if (this.recipientConstraints) {
      flags = flags.or(AuthenticationRequestDetails.FLAG_HAS_RECIPIENT_CONSTRAINTS);
    }
    if (this.expiryTime) {
      flags = flags.or(AuthenticationRequestDetails.FLAG_HAS_EXPIRY_TIME);
    } 
    return flags;
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength();
    }

    if (this.hasRecipentConstraints()) {
      length += varuint.encodingLength(this.recipientConstraints.length);      
      for (let i = 0; i < this.recipientConstraints.length; i++) {
        length += this.recipientConstraints[i].getByteLength();
      }      
    }

    if (this.hasExpiryTime()) {
      length += varuint.encodingLength(this.expiryTime.toNumber());
    }

    return length;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()))

    writer.writeCompactSize(this.flags.toNumber());

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }
    
    if (this.hasRecipentConstraints()) {
      writer.writeCompactSize(this.recipientConstraints.length);   
      for (let i = 0; i < this.recipientConstraints.length; i++) {
        writer.writeSlice(this.recipientConstraints[i].toBuffer());
      }
    }

    if (this.hasExpiryTime()) {
      writer.writeCompactSize(this.expiryTime.toNumber());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize());

    if (this.hasRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    if (this.hasRecipentConstraints()) {
      this.recipientConstraints = [];
      const recipientConstraintsLength = reader.readCompactSize();

      for (let i = 0; i < recipientConstraintsLength; i++) {
        const recipientConstraint = new RecipientConstraint();
        reader.offset = recipientConstraint.fromBuffer(buffer, reader.offset, rootSystemName);
        this.recipientConstraints.push(recipientConstraint);
      }
    } 

    if (this.hasExpiryTime()) {
      this.expiryTime = new BN(reader.readCompactSize());
    }

    return reader.offset;
  }

  toJson(): AuthenticationRequestDetailsJson {
    const retval = {
      flags: this.flags.toNumber(),
      requestid: this.hasRequestID() ? this.requestID.toJson() : undefined,
      recipientConstraints: this.recipientConstraints ? this.recipientConstraints.map(p => p.toJson()) : undefined,
      expirytime: this.expiryTime ? this.expiryTime.toNumber() : undefined
    };

    return retval;
  }

  static fromJson(data: AuthenticationRequestDetailsJson): AuthenticationRequestDetails {
    const loginDetails = new AuthenticationRequestDetails();

    loginDetails.flags = new BN(data?.flags || 0);
    loginDetails.requestID = data.requestid ? CompactIAddressObject.fromCompactAddressObjectJson(data.requestid) : undefined;

    const recipientConstraints = data.recipientconstraints || data.recipientconstraints;
    if(loginDetails.hasRecipentConstraints() && recipientConstraints) {
      loginDetails.recipientConstraints = recipientConstraints.map(p => RecipientConstraint.fromJson(p));
    }

    if(loginDetails.hasExpiryTime() && data.expirytime) {
      loginDetails.expiryTime = new BN(data.expirytime);
    }

    return loginDetails;
  }

  setFlags() {
    this.flags = this.calcFlags();
  }   

  isValid(): boolean {
    let valid = true;
    valid &&= this.flags != null && this.flags.gte(new BN(0));
    
    if (this.hasRequestID()) {
      if (!this.requestID || !this.requestID.isValid()) {
        return false;
      }
    }

    if (this.hasRecipentConstraints()) {
      if (!this.recipientConstraints || this.recipientConstraints.length === 0) {
        return false;
      }
    }

    if (this.hasExpiryTime()) {
      if (!this.expiryTime || this.expiryTime.isZero()) {
        return false;
      }
    }

    return valid;
  }
}
