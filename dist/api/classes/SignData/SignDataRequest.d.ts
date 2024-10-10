import { ApiRequest } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { DataDescriptorInfo } from "../../../utils/types/DataDescriptor";
import { SignDataParameters } from "../../../utils/types/SignData";
export declare type SignDataArgs = {
    address?: string;
    filename?: string;
    message?: string;
    messagehex?: string;
    messsagebase64?: string;
    datahash?: string;
    vdxfdata?: string;
    mmrdata?: Array<DataDescriptorInfo | SignDataParameters>;
    mmrsalt?: Array<string>;
    mmrhashtype?: string;
    priormmr?: Array<string>;
    vdxfkeys?: Array<string>;
    vdxfkeynames?: Array<string>;
    boundhahses?: Array<string>;
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
