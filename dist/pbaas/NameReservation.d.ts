import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { IdentityID } from './IdentityID';
import { CommitmentHash } from './CommitmentHash';
export type NameReservationJSON = {
    name: string;
    salt: string;
    referral?: string;
    /** Legacy JSON metadata; parent is NOT serialized or committed. */
    parent?: string;
    nameid?: string;
};
export type NameReservationData = {
    name?: string;
    referral?: IdentityID;
    salt?: Buffer;
};
/** Legacy CNameReservation. Salt is raw uint256 bytes; JSON salt is display hex. */
export declare class NameReservation extends SerializableEntityBase implements SerializableEntity {
    static readonly MAX_NAME_SIZE: number;
    static readonly DEFAULT_OUTPUT_AMOUNT = 0;
    name: string;
    referral: IdentityID;
    salt: Buffer;
    constructor(data?: NameReservationData);
    private validate;
    isValid(): boolean;
    /** Stricter wallet creation policy, separate from historical payload decoding. */
    validateForCreation(): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    /** Stream parser; supplying length rejects any trailing payload bytes. */
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    static fromHex(hex: string): NameReservation;
    getCommitment(): CommitmentHash;
    /**
     * Explicit context is mandatory: null denotes an explicitly selected absolute
     * root (the historical genesis case), never the daemon's implicit network root.
     */
    getIdentityAddress(parent: string | null): string;
    toJSON(): NameReservationJSON;
    /** Explicit metadata context, separate from JSON.stringify's property-key argument. */
    toJSONWithParent(parent: string | null): NameReservationJSON;
    /** Parse canonical leaf data; callers resolve friendly names before calling. */
    static fromJSON(json: NameReservationJSON, parent?: string | null): NameReservation;
}
