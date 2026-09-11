import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SaplingExtendedViewingKeyData } from '../utils/sapling';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class SaplingExtendedViewingKey extends SerializableEntityBase implements SerializableEntity, SaplingExtendedViewingKeyData {
    depth: number;
    parentFVKTag: Buffer;
    childIndex: Buffer;
    chainCode: Buffer;
    ak: Buffer;
    nk: Buffer;
    ovk: Buffer;
    dk: Buffer;
    constructor(data?: SaplingExtendedViewingKeyData);
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    static fromKeyString(key: string): SaplingExtendedViewingKey;
    toKeyString(testnet?: boolean): string;
}
