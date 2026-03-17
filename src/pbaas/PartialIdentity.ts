import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { Identity, VerusCLIVerusIDJson, VerusIDInitData } from './Identity';
import { ContentMultiMap, ContentMultiMapJson, FqnContentMultiMap, KvContent } from './ContentMultiMap';
import { FqnVdxfUniValue, VdxfUniValue } from './VdxfUniValue';
import { CompactIAddressObject } from '../vdxf/classes/CompactAddressObject';
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

    // Always use FqnContentMultiMap so FQN keys survive binary round-trips.
    // Also convert any plain VdxfUniValue inner values to FqnVdxfUniValue so
    // that the serialization format is consistent regardless of how the
    // PartialIdentity was constructed (fromJson vs direct constructor).
    if (!(this.contentMultimap instanceof FqnContentMultiMap)) {
      const srcKvContent = this.contentMultimap?.kvContent ?? new KvContent();
      const newKvContent = new KvContent();

      for (const [key, values] of srcKvContent.entries()) {
        newKvContent.set(key, values.map(v => {
          if (v instanceof VdxfUniValue && !(v instanceof FqnVdxfUniValue)) {
            return FqnVdxfUniValue.fromVdxfUniValue(v);
          }
          return v;
        }));
      }

      this.contentMultimap = new FqnContentMultiMap({ kvContent: newKvContent });
    }

    this.contains = new BN("0");

    if (data?.parent) this.toggleContainsParent();
    if (data?.systemId) this.toggleContainsSystemId();
    if (data?.contentMap) this.toggleContainsContentMap();
    if (data?.contentMultimap) this.toggleContainsContentMultiMap();
    if (data?.revocationAuthority) this.toggleContainsRevocation();
    if (data?.recoveryAuthority) this.toggleContainsRecovery();
    if (data?.privateAddresses && data.privateAddresses.length > 0) this.toggleContainsPrivateAddresses();
    if (data?.unlockAfter) this.toggleContainsUnlockAfter();
    if (data?.flags) this.toggleContainsFlags();
    if (data?.minSigs) this.toggleContainsMinSigs();
    if (data?.version) this.toggleContainsVersion();
    if (data?.primaryAddresses && data.primaryAddresses.length > 0) this.toggleContainsPrimaryAddresses();
  }

  containsFlags() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_FLAGS).toNumber());
  }

  containsVersion() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_VERSION).toNumber());
  }

  containsPrimaryAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS).toNumber());
  }

  containsMinSigs() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_MINSIGS).toNumber());
  }

  containsParent() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PARENT).toNumber());
  }

  containsSystemId() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID).toNumber());
  }

  containsContentMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MAP).toNumber());
  }

  containsContentMultiMap() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP).toNumber());
  }

  containsRevocation() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION).toNumber());
  }

  containsRecovery() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY).toNumber());
  }

  containsPrivateAddresses() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS).toNumber());
  }

  containsUnlockAfter() {
    return !!(this.contains.and(PartialIdentity.PARTIAL_ID_CONTAINS_UNLOCK_AFTER).toNumber());
  }

  createContentMultiMap(): ContentMultiMap {
    return new FqnContentMultiMap();
  }

  clearContentMultiMap() {
    this.contentMultimap = new FqnContentMultiMap({ kvContent: new KvContent() });
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
    const instance = Identity.internalFromJson<PartialIdentity>(json, PartialIdentity);
    // Replace contentMultimap with FqnContentMultiMap so inner values are
    // FqnVdxfUniValue instances that preserve FQN keys through binary round-trips.
    if (json.contentmultimap) {
      instance.contentMultimap = FqnContentMultiMap.fromJson(json.contentmultimap as ContentMultiMapJson);
    }
    return instance;
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

  /**
   * Returns an array of every key used in the contentMultimap, both top-level and nested,
   * as strings. Keys that are hex-encoded CompactIAddressObject buffers are resolved via
   * toString() (which returns the iaddress or FQN string). Empty inner keys are skipped.
   */
  getContentMultiMapKeys(): string[] {
    const keys: string[] = [];

    for (const [key, values] of this.contentMultimap.kvContent.entries()) {
      keys.push(key.toString());

      for (const univalue of values) {
        if (univalue instanceof FqnVdxfUniValue) {
          for (const [key, value] of univalue.entries()) {
            keys.push(key.toString());
          }
        }
      }
    }

    return keys;
  }

  /**
   * Returns a partial identity with a plain ContentMultiMap equivalent of this PartialIdentity's
   * contentMultimap. All outer keys are resolved to CompactIAddress objects as
   * i addresses (TYPE_I_ADDRESS, 20-byte hash on-wire format),
   * and all inner FqnVdxfUniValue objects are converted to plain VdxfUniValue with any FQN
   * keys resolved to their iaddress equivalents.
   *
   * Use this when the resulting ContentMultiMap must be daemon-compatible (e.g. for
   * comparing daemon output to identities made here).
   */
  withResolvedContentMultiMap(): PartialIdentity {
    const clone = new PartialIdentity();
    clone.fromBuffer(this.toBuffer());
    clone.contentMultimap = this.toContentMultiMap();
    return clone;
  }

  toContentMultiMap(): ContentMultiMap {
    const newKvContent = new KvContent();

    for (const [key, values] of this.contentMultimap.kvContent.entries()) {
      const iAddrKey = CompactIAddressObject.fromAddress(key.toIAddress());

      const newValues = values.map(v => {
        if (v instanceof FqnVdxfUniValue) {
          const resolvedValues = v.values.map(inner => {
            const innerKey = Object.keys(inner)[0];
            if (innerKey === '') return inner;
            const compactAddr = new CompactIAddressObject();
            compactAddr.fromBuffer(Buffer.from(innerKey, 'hex'), 0);
            return { [compactAddr.toIAddress()]: inner[innerKey] };
          });
          return new VdxfUniValue({ values: resolvedValues, version: v.version });
        }
        return v;
      });

      newKvContent.set(iAddrKey, newValues);
    }

    return new ContentMultiMap({ kvContent: newKvContent });
  }
}
