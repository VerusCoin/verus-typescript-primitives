"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignDataRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class SignDataRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, signableItems) {
        super(chain, cmds_1.SIGN_DATA);
        this.data = signableItems;
    }
    getParams() {
        const params = [this.data];
        return params.filter((x) => x != null);
    }
    static fromJson(object) {
        return new SignDataRequest(object.chain, object.data);
    }
    toJson() {
        return {
            chain: this.chain,
            data: this.data,
        };
    }
}
exports.SignDataRequest = SignDataRequest;
