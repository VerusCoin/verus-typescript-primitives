import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { SaplingPaymentAddress } from '../../../pbaas';
import { SaplingExtendedSpendingKey } from '../../../pbaas/SaplingExtendedSpendingKey';
import { SaplingExtendedViewingKey } from '../../../pbaas/SaplingExtendedViewingKey';
import { CompactAddressObjectJson, CompactIAddressObject } from '../CompactAddressObject';
export interface AppEncryptionResponseDetailsInterface {
    version: BigNumber;
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    incomingViewingKey: Buffer;
    extendedViewingKey: SaplingExtendedViewingKey;
    address: SaplingPaymentAddress;
    extendedSpendingKey?: SaplingExtendedSpendingKey;
}
export interface AppEncryptionResponseDetailsJson {
    version: number;
    flags?: number;
    requestid?: CompactAddressObjectJson;
    incomingviewingkey: string;
    extendedviewingkey: string;
    address: string;
    extendedspendingkey?: string;
}
export declare class AppEncryptionResponseDetails extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    requestID?: CompactIAddressObject;
    incomingViewingKey: Buffer;
    extendedViewingKey: SaplingExtendedViewingKey;
    address: SaplingPaymentAddress;
    extendedSpendingKey?: SaplingExtendedSpendingKey;
    static FLAG_HAS_REQUEST_ID: import("bn.js");
    static FLAG_HAS_EXTENDED_SPENDING_KEY: import("bn.js");
    constructor(data?: AppEncryptionResponseDetailsInterface);
    containsRequestID(): boolean;
    toggleContainsRequestID(): void;
    containsExtendedSpendingKey(): boolean;
    toggleContainsExtendedSpendingKey(): void;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, rootSystemName?: string): number;
    toJson(): AppEncryptionResponseDetailsJson;
    static fromJson(json: AppEncryptionResponseDetailsJson): AppEncryptionResponseDetails;
}
