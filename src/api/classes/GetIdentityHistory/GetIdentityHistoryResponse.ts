import { IdentityDefinition } from "../../../identity/IdentityDefinition";
import { ApiResponse } from "../../ApiResponse";

export type IdentityHistoryEntry = {
  identity: IdentityDefinition;
  blockhash: string;
  height: number;
  output: { txid: string; voutnum: number };
  /** Serialized CPartialTransactionProof (ToUniValue emits hexadecimal bytes). */
  proof?: string;
};

export class GetIdentityHistoryResponse extends ApiResponse {
  result: {
    fullyqualifiedname: string;
    status: string;
    canspendfor: boolean;
    cansignfor: boolean;
    blockheight: number;
    txid: string;
    vout: number;
    history: IdentityHistoryEntry[];
  };
  toJSON() {
    return this.result;
  }
}
