/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class UTXORef implements SerializableEntity {
    hash: Buffer;
    n: BigNumber;
    constructor(data?: {
        hash?: Buffer;
        n?: BigNumber;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        hash: string;
        n: number;
    };
    static fromJson(data: {
        hash: string;
        n: string;
    }): UTXORef;
}
