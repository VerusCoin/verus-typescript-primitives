import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactAddressObjectJson, CompactIAddressObject } from '../CompactAddressObject';
export type IdentityUpdateResponseDetailsJson = {
    flags: string;
    requestid: CompactAddressObjectJson;
    txid?: string;
};
export declare class IdentityUpdateResponseDetails extends SerializableEntityBase implements SerializableEntity {
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    txid?: Buffer;
    static IDENTITY_UPDATE_RESPONSE_CONTAINS_TXID: import("bn.js");
    static IDENTITY_UPDATE_RESPONSE_CONTAINS_REQUEST_ID: import("bn.js");
    constructor(data?: {
        flags?: BigNumber;
        requestID?: CompactIAddressObject;
        txid?: Buffer;
    });
    containsTxid(): boolean;
    containsRequestID(): boolean;
    toggleContainsTxid(): void;
    toggleContainsRequestID(): void;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    getTxidString(): string;
    setTxidFromString(txid: string): void;
    toJson(): IdentityUpdateResponseDetailsJson;
    static fromJson(json: IdentityUpdateResponseDetailsJson): IdentityUpdateResponseDetails;
}
