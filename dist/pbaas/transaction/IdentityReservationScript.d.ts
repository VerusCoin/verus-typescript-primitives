import { AdvancedNameReservation } from '../AdvancedNameReservation';
import { NameReservation } from '../NameReservation';
import { OptCCParams } from '../OptCCParams';
import { SmartTransactionScript } from './SmartTransactionScript';
export type IdentityReservation = NameReservation | AdvancedNameReservation;
/** Identity-addressed reveal output. Consensus makes reservation outputs unspendable. */
export declare class IdentityReservationScript extends SmartTransactionScript {
    constructor(master?: OptCCParams, params?: OptCCParams);
    /** Legacy payloads omit their parent, so callers must explicitly supply it (null for root). */
    static fromReservation(reservation: IdentityReservation, legacyParent?: string | null): IdentityReservationScript;
    private validate;
    getReservation(): IdentityReservation;
    /**
     * Return the encoded destination. Verify legacy payloads with explicit parent
     * context, or null-parent advanced payloads with explicit root system context.
     */
    getIdentityAddress(legacyParent?: string | null, rootSystemName?: string): string;
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    toBuffer(): Buffer;
    getByteLength(): number;
}
