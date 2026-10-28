import { BigNumber } from "../utils/types/BigNumber";
/** CCurrencyDefinition::ECurrencyOptions in crosschainrpc.h. */
export declare enum CurrencyOptions {
    FRACTIONAL = 1,
    ID_ISSUANCE = 2,
    ID_STAKING = 4,
    ID_REFERRALS = 8,
    ID_REFERRALREQUIRED = 16,
    TOKEN = 32,
    SINGLECURRENCY = 64,
    GATEWAY = 128,
    PBAAS = 256,
    GATEWAY_CONVERTER = 512,
    GATEWAY_NAMECONTROLLER = 1024,
    NFT_TOKEN = 2048,
    NO_IDS = 4096,
    FLAG_MASK = 8191
}
export type AtomicCurrencyAmount = BigNumber | string | number;
export type CurrencyIdentityRegistrationInit = {
    currencyID: string;
    options: number;
    currencies?: string[];
    /** Atomic units. Use fromJSON for the RPC coin-denominated fields. */
    IDRegistrationFees: AtomicCurrencyAmount;
    IDReferralLevels: number;
    /** Atomic units; fractional definitions overload this as a reserve index. */
    IDImportFees: AtomicCurrencyAmount;
};
/** Strings allow callers with a lossless JSON transport to preserve amounts. */
export type CurrencyIdentityRegistrationJSON = {
    currencyid: string;
    options: number;
    currencies?: string[];
    idregistrationfees: number | string;
    idreferrallevels: number;
    idimportfees: number | string;
};
/**
 * Parse RPC coin units exactly, without multiplying a floating-point number.
 * Reject numbers whose adjacent atomic amounts map to the same JS number;
 * callers must use losslessly parsed decimal strings for those amounts.
 * The daemon's ParseFixedPoint amount limit (10^18 - 1 atoms) is preserved.
 */
export declare function currencyAmountToAtomic(value: number | string): BigNumber;
/**
 * Pure CCurrencyDefinition identity policy/price calculations. This is not a
 * currency validity check or a registration quote: chain eligibility, referral
 * history, fractional conversion, payment branches and native fees are resolved
 * by the caller using the registration context.
 */
export declare class CurrencyIdentityRegistration {
    readonly currencyID: string;
    readonly options: number;
    readonly currencies: ReadonlyArray<string>;
    private readonly registrationFees;
    private readonly importFees;
    readonly IDReferralLevels: number;
    constructor(data: CurrencyIdentityRegistrationInit);
    static fromJSON(data: CurrencyIdentityRegistrationJSON): CurrencyIdentityRegistration;
    isFractional(): boolean;
    isToken(): boolean;
    isNFTToken(): boolean;
    noIDs(): boolean;
    isGateway(): boolean;
    isPBAASChain(): boolean;
    isGatewayConverter(): boolean;
    isNameController(): boolean;
    IDRequiresPermission(): boolean;
    IDStaking(): boolean;
    IDReferrals(): boolean;
    IDReferralRequired(): boolean;
    getIDReferralLevels(): number;
    IDFullRegistrationAmount(): BigNumber;
    IDReferredRegistrationAmount(): BigNumber;
    IDReferralAmount(): BigNumber;
    IDImportFee(): BigNumber;
    feePricingCurrency(): string;
}
