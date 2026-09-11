import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import varint from '../../../utils/varint'
import bufferutils from '../../../utils/bufferutils'
import createHash = require('create-hash');
import { BigNumber } from '../../../utils/types/BigNumber';
import { BN } from 'bn.js';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactIAddressObject, CompactAddressObjectJson } from '../CompactAddressObject';
const { BufferReader, BufferWriter } = bufferutils;

export type AuthenticationResponseDetailsJson = {
  flags: string,
  requestid?: CompactAddressObjectJson
}

export class AuthenticationResponseDetails extends SerializableEntityBase implements SerializableEntity {
  flags?: BigNumber;
  requestID?: CompactIAddressObject;              // ID of request, to be referenced in response
  
  static FLAG_HAS_REQUEST_ID = new BN(1, 10);

  constructor (data?: {
    flags?: BigNumber,
    requestID?: CompactIAddressObject
  }) {
    super();
    this.flags = data && data.flags ? data.flags : new BN("0", 10);
    this.requestID = data?.requestID || null;

    this.setFlags();
  }

  hasRequestID(): boolean {
    return this.flags.and(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID).eq(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID);
  }

  setFlags() {
    this.flags = this.calcFlags();
  }

  calcFlags(flags: BigNumber = this.flags): BigNumber {
    if (this.requestID) {
      flags = flags.or(AuthenticationResponseDetails.FLAG_HAS_REQUEST_ID);
    }
    return flags;
  }

  toSha256() {
    return createHash("sha256").update(this.toBuffer()).digest();
  }

  getByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.flags);

    if (this.hasRequestID()) {
      length += this.requestID.getByteLength();
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.flags);

    if (this.hasRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0, rootSystemName: string = 'VRSC') {
    const reader = new BufferReader(buffer, offset);

    this.flags = reader.readVarInt();

    if (this.hasRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    return reader.offset;
  }

  toJson(): AuthenticationResponseDetailsJson {
    return {
      flags: this.flags.toString(10),
      requestid: this.hasRequestID() ? this.requestID.toJson() : undefined
    }
  }

  static fromJson(json: AuthenticationResponseDetailsJson): AuthenticationResponseDetails {
    return new AuthenticationResponseDetails({
      flags: new BN(json.flags, 10),
      requestID: json.requestid ? CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined
    });
  }
}