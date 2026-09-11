import { CurrencyDefinition, RawCurrencyDefinition } from "../../../currency/CurrencyDefinition";
import { ApiResponse } from "../../ApiResponse";
export declare class ListCurrenciesResponse extends ApiResponse {
    result: Array<{
        currencydefinition: RawCurrencyDefinition & Pick<CurrencyDefinition, "currencyidhex" | "fullyqualifiedname" | "definitiontxid" | "definitiontxout">;
        bestheight?: number;
        besttxid?: string;
        besttxout?: number;
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
    }>;
}
