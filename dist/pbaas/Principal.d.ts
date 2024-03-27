/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
export declare const VERSION_INVALID: import("bn.js");
export declare const VERSION_CURRENT: import("bn.js");
declare class TxDestination {
    primary_addresses: Array<Buffer>;
    constructor(data?: {
        primaryaddresses?: Array<string>;
    });
    getAddressString(): void;
    txgetByteLength(): number;
    txtoBuffer(): Buffer;
    txfromBuffer(buffer: any, offset?: number): number;
}
export declare class Principal extends TxDestination {
    flags: BigNumber;
    version: BigNumber;
    min_sigs: BigNumber;
    constructor(data?: {
        version?: BigNumber | number;
        flags?: BigNumber | number;
        minimumsignatures?: BigNumber | number;
        primaryaddresses?: Array<string>;
    });
    _dataByteLength(): number;
    _toBuffer(): Buffer;
    _fromBuffer(buffer: any, offset?: number): number;
}
export {};
