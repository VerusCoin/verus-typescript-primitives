import { CurrencyState } from "../../../currency/CurrencyState";
import { ApiResponse } from "../../ApiResponse";
export type CurrencyStateResult = {
    height: number;
    blocktime: number;
    currencystate: CurrencyState;
    conversiondata?: {
        volumecurrency: string;
        volumethisinterval: number;
        volumepairs: Array<{
            currency: string;
            convertto: string;
            volume: number;
            open: number;
            high: number;
            low: number;
            close: number;
        }>;
    };
};
/** Appended to a conversion-data range when its total volume is nonzero. */
export type CurrencyStateVolume = {
    totalvolume: number;
};
export type CurrencyStateResponseEntry = CurrencyStateResult | CurrencyStateVolume;
export declare class GetCurrencyStateResponse extends ApiResponse {
    result: CurrencyStateResponseEntry[];
    toJSON(): CurrencyStateResponseEntry[];
}
