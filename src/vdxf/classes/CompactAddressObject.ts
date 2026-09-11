/**
 * CompactIdentityObject - Class representing an id in the smallest possible format
 *
 * This class is used to represent an identity or address in a compact format, allowing for efficient
 * storage and transmission. The compact id can be represented either as a fully qualified name (FQN)
 * or as an identity address (iaddress) or as an x address (tag/index). The class includes methods for serialization, deserialization,
 * and validation of the compact id object.
 */

import { BN } from 'bn.js';
import { SerializableEntityBase } from '../../utils/types/SerializableEntityBase';
import bufferutils from '../../utils/bufferutils';
import { BigNumber } from '../../utils/types/BigNumber';
const { BufferReader, BufferWriter } = bufferutils;
import { SerializableEntity } from '../../utils/types/SerializableEntity';
import varuint from '../../utils/varuint';
import { fromBase58Check, getDataKey, toBase58Check, toIAddress, toXAddress } from "../../utils/address";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, X_ADDR_VERSION } from '../../constants/vdxf';
import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';

export interface CompactAddressObjectJson {
  version: number;
  type: number;
  address: string;
  rootsystemname: string;
  namespace?: string;
}

export interface CompactAddressObjectInterface {
  version?: BigNumber;
  type: BigNumber;
  address: string;
  rootSystemName?: string;
  nameSpace?: string;
}

export type CompactAddressIVariant = "COMPACT_ADDR_I_VARIANT";
export type CompactAddressXVariant = "COMPACT_ADDR_X_VARIANT";
export type CompactAddressVariantName = CompactAddressIVariant | CompactAddressXVariant;

// TODO: Find some way to not have to hardcode the version numbers into the types here and instead use the above constants
export type CompactAddressVariantAllowedType<T extends CompactAddressVariantName> = 
  T extends CompactAddressIVariant ? `${1 | 2}` :
  T extends CompactAddressXVariant ? `${1 | 3}` :
  never;

export class CompactAddressObject<V extends CompactAddressVariantName = CompactAddressIVariant> extends SerializableEntityBase implements SerializableEntity {
  static VERSION_INVALID = new BN(0);
  static FIRST_VERSION = new BN(1);
  static LAST_VERSION = new BN(1);
  static DEFAULT_VERSION = new BN(1);

  static TYPE_FQN = new BN(1);
  static TYPE_I_ADDRESS = new BN(2);
  static TYPE_X_ADDRESS = new BN(3);

  version: BigNumber;
  type: CompactAddressVariantAllowedType<V>;
  address: string;
  rootSystemName: string;
  nameSpace: string;

  constructor(data?: CompactAddressObjectInterface) {
    super();
    this.version = data?.version || new BN(CompactAddressObject.DEFAULT_VERSION);
    this.type = (data?.type.toString() as CompactAddressVariantAllowedType<V>) || ("1" as CompactAddressVariantAllowedType<V>);
    this.address = data?.address || '';
    this.rootSystemName = data?.rootSystemName || 'VRSC';
    this.nameSpace = data?.nameSpace || toIAddress(this.rootSystemName);
  }

  get BNType() {
    return new BN(this.type);
  }

  set setType(type: BigNumber) {
    this.type = type.toString() as CompactAddressVariantAllowedType<V>
  }

  isFQN(): boolean {
    return (this.BNType.eq(CompactAddressObject.TYPE_FQN));
  }

  isIaddress(): boolean {
    return (this.BNType.eq(CompactAddressObject.TYPE_I_ADDRESS));
  }

  isXaddress(): boolean {
    return (this.BNType.eq(CompactAddressObject.TYPE_X_ADDRESS));
  }

  isValid(): boolean {
    return this.address != null;
  }

  toIAddress(): string {
    if (this.isXaddress()) throw new Error("Cannot convert I to X address")
    else if (this.isIaddress()) return this.address;
    else if (this.isFQN()) {
      if (this.address.includes("::")) {
        return getDataKey(this.address, this.nameSpace, toIAddress(this.rootSystemName), I_ADDR_VERSION).id;
      } else {
        return toIAddress(this.address, this.rootSystemName);
      }
    } else throw new Error("Unknown type")
  }

  toXAddress(): string {
    if (this.isIaddress()) throw new Error("Cannot convert X to I address")
    else if (this.isXaddress()) return this.address;
    else if (this.isFQN()) {
      if (this.address.includes("::")) {
        return getDataKey(this.address, this.nameSpace, toIAddress(this.rootSystemName), X_ADDR_VERSION).id;
      } else {
        return toXAddress(this.address, this.rootSystemName);
      }
    } else throw new Error("Unknown type")
  }

  toString(): string {
    if (this.isIaddress()) {
      return this.toIAddress();
    } else if (this.isXaddress()) {
      return this.toXAddress();
    } else return this.address
  }

  static fromIAddress(iaddr: string): CompactAddressObject<CompactAddressIVariant> {
    return new CompactAddressObject({
      address: iaddr,
      type: CompactAddressObject.TYPE_I_ADDRESS
    })
  }

  static fromXAddress(xaddr: string, nameSpace: string = DEFAULT_VERUS_CHAINID): CompactAddressObject<CompactAddressXVariant> {
    return new CompactAddressObject({
      address: xaddr,
      nameSpace: nameSpace,
      type: CompactAddressObject.TYPE_X_ADDRESS
    })
  }

  private getFQNWithoutSuffix(): string {
    if (!this.isFQN()) return this.address;

    // If FQN ends with ".", it's explicitly defined - don't modify
    if (this.address.endsWith(".") || this.address.endsWith(".@")) return this.address;

    // Don't modify the root system name itself or VDXF keys
    if (this.address.toLowerCase() === this.rootSystemName.toLowerCase() || this.address.includes("::")) {
      return this.address;
    }

    const suffix = `.${this.rootSystemName.toLowerCase()}`;
    const lowerAddr = this.address.toLowerCase();

    // Check for pattern: .rootSystemName@ (e.g., "michael.vrsc@" → "michael@")
    if (lowerAddr.endsWith(`${suffix}@`)) {
      // Remove the suffix but keep the @
      return this.address.slice(0, -(suffix.length + 1)) + '@';
    }

    // Check for pattern: .rootSystemName (e.g., "michael.vrsc" → "michael")
    if (lowerAddr.endsWith(suffix)) {
      return this.address.slice(0, -suffix.length);
    }

    return this.address;
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.version.toNumber());
    length += varuint.encodingLength(this.BNType.toNumber());

    if (this.isIaddress() || this.isXaddress()) {
      length += HASH160_BYTE_LENGTH; // identityuint160
    } else {
      // For FQN, use the address without the root system suffix
      const addrToSerialize = this.getFQNWithoutSuffix();
      const addrLen = Buffer.from(addrToSerialize, 'utf8').byteLength;

      length += varuint.encodingLength(addrLen) + addrLen
    }

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.version.toNumber());
    writer.writeCompactSize(this.BNType.toNumber());

    if (this.isIaddress() || this.isXaddress()) {
      writer.writeSlice(fromBase58Check(this.address).hash);
    } else {
      // For FQN, write without the root system suffix to save space
      const addrToSerialize = this.getFQNWithoutSuffix();
      writer.writeVarSlice(Buffer.from(addrToSerialize, 'utf8'));
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readCompactSize());
    this.type = new BN(reader.readCompactSize()).toString() as CompactAddressVariantAllowedType<V>;

    if (this.isIaddress() || this.isXaddress()) {
      this.address = toBase58Check(reader.readSlice(20), this.isIaddress() ? I_ADDR_VERSION : X_ADDR_VERSION);
    } else {
      // Read FQN as-is without re-adding suffix
      // The suffix was stripped during serialization and remains stripped
      this.address = reader.readVarSlice().toString('utf8');
    }

    return reader.offset;
  }

  toJson(): CompactAddressObjectJson {
    return {
      version: this.version.toNumber(),
      type: this.BNType.toNumber(),
      address: this.address,
      rootsystemname: this.rootSystemName,
    };
  }

  static fromJson<V extends CompactAddressVariantName>(json: any): CompactAddressObject<V> {
    const instance = new CompactAddressObject<V>();

    instance.version = new BN(json.version);
    instance.type = new BN(json.type).toString() as CompactAddressVariantAllowedType<V>;
    instance.address = json.address;
    instance.rootSystemName = json.rootsystemname;

    return instance;
  }
}

export class CompactXAddressObject extends CompactAddressObject<CompactAddressXVariant> {
  static fromAddress(xaddr: string, rootSystemName: string = "VRSC", nameSpace?: string): CompactXAddressObject {
    return new CompactXAddressObject({
      address: xaddr,
      nameSpace: nameSpace,
      rootSystemName: rootSystemName,
      type: CompactAddressObject.TYPE_X_ADDRESS
    })
  }

  static fromDataKey(xaddr: string, rootSystemName: "VRSC", nameSpace?: string): CompactXAddressObject {
    return new CompactXAddressObject({
      address: xaddr,
      nameSpace: nameSpace,
      rootSystemName: rootSystemName,
      type: CompactAddressObject.TYPE_FQN
    })
  }

  toAddress() {
    return this.toXAddress();
  }

  static fromCompactAddressObjectJson(json: any): CompactXAddressObject {
    const inst = CompactAddressObject.fromJson(json);

    return inst as CompactXAddressObject;
  }
};

export class CompactIAddressObject extends CompactAddressObject<CompactAddressIVariant> {
  static fromAddress(iaddr: string, rootSystemName: string = "VRSC", nameSpace?: string): CompactIAddressObject {
    return new CompactIAddressObject({
      address: iaddr,
      rootSystemName: rootSystemName,
      nameSpace: nameSpace,
      type: CompactAddressObject.TYPE_I_ADDRESS
    })
  }

  static fromFQN(iaddr: string, rootSystemName: string = "VRSC", nameSpace?: string): CompactIAddressObject {
    return new CompactIAddressObject({
      address: iaddr,
      rootSystemName: rootSystemName,
      nameSpace: nameSpace,
      type: CompactAddressObject.TYPE_FQN
    })
  }

  toAddress() {
    return this.toIAddress();
  }

  static fromCompactAddressObjectJson(json: any): CompactIAddressObject {
    const inst = CompactAddressObject.fromJson(json);

    return new CompactIAddressObject({
      address: inst.address,
      nameSpace: inst.nameSpace,
      type: new BN(inst.type),
      rootSystemName: inst.rootSystemName
    })
  }
};
