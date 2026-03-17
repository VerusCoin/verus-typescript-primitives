import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare class SaplingPaymentAddress implements SerializableEntity {
    d: Buffer;
    pkD: Buffer;
    constructor(data?: {
        d: Buffer;
        pkD: Buffer;
    });
    /** @deprecated Use pkD instead */
    get pk_d(): Buffer;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    static fromAddressString(address: string): SaplingPaymentAddress;
    toAddressString(): string;
}
