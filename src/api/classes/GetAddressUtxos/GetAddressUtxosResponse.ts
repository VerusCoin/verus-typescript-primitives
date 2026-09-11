import { ApiResponse } from "../../ApiResponse";

type AddressUtxo = {
    address: string;
    addresses?: Array<string>;
    txid: string;
    outputIndex: number;
    script: string;
    currencyvalues?: {
      [key: string]: number | undefined;
    };
    currencynames?: {
      [key: string]: string | undefined;
    };
    satoshis: number;
    height: number;
    isspendable: boolean;
    blocktime?: number;
};

export class GetAddressUtxosResponse extends ApiResponse {
  result: Array<AddressUtxo> | {
    utxos: Array<AddressUtxo>;
    hash: string;
    height: number;
  };
}
