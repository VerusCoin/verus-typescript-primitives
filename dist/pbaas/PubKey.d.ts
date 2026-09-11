import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from "../utils/types/SerializableEntity";
export declare class PubKey extends SerializableEntityBase implements SerializableEntity {
    static PUBLIC_KEY_SIZE: number;
    static COMPRESSED_PUBLIC_KEY_SIZE: number;
    bytes: Buffer;
    compressed: boolean;
    constructor(bytes?: Buffer, compressed?: boolean);
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toBuffer(): Buffer;
}
