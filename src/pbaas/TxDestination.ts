import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BN } from 'bn.js';
import { BigNumber } from '../utils/types/BigNumber';
import { IdentityID } from './IdentityID';
import { KeyID } from './KeyID';
import { NoDestination } from './NoDestination';
import varuint from '../utils/varuint';

import bufferutils from '../utils/bufferutils';
import { PubKey } from './PubKey';
import { UnknownID } from './UnknownID';
import { SerializableEntity } from '../utils/types/SerializableEntity';
const { BufferReader, BufferWriter } = bufferutils;

export interface TxDestinationVariantInterface {
  new (hash?: Buffer): TxDestinationVariant;
}

// Add support for CNoDestination, CPubKey, CScriptID, CIndexID, CQuantumID
export type TxDestinationVariant = IdentityID | KeyID | NoDestination | PubKey | UnknownID;

export class TxDestination extends SerializableEntityBase implements SerializableEntity {
  type: BigNumber;
  data: TxDestinationVariant;

  static TYPE_INVALID = new BN(0, 10);
  static TYPE_PK = new BN(1, 10);
  static TYPE_PKH = new BN(2, 10);
  static TYPE_SH = new BN(3, 10);
  static TYPE_ID = new BN(4, 10);
  static TYPE_INDEX = new BN(5, 10);
  static TYPE_QUANTUM = new BN(6, 10);
  static TYPE_LAST = new BN(6, 10);

  constructor(data: TxDestinationVariant = new NoDestination(), type?: BigNumber) {
    super();
    this.data = data;

    if (!type) {
      this.type = TxDestination.getTxDestinationVariantType(data);
    } else this.type = type;
  }

  static getTxDestinationVariantType(variant: TxDestinationVariant): BigNumber {
    if (variant instanceof PubKey) return TxDestination.TYPE_PK;
    else if (variant instanceof KeyID) return TxDestination.TYPE_PKH;
    else if (variant instanceof IdentityID) return TxDestination.TYPE_ID;
    else return TxDestination.TYPE_INVALID
  }

  static getTxDestinationVariant(type: BigNumber): TxDestinationVariantInterface {
    if (type.eq(this.TYPE_PK)) return PubKey;
    else if (type.eq(this.TYPE_PKH)) return KeyID;
    else if (type.eq(this.TYPE_ID)) return IdentityID;
    else return UnknownID;
  }

  toAddress(): string {
    if (this.data instanceof IdentityID || this.data instanceof KeyID) return this.data.toAddress();
    else throw new Error("Can't get address for TxDestination type " + this.type.toNumber())
  }
  
  getByteLength(): number {
    if (this.type.eq(TxDestination.TYPE_PKH)) return 21
    else if (this.type.eq(TxDestination.TYPE_PK)) return 34
    else {
      const datalen = this.data.getByteLength() + 1;

      return varuint.encodingLength(datalen) + datalen;
    }
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    const destBytes = reader.readVarSlice();

    if (destBytes.length === 20) {
      this.type = TxDestination.TYPE_PKH;
      this.data = new KeyID(destBytes);
    } else if (destBytes.length === 33) {
      this.type = TxDestination.TYPE_PK;
      this.data = new PubKey(destBytes);
    } else {
      const subReader = new BufferReader(destBytes, 0);

      this.type = new BN(subReader.readUInt8(), 10);

      const DestVariant = TxDestination.getTxDestinationVariant(this.type);

      this.data = new DestVariant(subReader.readSlice(destBytes.length - subReader.offset));
    }

    return reader.offset;
  }

  toBuffer(): Buffer {
    const buffer = Buffer.alloc(this.getByteLength());
    const writer = new BufferWriter(buffer);

    if (this.type.eq(TxDestination.TYPE_PKH) || this.type.eq(TxDestination.TYPE_PK)) {
      writer.writeVarSlice(this.data.toBuffer());
    } else {
      const subWriter = new BufferWriter(Buffer.alloc(1 + this.data.getByteLength()));

      subWriter.writeUInt8(this.type.toNumber());
      subWriter.writeSlice(this.data.toBuffer());

      writer.writeVarSlice(subWriter.buffer);
    }

    return writer.buffer;
  }

  static fromChunk(chunk: Buffer): TxDestination {
    const writer = new BufferWriter(Buffer.alloc(varuint.encodingLength(chunk.length)));
    writer.writeCompactSize(chunk.length)

    const dest = new TxDestination()

    dest.fromBuffer(Buffer.concat([writer.buffer, chunk]))

    return dest
  }

  toChunk() {
    return Buffer.from(this.toBuffer().subarray(varuint.encodingLength(this.data.toBuffer().length)));
  }
}