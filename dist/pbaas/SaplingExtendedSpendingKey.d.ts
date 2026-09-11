import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SaplingExtendedSpendingKeyData } from '../utils/sapling';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class SaplingExtendedSpendingKey extends SerializableEntityBase implements SerializableEntity, SaplingExtendedSpendingKeyData {
    depth: number;
    parentFVKTag: Buffer;
    childIndex: Buffer;
    chainCode: Buffer;
    ask: Buffer;
    nsk: Buffer;
    ovk: Buffer;
    dk: Buffer;
    constructor(data?: SaplingExtendedSpendingKeyData);
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    static fromKeyString(key: string): SaplingExtendedSpendingKey;
    toKeyString(testnet?: boolean): string;
}
