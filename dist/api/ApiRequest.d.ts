import { ApiCommunication } from "./ApiCommunication";
import { ApiPrimitive, ApiPrimitiveJson, RequestParams } from "./ApiPrimitive";
export declare function positionalParams(params: Array<ApiPrimitive | undefined>): RequestParams;
export declare abstract class ApiRequest implements ApiCommunication {
    chain: string;
    cmd: string;
    abstract getParams(): RequestParams;
    abstract toJson(): ApiPrimitiveJson;
    constructor(chain: string, cmd: string);
    prepare(): [string, string, RequestParams];
}
