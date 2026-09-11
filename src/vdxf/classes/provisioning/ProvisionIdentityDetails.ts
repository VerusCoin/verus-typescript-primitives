/**
 * ProvisioningIdentity - Class for handling identity provisioning requests
 * 
 * This class is used when an application is requesting the provisioning or creation of a new identity
 * within the Verus blockchain ecosystem. The request includes:
 * - System ID (e.g., VRSC@) defining the blockchain system
 * - Parent ID (e.g., Token@) defining the parent namespace 
 * - Identity ID (e.g., john.VRSC@) defining the full identity to be provisioned
 * - Flags indicating which components are present and required
 * 
 * The user's wallet can use these parameters to understand the complete identity hierarchy
 * and present a clear provisioning request to the user, showing the system context,
 * parent namespace, and the specific identity being created. This enables secure,
 * user-controlled identity provisioning with proper namespace management.
 */

import bufferutils from "../../../utils/bufferutils";
import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from "../../../utils/types/BigNumber";
import { BN } from "bn.js";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import { CompactIAddressObject, CompactAddressObjectJson } from "../CompactAddressObject";
import varuint from "../../../utils/varuint";
import { RequestURI, RequestURIJson } from "../RequestURI";

export interface ProvisionIdentityDetailsInterface {
  version?: BigNumber;
  flags?: BigNumber;
  uri?: RequestURI;
  systemID?: CompactIAddressObject; // system e.g. VRSC@
  parentID?: CompactIAddressObject; // parent e.g. Token@
  identityID?: CompactIAddressObject; // Full identity e.g. john.VRSC@
}

export interface ProvisionIdentityDetailsJson {
  version?: number;
  flags: number;
  uri?: RequestURIJson;
  systemid?: CompactAddressObjectJson;
  parentid?: CompactAddressObjectJson;
  identityid?: CompactAddressObjectJson;
}

export class ProvisionIdentityDetails extends SerializableEntityBase implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  uri?: RequestURI;
  systemID?: CompactIAddressObject; // system e.g. VRSC@
  parentID?: CompactIAddressObject; // parent e.g. Token@
  identityID?: CompactIAddressObject; // Full identity e.g. john.VRSC@
  
  // Version
  static DEFAULT_VERSION = new BN(1, 10)
  static VERSION_FIRSTVALID = new BN(1, 10)
  static VERSION_LASTVALID = new BN(1, 10)

  // flags include params // parent same as signer
  static FLAG_HAS_SYSTEMID = new BN(1, 10);
  static FLAG_HAS_PARENTID = new BN(2, 10);
  static FLAG_HAS_IDENTITY_ID = new BN(4, 10);
  static FLAG_HAS_URI = new BN(8, 10);

  constructor(data?: ProvisionIdentityDetailsInterface) {
    super();
    this.version = data?.version || ProvisionIdentityDetails.DEFAULT_VERSION;
    this.flags = data?.flags || new BN(0, 10);
    this.uri = data?.uri;
    this.systemID = data?.systemID;
    this.parentID = data?.parentID;
    this.identityID = data?.identityID;

    this.setFlags();
  }

  hasSystemId(): boolean {
    return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID).eq(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID);
  }

  hasParentId(): boolean {
    return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_PARENTID).eq(ProvisionIdentityDetails.FLAG_HAS_PARENTID);
  }

  hasIdentityId(): boolean {
    return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID).eq(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID);
  }

  hasUri(): boolean {
    return this.flags.and(ProvisionIdentityDetails.FLAG_HAS_URI).eq(ProvisionIdentityDetails.FLAG_HAS_URI);
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.hasUri()) {
      if (this.uri == null) throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
      length += this.uri.getByteLength();
    }

    if (this.hasSystemId()) {
      length += this.systemID.getByteLength();
    }

    if (this.hasParentId()) {
      length += this.parentID.getByteLength();
    } 

    if (this.hasIdentityId()) {
      length += this.identityID.getByteLength();
    } 

    return length;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()))

    writer.writeCompactSize(this.flags.toNumber());

    if (this.hasUri()) {
      if (this.uri == null) throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
      writer.writeSlice(this.uri.toBuffer());
    }

    if (this.hasSystemId()) {
      writer.writeSlice(this.systemID.toBuffer());
    }

    if (this.hasParentId()) {
      writer.writeSlice(this.parentID.toBuffer());
    } 

    if (this.hasIdentityId()) {
      writer.writeSlice(this.identityID.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    if (buffer.length == 0) throw new Error("Cannot create provision identity from empty buffer");

    this.flags = new BN(reader.readCompactSize());

    if (this.hasUri()) {
      this.uri = new RequestURI();
      reader.offset = this.uri.fromBuffer(reader.buffer, reader.offset);
    } else {
      this.uri = undefined;
    }

    if (this.hasSystemId()) {
      const systemID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
      reader.offset = systemID.fromBuffer(reader.buffer, reader.offset);
      this.systemID = systemID;
    }

    if (this.hasParentId()) {
      const parentID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
      reader.offset = parentID.fromBuffer(reader.buffer, reader.offset);
      this.parentID = parentID;
    }

    if (this.hasIdentityId()) {
      const identityID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
      reader.offset = identityID.fromBuffer(reader.buffer, reader.offset);
      this.identityID = identityID;
    }

    return reader.offset;
  }

  toJson(): ProvisionIdentityDetailsJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      uri: this.uri ? this.uri.toJson() : null,
      systemid: this.systemID ? this.systemID.toJson() : null,
      parentid: this.parentID ? this.parentID.toJson() : null,
      identityid: this.identityID ? this.identityID.toJson() : null,
    };
  }

  static fromJson(data: any): ProvisionIdentityDetails {
    const provision = new ProvisionIdentityDetails();
    provision.version = new BN(data?.version || 0);
    provision.flags = new BN(data?.flags || 0);

    if (provision.hasUri()) {
      if (data?.uri == null) {
        throw new Error("Missing uri for ProvisionIdentityDetails with FLAG_HAS_URI set");
      }
      provision.uri = RequestURI.fromJson(data.uri);
    }

    if (provision.hasSystemId()) {
      provision.systemID = CompactIAddressObject.fromCompactAddressObjectJson(data.systemid);
    }

    if (provision.hasParentId()) {
      provision.parentID = CompactIAddressObject.fromCompactAddressObjectJson(data.parentid);
    }

    if (provision.hasIdentityId()) {
      provision.identityID = CompactIAddressObject.fromCompactAddressObjectJson(data.identityid);
    }

    return provision;
  }

  calcFlags(): BigNumber {
    let flags = new BN(this.flags);

    if (this.systemID) {
      flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_SYSTEMID);
    }

    if (this.parentID) {
      flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_PARENTID);
    }

    if (this.identityID) {
      flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID);
    }

    if (this.uri) {
      flags = flags.or(ProvisionIdentityDetails.FLAG_HAS_URI);
    }

    return flags;
  }

  setFlags() {
    this.flags = this.calcFlags();
  }

  isValid(): boolean {
    let valid = this.flags != null && this.flags.gte(new BN(0));

    valid &&= this.version != null;
    if (this.hasUri()) {
      valid &&= this.uri != null;
    }
     
    return valid;
  }
}
