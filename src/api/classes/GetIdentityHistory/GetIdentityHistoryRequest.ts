import { GET_IDENTITY_HISTORY } from "../../../constants/cmds";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest, positionalParams } from "../../ApiRequest";

/** Read original registrations/updates; getidentity(id, 0) returns current state. */
export class GetIdentityHistoryRequest extends ApiRequest {
  constructor(
    chain: string,
    public nameOrAddress: string,
    public heightstart?: number,
    /** Zero uses the tip; -1 also includes mempool entries. */
    public heightend?: number,
    public txproofs?: boolean,
    public txproofheight?: number
  ) {
    super(chain, GET_IDENTITY_HISTORY);
  }

  getParams(): RequestParams {
    const params = positionalParams([
      this.nameOrAddress,
      this.heightstart,
      this.heightend,
      this.txproofs,
      this.txproofheight,
    ]);

    // Fill only intermediate omissions with the daemon's defaults. The proxy
    // checks positional types and does not accept null placeholders.
    if (params.length > 1 && params[1] == null) params[1] = 0;
    if (params.length > 2 && params[2] == null) params[2] = 0;
    if (params.length > 3 && params[3] == null) params[3] = false;

    return params;
  }

  // Preserve the existing ApiRequest serialization contract.
  static fromJson(object: ApiPrimitiveJson): GetIdentityHistoryRequest {
    return GetIdentityHistoryRequest.fromJSON(object);
  }

  toJson(): ApiPrimitiveJson {
    return this.toJSON();
  }

  static fromJSON(object: ApiPrimitiveJson): GetIdentityHistoryRequest {
    return new GetIdentityHistoryRequest(
      object.chain as string,
      object.nameOrAddress as string,
      object.heightstart == null ? undefined : (object.heightstart as number),
      object.heightend == null ? undefined : (object.heightend as number),
      object.txproofs == null ? undefined : (object.txproofs as boolean),
      object.txproofheight == null
        ? undefined
        : (object.txproofheight as number)
    );
  }

  toJSON(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      nameOrAddress: this.nameOrAddress,
      heightstart: this.heightstart,
      heightend: this.heightend,
      txproofs: this.txproofs,
      txproofheight: this.txproofheight,
    };
  }
}
