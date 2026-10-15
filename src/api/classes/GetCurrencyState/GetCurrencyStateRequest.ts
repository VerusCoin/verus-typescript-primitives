import { GET_CURRENCY_STATE } from "../../../constants/cmds";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest, positionalParams } from "../../ApiRequest";

export class GetCurrencyStateRequest extends ApiRequest {
  constructor(
    chain: string,
    public currencynameorid: string,
    /** A height or an inclusive "start,end[,step]" range; omitted uses the tip. */
    public height?: number | string,
    public conversiondatacurrency?: string
  ) {
    super(chain, GET_CURRENCY_STATE);
  }

  getParams(): RequestParams {
    return positionalParams([
      this.currencynameorid,
      this.height,
      this.conversiondatacurrency,
    ]);
  }

  // Preserve the existing ApiRequest serialization contract.
  static fromJson(object: ApiPrimitiveJson): GetCurrencyStateRequest {
    return GetCurrencyStateRequest.fromJSON(object);
  }

  toJson(): ApiPrimitiveJson {
    return this.toJSON();
  }

  static fromJSON(object: ApiPrimitiveJson): GetCurrencyStateRequest {
    return new GetCurrencyStateRequest(
      object.chain as string,
      object.currencynameorid as string,
      object.height == null ? undefined : (object.height as number | string),
      object.conversiondatacurrency == null
        ? undefined
        : (object.conversiondatacurrency as string)
    );
  }

  toJSON(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      currencynameorid: this.currencynameorid,
      height: this.height,
      conversiondatacurrency: this.conversiondatacurrency,
    };
  }
}
