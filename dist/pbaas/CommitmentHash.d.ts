import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { TokenOutput } from './TokenOutput';
export type CommitmentHashJSON = {
    hash: string;
    version?: number;
    currencyvalues?: {
        [currency: string]: string | number;
    };
};
/** CCommitmentHash. Hash buffers are raw uint256 bytes, not display-order hex. */
export declare class CommitmentHash extends SerializableEntityBase implements SerializableEntity {
    static readonly DEFAULT_OUTPUT_AMOUNT = 0;
    hash: Buffer;
    tokenOutput?: TokenOutput;
    constructor(data?: {
        hash?: Buffer;
        tokenOutput?: TokenOutput;
    });
    static getAdvancedCommitmentHashKey(): Buffer;
    isAdvanced(): boolean;
    private validate;
    isValid(): boolean;
    toBuffer(): Buffer;
    getByteLength(): number;
    /** Stream parser; supplying length requires exactly one complete payload. */
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    static fromHex(hex: string): CommitmentHash;
    toJSON(): CommitmentHashJSON;
    static fromJSON(json: CommitmentHashJSON | string): CommitmentHash;
}
