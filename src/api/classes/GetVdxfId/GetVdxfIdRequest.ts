import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_VDXF_ID } from "../../../constants/cmds";

type InitialVdxfData = {
  vdxfkey?: string,
  uint256?: string,
  indexnum?: string | number
}

export class GetVdxfIdRequest extends ApiRequest {
  vdxfuri: string;
  initialdata?: InitialVdxfData

  constructor(chain: string, vdxfuri: string, initialdata?: InitialVdxfData) {
    super(chain, GET_VDXF_ID);
    this.vdxfuri = vdxfuri;
    this.initialdata = initialdata;
  }

  getParams(): RequestParams {
    const params = [
      this.vdxfuri,
      this.initialdata,
    ];

    return params.filter((x) => x != null);
  }

  static fromJson(object: ApiPrimitiveJson): GetVdxfIdRequest {
    return new GetVdxfIdRequest(
      object.chain as string,
      object.vdxfuri as string,
      object.initialdata != null ? (object.initialdata as InitialVdxfData) : undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      vdxfuri: this.vdxfuri,
      initialdata: this.initialdata
    };
  }
}
