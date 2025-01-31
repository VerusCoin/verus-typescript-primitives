import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import varuint from '../utils/varuint';
import { KeyID } from './KeyID';
import { NoDestination } from './NoDestination';
import { SerializableEntity } from '../utils/types/SerializableEntity';

export const PRINCIPAL_DEFAULT_FLAGS = new BN(0, 10)

export const PRINCIPAL_VERSION_INVALID = new BN(0, 10)
export const PRINCIPAL_VERSION_CURRENT = new BN(1, 10)

const { BufferReader, BufferWriter } = bufferutils

export class Principal implements SerializableEntity {
  flags: BigNumber;
  version: BigNumber;
  min_sigs?: BigNumber;
  primary_addresses?: Array<KeyID>;

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    min_sigs?: BigNumber,
    primary_addresses?: Array<KeyID>;
  }) {
    this.flags = PRINCIPAL_DEFAULT_FLAGS;
    this.version = PRINCIPAL_VERSION_INVALID;

    if (data != null) {
      if (data.flags != null) this.flags = data.flags
      if (data.version != null) this.version = data.version
      if (data.min_sigs != null) this.min_sigs = data.min_sigs
      if (data.primary_addresses) this.primary_addresses = data.primary_addresses;
    }
  }

  protected serializeFlags() {
    return true;
  }

  protected serializeVersion() {
    return true;
  }

  protected serializePrimaryAddresses() {
    return true;
  }

  protected serializeMinSigs() {
    return true;
  }

  private getSelfByteLength() {
    let byteLength = 0;

    if (this.serializeVersion()) byteLength += 4; //uint32 version size
    if (this.serializeFlags()) byteLength += 4; //uint32 flags size

    if (this.serializePrimaryAddresses()) {
      byteLength += varuint.encodingLength(this.primary_addresses.length);

      for (const addr of this.primary_addresses) {
        byteLength += varuint.encodingLength(addr.getByteLength());
        byteLength += addr.getByteLength();
      }
    }

    if (this.serializeMinSigs()) {
      byteLength += 4; //uint32 minimum signatures size
    }
    
    return byteLength
  }

  getByteLength() {
    return this.getSelfByteLength()
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()))

    if (this.serializeVersion()) writer.writeUInt32(this.version.toNumber())
    if (this.serializeFlags()) writer.writeUInt32(this.flags.toNumber())

    if (this.serializePrimaryAddresses()) writer.writeVector(this.primary_addresses.map(x => x.toBuffer()))

    if (this.serializeMinSigs()) writer.writeUInt32(this.min_sigs.toNumber())

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    if (this.serializeVersion()) this.version = new BN(reader.readUInt32(), 10);
    if (this.serializeFlags()) this.flags = new BN(reader.readUInt32(), 10);

    if (this.serializePrimaryAddresses()) {
      this.primary_addresses = reader.readVector().map(x => {
        if (x.length === 20) {
          return new KeyID(x);
        } else if (x.length === 33) {
          //TODO: Implement pubkey principal by adding PubKey class as possible TxDestination
          throw new Error("Pubkey Principal not yet supported");
        } else {
          return new NoDestination();
        }
      })
    }

    if (this.serializeMinSigs()) this.min_sigs = new BN(reader.readUInt32(), 10);

    return reader.offset;
  }
}

