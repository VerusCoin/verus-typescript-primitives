/// <reference types="node" />
export declare class Hash160 {
    hash: Buffer;
    version: number;
    varlength: boolean;
    constructor(hash?: Buffer, version?: number, varlength?: boolean);
    static getEmpty(): Hash160;
    static fromAddress(address: string, varlength?: boolean): Hash160;
    toAddress(): string | null;
    byteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, varlength?: boolean, offset?: number): number;
    toJson(): {
        hash: Buffer;
        version: number;
    };
}
