import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class UTXORef extends SerializableEntityBase implements SerializableEntity {
    hash: Buffer;
    n: BigNumber;
    constructor(data?: {
        hash?: Buffer;
        n?: BigNumber;
    });
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        txid: string;
        voutnum: number;
    };
    static fromJson(data: {
        txid: string;
        voutnum: string;
    }): UTXORef;
}
