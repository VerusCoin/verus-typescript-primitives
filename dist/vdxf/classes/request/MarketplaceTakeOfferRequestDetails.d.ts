import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import { BigNumber } from '../../../utils/types/BigNumber';
import { TransferDestination, TransferDestinationJson } from '../../../pbaas/TransferDestination';
export type MarketplaceTakeOfferParamsJson = {
    offeredidentityid: string;
    payoutdestination: TransferDestinationJson;
    forcurrencyid: string;
    foramount: string;
    expiryheight: string;
};
export type MarketplaceTakeOfferRequestDetailsJson = {
    flags?: string;
    rawTransactionHex?: string;
    offerDescription?: string;
    offerParams?: MarketplaceTakeOfferParamsJson;
};
/**
 * Parameters a wallet needs to construct a Verus marketplace sell offer (makeoffer)
 * (partial makeoffer transaction) entirely client-side:
 *   vin[0]  = the offered identity's current definition UTXO (looked up on-chain
 *             by the wallet from offeredIdentityId via getidentity)
 *   vout[0] = forAmountSats of forCurrencyId paid to payoutDestination
 * signed SIGHASH_SINGLE | SIGHASH_ANYONECANPAY over the identity input.
 */
export declare class MarketplaceTakeOfferParams implements SerializableEntity {
    offeredIdentityId: string;
    payoutDestination: TransferDestination;
    forCurrencyId: string;
    forAmountSats: BigNumber;
    expiryHeight: BigNumber;
    constructor(data?: {
        offeredIdentityId?: string;
        payoutDestination?: TransferDestination;
        forCurrencyId?: string;
        forAmountSats?: BigNumber;
        expiryHeight?: BigNumber;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): MarketplaceTakeOfferParamsJson;
    static fromJson(json: MarketplaceTakeOfferParamsJson): MarketplaceTakeOfferParams;
}
export declare class MarketplaceTakeOfferRequestDetails implements SerializableEntity {
    flags?: BigNumber;
    rawTransactionHex?: string;
    offerDescription?: string;
    offerParams?: MarketplaceTakeOfferParams;
    static MARKETPLACE_TAKEOFFER_REQUEST_VALID: import("bn.js");
    static MARKETPLACE_TAKEOFFER_REQUEST_CONTAINS_RAW_TX: import("bn.js");
    static MARKETPLACE_TAKEOFFER_REQUEST_CONTAINS_DESC: import("bn.js");
    static MARKETPLACE_TAKEOFFER_REQUEST_CONTAINS_OFFER_PARAMS: import("bn.js");
    constructor(data?: {
        flags?: BigNumber;
        rawTransactionHex?: string;
        offerDescription?: string;
        offerParams?: MarketplaceTakeOfferParams;
    });
    containsRawTx(): boolean;
    containsDesc(): boolean;
    containsOfferParams(): boolean;
    toggleContainsRawTx(): void;
    toggleContainsDesc(): void;
    toggleContainsOfferParams(): void;
    isValid(): boolean;
    toSha256(): Buffer<ArrayBufferLike>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): MarketplaceTakeOfferRequestDetailsJson;
    static fromJson(json: MarketplaceTakeOfferRequestDetailsJson): MarketplaceTakeOfferRequestDetails;
}
