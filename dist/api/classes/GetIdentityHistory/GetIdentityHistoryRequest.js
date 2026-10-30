"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIdentityHistoryRequest = void 0;
const cmds_1 = require("../../../constants/cmds");
const ApiRequest_1 = require("../../ApiRequest");
/** Read original registrations/updates; getidentity(id, 0) returns current state. */
class GetIdentityHistoryRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, nameOrAddress, heightstart, 
    /** Zero uses the tip; -1 also includes mempool entries. */
    heightend, txproofs, txproofheight) {
        super(chain, cmds_1.GET_IDENTITY_HISTORY);
        this.nameOrAddress = nameOrAddress;
        this.heightstart = heightstart;
        this.heightend = heightend;
        this.txproofs = txproofs;
        this.txproofheight = txproofheight;
    }
    getParams() {
        const params = (0, ApiRequest_1.positionalParams)([
            this.nameOrAddress,
            this.heightstart,
            this.heightend,
            this.txproofs,
            this.txproofheight,
        ]);
        // Fill only intermediate omissions with the daemon's defaults. The proxy
        // checks positional types and does not accept null placeholders.
        if (params.length > 1 && params[1] == null)
            params[1] = 0;
        if (params.length > 2 && params[2] == null)
            params[2] = 0;
        if (params.length > 3 && params[3] == null)
            params[3] = false;
        return params;
    }
    // Preserve the existing ApiRequest serialization contract.
    static fromJson(object) {
        return GetIdentityHistoryRequest.fromJSON(object);
    }
    toJson() {
        return this.toJSON();
    }
    static fromJSON(object) {
        return new GetIdentityHistoryRequest(object.chain, object.nameOrAddress, object.heightstart == null ? undefined : object.heightstart, object.heightend == null ? undefined : object.heightend, object.txproofs == null ? undefined : object.txproofs, object.txproofheight == null
            ? undefined
            : object.txproofheight);
    }
    toJSON() {
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
exports.GetIdentityHistoryRequest = GetIdentityHistoryRequest;
