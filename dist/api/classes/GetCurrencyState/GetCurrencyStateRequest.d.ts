import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest } from "../../ApiRequest";
export declare class GetCurrencyStateRequest extends ApiRequest {
    currencynameorid: string;
    /** A height or inclusive "start,end[,step]" range. Omitted/nonpositive numbers use the tip; string "0" selects genesis. */
    height?: number | string;
    conversiondatacurrency?: string;
    constructor(chain: string, currencynameorid: string, 
    /** A height or inclusive "start,end[,step]" range. Omitted/nonpositive numbers use the tip; string "0" selects genesis. */
    height?: number | string, conversiondatacurrency?: string);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): GetCurrencyStateRequest;
    toJson(): ApiPrimitiveJson;
    static fromJSON(object: ApiPrimitiveJson): GetCurrencyStateRequest;
    toJSON(): ApiPrimitiveJson;
}
