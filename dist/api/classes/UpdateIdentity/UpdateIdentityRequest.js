"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIdentityRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class UpdateIdentityRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, jsonidentity, returntx, tokenupdate, feeoffer, sourceoffunds) {
        super(chain, cmds_1.UPDATE_IDENTITY);
        this.jsonidentity = jsonidentity;
        this.returntx = returntx;
        this.tokenupdate = tokenupdate;
        this.feeoffer = feeoffer;
        this.sourceoffunds = sourceoffunds;
    }
    getParams() {
        const params = [
            this.jsonidentity,
            this.returntx,
            this.tokenupdate,
            this.feeoffer,
            this.sourceoffunds
        ];
        if (this.sourceoffunds)
            return params;
        else
            return params.filter((x) => x != null);
    }
    static fromJson(object) {
        return new UpdateIdentityRequest(object.chain, object.jsonidentity, object.returntx != null ? object.returntx : undefined, object.tokenupdate != null ? object.tokenupdate : undefined, object.feeoffer != null ? object.feeoffer : undefined, object.sourceoffunds != null ? object.sourceoffunds : undefined);
    }
    toJson() {
        return {
            chain: this.chain,
            jsonidentity: this.jsonidentity,
            returntx: this.returntx,
            tokenupdate: this.tokenupdate,
            feeoffer: this.feeoffer,
            sourceoffunds: this.sourceoffunds,
        };
    }
}
exports.UpdateIdentityRequest = UpdateIdentityRequest;
