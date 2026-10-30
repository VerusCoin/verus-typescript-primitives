"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrencyStateResponse = void 0;
const ApiResponse_1 = require("../../ApiResponse");
class GetCurrencyStateResponse extends ApiResponse_1.ApiResponse {
    toJSON() {
        return this.result;
    }
}
exports.GetCurrencyStateResponse = GetCurrencyStateResponse;
