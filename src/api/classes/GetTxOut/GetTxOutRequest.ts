import { GET_TX_OUT } from "../../../constants/cmds";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { ApiRequest, positionalParams } from "../../ApiRequest";

export class GetTxOutRequest extends ApiRequest {
  constructor(
    chain: string,
    public txid: string,
    public n: number,
    /** The daemon defaults to true and excludes outputs spent in the mempool. */
    public includemempool?: boolean
  ) {
    super(chain, GET_TX_OUT);
  }

  getParams(): RequestParams {
    return positionalParams([this.txid, this.n, this.includemempool]);
  }

  // Preserve the existing ApiRequest serialization contract.
  static fromJson(object: ApiPrimitiveJson): GetTxOutRequest {
    return GetTxOutRequest.fromJSON(object);
  }

  toJson(): ApiPrimitiveJson {
    return this.toJSON();
  }

  static fromJSON(object: ApiPrimitiveJson): GetTxOutRequest {
    return new GetTxOutRequest(
      object.chain as string,
      object.txid as string,
      object.n as number,
      object.includemempool == null
        ? undefined
        : (object.includemempool as boolean)
    );
  }

  toJSON(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      txid: this.txid,
      n: this.n,
      includemempool: this.includemempool,
    };
  }
}
