import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
export declare class GetBlockHashRequest extends ApiRequest {
    height: number;
    constructor(chain: string, height: number);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetBlockHashRequest;
    toJson(): ApiPrimitiveJson;
}
