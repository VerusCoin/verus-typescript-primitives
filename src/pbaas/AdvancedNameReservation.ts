import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import bufferutils from '../utils/bufferutils';
import { hash } from '../utils/hash';
import { nameAndParentAddrToIAddr, toIAddress } from '../utils/address';
import { validateIdentityRegistrationName } from '../utils/identityRegistration';
import { IdentityID } from './IdentityID';
import { CommitmentHash } from './CommitmentHash';
import {
  assertIdentityID, assertNameBytes, assertUint256, boundedReader, checkPayloadEnd,
  identityIDFromJSON, MAX_IDENTITY_NAME_BYTES, payloadFromHex, readName, uint256FromHex
} from './identityRegistrationSerialization';

export type AdvancedNameReservationJSON = {
  version: number;
  name: string;
  parent: string;
  referral?: string;
  salt: string;
  nameid?: string;
};

export type AdvancedNameReservationData = {
  version?: number;
  name?: string;
  parent?: IdentityID;
  referral?: IdentityID;
  salt?: Buffer;
};

/** CAdvancedNameReservation version 1; its version is a fixed uint32 LE. */
export class AdvancedNameReservation extends SerializableEntityBase implements SerializableEntity {
  static readonly VERSION_CURRENT = 1;
  static readonly MAX_NAME_SIZE = MAX_IDENTITY_NAME_BYTES;
  static readonly DEFAULT_OUTPUT_AMOUNT = 0;
  version: number;
  name: string;
  parent: IdentityID;
  referral: IdentityID;
  salt: Buffer;

  constructor(data: AdvancedNameReservationData = {}) {
    super();
    this.version = data.version == null ? AdvancedNameReservation.VERSION_CURRENT : data.version;
    this.name = data.name == null ? '' : data.name;
    if (data.parent != null) assertIdentityID(data.parent, 'Parent');
    if (data.referral != null) assertIdentityID(data.referral, 'Referral');
    if (data.salt != null && !Buffer.isBuffer(data.salt)) throw new Error('Salt must be a Buffer of raw uint256 bytes');
    this.parent = new IdentityID(Buffer.from(data.parent?.hash || Buffer.alloc(20)));
    this.referral = new IdentityID(Buffer.from(data.referral?.hash || Buffer.alloc(20)));
    this.salt = Buffer.from(data.salt || Buffer.alloc(32));
  }

  private validate(): void {
    if (this.version !== AdvancedNameReservation.VERSION_CURRENT) throw new Error('Unsupported advanced reservation version');
    assertNameBytes(this.name);
    assertIdentityID(this.parent, 'Parent');
    assertIdentityID(this.referral, 'Referral');
    assertUint256(this.salt, 'Salt');
  }

  isValid(): boolean {
    try { this.validate(); return true; } catch (_) { return false; }
  }

  validateForCreation(): void {
    this.validate();
    assertIdentityID(this.parent, 'Parent', false);
    validateIdentityRegistrationName(this.name);
  }

  getByteLength(): number {
    this.validate();
    return 4 + 1 + Buffer.byteLength(this.name, 'utf8') + 20 + 20 + 32;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()));
    writer.writeUInt32(this.version);
    writer.writeVarSlice(Buffer.from(this.name, 'utf8'));
    writer.writeSlice(this.parent.hash);
    writer.writeSlice(this.referral.hash);
    writer.writeSlice(this.salt);
    return writer.buffer;
  }

  /** Stream parser; supplying length rejects any trailing payload bytes. */
  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    const reader = boundedReader(buffer, offset, length);
    const version = reader.readUInt32();
    const name = readName(reader);
    const parent = new IdentityID(Buffer.from(reader.readSlice(20)));
    const referral = new IdentityID(Buffer.from(reader.readSlice(20)));
    const salt = Buffer.from(reader.readSlice(32));
    const parsed = new AdvancedNameReservation({ version, name, parent, referral, salt });
    parsed.validate();
    checkPayloadEnd(reader.offset, offset, length);
    this.version = version;
    this.name = name;
    this.parent = parent;
    this.referral = referral;
    this.salt = salt;
    return reader.offset;
  }

  static fromHex(hex: string): AdvancedNameReservation {
    const bytes = payloadFromHex(hex);
    const result = new AdvancedNameReservation();
    result.fromBuffer(bytes, 0, bytes.length);
    return result;
  }

  getCommitment(): CommitmentHash {
    return new CommitmentHash({ hash: hash(this.toBuffer()) });
  }

  /**
   * A null serialized parent uses the daemon's global root when deriving nameid.
   * It does not mean an absolute, parentless identity. Require that context rather
   * than silently assuming a network; ordinary nonnull parents are self-contained.
   */
  getIdentityAddress(rootSystemName?: string): string {
    this.validate();
    if (/[.@]/.test(this.name)) throw new Error('Reservation must contain a leaf name');
    // CIdentity::GetID hashes a C string; NUL would truncate the daemon's name.
    if (this.name.includes('\0')) throw new Error('Cannot derive an identity address from a name containing NUL');
    if (this.parent.hash.equals(Buffer.alloc(20))) {
      if (rootSystemName === undefined) throw new Error('Null-parent reservation requires explicit root system context');
      validateIdentityRegistrationName(rootSystemName);
      // CleanName(..., addVerus=true) appends the root unless the leaf is already
      // the root name (ASCII case-insensitive). toIAddress implements that rule.
      return toIAddress(this.name, rootSystemName);
    }
    return nameAndParentAddrToIAddr(this.name, this.parent.toAddress());
  }

  toJSON(): AdvancedNameReservationJSON {
    return this.toJSONInRootContext();
  }

  /** Explicit context is separate from JSON.stringify's property-key argument. */
  toJSONWithRootSystem(rootSystemName: string): AdvancedNameReservationJSON {
    return this.toJSONInRootContext(rootSystemName);
  }

  private toJSONInRootContext(rootSystemName?: string): AdvancedNameReservationJSON {
    this.validate();
    return {
      version: this.version,
      name: this.name,
      parent: this.parent.toAddress(),
      referral: this.referral.hash.equals(Buffer.alloc(20)) ? '' : this.referral.toAddress(),
      salt: Buffer.from(this.salt).reverse().toString('hex'),
      nameid: this.getIdentityAddress(rootSystemName)
    };
  }

  static fromJSON(json: AdvancedNameReservationJSON, rootSystemName?: string): AdvancedNameReservation {
    const result = new AdvancedNameReservation({
      version: json.version,
      name: json.name,
      parent: identityIDFromJSON(json.parent, 'Parent'),
      referral: identityIDFromJSON(json.referral == null ? '' : json.referral, 'Referral'),
      salt: uint256FromHex(json.salt, 'Salt')
    });
    result.validate();
    if (json.nameid != null && json.nameid !== result.getIdentityAddress(rootSystemName)) throw new Error('Reservation nameid does not match its name and parent');
    return result;
  }
}
