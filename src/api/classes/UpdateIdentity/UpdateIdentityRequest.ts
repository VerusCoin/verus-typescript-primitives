import { ApiRequest, positionalParams } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { UPDATE_IDENTITY } from "../../../constants/cmds";
import { VerusCLIVerusIDJsonWithData } from "../../../vdxf/classes";

export class UpdateIdentityRequest extends ApiRequest {
  jsonidentity: VerusCLIVerusIDJsonWithData;
  returntx?: boolean;
  tokenupdate?: boolean;
  feeoffer?: number;
  sourceoffunds?: string;

  constructor(
    chain: string,
    jsonidentity: VerusCLIVerusIDJsonWithData,
    returntx?: boolean,
    tokenupdate?: boolean,
    feeoffer?: number,
    sourceoffunds?: string
  ) {
    super(chain, UPDATE_IDENTITY);
    this.jsonidentity = jsonidentity;
    this.returntx = returntx;
    this.tokenupdate = tokenupdate;
    this.feeoffer = feeoffer;
    this.sourceoffunds = sourceoffunds;
  }

  getParams(): RequestParams {
    // The daemon parses a present fee slot as an amount and rejects null.
    const feeoffer =
      this.sourceoffunds != null && this.feeoffer == null ? 0 : this.feeoffer;
    const params = [
      this.jsonidentity,
      this.returntx,
      this.tokenupdate,
      feeoffer,
      this.sourceoffunds,
    ];

    return positionalParams(params);
  }

  static fromJson(object: ApiPrimitiveJson): UpdateIdentityRequest {
    return new UpdateIdentityRequest(
      object.chain as string,
      object.jsonidentity as VerusCLIVerusIDJsonWithData,
      object.returntx != null ? (object.returntx as boolean) : undefined,
      object.tokenupdate != null ? (object.tokenupdate as boolean) : undefined,
      object.feeoffer != null ? (object.feeoffer as number) : undefined,
      object.sourceoffunds != null
        ? (object.sourceoffunds as string)
        : undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      jsonidentity: this.jsonidentity,
      returntx: this.returntx,
      tokenupdate: this.tokenupdate,
      feeoffer: this.feeoffer,
      sourceoffunds: this.sourceoffunds,
    };
  }
}
