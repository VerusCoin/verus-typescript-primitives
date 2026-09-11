import { ApiRequest, positionalParams } from "../../ApiRequest";
import { ApiPrimitiveJson, RequestParams } from "../../ApiPrimitive";
import { FUND_RAW_TRANSACTION } from "../../../constants/cmds";

type Utxo = {
  voutnum: number;
  txid: string;
};

export class FundRawTransactionRequest extends ApiRequest {
  txhex: string;
  utxos?: Array<Utxo>;
  changeaddr?: string;
  explicitfee?: number;

  constructor(
    chain: string,
    txhex: string,
    utxos?: Array<Utxo>,
    changeaddr?: string,
    explicitfee?: number
  ) {
    super(chain, FUND_RAW_TRANSACTION);
    this.txhex = txhex;
    this.utxos = utxos;
    this.changeaddr = changeaddr;
    this.explicitfee = explicitfee;
  }

  getParams(): RequestParams {
    if (this.utxos != null && this.changeaddr == null) {
      throw new Error("changeaddr is required when utxos are provided");
    }
    if (
      this.utxos == null &&
      (this.changeaddr != null || this.explicitfee != null)
    ) {
      throw new Error(
        "utxos are required when changeaddr or explicitfee is provided"
      );
    }

    const params = [this.txhex, this.utxos, this.changeaddr, this.explicitfee];

    return positionalParams(params);
  }

  static fromJson(object: ApiPrimitiveJson): FundRawTransactionRequest {
    return new FundRawTransactionRequest(
      object.chain as string,
      object.txhex as string,
      object.utxos != null ? (object.utxos as Array<Utxo>) : undefined,
      object.changeaddr != null ? (object.changeaddr as string) : undefined,
      object.explicitfee != null ? (object.explicitfee as number) : undefined
    );
  }

  toJson(): ApiPrimitiveJson {
    return {
      chain: this.chain,
      txhex: this.txhex,
      utxos: this.utxos,
      changeaddr: this.changeaddr,
      explicitfee: this.explicitfee,
    };
  }
}
