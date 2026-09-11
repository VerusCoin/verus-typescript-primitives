import { ApiResponse } from "../../ApiResponse";

type AddressDelta = {
    satoshis: number;
    txid: string;
    index: number;
    blockindex: number;
    height: number;
    spending: boolean;
    address: string;
    currencyvalues?: { [key: string]: number },
    blocktime?: number;
    currencynames?: { [key: string]: string },
    sent?: {
      outputfunctions?: Array<string>;
      privateoutput?: number;
      outputs: Array<{
        addresses: string | Array<string>;
        amounts: { [key: string]: number };
      }>;
    };
};

export class GetAddressDeltasResponse extends ApiResponse {
  result: Array<AddressDelta> | {
    deltas: Array<AddressDelta>;
    start: { hash: string; height: number };
    end: { hash: string; height: number };
  };
}
