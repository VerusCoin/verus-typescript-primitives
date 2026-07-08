import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { BigNumber } from '../../../utils/types/BigNumber';
export type MarketplaceCloseOfferParamsJson = {
    offertxid: string;
};
export type MarketplaceCloseOfferRequestDetailsJson = {
    flags?: string;
    offerDescription?: string;
    closeOfferParams?: MarketplaceCloseOfferParamsJson;
};
/**
 * Identifies the on-chain listing a wallet should unlist by reclaiming its own
 * listing deposit (a `closeoffers`-equivalent spend of the deposit output back
 * to its owner). offerTxid is the txid of the on-chain listing transaction
 * (the wallet-published or `publishoffer`-published deposit tx), not the raw
 * offer transaction itself.
 */
export declare class MarketplaceCloseOfferParams implements SerializableEntity {
    offerTxid: string;
    constructor(data?: {
        offerTxid?: string;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): MarketplaceCloseOfferParamsJson;
    static fromJson(json: MarketplaceCloseOfferParamsJson): MarketplaceCloseOfferParams;
}
export declare class MarketplaceCloseOfferRequestDetails implements SerializableEntity {
    flags?: BigNumber;
    offerDescription?: string;
    closeOfferParams?: MarketplaceCloseOfferParams;
    static MARKETPLACE_CLOSEOFFER_REQUEST_VALID: import("bn.js");
    static MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_DESC: import("bn.js");
    static MARKETPLACE_CLOSEOFFER_REQUEST_CONTAINS_CLOSE_PARAMS: import("bn.js");
    constructor(data?: {
        flags?: BigNumber;
        offerDescription?: string;
        closeOfferParams?: MarketplaceCloseOfferParams;
    });
    containsDesc(): boolean;
    containsCloseOfferParams(): boolean;
    toggleContainsDesc(): void;
    toggleContainsCloseOfferParams(): void;
    isValid(): boolean;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): MarketplaceCloseOfferRequestDetailsJson;
    static fromJson(json: MarketplaceCloseOfferRequestDetailsJson): MarketplaceCloseOfferRequestDetails;
}
