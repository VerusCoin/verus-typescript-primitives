"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIdentitiesWithAddressRequest = void 0;
const ApiRequest_1 = require("../../ApiRequest");
const cmds_1 = require("../../../constants/cmds");
class GetIdentitiesWithAddressRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, query) {
        super(chain, cmds_1.GET_IDENTITIES_WITH_ADDRESS);
        this.query = query;
    }
    getParams() {
        return [
            this.query,
        ];
    }
    static fromJson(object) {
        return new GetIdentitiesWithAddressRequest(object.chain, object.query);
    }
    toJson() {
        return {
            chain: this.chain,
            query: this.query,
        };
    }
}
exports.GetIdentitiesWithAddressRequest = GetIdentitiesWithAddressRequest;
