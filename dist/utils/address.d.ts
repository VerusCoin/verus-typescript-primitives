/// <reference types="node" />
import { hash } from "./hash";
export declare const fromBase58Check: (address: string) => {
    version: number;
    hash: Buffer;
};
export declare const toBase58Check: (hash: Buffer, version: number) => string;
export declare const toIAddress: (fullyqualifiedname: string, rootSystemName?: string) => string;
