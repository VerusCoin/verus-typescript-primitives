import { ApiRequest } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
type PrevTx = {
    txid: string;
    vout: number;
    scriptPubKey: string;
    redeemScript: string;
    amount: number;
};
type SigHashType = "ALL" | "NONE" | "SINGLE" | "ALL|ANYONECANPAY" | "NONE|ANYONECANPAY" | "SINGLE|ANYONECANPAY";
export declare class SignRawTransactionRequest extends ApiRequest {
    hexstring: string;
    prevtxs?: Array<PrevTx>;
    privatekeys?: Array<string>;
    sighashtype?: SigHashType;
    branchid?: string;
    constructor(chain: string, hexstring: string, prevtxs?: Array<PrevTx>, sighashtype?: SigHashType, branchid?: string, privatekeys?: Array<string>);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): SignRawTransactionRequest;
    toJson(): ApiPrimitiveJson;
}
export {};
