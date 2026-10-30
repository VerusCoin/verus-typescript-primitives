import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest } from "../../ApiRequest";
/** Read original registrations/updates; getidentity(id, 0) returns current state. */
export declare class GetIdentityHistoryRequest extends ApiRequest {
    nameOrAddress: string;
    heightstart?: number;
    /** Zero uses the tip; -1 also includes mempool entries. */
    heightend?: number;
    txproofs?: boolean;
    txproofheight?: number;
    constructor(chain: string, nameOrAddress: string, heightstart?: number, 
    /** Zero uses the tip; -1 also includes mempool entries. */
    heightend?: number, txproofs?: boolean, txproofheight?: number);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetIdentityHistoryRequest;
    toJson(): ApiPrimitiveJson;
    static fromJSON(object: ApiPrimitiveJson): GetIdentityHistoryRequest;
    toJSON(): ApiPrimitiveJson;
}
