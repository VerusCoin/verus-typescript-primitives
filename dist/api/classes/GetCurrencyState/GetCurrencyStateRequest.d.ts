import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest } from "../../ApiRequest";
export declare class GetCurrencyStateRequest extends ApiRequest {
    currencynameorid: string;
    /** A height or an inclusive "start,end[,step]" range; omitted uses the tip. */
    height?: number | string;
    conversiondatacurrency?: string;
    constructor(chain: string, currencynameorid: string, 
    /** A height or an inclusive "start,end[,step]" range; omitted uses the tip. */
    height?: number | string, conversiondatacurrency?: string);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetCurrencyStateRequest;
    toJson(): ApiPrimitiveJson;
    static fromJSON(object: ApiPrimitiveJson): GetCurrencyStateRequest;
    toJSON(): ApiPrimitiveJson;
}
