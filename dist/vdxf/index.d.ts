/// <reference types="node" />
/// <reference types="bn.js" />
import { VDXFKeyInterface } from './keys';
import { BigNumber } from "../utils/types/BigNumber";
export * from './keys';
export * from './scopes';
export * from './keymap';
export * from './identitydatakeys';
export * from './vdxfdatakeys';
export interface VDXFObjectInterface {
    vdxfkey: string;
    toString: () => string;
    toJson: () => {
        [key: string]: any;
    };
    toBuffer: () => Buffer;
    toDataBuffer: () => Buffer;
    fromDataBuffer: (buffer: Buffer, offset: number) => number;
    fromBuffer: (buffer: Buffer, offset: number) => number;
    dataByteLength: () => number;
    byteLength: () => number;
    getVersionNoFlags: () => BigNumber;
}
export interface VerusIDSignatureInterface {
    signature: string;
}
export declare type VerusIDSignatureJson = {
    signature: string;
    vdxfkey: string;
    serializekey: boolean;
};
export declare class VDXFObject implements VDXFObjectInterface {
    vdxfkey: string;
    version: BigNumber;
    serializekey: boolean;
    constructor(key?: string, serializekey?: boolean);
    getVersionNoFlags(): import("bn.js");
    toJson(): {};
    toString(includeKey?: boolean): string;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    isValidVersion(): boolean;
    fromBuffer(buffer: Buffer, offset?: number, vdxfkey?: string): number;
    byteLength(includeKey?: boolean): number;
    toBuffer(includeKey?: boolean): Buffer;
    toSha256(): Buffer;
}
export declare class BufferDataVdxfObject extends VDXFObject {
    data: string;
    encoding: BufferEncoding;
    constructor(data?: string, vdxfkey?: string, encoding?: BufferEncoding);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toJson(): {
        data: string;
        vdxfkey: string;
    };
}
export declare class VDXFData extends VDXFObject {
    data: Buffer;
    constructor(data?: Buffer, vdxfkey?: string);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toJson(): {
        data: string;
        vdxfkey: string;
    };
}
export declare class Utf8DataVdxfObject extends BufferDataVdxfObject {
    constructor(data?: string, vdxfkey?: string);
}
export declare class HexDataVdxfObject extends BufferDataVdxfObject {
    constructor(data?: string, vdxfkey?: string);
}
export declare class Utf8OrBase58Object extends VDXFObject {
    data: string;
    base58Keys: {
        [key: string]: boolean;
    };
    constructor(data?: string, vdxfkey?: string, base58Keys?: Array<string>);
    isBase58(): boolean;
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    toJson(): {
        data: string;
        vdxfkey: string;
    };
}
export declare class VerusIDSignature extends VDXFObject {
    signature: string;
    constructor(sig?: VerusIDSignatureInterface, vdxfkey?: VDXFKeyInterface, serializekey?: boolean);
    dataByteLength(): number;
    toDataBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
    static fromJson(data: VerusIDSignatureJson): VerusIDSignature;
    toJson(): VerusIDSignatureJson;
}
