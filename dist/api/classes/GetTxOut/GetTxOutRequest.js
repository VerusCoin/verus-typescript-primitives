"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTxOutRequest = void 0;
const cmds_1 = require("../../../constants/cmds");
const ApiRequest_1 = require("../../ApiRequest");
class GetTxOutRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, txid, n, 
    /** The daemon defaults to true and excludes outputs spent in the mempool. */
    includemempool) {
        super(chain, cmds_1.GET_TX_OUT);
        this.txid = txid;
        this.n = n;
        this.includemempool = includemempool;
    }
    getParams() {
        return (0, ApiRequest_1.positionalParams)([this.txid, this.n, this.includemempool]);
    }
    // Preserve the existing ApiRequest serialization contract.
    static fromJson(object) {
        return GetTxOutRequest.fromJSON(object);
    }
    toJson() {
        return this.toJSON();
    }
    static fromJSON(object) {
        return new GetTxOutRequest(object.chain, object.txid, object.n, object.includemempool == null
            ? undefined
            : object.includemempool);
    }
    toJSON() {
        return {
            chain: this.chain,
            txid: this.txid,
            n: this.n,
            includemempool: this.includemempool,
        };
    }
}
exports.GetTxOutRequest = GetTxOutRequest;
