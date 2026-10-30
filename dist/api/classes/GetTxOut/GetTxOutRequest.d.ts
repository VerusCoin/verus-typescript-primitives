import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest } from "../../ApiRequest";
export declare class GetTxOutRequest extends ApiRequest {
    txid: string;
    n: number;
    /** The daemon defaults to true and excludes outputs spent in the mempool. */
    includemempool?: boolean;
    constructor(chain: string, txid: string, n: number, 
    /** The daemon defaults to true and excludes outputs spent in the mempool. */
    includemempool?: boolean);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetTxOutRequest;
    toJson(): ApiPrimitiveJson;
    static fromJSON(object: ApiPrimitiveJson): GetTxOutRequest;
    toJSON(): ApiPrimitiveJson;
}
