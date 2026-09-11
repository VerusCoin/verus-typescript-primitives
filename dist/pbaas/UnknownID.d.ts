import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from "../utils/types/SerializableEntity";
export declare class UnknownID extends SerializableEntityBase implements SerializableEntity {
    bytes: Buffer;
    constructor(bytes?: Buffer);
    getByteLength(): number;
    fromBuffer(buffer: Buffer, offset?: number, length?: number): number;
    toBuffer(): Buffer;
}
