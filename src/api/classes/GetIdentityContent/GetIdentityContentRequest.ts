import { ApiRequest, positionalParams } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_IDENTITY_CONTENT } from "../../../constants/cmds";

export class GetIdentityContentRequest extends ApiRequest {
  nameOrAddress: string;
  heightstart?: number;
  heightend?: number;
  txproof?: boolean;
  txproofheight?: number;
  vdxfkey?: string;

  constructor(
    chain: string,
    nameOrAddress: string,
    heightstart?: number,
    heightend?: number,
    txproof?: boolean,
    txproofheight?: number,
    vdxfkey?: string
  ) {
    super(chain, GET_IDENTITY_CONTENT);
    this.nameOrAddress = nameOrAddress;
    this.heightstart = heightstart;
    this.heightend = heightend;
    this.txproof = txproof;
    this.txproofheight = txproofheight;
    this.vdxfkey = vdxfkey;
  }

  getParams(): RequestParams {
    const params = [
      this.nameOrAddress,
      this.heightstart,
      this.heightend,
      this.txproof,
      this.txproofheight,
      this.vdxfkey,
    ];

    return positionalParams(params);
  }

  static fromJson(object: ApiPrimitiveJson): GetIdentityContentRequest {
    return new GetIdentityContentRequest(
      object.chain as string,
      object.nameOrAddress as string,
      object.heightstart != null ? (object.heightstart as number) : undefined,
      object.heightend != null ? (object.heightend as number) : undefined,
      object.txproof != null ? (object.txproof as boolean) : undefined,
      object.txproofheight != null
        ? (object.txproofheight as number)
        : undefined,
      object.vdxfkey != null ? (object.vdxfkey as string) : undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      nameOrAddress: this.nameOrAddress,
      heightstart: this.heightstart,
      heightend: this.heightend,
      txproof: this.txproof,
      txproofheight: this.txproofheight,
      vdxfkey: this.vdxfkey,
    };
  }
}
