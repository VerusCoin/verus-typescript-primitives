import { ApiRequest } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { SignDataMMRDataParameters, SignDataParameters } from "../../../utils/types/SignData";
export type SignDataArgs = SignDataParameters & {
    address?: string;
    mmrdata?: Array<SignDataMMRDataParameters>;
    mmrsalt?: Array<string>;
    mmrhashtype?: string;
    priormmr?: Array<string>;
    vdxfkeys?: Array<string>;
    vdxfkeynames?: Array<string>;
    boundhashes?: Array<string>;
    hashtype?: string;
    signature?: string;
    encrypttoaddress?: string;
    createmmr?: boolean;
};
export declare class SignDataRequest extends ApiRequest {
    data: SignDataArgs;
    constructor(chain: string, signableItems: SignDataArgs);
    getParams(): RequestParams;
    static fromJson(object: ApiPrimitiveJson): SignDataRequest;
    toJson(): ApiPrimitiveJson;
}
