import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { IdentityID } from './IdentityID';
import { KeyID } from './KeyID';
import { NoDestination } from './NoDestination';
import { PubKey } from './PubKey';
import { UnknownID } from './UnknownID';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface TxDestinationVariantInterface {
    new (hash?: Buffer): TxDestinationVariant;
}
export type TxDestinationVariant = IdentityID | KeyID | NoDestination | PubKey | UnknownID;
export declare class TxDestination extends SerializableEntityBase implements SerializableEntity {
    type: BigNumber;
    data: TxDestinationVariant;
    static TYPE_INVALID: import("bn.js");
    static TYPE_PK: import("bn.js");
    static TYPE_PKH: import("bn.js");
    static TYPE_SH: import("bn.js");
    static TYPE_ID: import("bn.js");
    static TYPE_INDEX: import("bn.js");
    static TYPE_QUANTUM: import("bn.js");
    static TYPE_LAST: import("bn.js");
    constructor(data?: TxDestinationVariant, type?: BigNumber);
    static getTxDestinationVariantType(variant: TxDestinationVariant): BigNumber;
    static getTxDestinationVariant(type: BigNumber): TxDestinationVariantInterface;
    toAddress(): string;
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toBuffer(): Buffer;
    static fromChunk(chunk: Buffer): TxDestination;
    toChunk(): Buffer<ArrayBuffer>;
}
