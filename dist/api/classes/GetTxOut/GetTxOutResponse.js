"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTxOutResponse = void 0;
const ApiResponse_1 = require("../../ApiResponse");
class GetTxOutResponse extends ApiResponse_1.ApiResponse {
    toJSON() {
        return this.result;
    }
}
exports.GetTxOutResponse = GetTxOutResponse;
