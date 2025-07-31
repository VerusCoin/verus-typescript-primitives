import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { Principal } from './Principal';
import { fromBase58Check, nameAndParentAddrToIAddr, toBase58Check } from '../utils/address';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../constants/vdxf';
import { BN } from 'bn.js';
import { IdentityID } from './IdentityID';
import { SaplingPaymentAddress } from './SaplingPaymentAddress';
import { ContentMultiMap, ContentMultiMapJson } from './ContentMultiMap';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { KeyID } from './KeyID';
import { PartialSignDataCLIJson } from './PartialSignData';

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
  min_sigs?: BigNumber;
  primary_addresses?: Array<KeyID>;
  parent?: IdentityID;
  system_id?: IdentityID;
  name?: string;
  content_map?: Hashes;
  content_multimap?: ContentMultiMap;
  revocation_authority?: IdentityID;
  recovery_authority?: IdentityID;
  private_addresses?: Array<SaplingPaymentAddress>;
  unlock_after?: BigNumber;
}

export class Identity extends Principal implements SerializableEntity {
  parent: IdentityID;
  system_id: IdentityID;
  name: string;
  content_map: Hashes;
  content_multimap: ContentMultiMap;
  revocation_authority: IdentityID;
  recovery_authority: IdentityID;
  private_addresses: Array<SaplingPaymentAddress>;
  unlock_after: BigNumber;

  static VERSION_INVALID = new BN(0);
  static VERSION_VERUSID = new BN(1);
  static VERSION_VAULT = new BN(2);
  static VERSION_PBAAS = new BN(3);
  static VERSION_CURRENT = Identity.VERSION_PBAAS;
  static VERSION_FIRSTVALID = new BN(1);
  static VERSION_LASTVALID = new BN(3);

  constructor(data?: VerusIDInitData) {
    super(data)

    if (data?.version) this.version = data.version;
    else this.version = Identity.VERSION_CURRENT;

    if (data?.parent) this.parent = data.parent;
    if (data?.system_id) this.system_id = data.system_id;
    if (data?.name) this.name = data.name;
    if (data?.content_map) this.content_map = data.content_map;
    else this.content_map = new Map();
    if (data?.content_multimap) this.content_multimap = data.content_multimap;
    else this.content_multimap = new ContentMultiMap({ kv_content: new Map() });
    if (data?.revocation_authority) this.revocation_authority = data.revocation_authority;
    if (data?.recovery_authority) this.recovery_authority = data.recovery_authority;
    if (data?.private_addresses) this.private_addresses = data.private_addresses;
    if (data?.unlock_after) this.unlock_after = data.unlock_after;
  }

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
      length += this.content_multimap.getByteLength();
    }

    if (this.containsContentMap()) {
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        length += varuint.encodingLength(this.content_map.size);
  
        for (const m of this.content_map.entries()) {
          length += 20;   //uint160 key
          length += 32;   //uint256 hash
        }
      }
  
      length += varuint.encodingLength(this.content_map.size);
  
      for (const m of this.content_map.entries()) {
        length += 20;   //uint160 key
        length += 32;   //uint256 hash
      }
    }

    if (this.containsRevocation()) length += this.revocation_authority.getByteLength();   //uint160 revocation authority
    if (this.containsRecovery()) length += this.recovery_authority.getByteLength();   //uint160 recovery authority

    if (this.containsPrivateAddresses()) {
      length += varuint.encodingLength(this.private_addresses ? this.private_addresses.length : 0);
      
      if (this.private_addresses) {
        for (const n of this.private_addresses) {
          length += n.getByteLength();
        }
      }
    }
    
    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) length += this.system_id.getByteLength();   //uint160 systemid
      if (this.containsUnlockAfter()) length += 4;                             //uint32 unlockafter
    }

    return length;
  }

  getByteLength() {
    return this.getIdentityByteLength();
  }

  clearContentMultiMap() {
    this.content_multimap = new ContentMultiMap({ kv_content: new Map() });
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getIdentityByteLength()));

    writer.writeSlice(super.toBuffer());

    if (this.containsParent()) writer.writeSlice(this.parent.toBuffer());
    if (this.containsName()) writer.writeVarSlice(Buffer.from(this.name, "utf8"));

    //contentmultimap
    if (this.containsContentMultiMap() && this.version.gte(IDENTITY_VERSION_PBAAS)) {
      writer.writeSlice(this.content_multimap.toBuffer());
    }

    if (this.containsContentMap()) {
      //contentmap
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        writer.writeCompactSize(this.content_map.size);

        for (const [key, value] of this.content_map.entries()) {
          writer.writeSlice(fromBase58Check(key).hash);
          writer.writeSlice(value);
        }
      }

      //contentmap2
      writer.writeCompactSize(this.content_map.size);

      for (const [key, value] of this.content_map.entries()) {
        writer.writeSlice(fromBase58Check(key).hash);
        writer.writeSlice(value);
      }
    }
    
    if (this.containsRevocation()) writer.writeSlice(this.revocation_authority.toBuffer());
    if (this.containsRecovery()) writer.writeSlice(this.recovery_authority.toBuffer());

    if (this.containsPrivateAddresses()) {
      // privateaddresses
      writer.writeCompactSize(this.private_addresses ? this.private_addresses.length : 0);

      if (this.private_addresses) {
        for (const n of this.private_addresses) {
          writer.writeSlice(n.toBuffer());
        }
      }
    }
    
    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) writer.writeSlice(this.system_id.toBuffer())
      if (this.containsUnlockAfter()) writer.writeUInt32(this.unlock_after.toNumber())
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
        const multimap = new ContentMultiMap();

      reader.offset = multimap.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);

        this.content_multimap = multimap;
      }
    }

    if (this.containsContentMap()) {
      // contentmap
      if (this.version.lt(IDENTITY_VERSION_PBAAS)) {
        const contentMapSize = reader.readVarInt();
        this.content_map = new Map();

        for (var i = 0; i < contentMapSize.toNumber(); i++) {
          const contentMapKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
          this.content_map.set(contentMapKey, reader.readSlice(32));
        }
      }

      const contentMapSize = reader.readVarInt();
      this.content_map = new Map();

      for (var i = 0; i < contentMapSize.toNumber(); i++) {
        const contentMapKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION)
        this.content_map.set(contentMapKey, reader.readSlice(32));
      }
    }

    if (this.containsRevocation()) {
      const _revocation = new IdentityID();
      reader.offset = _revocation.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.revocation_authority = _revocation;
    }

    if (this.containsRecovery()) {
      const _recovery = new IdentityID();
      reader.offset = _recovery.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.recovery_authority = _recovery;
    }
    
    if (this.containsPrivateAddresses()) {
      const numPrivateAddresses = reader.readVarInt();

      if (numPrivateAddresses.gt(new BN(0))) this.private_addresses = [];
  
      for (var i = 0; i < numPrivateAddresses.toNumber(); i++) {
        const saplingAddr = new SaplingPaymentAddress();
        reader.offset = saplingAddr.fromBuffer(
          reader.buffer,
          reader.offset
        );
        this.private_addresses.push(saplingAddr);
      }
    }

    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      if (this.containsSystemId()) {
        const _system = new IdentityID();
        reader.offset = _system.fromBuffer(
          reader.buffer,
          reader.offset
        );
        this.system_id = _system;
      }
      
      if (this.containsUnlockAfter()) {
        this.unlock_after = new BN(reader.readUInt32(), 10);
      }
    } else {
      this.system_id = _parent;
      this.unlock_after = new BN(0);
    }

    return reader.offset;
  }

  toJson(): VerusCLIVerusIDJson {
    const contentmap = {};

    if (this.containsContentMap()) {
      for (const [key, value] of this.content_map.entries()) { 
        const valueCopy = Buffer.from(value);
        contentmap[fromBase58Check(key).hash.reverse().toString('hex')] = valueCopy.reverse().toString('hex');
      }
    }
    
    const ret: VerusCLIVerusIDJson = {
      contentmap: this.containsContentMap() ? contentmap : undefined,
      contentmultimap: this.containsContentMultiMap() ? this.content_multimap.toJson() : undefined,
      flags: this.containsFlags() ? this.flags.toNumber() : undefined,
      minimumsignatures: this.containsMinSigs() ? this.min_sigs.toNumber() : undefined,
      name: this.name,
      parent: this.containsParent() ? this.parent.toAddress() : undefined,
      primaryaddresses: this.containsPrimaryAddresses() ? this.primary_addresses.map(x => x.toAddress()) : undefined,
      recoveryauthority: this.containsRecovery() ? this.recovery_authority.toAddress() : undefined,
      revocationauthority: this.containsRevocation() ? this.revocation_authority.toAddress() : undefined,
      systemid: this.containsSystemId() ? this.system_id.toAddress() : undefined,
      timelock: this.containsUnlockAfter() ? this.unlock_after.toNumber() : undefined,
      version: this.containsVersion() ? this.version.toNumber() : undefined,
      identityaddress: this.containsParent() ? this.getIdentityAddress() : undefined
    };

    if (this.private_addresses != null && this.private_addresses.length > 0) {
      ret.privateaddress = this.private_addresses[0].toAddressString();
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

    this.flags = this.flags.xor(IDENTITY_FLAG_LOCKED);
    this.unlock_after = unlockAfter;
  }

  unlock(height: BigNumber = new BN(0), txExpiryHeight: BigNumber = new BN(0)): void {
    if (this.isRevoked()) {
      this.flags = this.flags.and(IDENTITY_FLAG_LOCKED.notn(16));
      this.unlock_after = new BN(0);
    } else if (this.isLocked()) {
      this.flags = this.flags.and(IDENTITY_FLAG_LOCKED.notn(16));
      this.unlock_after = this.unlock_after.add(txExpiryHeight);
    } else if (height.gt(this.unlock_after)) {
      this.unlock_after = new BN(0);
    }

    if (this.unlock_after.gt((txExpiryHeight.add(IDENTITY_MAX_UNLOCK_DELAY)))) {
      this.unlock_after = txExpiryHeight.add(IDENTITY_MAX_UNLOCK_DELAY);
    }
  }

  revoke() {
    this.flags = this.flags.xor(IDENTITY_FLAG_REVOKED);
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

    this.primary_addresses = primaryAddresses;
  }

  setRevocation(iAddr: string) {
    this.revocation_authority = IdentityID.fromAddress(iAddr);
  }

  setRecovery(iAddr: string) {
    this.recovery_authority = IdentityID.fromAddress(iAddr);
  }

  setPrivateAddress(zAddr: string) {
    this.private_addresses = [SaplingPaymentAddress.fromAddressString(zAddr)]
  }

  upgradeVersion(version: BigNumber = Identity.VERSION_CURRENT) {
    if (version.eq(this.version)) return;
    if (version.lt(this.version)) throw new Error("Cannot downgrade version");
    if (version.lt(Identity.VERSION_PBAAS)) throw new Error("Cannot upgrade to a version less than PBAAS");
    if (version.gt(Identity.VERSION_CURRENT)) throw new Error("Cannot upgrade to a version greater than the current known version");

    if (this.version.lt(Identity.VERSION_VAULT)) {
      this.system_id = this.parent ? this.parent : IdentityID.fromAddress(this.getIdentityAddress());
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
      min_sigs: json.minimumsignatures ? new BN(json.minimumsignatures, 10) : undefined,
      primary_addresses: json.primaryaddresses ? json.primaryaddresses.map(x => KeyID.fromAddress(x)) : undefined,
      parent: json.parent ? IdentityID.fromAddress(json.parent) : undefined,
      system_id: json.systemid ? IdentityID.fromAddress(json.systemid) : undefined,
      name: json.name,
      content_map: json.contentmap ? contentmap : undefined,
      content_multimap: json.contentmultimap ? ContentMultiMap.fromJson(json.contentmultimap as  ContentMultiMapJson) : undefined,
      revocation_authority: json.revocationauthority ? IdentityID.fromAddress(json.revocationauthority) : undefined,
      recovery_authority: json.recoveryauthority ? IdentityID.fromAddress(json.recoveryauthority) : undefined,
      private_addresses: json.privateaddress == null ? [] : [SaplingPaymentAddress.fromAddressString(json.privateaddress)],
      unlock_after: json.timelock != null ? new BN(json.timelock, 10) : undefined
    });
  }

  static fromJson(json: VerusCLIVerusIDJson): Identity {
    return Identity.internalFromJson<Identity>(json, Identity);
  }
}