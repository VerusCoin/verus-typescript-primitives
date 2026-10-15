"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetCurrencyStateRequest = void 0;
const cmds_1 = require("../../../constants/cmds");
const ApiRequest_1 = require("../../ApiRequest");
class GetCurrencyStateRequest extends ApiRequest_1.ApiRequest {
    constructor(chain, currencynameorid, 
    /** A height or inclusive "start,end[,step]" range. Omitted/nonpositive numbers use the tip; string "0" selects genesis. */
    height, conversiondatacurrency) {
        super(chain, cmds_1.GET_CURRENCY_STATE);
        this.currencynameorid = currencynameorid;
        this.height = height;
        this.conversiondatacurrency = conversiondatacurrency;
    }
    getParams() {
        let height = this.height;
        if (typeof height === "number") {
            if (!Number.isSafeInteger(height)) {
                throw new Error("Currency state height must be a safe integer or a range string");
            }
            // The proxy requires strings. C++ treats nonpositive numeric heights as
            // the tip, but the string "0" selects genesis. Split("") retains the tip.
            height = height > 0 ? String(height) : "";
        }
        if (height == null && this.conversiondatacurrency != null) {
            height = "";
        }
        return (0, ApiRequest_1.positionalParams)([
            this.currencynameorid,
            height,
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
