/** Monetary values are RPC coin amounts, not atomic integers. */
export type CurrencyStateReserve = {
    currencyid: string;
    weight: number;
    reserves: number;
    priceinreserve: number;
};
/** CCoinbaseCurrencyState::ToUniValue, also embedded in getcurrency. */
export type CurrencyState = {
    flags: number;
    version: number;
    currencyid: string;
    reservecurrencies?: CurrencyStateReserve[];
    launchcurrencies?: CurrencyStateReserve[];
    initialsupply: number;
    emitted: number;
    supply: number;
    currencies?: {
        [currencyid: string]: {
            reservein: number;
            primarycurrencyin: number;
            reserveout: number;
            lastconversionprice: number;
            viaconversionprice: number;
            fees: number;
            conversionfees: number;
            priorweights: number;
        };
    };
    primarycurrencyfees: number;
    primarycurrencyconversionfees: number;
    primarycurrencyout: number;
    preconvertedout: number;
};
