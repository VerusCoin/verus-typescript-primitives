import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { Principal } from './Principal';
import { fromBase58Check, nameAndParentAddrToIAddr, toBase58Check } from '../utils/address';
import { I_ADDR_VERSION, R_ADDR_VERSION, HASH160_BYTE_LENGTH, HASH256_BYTE_LENGTH } from '../constants/vdxf';
import { BN } from 'bn.js';
import { IdentityID } from './IdentityID';
import { SaplingPaymentAddress } from './SaplingPaymentAddress';
import { ContentMultiMap, ContentMultiMapJson, KvContent, FqnContentMultiMap } from './ContentMultiMap';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { KeyID } from './KeyID';

export const IDENTITY_VERSION_VAULT = new BN(2, 10);
export const IDENTITY_VERSION_PBAAS = new BN(3, 10);
export const IDENITTY_VERSION_INVALID = new BN(0, 10);

export const IDENTITY_FLAG_REVOKED = new BN("8000", 16);          // set when this identity is revoked
export const IDENTITY_FLAG_ACTIVECURRENCY = new BN("1", 16);      // flag that is set when this ID is being used as an active currency name
export const IDENTITY_FLAG_LOCKED = new BN("2", 16);              // set when this identity is locked
export const IDENTITY_FLAG_TOKENIZED_CONTROL = new BN("4", 16);   // set when revocation/recovery over this identity can be performed by anyone who controls its token
export const IDENTITY_MAX_UNLOCK_DELAY = new BN(60).mul(new BN(24)).mul(new BN(22)).mul(new BN(365));        // 21+ year maximum unlock time for an ID w/1 minute blocks, not adjusted for avg blocktime in first PBaaS
export const IDENTITY_MAX_NAME_LEN = new BN(64);

const { BufferReader, BufferWriter } = bufferutils;

export type Hashes = Map<string, Buffer>;

export type VerusCLIVerusIDJsonBase<T = ContentMultiMapJson> = {
  contentmap?: { [key: string]: string };
  contentmultimap?: T;
  flags?: number;
  identityaddress?: string;
  minimumsignatures?: number;
  name?: string;
  parent?: string;
  primaryaddresses?: Array<string>;
  privateaddress?: string;
  recoveryauthority?: string;
  revocationauthority?: string;
  systemid?: string;
  timelock?: number;
  version?: number;
};

export type VerusCLIVerusIDJson = VerusCLIVerusIDJsonBase<ContentMultiMapJson>;

export type VerusIDInitData = {
  version?: BigNumber;
  flags?: BigNumber;
  minSigs?: BigNumber;
  primaryAddresses?: Array<KeyID>;
  parent?: IdentityID;
  systemId?: IdentityID;
  name?: string;
  contentMap?: Hashes;
  contentMultiMap?: ContentMultiMap;
  revocationAuthority?: IdentityID;
  recoveryAuthority?: IdentityID;
  privateAddresses?: Array<SaplingPaymentAddress>;
  unlockAfter?: BigNumber;
}

export class Identity extends Principal implements SerializableEntity {
  parent: IdentityID;
  systemId: IdentityID;
  name: string;
  contentMap: Hashes;
  contentMultiMap: ContentMultiMap;
  revocationAuthority: IdentityID;
  recoveryAuthority: IdentityID;
  privateAddresses: Array<SaplingPaymentAddress>;
  unlockAfter: BigNumber;

  static VERSION_INVALID = new BN(0);
  static VERSION_VERUSID = new BN(1);
  static VERSION_VAULT = new BN(2);
  static VERSION_PBAAS = new BN(3);
  static VERSION_CURRENT = Identity.VERSION_PBAAS;
  static VERSION_FIRSTVALID = new BN(1);
  static VERSION_LASTVALID = new BN(3);

  constructor(data?: VerusIDInitData) {
    super(data)

    if (data != null) {
      const d = data as any;
      const deprecated = ['system_id', 'content_map', 'content_multimap', 'revocation_authority', 'recovery_authority', 'private_addresses', 'unlock_after'].filter(k => k in d);
      if (deprecated.length > 0) {
        const map: Record<string, string> = { system_id: 'systemId', content_map: 'contentMap', content_multimap: 'contentMultiMap', revocation_authority: 'revocationAuthority', recovery_authority: 'recoveryAuthority', private_addresses: 'privateAddresses', unlock_after: 'unlockAfter' };
        throw new Error(`Identity: snake_case property names are no longer supported. Rename: ${deprecated.map(k => `'${k}' → '${map[k]}'`).join(', ')}.`);
      }
    }

    if (data?.version) this.version = data.version;
    else this.version = Identity.VERSION_CURRENT;

    if (data?.parent) this.parent = data.parent;
    if (data?.systemId) this.systemId = data.systemId;
    if (data?.name) this.name = data.name;
    if (data?.contentMap) this.contentMap = data.contentMap;
    else this.contentMap = new Map();
    if (data?.contentMultiMap) this.contentMultiMap = data.contentMultiMap;
    else this.contentMultiMap = new ContentMultiMap({ kvContent: new KvContent() });
    if (data?.revocationAuthority) this.revocationAuthority = data.revocationAuthority;
    if (data?.recoveryAuthority) this.recoveryAuthority = data.recoveryAuthority;
    if (data?.privateAddresses) this.privateAddresses = data.privateAddresses;
    if (data?.unlockAfter) this.unlockAfter = data.unlockAfter;
  }

  /** @deprecated Use systemId instead */
  get system_id(): IdentityID { return this.systemId; }

  /** @deprecated Use contentMap instead */
  get content_map(): Hashes { return this.contentMap; }

  /** @deprecated Use contentMultiMap instead */
  get content_multimap(): ContentMultiMap { return this.contentMultiMap; }

  /** @deprecated Use revocationAuthority instead */
  get revocation_authority(): IdentityID { return this.revocationAuthority; }

  /** @deprecated Use recoveryAuthority instead */
  get recovery_authority(): IdentityID { return this.recoveryAuthority; }

  /** @deprecated Use privateAddresses instead */
  get private_addresses(): Array<SaplingPaymentAddress> { return this.privateAddresses; }

  /** @deprecated Use unlockAfter instead */
  get unlock_after(): BigNumber { return this.unlockAfter; }

  protected containsParent() {
    return true;
  }

  protected containsSystemId() {
    return true;
  }

  protected containsName() {
    return true;
  }

  protected containsContentMap() {
    return true;
  }

  protected containsContentMultiMap() {
    return true;
  }

  protected containsRevocation() {
    return true;
  }

  protected containsRecovery() {
    return true;
  }

  protected containsPrivateAddresses() {
    return true;
  }

  protected containsUnlockAfter() {
    return true;
  }

  private getIdentityByteLength(): number {
    let length = 0;

    length += super.getByteLength();

    if (this.containsParent()) length += this.parent.getByteLength();

    if (this.containsName()) {
      const nameLength = Buffer.from(this.name, "utf8").length;
      length += varuint.encodingLength(nameLength);
      length += nameLength;
    }

    if (this.containsContentMultiMap() && this.version.gte(IDENTITY_VERSION_PBAAS)) {
      length += this.contentMultiMap.getByteLength();
    }

    if (this.containsContentMap()) {
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        length += varuint.encodingLength(this.contentMap.size);

        for (const m of this.contentMap.entries()) {
          length += HASH160_BYTE_LENGTH;   //uint160 key
          length += HASH256_BYTE_LENGTH;
        }
      }

      length += varuint.encodingLength(this.contentMap.size);

      for (const m of this.contentMap.entries()) {
        length += HASH160_BYTE_LENGTH;   //uint160 key
        length += HASH256_BYTE_LENGTH;   //uint256 hash
      }
    }

    if (this.containsRevocation()) length += this.revocationAuthority.getByteLength();   //uint160 revocation authority
    if (this.containsRecovery()) length += this.recoveryAuthority.getByteLength();   //uint160 recovery authority

    if (this.containsPrivateAddresses()) {
      length += varuint.encodingLength(this.privateAddresses ? this.privateAddresses.length : 0);

      if (this.privateAddresses) {
        for (const n of this.privateAddresses) {
          length += n.getByteLength();
        }
      }
    }

    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) length += this.systemId.getByteLength();   //uint160 systemid
      if (this.containsUnlockAfter()) length += 4;                             //uint32 unlockafter
    }

    return length;
  }

  getByteLength() {
    return this.getIdentityByteLength();
  }

  protected createContentMultiMap(): ContentMultiMap {
    return new ContentMultiMap();
  }

  clearContentMultiMap() {
    this.contentMultiMap = new ContentMultiMap({ kvContent: new KvContent() });
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getIdentityByteLength()));

    writer.writeSlice(super.toBuffer());

    if (this.containsParent()) writer.writeSlice(this.parent.toBuffer());
    if (this.containsName()) writer.writeVarSlice(Buffer.from(this.name, "utf8"));

    //contentmultimap
    if (this.containsContentMultiMap() && this.version.gte(IDENTITY_VERSION_PBAAS)) {
      writer.writeSlice(this.contentMultiMap.toBuffer());
    }

    if (this.containsContentMap()) {
      //contentmap
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        writer.writeCompactSize(this.contentMap.size);

        for (const [key, value] of this.contentMap.entries()) {
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeSlice(value);
        }
      }

      //contentmap2
      writer.writeCompactSize(this.contentMap.size);

      for (const [key, value] of this.contentMap.entries()) {
        writer.writeSlice(fromBase58Check(key).hash);
        writer.writeSlice(value);
      }
    }

    if (this.containsRevocation()) writer.writeSlice(this.revocationAuthority.toBuffer());
    if (this.containsRecovery()) writer.writeSlice(this.recoveryAuthority.toBuffer());

    if (this.containsPrivateAddresses()) {
      // privateaddresses
      writer.writeCompactSize(this.privateAddresses ? this.privateAddresses.length : 0);

      if (this.privateAddresses) {
        for (const n of this.privateAddresses) {
          writer.writeSlice(n.toBuffer());
        }
      }
    }

    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) writer.writeSlice(this.systemId.toBuffer())
      if (this.containsUnlockAfter()) writer.writeUInt32(this.unlockAfter.toNumber())
    }

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0, parseVdxfObjects: boolean = false) {
    const reader = new BufferReader(buffer, offset);

    reader.offset = super.fromBuffer(reader.buffer, reader.offset);
    const _parent = new IdentityID();

    if (this.containsParent()) {
      reader.offset = _parent.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.parent = _parent;
    }

    if (this.containsName()) this.name = Buffer.from(reader.readVarSlice()).toString('utf8')

    if (this.containsContentMultiMap()) {
      //contentmultimap
      if (this.version.gte(IDENTITY_VERSION_PBAAS)) {
        const multimap = this.createContentMultiMap();

        reader.offset = multimap.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);

        this.contentMultiMap = multimap;
      }
    }

    if (this.containsContentMap()) {
      // contentmap
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        const contentMapSize = reader.readVarInt();
        this.contentMap = new Map();

        for (var i = 0; i < contentMapSize.toNumber(); i++) {
          const contentMapKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
          this.contentMap.set(contentMapKey, reader.readSlice(32));
        }
      }

      const contentMapSize = reader.readVarInt();
      this.contentMap = new Map();

      for (var i = 0; i < contentMapSize.toNumber(); i++) {
        const contentMapKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
        this.contentMap.set(contentMapKey, reader.readSlice(32));
      }
    }

    if (this.containsRevocation()) {
      const _revocation = new IdentityID();
      reader.offset = _revocation.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.revocationAuthority = _revocation;
    }

    if (this.containsRecovery()) {
      const _recovery = new IdentityID();
      reader.offset = _recovery.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.recoveryAuthority = _recovery;
    }

    if (this.containsPrivateAddresses()) {
      const numPrivateAddresses = reader.readVarInt();

      if (numPrivateAddresses.gt(new BN(0))) this.privateAddresses = [];

      for (var i = 0; i < numPrivateAddresses.toNumber(); i++) {
        const saplingAddr = new SaplingPaymentAddress();
        reader.offset = saplingAddr.fromBuffer(
          reader.buffer,
          reader.offset
        );
        this.privateAddresses.push(saplingAddr);
      }
    }

    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) {
        const _system = new IdentityID();
        reader.offset = _system.fromBuffer(
          reader.buffer,
          reader.offset
        );
        this.systemId = _system;
      }

      if (this.containsUnlockAfter()) {
        this.unlockAfter = new BN(reader.readUInt32(), 10);
      }
    } else {
      this.systemId = _parent;
      this.unlockAfter = new BN(0);
    }

    return reader.offset;
  }

  toJson(): VerusCLIVerusIDJson {
    const contentmap = {};

    if (this.containsContentMap()) {
      for (const [key, value] of this.contentMap.entries()) {
        const valueCopy = Buffer.from(value);
        contentmap[fromBase58Check(key).hash.reverse().toString('hex')] = valueCopy.reverse().toString('hex');
      }
    }

    const ret: VerusCLIVerusIDJson = {
      contentmap: this.containsContentMap() ? contentmap : undefined,
      contentmultimap: this.containsContentMultiMap() ? this.contentMultiMap.toJson() : undefined,
      flags: this.containsFlags() ? this.flags.toNumber() : undefined,
      minimumsignatures: this.containsMinSigs() ? this.minSigs.toNumber() : undefined,
      name: this.name,
      parent: this.containsParent() ? this.parent.toAddress() : undefined,
      primaryaddresses: this.containsPrimaryAddresses() ? this.primaryAddresses.map(x => x.toAddress()) : undefined,
      recoveryauthority: this.containsRecovery() ? this.recoveryAuthority.toAddress() : undefined,
      revocationauthority: this.containsRevocation() ? this.revocationAuthority.toAddress() : undefined,
      systemid: this.containsSystemId() ? this.systemId.toAddress() : undefined,
      timelock: this.containsUnlockAfter() ? this.unlockAfter.toNumber() : undefined,
      version: this.containsVersion() ? this.version.toNumber() : undefined,
      identityaddress: this.containsParent() ? this.getIdentityAddress() : undefined
    };

    if (this.privateAddresses != null && this.privateAddresses.length > 0) {
      ret.privateaddress = this.privateAddresses[0].toAddressString();
    }

    for (const key in ret) {
      if (ret[key] === undefined) delete ret[key]
    }

    return ret;
  }

  getIdentityAddress() {
    return nameAndParentAddrToIAddr(this.name, this.parent.toAddress());
  }

  isRevoked(): boolean {
    return !!(this.flags.and(IDENTITY_FLAG_REVOKED).toNumber());
  }

  isLocked(): boolean {
    return !!(this.flags.and(IDENTITY_FLAG_LOCKED).toNumber());
  }

  hasActiveCurrency(): boolean {
    return !!(this.flags.and(IDENTITY_FLAG_ACTIVECURRENCY).toNumber());
  }

  hasTokenizedIdControl(): boolean {
    return !!(this.flags.and(IDENTITY_FLAG_TOKENIZED_CONTROL).toNumber());
  }

  lock(unlockTime: BigNumber) {
    let unlockAfter: BigNumber = unlockTime;

    if (unlockTime.lte(new BN(0))) {
      unlockAfter = new BN(1);
    } else if (unlockTime.gt(IDENTITY_MAX_UNLOCK_DELAY)) {
      unlockAfter = IDENTITY_MAX_UNLOCK_DELAY;
    }

    this.flags = this.flags.or(IDENTITY_FLAG_LOCKED);
    this.unlockAfter = unlockAfter;
  }

  unlock(height: BigNumber = new BN(0), txExpiryHeight: BigNumber = new BN(0)): void {
    if (this.isRevoked()) {
      this.flags = this.flags.and(IDENTITY_FLAG_LOCKED.notn(16));
      this.unlockAfter = new BN(0);
    } else if (this.isLocked()) {
      this.flags = this.flags.and(IDENTITY_FLAG_LOCKED.notn(16));
      this.unlockAfter = this.unlockAfter.add(txExpiryHeight);
    } else if (height.gt(this.unlockAfter)) {
      this.unlockAfter = new BN(0);
    }

    if (this.unlockAfter.gt((txExpiryHeight.add(IDENTITY_MAX_UNLOCK_DELAY)))) {
      this.unlockAfter = txExpiryHeight.add(IDENTITY_MAX_UNLOCK_DELAY);
    }
  }

  revoke() {
    this.flags = this.flags.or(IDENTITY_FLAG_REVOKED);
    this.unlock();
  }

  unrevoke() {
    this.flags = this.flags.and(IDENTITY_FLAG_REVOKED.notn(16));
  }

  setPrimaryAddresses(addresses: Array<string>) {
    const primaryAddresses: Array<KeyID> = [];

    for (const str of addresses) {
      const addr = KeyID.fromAddress(str);

      if (addr.version !== R_ADDR_VERSION) throw new Error("Primary addresses must be r-addresses.");
      else {
        primaryAddresses.push(addr);
      }
    }

    this.primaryAddresses = primaryAddresses;
  }

  setRevocation(iAddr: string) {
    this.revocationAuthority = IdentityID.fromAddress(iAddr);
  }

  setRecovery(iAddr: string) {
    this.recoveryAuthority = IdentityID.fromAddress(iAddr);
  }

  setPrivateAddress(zAddr: string) {
    this.privateAddresses = [SaplingPaymentAddress.fromAddressString(zAddr)]
  }

  upgradeVersion(version: BigNumber = Identity.VERSION_CURRENT) {
    if (version.eq(this.version)) return;
    if (version.lt(this.version)) throw new Error("Cannot downgrade version");
    if (version.lt(Identity.VERSION_PBAAS)) throw new Error("Cannot upgrade to a version less than PBAAS");
    if (version.gt(Identity.VERSION_CURRENT)) throw new Error("Cannot upgrade to a version greater than the current known version");

    if (this.version.lt(Identity.VERSION_VAULT)) {
      this.systemId = this.parent ? this.parent : IdentityID.fromAddress(this.getIdentityAddress());
      this.version = Identity.VERSION_VAULT;
    }

    if (this.version.lt(Identity.VERSION_PBAAS)) {
      this.version = Identity.VERSION_PBAAS;
    }
  }

  protected static internalFromJson<T>(
    json: VerusCLIVerusIDJson,
    ctor: new (...args: any[]) => T
  ): T {
    const contentmap = new Map<string, Buffer>();

    if (json.contentmap) {
      for (const key in json.contentmap) {
        const reverseKey = Buffer.from(key, 'hex').reverse();
        const iAddrKey = toBase58Check(reverseKey, I_ADDR_VERSION);

        contentmap.set(iAddrKey, Buffer.from(json.contentmap[key], 'hex').reverse());
      }
    }

    return new ctor({
      version: json.version != null ? new BN(json.version, 10) : undefined,
      flags: json.flags != null ? new BN(json.flags, 10) : undefined,
      minSigs: json.minimumsignatures ? new BN(json.minimumsignatures, 10) : undefined,
      primaryAddresses: json.primaryaddresses ? json.primaryaddresses.map(x => KeyID.fromAddress(x)) : undefined,
      parent: json.parent ? IdentityID.fromAddress(json.parent) : undefined,
      systemId: json.systemid ? IdentityID.fromAddress(json.systemid) : undefined,
      name: json.name,
      contentMap: json.contentmap ? contentmap : undefined,
      contentMultiMap: json.contentmultimap ? ContentMultiMap.fromJson(json.contentmultimap as  ContentMultiMapJson) : undefined,
      revocationAuthority: json.revocationauthority ? IdentityID.fromAddress(json.revocationauthority) : undefined,
      recoveryAuthority: json.recoveryauthority ? IdentityID.fromAddress(json.recoveryauthority) : undefined,
      privateAddresses: json.privateaddress == null ? [] : [SaplingPaymentAddress.fromAddressString(json.privateaddress)],
      unlockAfter: json.timelock != null ? new BN(json.timelock, 10) : undefined
    });
  }

  static fromJson(json: VerusCLIVerusIDJson): Identity {
    return Identity.internalFromJson<Identity>(json, Identity);
  }
}
