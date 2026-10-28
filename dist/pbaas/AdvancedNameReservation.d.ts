import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { IdentityID } from './IdentityID';
import { CommitmentHash } from './CommitmentHash';
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
export declare class AdvancedNameReservation extends SerializableEntityBase implements SerializableEntity {
    static readonly VERSION_CURRENT = 1;
    static readonly MAX_NAME_SIZE: number;
    static readonly DEFAULT_OUTPUT_AMOUNT = 0;
    version: number;
    name: string;
    parent: IdentityID;
    referral: IdentityID;
    salt: Buffer;
    constructor(data?: AdvancedNameReservationData);
    private validate;
    isValid(): boolean;
    validateForCreation(): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    /** Stream parser; supplying length rejects any trailing payload bytes. */
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    static fromHex(hex: string): AdvancedNameReservation;
    getCommitment(): CommitmentHash;
    /**
     * A null serialized parent uses the daemon's global root when deriving nameid.
     * It does not mean an absolute, parentless identity. Require that context rather
     * than silently assuming a network; ordinary nonnull parents are self-contained.
     */
    getIdentityAddress(rootSystemName?: string): string;
    toJSON(): AdvancedNameReservationJSON;
    /** Explicit context is separate from JSON.stringify's property-key argument. */
    toJSONWithRootSystem(rootSystemName: string): AdvancedNameReservationJSON;
    private toJSONInRootContext;
    static fromJSON(json: AdvancedNameReservationJSON, rootSystemName?: string): AdvancedNameReservation;
}
