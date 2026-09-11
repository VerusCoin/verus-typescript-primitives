"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FundRawTransactionRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class FundRawTransactionRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, txhex, utxos, changeaddr, explicitfee) {
        super(chain, cmds_1.FUND_RAW_TRANSACTION);
        this.txhex = txhex;
        this.utxos = utxos;
        this.changeaddr = changeaddr;
        this.explicitfee = explicitfee;
    }
    getParams() {
        if (this.utxos != null && this.changeaddr == null) {
            throw new Error("changeaddr is required when utxos are provided");
        }
        if (this.utxos == null &&
            (this.changeaddr != null || this.explicitfee != null)) {
            throw new Error("utxos are required when changeaddr or explicitfee is provided");
        }
        const params = [this.txhex, this.utxos, this.changeaddr, this.explicitfee];
        return (0, ApiRequest_1.positionalParams)(params);
    }
    static fromJson(object) {
        return new FundRawTransactionRequest(object.chain, object.txhex, object.utxos != null ? object.utxos : undefined, object.changeaddr != null ? object.changeaddr : undefined, object.explicitfee != null ? object.explicitfee : undefined);
    }
    toJson() {
        return {
            chain: this.chain,
            txhex: this.txhex,
            utxos: this.utxos,
            changeaddr: this.changeaddr,
            explicitfee: this.explicitfee,
        };
    }
}
exports.FundRawTransactionRequest = FundRawTransactionRequest;
