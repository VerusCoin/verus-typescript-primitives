"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyIdentityRegistration = exports.CurrencyOptions = void 0;
exports.currencyAmountToAtomic = currencyAmountToAtomic;
const bn_js_1 = require("bn.js");
const numberConversion_1 = require("../utils/numberConversion");
/** CCurrencyDefinition::ECurrencyOptions in crosschainrpc.h. */
var CurrencyOptions;
(function (CurrencyOptions) {
    CurrencyOptions[CurrencyOptions["FRACTIONAL"] = 1] = "FRACTIONAL";
    CurrencyOptions[CurrencyOptions["ID_ISSUANCE"] = 2] = "ID_ISSUANCE";
    CurrencyOptions[CurrencyOptions["ID_STAKING"] = 4] = "ID_STAKING";
    CurrencyOptions[CurrencyOptions["ID_REFERRALS"] = 8] = "ID_REFERRALS";
    CurrencyOptions[CurrencyOptions["ID_REFERRALREQUIRED"] = 16] = "ID_REFERRALREQUIRED";
    CurrencyOptions[CurrencyOptions["TOKEN"] = 32] = "TOKEN";
    CurrencyOptions[CurrencyOptions["SINGLECURRENCY"] = 64] = "SINGLECURRENCY";
    CurrencyOptions[CurrencyOptions["GATEWAY"] = 128] = "GATEWAY";
    CurrencyOptions[CurrencyOptions["PBAAS"] = 256] = "PBAAS";
    CurrencyOptions[CurrencyOptions["GATEWAY_CONVERTER"] = 512] = "GATEWAY_CONVERTER";
    CurrencyOptions[CurrencyOptions["GATEWAY_NAMECONTROLLER"] = 1024] = "GATEWAY_NAMECONTROLLER";
    CurrencyOptions[CurrencyOptions["NFT_TOKEN"] = 2048] = "NFT_TOKEN";
    CurrencyOptions[CurrencyOptions["NO_IDS"] = 4096] = "NO_IDS";
    CurrencyOptions[CurrencyOptions["FLAG_MASK"] = 8191] = "FLAG_MASK";
})(CurrencyOptions || (exports.CurrencyOptions = CurrencyOptions = {}));
const MAX_AMOUNT = new bn_js_1.BN("9223372036854775807");
const MIN_AMOUNT = new bn_js_1.BN("-9223372036854775808");
const MAX_SAFE_AMOUNT = new bn_js_1.BN(Number.MAX_SAFE_INTEGER);
function atomicAmount(value) {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
        throw new Error("Atomic amount must be a safe integer or a decimal integer string");
    }
    if (typeof value === "string" && !/^-?(0|[1-9]\d*)$/.test(value)) {
        throw new Error("Atomic amount must be a decimal integer");
    }
    if (!bn_js_1.BN.isBN(value) &&
        typeof value !== "number" &&
        typeof value !== "string") {
        throw new Error("Invalid atomic amount");
    }
    const amount = new bn_js_1.BN(value);
    if (amount.lt(MIN_AMOUNT) || amount.gt(MAX_AMOUNT)) {
        throw new Error("Atomic amount exceeds signed 64-bit range");
    }
    return amount.clone();
}
/**
 * Parse RPC coin units exactly, without multiplying a floating-point number.
 * Reject numbers whose adjacent atomic amounts map to the same JS number;
 * callers must use losslessly parsed decimal strings for those amounts.
 * The daemon's ParseFixedPoint amount limit (10^18 - 1 atoms) is preserved.
 */
function currencyAmountToAtomic(value) {
    if (typeof value !== "number" && typeof value !== "string") {
        throw new Error("Currency amount must be a number or decimal string");
    }
    const amount = (0, numberConversion_1.decimalToBn)(value);
    if (typeof value === "number" &&
        (amount.abs().gt(MAX_SAFE_AMOUNT) ||
            Number((0, numberConversion_1.bnToDecimal)(amount.addn(1))) === value ||
            Number((0, numberConversion_1.bnToDecimal)(amount.subn(1))) === value)) {
        throw new Error("Currency amount loses atomic precision; use a decimal string");
    }
    return amount;
}
/**
 * Pure CCurrencyDefinition identity policy/price calculations. This is not a
 * currency validity check or a registration quote: chain eligibility, referral
 * history, fractional conversion, payment branches and native fees are resolved
 * by the caller using the registration context.
 */
class CurrencyIdentityRegistration {
    constructor(data) {
        if (!Number.isInteger(data.options) ||
            data.options < 0 ||
            (data.options & CurrencyOptions.FLAG_MASK) !== data.options) {
            throw new Error("Unsupported currency options");
        }
        if (!Number.isInteger(data.IDReferralLevels) ||
            data.IDReferralLevels < 0 ||
            data.IDReferralLevels > 5) {
            throw new Error("Identity referral levels must be between zero and five");
        }
        this.currencyID = data.currencyID;
        this.options = data.options;
        this.currencies = Object.freeze((data.currencies || []).slice());
        this.registrationFees = atomicAmount(data.IDRegistrationFees);
        if (this.registrationFees.isNeg()) {
            throw new Error("Identity registration fees cannot be negative");
        }
        this.importFees = atomicAmount(data.IDImportFees);
        this.IDReferralLevels = data.IDReferralLevels;
    }
    static fromJSON(data) {
        return new CurrencyIdentityRegistration({
            currencyID: data.currencyid,
            options: data.options,
            currencies: data.currencies,
            IDRegistrationFees: currencyAmountToAtomic(data.idregistrationfees),
            IDReferralLevels: data.idreferrallevels,
            IDImportFees: currencyAmountToAtomic(data.idimportfees),
        });
    }
    isFractional() {
        return !!(this.options & CurrencyOptions.FRACTIONAL);
    }
    isToken() {
        return !!(this.options & CurrencyOptions.TOKEN);
    }
    isNFTToken() {
        return !!(this.options & CurrencyOptions.NFT_TOKEN);
    }
    noIDs() {
        return this.isNFTToken() || !!(this.options & CurrencyOptions.NO_IDS);
    }
    isGateway() {
        return !!(this.options & CurrencyOptions.GATEWAY);
    }
    isPBAASChain() {
        return !!(this.options & CurrencyOptions.PBAAS);
    }
    isGatewayConverter() {
        return !!(this.options & CurrencyOptions.GATEWAY_CONVERTER);
    }
    isNameController() {
        return !!(this.options &
            (CurrencyOptions.PBAAS | CurrencyOptions.GATEWAY_NAMECONTROLLER));
    }
    IDRequiresPermission() {
        return !!(this.options & CurrencyOptions.ID_ISSUANCE);
    }
    IDStaking() {
        return !!(this.options & CurrencyOptions.ID_STAKING);
    }
    IDReferrals() {
        return !!(this.options & CurrencyOptions.ID_REFERRALS);
    }
    IDReferralRequired() {
        return !!(this.options & CurrencyOptions.ID_REFERRALREQUIRED);
    }
    getIDReferralLevels() {
        return this.IDReferrals() || this.IDReferralRequired()
            ? this.IDReferralLevels
            : 0;
    }
    IDFullRegistrationAmount() {
        return this.registrationFees.clone();
    }
    IDReferredRegistrationAmount() {
        return this.IDReferrals()
            ? this.registrationFees
                .muln(this.IDReferralLevels + 1)
                .divn(this.IDReferralLevels + 2)
            : this.IDFullRegistrationAmount();
    }
    IDReferralAmount() {
        return this.IDReferrals()
            ? this.registrationFees.divn(this.IDReferralLevels + 2)
            : new bn_js_1.BN(0);
    }
    IDImportFee() {
        return this.importFees.clone();
    }
    feePricingCurrency() {
        return this.isFractional() &&
            !this.importFees.isNeg() &&
            this.importFees.lt(new bn_js_1.BN(this.currencies.length))
            ? this.currencies[this.importFees.toNumber()]
            : this.currencyID;
    }
}
exports.CurrencyIdentityRegistration = CurrencyIdentityRegistration;
