"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIdentityContentRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class GetIdentityContentRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, nameOrAddress, heightstart, heightend, txproof, txproofheight, vdxfkey) {
        super(chain, cmds_1.GET_IDENTITY_CONTENT);
        this.nameOrAddress = nameOrAddress;
        this.heightstart = heightstart;
        this.heightend = heightend;
        this.txproof = txproof;
        this.txproofheight = txproofheight;
        this.vdxfkey = vdxfkey;
    }
    getParams() {
        const params = [
            this.nameOrAddress,
            this.heightstart,
            this.heightend,
            this.txproof,
            this.txproofheight,
            this.vdxfkey,
        ];
        return (0, ApiRequest_1.positionalParams)(params);
    }
    static fromJson(object) {
        return new GetIdentityContentRequest(object.chain, object.nameOrAddress, object.heightstart != null ? object.heightstart : undefined, object.heightend != null ? object.heightend : undefined, object.txproof != null ? object.txproof : undefined, object.txproofheight != null
            ? object.txproofheight
            : undefined, object.vdxfkey != null ? object.vdxfkey : undefined);
    }
    toJson() {
        return {
            chain: this.chain,
            nameOrAddress: this.nameOrAddress,
            heightstart: this.heightstart,
            heightend: this.heightend,
            txproof: this.txproof,
            txproofheight: this.txproofheight,
            vdxfkey: this.vdxfkey,
        };
    }
}
exports.GetIdentityContentRequest = GetIdentityContentRequest;
