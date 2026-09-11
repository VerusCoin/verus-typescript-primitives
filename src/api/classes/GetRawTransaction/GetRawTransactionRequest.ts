import { ApiRequest } from "../../ApiRequest";
import { RequestParams, ApiPrimitiveJson } from "../../ApiPrimitive";
import { GET_RAW_TRANSACTION } from "../../../constants/cmds";

export class GetRawTransactionRequest extends ApiRequest {
  txid: string;
  verbose?: number;

  constructor(chain: string, txid: string, verbose?: number) {
    super(chain, GET_RAW_TRANSACTION);
    this.txid = txid;
    this.verbose = verbose;
  }

  getParams(): RequestParams {
    const params = [this.txid, this.verbose];

    return params.filter((x) => x != null);
  }

  static fromJson(object: ApiPrimitiveJson): GetRawTransactionRequest {
    return new GetRawTransactionRequest(
      object.chain as string,
      object.txid as string,
      (object.verbosity ?? object.verbose ?? undefined) as number | undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      txid: this.txid,
      verbosity: this.verbose,
    };
  }
}
