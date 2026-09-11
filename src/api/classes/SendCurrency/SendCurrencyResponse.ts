import { ApiResponse } from "../../ApiResponse";

export class SendCurrencyResponse extends ApiResponse {
  result: string | ({
    outputtotals: { [currencyid: string]: number },
    feeamount: number,
  } & (
    { hextx: string; hextxwithoutz?: never } |
    { hextx?: never; hextxwithoutz: string }
  ))
}
