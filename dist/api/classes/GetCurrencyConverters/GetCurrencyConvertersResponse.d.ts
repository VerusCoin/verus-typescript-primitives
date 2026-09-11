import { ApiPrimitiveJson } from "../../ApiPrimitive";
import { ApiResponse } from "../../ApiResponse";
export declare class GetCurrencyConvertersResponse extends ApiResponse {
    result: Array<{
        [key: string]: string | number | ApiPrimitiveJson | undefined;
        fullyqualifiedname: string;
        height: number;
        output: {
            txid: string;
            voutnum: number;
        };
        lastnotarization: ApiPrimitiveJson;
        targetamount?: number;
        sourceamounts?: {
            [currencyid: string]: number;
        };
    }>;
}
