import { SerializableEntityBase } from '../../utils/types/SerializableEntityBase';
import { SerializableEntity } from "../../utils/types/SerializableEntity";
export declare class Hash160 extends SerializableEntityBase {
    hash: Buffer;
    version: number;
    varlength: boolean;
    constructor(hash?: Buffer, version?: number, varlength?: boolean);
    static getEmpty(): Hash160;
    static fromAddress(address: string, varlength?: boolean): Hash160;
    toAddress(): string | null;
    /**
     * @deprecated The method has been replaced by getByteLength and will be removed in the future
     */
    byteLength(): number;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, varlength?: boolean, offset?: number): number;
    toJson(): {
        hash: Buffer<ArrayBufferLike>;
        version: number;
    };
}
export declare class Hash160SerEnt extends Hash160 implements SerializableEntity {
    constructor(hash?: Buffer, version?: number, varlength?: boolean);
    fromBuffer(buffer: Buffer): number;
    fromBuffer(buffer: Buffer, offset?: number, varlength?: boolean): number;
}
