import { ApiPrimitive } from "../../ApiPrimitive";
import { ApiResponse } from "../../ApiResponse";

export type UnspentTransactionOutput = {
  bestblock: string;
  confirmations: number;
  value: number;
  interest?: number;
  scriptPubKey: {
    /** Smart scripts add eval-specific JSON properties. Verify their hex bytes. */
    [key: string]: ApiPrimitive | undefined;
    asm: string;
    hex: string;
    type: string;
    reqSigs?: number;
    addresses?: string[];
  };
  version: number;
  coinbase: boolean;
};

export class GetTxOutResponse extends ApiResponse {
  result: UnspentTransactionOutput | null;
  toJSON() {
    return this.result;
  }
}
