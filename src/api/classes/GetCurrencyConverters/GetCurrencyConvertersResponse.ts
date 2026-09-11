import { ApiPrimitiveJson } from "../../ApiPrimitive";
import { ApiResponse } from "../../ApiResponse";

export class GetCurrencyConvertersResponse extends ApiResponse {
  result: Array<{
    // A dynamic currency ID maps to its raw definition alongside these fields.
    [key: string]: string | number | ApiPrimitiveJson | undefined;
    fullyqualifiedname: string;
    height: number;
    output: { txid: string; voutnum: number };
    lastnotarization: ApiPrimitiveJson;
    targetamount?: number;
    sourceamounts?: { [currencyid: string]: number };
  }>
}
