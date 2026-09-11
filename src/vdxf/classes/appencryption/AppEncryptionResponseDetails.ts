import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';

import { BigNumber } from '../../../utils/types/BigNumber';
import { BN } from 'bn.js';
import varint from '../../../utils/varint';
import bufferutils from '../../../utils/bufferutils';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { SaplingPaymentAddress } from '../../../pbaas';
import createHash = require("create-hash");
import { SaplingExtendedSpendingKey } from '../../../pbaas/SaplingExtendedSpendingKey';
import { SaplingExtendedViewingKey } from '../../../pbaas/SaplingExtendedViewingKey';
import { CompactAddressObjectJson, CompactIAddressObject } from '../CompactAddressObject';

export interface AppEncryptionResponseDetailsInterface {
  version: BigNumber;
  flags?: BigNumber;
  requestID?: CompactIAddressObject;
  incomingViewingKey: Buffer;
  extendedViewingKey: SaplingExtendedViewingKey;
  address: SaplingPaymentAddress;
  extendedSpendingKey?: SaplingExtendedSpendingKey;
}

export interface AppEncryptionResponseDetailsJson {    
  version: number;
  flags?: number;
  requestid?: CompactAddressObjectJson;
  incomingviewingkey: string;
  extendedviewingkey: string;
  address: string;
  extendedspendingkey?: string;
}

export class AppEncryptionResponseDetails extends SerializableEntityBase implements SerializableEntity {
  version: BigNumber;
  flags: BigNumber;
  requestID?: CompactIAddressObject;
  incomingViewingKey: Buffer;
  extendedViewingKey: SaplingExtendedViewingKey;
  address: SaplingPaymentAddress;
  extendedSpendingKey?: SaplingExtendedSpendingKey;

  static FLAG_HAS_REQUEST_ID = new BN(1, 10);
  static FLAG_HAS_EXTENDED_SPENDING_KEY = new BN(2, 10);

  constructor(data?: AppEncryptionResponseDetailsInterface) {
    super();
    this.version = data?.version ?? new BN(1);
    this.flags = data?.flags ?? new BN(0, 10);
    this.incomingViewingKey = data?.incomingViewingKey ?? Buffer.alloc(32);
    this.extendedViewingKey = data?.extendedViewingKey ?? new SaplingExtendedViewingKey();
    this.address = data?.address ?? new SaplingPaymentAddress();

    if (data?.requestID) {
      if (!this.containsRequestID()) this.toggleContainsRequestID();
      this.requestID = data.requestID;
    }

    if (data?.extendedSpendingKey) {
      if (!this.containsExtendedSpendingKey()) this.toggleContainsExtendedSpendingKey();
      this.extendedSpendingKey = data.extendedSpendingKey;
    }
  }

  containsRequestID() {
    return !!(this.flags.and(AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID).toNumber());
  }

  toggleContainsRequestID() {
    this.flags = this.flags.xor(AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID);
  }

  containsExtendedSpendingKey() {
    return !!(this.flags.and(AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY).toNumber());
  }

  toggleContainsExtendedSpendingKey() {
    this.flags = this.flags.xor(AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY);
  }

  toSha256() {
    return createHash("sha256").update(this.toBuffer()).digest();
  }

  getByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.flags);

    if (this.containsRequestID()) {
      length += this.requestID.getByteLength();
    }

    length += 32; // incomingViewingKey
    length += this.extendedViewingKey.getByteLength();
    length += this.address.getByteLength();

    if (this.containsExtendedSpendingKey()) {
      length += this.extendedSpendingKey.getByteLength();
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.flags);

    if (this.containsRequestID()) {
      writer.writeSlice(this.requestID.toBuffer());
    }

    writer.writeSlice(this.incomingViewingKey);
    writer.writeSlice(this.extendedViewingKey.toBuffer());
    writer.writeSlice(this.address.toBuffer());

    if (this.containsExtendedSpendingKey()) {
      writer.writeSlice(this.extendedSpendingKey.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0, rootSystemName: string = 'VRSC') {
    const reader = new BufferReader(buffer, offset);

    this.flags = reader.readVarInt();

    if (this.containsRequestID()) {
      this.requestID = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });

      reader.offset = this.requestID.fromBuffer(reader.buffer, reader.offset);
    }

    this.incomingViewingKey = reader.readSlice(32);

    this.extendedViewingKey = new SaplingExtendedViewingKey();
    reader.offset = this.extendedViewingKey.fromBuffer(reader.buffer, reader.offset);

    this.address = new SaplingPaymentAddress();
    reader.offset = this.address.fromBuffer(reader.buffer, reader.offset);

    if (this.containsExtendedSpendingKey()) {
      this.extendedSpendingKey = new SaplingExtendedSpendingKey();
      reader.offset = this.extendedSpendingKey.fromBuffer(reader.buffer, reader.offset);
    }

    return reader.offset;
  }

  toJson(): AppEncryptionResponseDetailsJson {
    return {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      requestid: this.containsRequestID() ? this.requestID.toJson() : undefined,
      incomingviewingkey: this.incomingViewingKey.toString('hex'),
      extendedviewingkey: this.extendedViewingKey.toKeyString(),
      address: this.address.toAddressString(),
      extendedspendingkey: this.containsExtendedSpendingKey() ? this.extendedSpendingKey.toKeyString() : undefined
    };
  }

  static fromJson(json: AppEncryptionResponseDetailsJson): AppEncryptionResponseDetails {
    return new AppEncryptionResponseDetails({
      version: new BN(json.version, 10),
      flags: new BN(json.flags ?? 0, 10),
      requestID: json.requestid ? CompactIAddressObject.fromCompactAddressObjectJson(json.requestid) : undefined,
      incomingViewingKey: Buffer.from(json.incomingviewingkey, 'hex'),
      extendedViewingKey: SaplingExtendedViewingKey.fromKeyString(json.extendedviewingkey),
      address: SaplingPaymentAddress.fromAddressString(json.address),
      extendedSpendingKey: json.extendedspendingkey ? SaplingExtendedSpendingKey.fromKeyString(json.extendedspendingkey) : undefined
    });
  }
}
