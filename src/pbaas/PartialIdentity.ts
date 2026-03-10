import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { Identity, VerusCLIVerusIDJson, VerusIDInitData } from './Identity';
import { ContentMultiMap, FqnContentMultiMap, KvContent } from './ContentMultiMap';
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
  static PARTIAL_ID_CONTAINS_VERSION = new BN("2048", 10);

  constructor(data?: VerusIDInitData) {
    super(data);

    // Always use FqnContentMultiMap so FQN keys survive binary round-trips
    if (!(this.content_multimap instanceof FqnContentMultiMap)) {
      this.content_multimap = new FqnContentMultiMap({ kvContent: this.content_multimap?.kvContent ?? new KvContent() });
    }

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
    if (data?.version) this.toggleContainsVersion();
    if (data?.primary_addresses && data.primary_addresses.length > 0) this.toggleContainsPrimaryAddresses();
  }

  protected containsFlags() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS).toNumber());
  }

  protected containsVersion() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_VERSION).toNumber());
  }

  protected containsPrimaryAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS).toNumber());
  }

  protected containsMinSigs() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS).toNumber());
  }

  protected containsParent() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT).toNumber());
  }

  protected containsSystemId() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID).toNumber());
  }

  protected containsContentMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP).toNumber());
  }

  protected containsContentMultiMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP).toNumber());
  }

  protected containsRevocation() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION).toNumber());
  }

  protected containsRecovery() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY).toNumber());
  }

  protected containsPrivateAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS).toNumber());
  }

  protected containsUnlockAfter() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER).toNumber());
  }

  protected createContentMultiMap(): ContentMultiMap {
    return new FqnContentMultiMap();
  }

  clearContentMultiMap() {
    this.content_multimap = new FqnContentMultiMap({ kvContent: new KvContent() });
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

  private toggleContainsVersion() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_VERSION);
  }

  private toggleContainsMinSigs() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS);
  }

  private toggleContainsPrimaryAddresses() {
    this.contains = this.contains.xor(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS);
  }

  private enableContainsFlags() {
    this.contains = this.contains.or(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS);
  }

  private enableContainsUnlockAfter() {
    this.contains = this.contains.or(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER);
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

  static fromJson(json: VerusCLIVerusIDJson): PartialIdentity {
    return Identity.internalFromJson<PartialIdentity>(json, PartialIdentity);
  }

  lock(unlockTime: BigNumber) {
    this.enableContainsFlags();
    this.enableContainsUnlockAfter();
    return super.lock(unlockTime);
  }

  unlock(height: BigNumber = new BN(0), txExpiryHeight: BigNumber = new BN(0)): void {
    this.enableContainsFlags();
    this.enableContainsUnlockAfter();
    return super.unlock(height, txExpiryHeight);
  }

  revoke() {
    this.enableContainsFlags();
    this.enableContainsUnlockAfter();
    return super.revoke();
  }

  unrevoke() {
    this.enableContainsFlags();
    return super.unrevoke();
  }
}