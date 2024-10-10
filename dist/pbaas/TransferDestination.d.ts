/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare const DEST_INVALID: import("bn.js");
export declare const DEST_PK: import("bn.js");
export declare const DEST_PKH: import("bn.js");
export declare const DEST_SH: import("bn.js");
export declare const DEST_ID: import("bn.js");
export declare const DEST_FULLID: import("bn.js");
export declare const DEST_REGISTERCURRENCY: import("bn.js");
export declare const DEST_QUANTUM: import("bn.js");
export declare const DEST_NESTEDTRANSFER: import("bn.js");
export declare const DEST_ETH: import("bn.js");
export declare const DEST_ETHNFT: import("bn.js");
export declare const DEST_RAW: import("bn.js");
export declare const LAST_VALID_TYPE_NO_FLAGS: import("bn.js");
export declare const FLAG_DEST_AUX: import("bn.js");
export declare const FLAG_DEST_GATEWAY: import("bn.js");
export declare const FLAG_MASK: import("bn.js");
export declare type TransferDestinationJson = {
    type: string;
    destination_bytes: string;
    gateway_id?: string;
    gateway_code?: string;
    fees: string;
    aux_dests: Array<TransferDestinationJson>;
};
export declare class TransferDestination implements SerializableEntity {
    type: BigNumber;
    destination_bytes: Buffer;
    gateway_id: string;
    gateway_code: string;
    fees: BigNumber;
    aux_dests: Array<TransferDestination>;
    constructor(data?: {
        type?: BigNumber;
        destination_bytes?: Buffer;
        gateway_id?: string;
        gateway_code?: string;
        fees?: BigNumber;
        aux_dests?: Array<TransferDestination>;
    });
    isGateway(): boolean;
    hasAuxDests(): boolean;
    isIAddr(): boolean;
    isPKH(): boolean;
    isETHAccount(): boolean;
    typeNoFlags(): import("bn.js");
    getAddressString(): string;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    static fromJson(data: TransferDestinationJson): TransferDestination;
    toJson(): TransferDestinationJson;
    isValid(): boolean;
    getAuxDest(destNum: any): TransferDestination;
}
