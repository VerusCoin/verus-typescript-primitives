import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import bufferutils from '../utils/bufferutils';
import { hash } from '../utils/hash';
import { nameAndParentAddrToIAddr } from '../utils/address';
import { validateIdentityRegistrationName } from '../utils/identityRegistration';
import { IdentityID } from './IdentityID';
import { CommitmentHash } from './CommitmentHash';
import {
  assertIdentityID, assertNameBytes, assertUint256, boundedReader, checkPayloadEnd,
  identityIDFromJSON, MAX_IDENTITY_NAME_BYTES, payloadFromHex, readName, uint256FromHex
} from './identityRegistrationSerialization';

export type NameReservationJSON = {
  name: string;
  salt: string;
  referral?: string;
  /** Legacy JSON metadata; parent is NOT serialized or committed. */
  parent?: string;
  nameid?: string;
};

export type NameReservationData = { name?: string; referral?: IdentityID; salt?: Buffer };

/** Legacy CNameReservation. Salt is raw uint256 bytes; JSON salt is display hex. */
export class NameReservation extends SerializableEntityBase implements SerializableEntity {
  static readonly MAX_NAME_SIZE = MAX_IDENTITY_NAME_BYTES;
  static readonly DEFAULT_OUTPUT_AMOUNT = 0;
  name: string;
  referral: IdentityID;
  salt: Buffer;

  constructor(data: NameReservationData = {}) {
    super();
    this.name = data.name == null ? '' : data.name;
    if (data.referral != null) assertIdentityID(data.referral, 'Referral');
    if (data.salt != null && !Buffer.isBuffer(data.salt)) throw new Error('Salt must be a Buffer of raw uint256 bytes');
    this.referral = new IdentityID(Buffer.from(data.referral?.hash || Buffer.alloc(20)));
    this.salt = Buffer.from(data.salt || Buffer.alloc(32));
  }

  private validate(): void {
    assertNameBytes(this.name);
    assertIdentityID(this.referral, 'Referral');
    assertUint256(this.salt, 'Salt');
  }

  isValid(): boolean {
    try { this.validate(); return true; } catch (_) { return false; }
  }

  /** Stricter wallet creation policy, separate from historical payload decoding. */
  validateForCreation(): void {
    this.validate();
    validateIdentityRegistrationName(this.name);
  }

  getByteLength(): number {
    this.validate();
    return 1 + Buffer.byteLength(this.name, 'utf8') + 20 + 32;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()));
    writer.writeVarSlice(Buffer.from(this.name, 'utf8'));
    writer.writeSlice(this.referral.hash);
    writer.writeSlice(this.salt);
    return writer.buffer;
  }

  /** Stream parser; supplying length rejects any trailing payload bytes. */
  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    const reader = boundedReader(buffer, offset, length);
    const name = readName(reader);
    const referral = new IdentityID(Buffer.from(reader.readSlice(20)));
    const salt = Buffer.from(reader.readSlice(32));
    const parsed = new NameReservation({ name, referral, salt });
    parsed.validate();
    checkPayloadEnd(reader.offset, offset, length);
    this.name = name;
    this.referral = referral;
    this.salt = salt;
    return reader.offset;
  }

  static fromHex(hex: string): NameReservation {
    const bytes = payloadFromHex(hex);
    const result = new NameReservation();
    result.fromBuffer(bytes, 0, bytes.length);
    return result;
  }

  getCommitment(): CommitmentHash {
    return new CommitmentHash({ hash: hash(this.toBuffer()) });
  }

  /**
   * Explicit context is mandatory: null denotes an explicitly selected absolute
   * root (the historical genesis case), never the daemon's implicit network root.
   */
  getIdentityAddress(parent: string | null): string {
    this.validate();
    if (/[.@]/.test(this.name)) throw new Error('Reservation must contain a leaf name');
    // CIdentity::GetID hashes a C string; NUL would truncate the daemon's name.
    if (this.name.includes('\0')) throw new Error('Cannot derive an identity address from a name containing NUL');
    if (parent === undefined) throw new Error('Legacy reservation requires explicit parent context');
    const parentID = parent === null ? null : identityIDFromJSON(parent, 'Parent', false);
    return nameAndParentAddrToIAddr(this.name, parentID?.toAddress());
  }

  toJSON(): NameReservationJSON {
    this.validate();
    return {
      name: this.name,
      salt: Buffer.from(this.salt).reverse().toString('hex'),
      referral: this.referral.hash.equals(Buffer.alloc(20)) ? '' : this.referral.toAddress()
    };
  }

  /** Explicit metadata context, separate from JSON.stringify's property-key argument. */
  toJSONWithParent(parent: string | null): NameReservationJSON {
    return {
      ...this.toJSON(),
      parent: parent === null ? '' : parent,
      nameid: this.getIdentityAddress(parent)
    };
  }

  /** Parse canonical leaf data; callers resolve friendly names before calling. */
  static fromJSON(json: NameReservationJSON, parent?: string | null): NameReservation {
    const result = new NameReservation({
      name: json.name,
      referral: identityIDFromJSON(json.referral == null ? '' : json.referral, 'Referral'),
      salt: uint256FromHex(json.salt, 'Salt')
    });
    result.validate();
    // Legacy metadata is not committed. Verify supplied nameid only against
    // explicit caller context, including the historical null-root exception.
    if (json.nameid != null) {
      if (parent === undefined) throw new Error('Legacy nameid metadata requires explicit parent context');
      if (json.nameid !== result.getIdentityAddress(parent)) throw new Error('Reservation nameid does not match its name and parent');
    }
    return result;
  }
}
