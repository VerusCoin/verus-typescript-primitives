import varuint from '../utils/varuint'
import bufferutils from '../utils/bufferutils'
import { BigNumber } from '../utils/types/BigNumber';
import { Principal } from './Principal';
import { fromBase58Check, nameAndParentAddrToIAddr, toBase58Check, toIAddress } from '../utils/address';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../constants/vdxf';
import { BN } from 'bn.js';
import { IdentityID } from './IdentityID';
import { SaplingPaymentAddress } from './SaplingPaymentAddress';
import { ContentMultiMap, ContentMultiMapJson, isKvValueArrayItemVdxfUniValueJson } from './ContentMultiMap';
import { VdxfUniType, VdxfUniValueJson } from './VdxfUniValue';
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

const { BufferReader, BufferWriter } = bufferutils

export type Hashes = Map<string, Buffer>;

export type VerusCLIVerusIDJson = {
  contentmap?: { [key: string]: string },
  contentmultimap?: ContentMultiMapJson,
  flags: number,
  identityaddress: string,
  minimumsignatures: number,
  name: string,
  parent: string,
  primaryaddresses: Array<string>,
  privateaddress?: string,
  recoveryauthority: string,
  revocationauthority: string,
  systemid?: string,
  timelock: number,
  version: number
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

  constructor(data?: {
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
  }) {
    super(data)

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

  getByteLength() {
    let length = 0;

    length += super.getByteLength();
    length += this.parent.getByteLength();

    const nameLength = Buffer.from(this.name, "utf8").length;
    length += varuint.encodingLength(nameLength);
    length += nameLength;

    if (this.version.gte(IDENTITY_VERSION_PBAAS)) {
      length += this.content_multimap.getByteLength();
    }

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

    length += this.revocation_authority.getByteLength();   //uint160 revocation authority
    length += this.recovery_authority.getByteLength();   //uint160 recovery authority

    // privateaddresses
    length += varuint.encodingLength(this.private_addresses ? this.private_addresses.length : 0);

    if (this.private_addresses) {
      for (const n of this.private_addresses) {
        length += n.getByteLength();
      }
    }

    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      length += this.system_id.getByteLength();   //uint160 systemid
      length += 4;                             //uint32 unlockafter
    }

    return length;
  }

  clearContentMultiMap() {
    this.content_multimap = new ContentMultiMap({ kv_content: new Map() });
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeSlice(super.toBuffer());

    writer.writeSlice(this.parent.toBuffer());

    writer.writeVarSlice(Buffer.from(this.name, "utf8"));

    //contentmultimap
    if (this.version.gte(IDENTITY_VERSION_PBAAS)) {
      writer.writeSlice(this.content_multimap.toBuffer());
    }

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

    writer.writeSlice(this.revocation_authority.toBuffer());
    writer.writeSlice(this.recovery_authority.toBuffer());

    // privateaddresses
    writer.writeCompactSize(this.private_addresses ? this.private_addresses.length : 0);

    if (this.private_addresses) {
      for (const n of this.private_addresses) {
        writer.writeSlice(n.toBuffer());
      }
    }
    
    // post PBAAS
    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      writer.writeSlice(this.system_id.toBuffer())
      writer.writeUInt32(this.unlock_after.toNumber())
    }

    return writer.buffer
  }

  fromBuffer(buffer: Buffer, offset: number = 0, parseVdxfObjects: boolean = false) {
    const reader = new BufferReader(buffer, offset);

    reader.offset = super.fromBuffer(reader.buffer, reader.offset);

    const _parent = new IdentityID();
    reader.offset = _parent.fromBuffer(
      reader.buffer,
      reader.offset
    );
    this.parent = _parent;

    this.name = Buffer.from(reader.readVarSlice()).toString('utf8')

    //contentmultimap
    if (this.version.gte(IDENTITY_VERSION_PBAAS)) {
      const multimap = new ContentMultiMap();

      reader.offset = multimap.fromBuffer(reader.buffer, reader.offset, parseVdxfObjects);

      this.content_multimap = multimap;
    }

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

    const _revocation = new IdentityID();
    reader.offset = _revocation.fromBuffer(
      reader.buffer,
      reader.offset
    );
    this.revocation_authority = _revocation;

    const _recovery = new IdentityID();
    reader.offset = _recovery.fromBuffer(
      reader.buffer,
      reader.offset
    );
    this.recovery_authority = _recovery;

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

    if (this.version.gte(IDENTITY_VERSION_VAULT)) {
      const _system = new IdentityID();
      reader.offset = _system.fromBuffer(
        reader.buffer,
        reader.offset
      );
      this.system_id = _system;

      this.unlock_after = new BN(reader.readUInt32(), 10);
    } else {
      this.system_id = _parent;
      this.unlock_after = new BN(0);
    }

    return reader.offset;
  }

  toJson(): VerusCLIVerusIDJson {
    const contentmap = {};

    for (const [key, value] of this.content_map.entries()) { 
      const valueCopy = Buffer.from(value);
      contentmap[fromBase58Check(key).hash.reverse().toString('hex')] = valueCopy.reverse().toString('hex');
    }

    const ret: VerusCLIVerusIDJson = {
      contentmap,
      contentmultimap: this.content_multimap.toJson(),
      flags: this.flags.toNumber(),
      minimumsignatures: this.min_sigs.toNumber(),
      name: this.name,
      parent: this.parent.toAddress(),
      primaryaddresses: this.primary_addresses.map(x => x.toAddress()),
      recoveryauthority: this.recovery_authority.toAddress(),
      revocationauthority: this.revocation_authority.toAddress(),
      systemid: this.system_id.toAddress(),
      timelock: this.unlock_after.toNumber(),
      version: this.version.toNumber(),
      identityaddress: this.getIdentityAddress()
    };

    if (this.private_addresses != null && this.private_addresses.length > 0) {
      ret.privateaddress = this.private_addresses[0].toAddressString();
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

  static fromJson(json: VerusCLIVerusIDJson): Identity {
    const contentmap = new Map<string, Buffer>();

    for (const key in json.contentmap) {
      const reverseKey = Buffer.from(key, 'hex').reverse();
      const iAddrKey = toBase58Check(reverseKey, I_ADDR_VERSION);
      
      contentmap.set(iAddrKey, Buffer.from(json.contentmap[key], 'hex').reverse());
    }

    return new Identity({
      version: new BN(json.version, 10),
      flags: new BN(json.flags, 10),
      min_sigs: new BN(json.minimumsignatures, 10),
      primary_addresses: json.primaryaddresses.map(x => KeyID.fromAddress(x)),
      parent: IdentityID.fromAddress(json.parent),
      system_id: json.systemid ? IdentityID.fromAddress(json.systemid) : undefined,
      name: json.name,
      content_map: contentmap,
      content_multimap: ContentMultiMap.fromJson(json.contentmultimap),
      revocation_authority: IdentityID.fromAddress(json.revocationauthority),
      recovery_authority: IdentityID.fromAddress(json.recoveryauthority),
      private_addresses: json.privateaddress == null ? [] : [SaplingPaymentAddress.fromAddressString(json.privateaddress)],
      unlock_after: new BN(json.timelock, 10)
    });
  }
}