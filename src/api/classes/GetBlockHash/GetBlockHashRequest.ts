import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_BLOCK_HASH } from "../../../constants/cmds";

export class GetBlockHashRequest extends ApiRequest {
  height: number;

  constructor(chain: string, height: number) {
    super(chain, GET_BLOCK_HASH);
    this.height = height;
  }

  getParams(): RequestParams {
    return [this.height];
  }

  static fromJson(object: ApiPrimitiveJson): GetBlockHashRequest {
    return new GetBlockHashRequest(
      object.chain as string,
      object.height as number
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      height: this.height,
    };
  }
}
