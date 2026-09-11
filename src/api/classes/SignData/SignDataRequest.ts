import { ApiRequest } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { SIGN_DATA } from "../../../constants/cmds";
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
}

export class SignDataRequest extends ApiRequest {
  data: SignDataArgs;

  constructor(chain: string, signableItems: SignDataArgs) {
    super(chain, SIGN_DATA);
    this.data = signableItems;
  }

  getParams(): RequestParams {
    const params = [this.data];

    return params.filter((x) => x != null);
  }

  static fromJson(object: ApiPrimitiveJson): SignDataRequest {
    return new SignDataRequest(
      object.chain as string,
      object.data as SignDataArgs
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      data: this.data,
    };
  }
}
