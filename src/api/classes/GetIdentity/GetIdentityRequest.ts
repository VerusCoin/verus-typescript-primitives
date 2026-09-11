import { ApiRequest, positionalParams } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_IDENTITY } from "../../../constants/cmds";

export class GetIdentityRequest extends ApiRequest {
  nameOrAddress: string;
  height?: number;
  txproof?: boolean;
  txproofheight?: number;

  constructor(
    chain: string,
    nameOrAddress: string,
    height?: number,
    txproof?: boolean,
    txproofheight?: number
  ) {
    super(chain, GET_IDENTITY);
    this.nameOrAddress = nameOrAddress;
    this.height = height;
    this.txproof = txproof;
    this.txproofheight = txproofheight;
  }

  getParams(): RequestParams {
    const params = [
      this.nameOrAddress,
      this.height,
      this.txproof,
      this.txproofheight,
    ];

    return positionalParams(params);
  }

  static fromJson(object: ApiPrimitiveJson): GetIdentityRequest {
    return new GetIdentityRequest(
      object.chain as string,
      object.nameOrAddress as string,
      object.height != null ? (object.height as number) : undefined,
      object.txproof != null ? (object.txproof as boolean) : undefined,
      object.txproofheight != null
        ? (object.txproofheight as number)
        : undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      nameOrAddress: this.nameOrAddress,
      height: this.height,
      txproof: this.txproof,
      txproofheight: this.txproofheight,
    };
  }
}
