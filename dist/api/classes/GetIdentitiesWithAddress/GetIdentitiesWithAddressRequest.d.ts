import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
interface GetIdentitiesWithAddressQuery {
    address: string;
    fromheight?: number;
    toheight?: number;
    unspent?: boolean;
}
export declare class GetIdentitiesWithAddressRequest extends ApiRequest {
    query: GetIdentitiesWithAddressQuery;
    constructor(chain: string, query: GetIdentitiesWithAddressQuery);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetIdentitiesWithAddressRequest;
    toJson(): ApiPrimitiveJson;
}
export {};
