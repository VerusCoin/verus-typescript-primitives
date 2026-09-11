export type ListedCurrencyOffering = {
    [key: string]: number;
};
export interface ListedIdentityOffering {
    name: string;
    identityid: string;
    systemid: string;
    original: boolean;
}
export type ListedValueOffering = ListedCurrencyOffering | ListedIdentityOffering;
export interface ListedOfferTerms {
    offer: ListedValueOffering;
    accept: ListedValueOffering;
    blockexpiry: number;
    txid: string;
    tx?: string;
}
export type ListedOffer = {
    price: number;
    offer: ListedOfferTerms;
} & ({
    currencyid: string;
    identityid?: never;
} | {
    identityid: string;
    currencyid?: never;
});
export type OfferList = {
    [key: string]: Array<ListedOffer>;
};
