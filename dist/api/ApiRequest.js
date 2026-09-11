"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRequest = void 0;
exports.positionalParams = positionalParams;
function positionalParams(params) {
    let length = params.length;
    while (length > 0 && params[length - 1] == null) {
        length--;
    }
    return params.slice(0, length).map((param) => (param == null ? null : param));
}
class ApiRequest {
    constructor(chain, cmd) {
        this.chain = chain;
        this.cmd = cmd;
    }
    prepare() {
        return [this.chain, this.cmd, this.getParams()];
    }
}
exports.ApiRequest = ApiRequest;
