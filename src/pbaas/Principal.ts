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
  minSigs?: BigNumber;
  primaryAddresses?: Array<KeyID>;

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    minSigs?: BigNumber,
    primaryAddresses?: Array<KeyID>;
  }) {
    this.flags = PRINCIPAL_DEFAULT_FLAGS;
    this.version = PRINCIPAL_VERSION_INVALID;

    if (data != null) {
      const d = data as any;
      if ('min_sigs' in d || 'primary_addresses' in d) {
        throw new Error("Principal: snake_case property names are no longer supported. Use 'minSigs' instead of 'min_sigs', 'primaryAddresses' instead of 'primary_addresses'.");
      }
      if (data.flags != null) this.flags = data.flags
      if (data.version != null) this.version = data.version
      if (data.minSigs != null) this.minSigs = data.minSigs
      if (data.primaryAddresses) this.primaryAddresses = data.primaryAddresses;
    }
  }

  /** @deprecated Use minSigs instead */
  get min_sigs(): BigNumber | undefined { return this.minSigs; }

  /** @deprecated Use primaryAddresses instead */
  get primary_addresses(): Array<KeyID> | undefined { return this.primaryAddresses; }

  protected containsFlags() {
    return true;
  }

  protected containsVersion() {
    return true;
  }

  protected containsPrimaryAddresses() {
    return true;
  }

  protected containsMinSigs() {
    return true;
  }

  private getSelfByteLength() {
    let byteLength = 0;

    if (this.containsVersion()) byteLength += 4; //uint32 version size
    if (this.containsFlags()) byteLength += 4; //uint32 flags size

    if (this.containsPrimaryAddresses()) {
      byteLength += varuint.encodingLength(this.primaryAddresses.length);

      for (const addr of this.primaryAddresses) {
        byteLength += varuint.encodingLength(addr.getByteLength());
        byteLength += addr.getByteLength();
      }
    }

    if (this.containsMinSigs()) {
      byteLength += 4; //uint32 minimum signatures size
    }
    
    return byteLength
  }

  getByteLength() {
    return this.getSelfByteLength()
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getSelfByteLength()))

    if (this.containsVersion()) writer.writeUInt32(this.version.toNumber())
    if (this.containsFlags()) writer.writeUInt32(this.flags.toNumber())

    if (this.containsPrimaryAddresses()) writer.writeVector(this.primaryAddresses.map(x => x.toBuffer()))

    if (this.containsMinSigs()) writer.writeUInt32(this.minSigs.toNumber())

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    if (this.containsVersion()) this.version = new BN(reader.readUInt32(), 10);
    if (this.containsFlags()) this.flags = new BN(reader.readUInt32(), 10);

    if (this.containsPrimaryAddresses()) {
      this.primaryAddresses = reader.readVector().map(x => {
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

    if (this.containsMinSigs()) this.minSigs = new BN(reader.readUInt32(), 10);

    return reader.offset;
  }
}

