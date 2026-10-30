import { IdentityDefinition } from "../../../identity/IdentityDefinition";
import { ApiResponse } from "../../ApiResponse";
export type IdentityHistoryEntry = {
    identity: IdentityDefinition;
    blockhash: string;
    height: number;
    output: {
        txid: string;
        voutnum: number;
    };
    /** Serialized CPartialTransactionProof (ToUniValue emits hexadecimal bytes). */
    proof?: string;
};
export declare class GetIdentityHistoryResponse extends ApiResponse {
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
    toJSON(): {
        fullyqualifiedname: string;
        status: string;
        canspendfor: boolean;
        cansignfor: boolean;
        blockheight: number;
        txid: string;
        vout: number;
        history: IdentityHistoryEntry[];
    };
}
