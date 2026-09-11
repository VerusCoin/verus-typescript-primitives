/** Fields emitted by CCurrencyDefinition::ToUniValue, without RPC metadata. */
export type RawCurrencyDefinition = {
  version: number;
  options: number;
  name: string;
  currencyid: string;
  parent?: string;
  systemid: string;
  maxpreconversion?: Array<number>,
  minpreconversion?: Array<number>,
  notarizationprotocol: number;
  proofprotocol: number;
  launchsystemid?: string;
  startblock: number;
  endblock: number;
  currencies?: Array<string>;
  weights?: Array<number>;
  conversions?: Array<number>;
  initialsupply?: number;
  prelaunchcarveout?: number;
  initialcontributions?: Array<number>;
  idregistrationfees: number;
  idreferrallevels: number;
  idimportfees: number;
};

/** Currency definition enriched by getcurrency. */
export type CurrencyDefinition = RawCurrencyDefinition & {
  currencyidhex: string;
  fullyqualifiedname: string;
  currencynames?: { [key: string]: string };
  definitiontxid?: string;
  definitiontxout?: number;
  bestheight: number;
  lastconfirmedheight?: number;
  bestcurrencystate?: {
    flags: number;
    version: number;
    currencyid: string;
    reservecurrencies: Array<{
      currencyid: string;
      weight: number;
      reserves: number;
      priceinreserve: number;
    }>;
    initialsupply: number;
    emitted: number;
    supply: number;
    currencies: {
      [key: string]: {
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
  lastconfirmedcurrencystate?: {
    flags: number;
    version: number;
    currencyid: string;
    reservecurrencies: Array<{
      currencyid: string;
      weight: number;
      reserves: number;
      priceinreserve: number;
    }>;
    initialsupply: number;
    emitted: number;
    supply: number;
    currencies: {
      [key: string]: {
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
}
