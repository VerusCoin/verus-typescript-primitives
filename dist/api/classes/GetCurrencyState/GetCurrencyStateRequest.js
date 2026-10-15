"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrencyStateRequest = void 0;
const cmds_1 = require("../../../constants/cmds");
const ApiRequest_1 = require("../../ApiRequest");
class GetCurrencyStateRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, currencynameorid, 
    /** A height or an inclusive "start,end[,step]" range; omitted uses the tip. */
    height, conversiondatacurrency) {
        super(chain, cmds_1.GET_CURRENCY_STATE);
        this.currencynameorid = currencynameorid;
        this.height = height;
        this.conversiondatacurrency = conversiondatacurrency;
    }
    getParams() {
        return (0, ApiRequest_1.positionalParams)([
            this.currencynameorid,
            this.height,
            this.conversiondatacurrency,
        ]);
    }
    // Preserve the existing ApiRequest serialization contract.
    static fromJson(object) {
        return GetCurrencyStateRequest.fromJSON(object);
    }
    toJson() {
        return this.toJSON();
    }
    static fromJSON(object) {
        return new GetCurrencyStateRequest(object.chain, object.currencynameorid, object.height == null ? undefined : object.height, object.conversiondatacurrency == null
            ? undefined
            : object.conversiondatacurrency);
    }
    toJSON() {
        return {
            chain: this.chain,
            currencynameorid: this.currencynameorid,
            height: this.height,
            conversiondatacurrency: this.conversiondatacurrency,
        };
    }
}
exports.GetCurrencyStateRequest = GetCurrencyStateRequest;
