import { GET_CURRENCY_STATE } from "../../../constants/cmds";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest, positionalParams } from "../../ApiRequest";

export class GetCurrencyStateRequest extends ApiRequest {
  constructor(
    chain: string,
    public currencynameorid: string,
    /** A height or inclusive "start,end[,step]" range. Omitted/nonpositive numbers use the tip; string "0" selects genesis. */
    public height?: number | string,
    public conversiondatacurrency?: string
  ) {
    super(chain, GET_CURRENCY_STATE);
  }

  getParams(): RequestParams {
    let height = this.height;
    if (typeof height === "number") {
      if (!Number.isSafeInteger(height)) {
        throw new Error("Currency state height must be a safe integer or a range string");
      }
      // The proxy requires strings. C++ treats nonpositive numeric heights as
      // the tip, but the string "0" selects genesis. Split("") retains the tip.
      height = height > 0 ? String(height) : "";
    }
    if (height == null && this.conversiondatacurrency != null) {
      height = "";
    }
    return positionalParams([
      this.currencynameorid,
      height,
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
