"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockHashRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class GetBlockHashRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, height) {
        super(chain, cmds_1.GET_BLOCK_HASH);
        this.height = height;
    }
    getParams() {
        return [this.height];
    }
    static fromJson(object) {
        return new GetBlockHashRequest(object.chain, object.height);
    }
    toJson() {
        return {
            chain: this.chain,
            height: this.height,
        };
    }
}
exports.GetBlockHashRequest = GetBlockHashRequest;
