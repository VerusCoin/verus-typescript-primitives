import { PartialIdentity } from '../../../pbaas/PartialIdentity';
import { PartialSignData, PartialSignDataCLIJson, PartialSignDataJson } from '../../../pbaas/PartialSignData';
import { BigNumber } from '../../../utils/types/BigNumber';
import { ContentMultiMapJsonValue, IdentityID, VerusCLIVerusIDJson, VerusCLIVerusIDJsonBase } from '../../../pbaas';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { CompactAddressObjectJson, CompactIAddressObject } from '../CompactAddressObject';
import { KvMap } from '../../../utils/KvMap';
export type SignDataMap = KvMap<PartialSignData>;
export type VerusCLIVerusIDJsonWithData = VerusCLIVerusIDJsonBase<{
    [key: string]: ContentMultiMapJsonValue | {
        data: PartialSignDataCLIJson;
    };
}>;
export type IdentityUpdateRequestDetailsJson = {
    flags?: string;
    requestid?: CompactAddressObjectJson;
    identity?: VerusCLIVerusIDJson;
    expiryheight?: string;
    systemid?: string;
    signdatamap?: {
        [key: string]: PartialSignDataJson;
    };
    txid?: string;
};
export declare class IdentityUpdateRequestDetails implements SerializableEntity {
    flags?: BigNumber;
    requestID?: CompactIAddressObject;
    identity?: PartialIdentity;
    expiryHeight?: BigNumber;
    systemID?: IdentityID;
    signDataMap?: SignDataMap;
    txid?: Buffer;
    static IDENTITY_UPDATE_REQUEST_VALID: import("bn.js");
    static IDENTITY_UPDATE_REQUEST_CONTAINS_SIGNDATA: import("bn.js");
    static IDENTITY_UPDATE_REQUEST_EXPIRES: import("bn.js");
    static IDENTITY_UPDATE_REQUEST_CONTAINS_REQUEST_ID: import("bn.js");
    static IDENTITY_UPDATE_REQUEST_CONTAINS_SYSTEM: import("bn.js");
    static IDENTITY_UPDATE_REQUEST_CONTAINS_TXID: import("bn.js");
    constructor(data?: {
        flags?: BigNumber;
        requestID?: CompactIAddressObject;
        identity?: PartialIdentity;
        expiryHeight?: BigNumber;
        systemID?: IdentityID;
        txid?: Buffer;
        signDataMap?: SignDataMap;
    });
    expires(): boolean;
    containsSignData(): boolean;
    containsSystem(): boolean;
    containsRequestID(): boolean;
    containsTxid(): boolean;
    toggleExpires(): void;
    toggleContainsSignData(): void;
    toggleContainsSystem(): void;
    toggleContainsRequestID(): void;
    toggleContainsTxid(): void;
    toSha256(): Buffer<ArrayBufferLike>;
    getContentMultiMapKeys(): string[];
    getIdentityAddress(isTestnet?: boolean): string;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number, parseVdxfObjects?: boolean, rootSystemName?: string): number;
    getTxidString(): string;
    setTxidFromString(txid: string): void;
    toJson(): IdentityUpdateRequestDetailsJson;
    static fromJson(json: IdentityUpdateRequestDetailsJson): IdentityUpdateRequestDetails;
    toCLIJson(): VerusCLIVerusIDJsonWithData;
    static fromCLIJson(json: VerusCLIVerusIDJsonWithData, details?: IdentityUpdateRequestDetailsJson): IdentityUpdateRequestDetails;
}
