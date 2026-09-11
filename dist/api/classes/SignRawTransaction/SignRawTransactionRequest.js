"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignRawTransactionRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class SignRawTransactionRequest extends ApiRequest_1.ApiRequest {
    // privatekeys is trailing to preserve the established constructor order.
    // getParams emits it in the daemon's third positional slot.
    constructor(chain, hexstring, prevtxs, sighashtype, branchid, privatekeys) {
        super(chain, cmds_1.SIGN_RAW_TRANSACTION);
        this.hexstring = hexstring;
        this.prevtxs = prevtxs;
        this.privatekeys = privatekeys;
        this.sighashtype = sighashtype;
        this.branchid = branchid;
    }
    getParams() {
        const params = [
            this.hexstring,
            this.prevtxs,
            this.privatekeys,
            this.sighashtype,
            this.branchid,
        ];
        return (0, ApiRequest_1.positionalParams)(params);
    }
    static fromJson(object) {
        return new SignRawTransactionRequest(object.chain, object.hexstring, object.prevtxs != null ? object.prevtxs : undefined, object.sighashtype != null
            ? object.sighashtype
            : undefined, object.branchid != null ? object.branchid : undefined, object.privatekeys != null
            ? object.privatekeys
            : undefined);
    }
    toJson() {
        return {
            chain: this.chain,
            hexstring: this.hexstring,
            prevtxs: this.prevtxs,
            privatekeys: this.privatekeys,
            sighashtype: this.sighashtype,
            branchid: this.branchid,
        };
    }
}
exports.SignRawTransactionRequest = SignRawTransactionRequest;
