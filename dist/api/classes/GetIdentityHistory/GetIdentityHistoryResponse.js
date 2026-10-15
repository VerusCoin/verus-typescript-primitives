"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetIdentityHistoryResponse = void 0;
const ApiResponse_1 = require("../../ApiResponse");
class GetIdentityHistoryResponse extends ApiResponse_1.ApiResponse {
    toJSON() {
        return this.result;
    }
}
exports.GetIdentityHistoryResponse = GetIdentityHistoryResponse;
