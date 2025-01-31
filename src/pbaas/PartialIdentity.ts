import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { Identity, VerusIDInitData } from './Identity';
import { BN } from 'bn.js';
import varint from '../utils/varint';
import bufferutils from '../utils/bufferutils';

const { BufferReader, BufferWriter } = bufferutils;

export class PartialIdentity extends Identity implements SerializableEntity {
  contains: BigNumber;

  static PARTIAL_ID_CONTAINS_PARENT = new BN("1", 10);
  static PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP = new BN("2", 10);
  static PARTIAL_ID_CONTAINS_PRIMARY_ADDRS = new BN("4", 10);
  static PARTIAL_ID_CONTAINS_REVOCATION = new BN("8", 10);
  static PARTIAL_ID_CONTAINS_RECOVERY = new BN("16", 10);
  static PARTIAL_ID_CONTAINS_UNLOCK_AFTER = new BN("32", 10);
  static PARTIAL_ID_CONTAINS_SYSTEM_ID = new BN("64", 10);
  static PARTIAL_ID_CONTAINS_PRIV_ADDRS = new BN("128", 10);
  static PARTIAL_ID_CONTAINS_CONTENT_MAP = new BN("256", 10);
  static PARTIAL_ID_CONTAINS_MINSIGS = new BN("512", 10);
  static PARTIAL_ID_CONTAINS_FLAGS = new BN("1024", 10);

  constructor(data?: VerusIDInitData) {
    super(data);

    this.contains = new BN("0");
    
    if (data?.parent) this.toggleContainsParent();
    if (data?.system_id) this.toggleContainsSystemId();
    if (data?.content_map) this.toggleContainsContentMap();
    if (data?.content_multimap) this.toggleContainsContentMultiMap();
    if (data?.revocation_authority) this.toggleContainsRevocation();
    if (data?.recovery_authority) this.toggleContainsRecovery();
    if (data?.private_addresses && data.private_addresses.length > 0) this.toggleContainsPrivateAddresses();
    if (data?.unlock_after) this.toggleContainsUnlockAfter();
    if (data?.flags) this.toggleContainsFlags();
    if (data?.min_sigs) this.toggleContainsMinSigs();
    if (data?.primary_addresses && data.primary_addresses.length > 0) this.toggleContainsPrimaryAddresses();
  }

  protected serializeFlags() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS).toNumber());
  }

  protected serializePrimaryAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS).toNumber());
  }

  protected serializeMinSigs() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS).toNumber());
  }

  protected serializeParent() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT).toNumber());
  }

  protected serializeSystemId() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID).toNumber());
  }

  protected serializeContentMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP).toNumber());
  }

  protected serializeContentMultiMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP).toNumber());
  }

  protected serializeRevocation() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION).toNumber());
  }

  protected serializeRecovery() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY).toNumber());
  }

  protected serializePrivateAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS).toNumber());
  }

  protected serializeUnlockAfter() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER).toNumber());
  }

  private toggleContainsParent() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT);
  }

  private toggleContainsSystemId() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID);
  }

  private toggleContainsContentMap() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP);
  }

  private toggleContainsContentMultiMap() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP);
  }

  private toggleContainsRevocation() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION);
  }

  private toggleContainsRecovery() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY);
  }

  private toggleContainsPrivateAddresses() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS);
  }

  private toggleContainsUnlockAfter() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER);
  }

  private toggleContainsFlags() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS);
  }

  private toggleContainsMinSigs() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS);
  }

  private toggleContainsPrimaryAddresses() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS);
  }

  private getPartialIdentityByteLength(): number {
    let length = 0;

    length += varint.encodingLength(this.contains);
    length += super.getByteLength();

    return length;
  }

  getByteLength(): number {
    return this.getPartialIdentityByteLength();
  }

  fromBuffer(buffer: Buffer, offset: number = 0, parseVdxfObjects: boolean = false): number {
    const reader = new BufferReader(buffer, offset);

    this.contains = reader.readVarInt();

    reader.offset = super.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);

    return reader.offset;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getPartialIdentityByteLength()));

    writer.writeVarInt(this.contains);

    writer.writeSlice(super.toBuffer());

    return writer.buffer;
  }
}