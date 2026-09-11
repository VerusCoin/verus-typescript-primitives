"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIdentityRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class GetIdentityRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, nameOrAddress, height, txproof, txproofheight) {
        super(chain, cmds_1.GET_IDENTITY);
        this.nameOrAddress = nameOrAddress;
        this.height = height;
        this.txproof = txproof;
        this.txproofheight = txproofheight;
    }
    getParams() {
        const params = [
            this.nameOrAddress,
            this.height,
            this.txproof,
            this.txproofheight,
        ];
        return (0, ApiRequest_1.positionalParams)(params);
    }
    static fromJson(object) {
        return new GetIdentityRequest(object.chain, object.nameOrAddress, object.height != null ? object.height : undefined, object.txproof != null ? object.txproof : undefined, object.txproofheight != null
            ? object.txproofheight
            : undefined);
    }
    toJson() {
        return {
            chain: this.chain,
            nameOrAddress: this.nameOrAddress,
            height: this.height,
            txproof: this.txproof,
            txproofheight: this.txproofheight,
        };
    }
}
exports.GetIdentityRequest = GetIdentityRequest;
