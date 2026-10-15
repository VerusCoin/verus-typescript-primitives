import { BN } from "bn.js";
import { BigNumber } from "../utils/types/BigNumber";
import { bnToDecimal, decimalToBn } from "../utils/numberConversion";

/** CCurrencyDefinition::ECurrencyOptions in crosschainrpc.h. */
export enum CurrencyOptions {
  FRACTIONAL = 0x1,
  ID_ISSUANCE = 0x2,
  ID_STAKING = 0x4,
  ID_REFERRALS = 0x8,
  ID_REFERRALREQUIRED = 0x10,
  TOKEN = 0x20,
  SINGLECURRENCY = 0x40,
  GATEWAY = 0x80,
  PBAAS = 0x100,
  GATEWAY_CONVERTER = 0x200,
  GATEWAY_NAMECONTROLLER = 0x400,
  NFT_TOKEN = 0x800,
  NO_IDS = 0x1000,
  FLAG_MASK = 0x1fff,
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

const MAX_AMOUNT = new BN("9223372036854775807");
const MIN_AMOUNT = new BN("-9223372036854775808");
const MAX_SAFE_AMOUNT = new BN(Number.MAX_SAFE_INTEGER);

function atomicAmount(value: AtomicCurrencyAmount): BigNumber {
  if (typeof value === "number" && !Number.isSafeInteger(value)) {
    throw new Error(
      "Atomic amount must be a safe integer or a decimal integer string"
    );
  }
  if (typeof value === "string" && !/^-?(0|[1-9]\d*)$/.test(value)) {
    throw new Error("Atomic amount must be a decimal integer");
  }
  if (
    !BN.isBN(value) &&
    typeof value !== "number" &&
    typeof value !== "string"
  ) {
    throw new Error("Invalid atomic amount");
  }
  const amount = new BN(value);
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
export function currencyAmountToAtomic(value: number | string): BigNumber {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new Error("Currency amount must be a number or decimal string");
  }
  const amount = decimalToBn(value);
  if (
    typeof value === "number" &&
    (amount.abs().gt(MAX_SAFE_AMOUNT) ||
      Number(bnToDecimal(amount.addn(1))) === value ||
      Number(bnToDecimal(amount.subn(1))) === value)
  ) {
    throw new Error(
      "Currency amount loses atomic precision; use a decimal string"
    );
  }
  return amount;
}

/**
 * Pure CCurrencyDefinition identity policy/price calculations. This is not a
 * currency validity check or a registration quote: chain eligibility, referral
 * history, fractional conversion, payment branches and native fees are resolved
 * by the caller using the registration context.
 */
export class CurrencyIdentityRegistration {
  readonly currencyID: string;
  readonly options: number;
  readonly currencies: ReadonlyArray<string>;
  private readonly registrationFees: BigNumber;
  private readonly importFees: BigNumber;
  readonly IDReferralLevels: number;

  constructor(data: CurrencyIdentityRegistrationInit) {
    if (
      !Number.isInteger(data.options) ||
      data.options < 0 ||
      (data.options & CurrencyOptions.FLAG_MASK) !== data.options
    ) {
      throw new Error("Unsupported currency options");
    }
    if (
      !Number.isInteger(data.IDReferralLevels) ||
      data.IDReferralLevels < 0 ||
      data.IDReferralLevels > 5
    ) {
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

  static fromJSON(
    data: CurrencyIdentityRegistrationJSON
  ): CurrencyIdentityRegistration {
    return new CurrencyIdentityRegistration({
      currencyID: data.currencyid,
      options: data.options,
      currencies: data.currencies,
      IDRegistrationFees: currencyAmountToAtomic(data.idregistrationfees),
      IDReferralLevels: data.idreferrallevels,
      IDImportFees: currencyAmountToAtomic(data.idimportfees),
    });
  }

  isFractional(): boolean {
    return !!(this.options & CurrencyOptions.FRACTIONAL);
  }
  isToken(): boolean {
    return !!(this.options & CurrencyOptions.TOKEN);
  }
  isNFTToken(): boolean {
    return !!(this.options & CurrencyOptions.NFT_TOKEN);
  }
  noIDs(): boolean {
    return this.isNFTToken() || !!(this.options & CurrencyOptions.NO_IDS);
  }
  isGateway(): boolean {
    return !!(this.options & CurrencyOptions.GATEWAY);
  }
  isPBAASChain(): boolean {
    return !!(this.options & CurrencyOptions.PBAAS);
  }
  isGatewayConverter(): boolean {
    return !!(this.options & CurrencyOptions.GATEWAY_CONVERTER);
  }
  isNameController(): boolean {
    return !!(
      this.options &
      (CurrencyOptions.PBAAS | CurrencyOptions.GATEWAY_NAMECONTROLLER)
    );
  }
  IDRequiresPermission(): boolean {
    return !!(this.options & CurrencyOptions.ID_ISSUANCE);
  }
  IDStaking(): boolean {
    return !!(this.options & CurrencyOptions.ID_STAKING);
  }
  IDReferrals(): boolean {
    return !!(this.options & CurrencyOptions.ID_REFERRALS);
  }
  IDReferralRequired(): boolean {
    return !!(this.options & CurrencyOptions.ID_REFERRALREQUIRED);
  }
  getIDReferralLevels(): number {
    return this.IDReferrals() || this.IDReferralRequired()
      ? this.IDReferralLevels
      : 0;
  }
  IDFullRegistrationAmount(): BigNumber {
    return this.registrationFees.clone();
  }
  IDReferredRegistrationAmount(): BigNumber {
    return this.IDReferrals()
      ? this.registrationFees
          .muln(this.IDReferralLevels + 1)
          .divn(this.IDReferralLevels + 2)
      : this.IDFullRegistrationAmount();
  }
  IDReferralAmount(): BigNumber {
    return this.IDReferrals()
      ? this.registrationFees.divn(this.IDReferralLevels + 2)
      : new BN(0);
  }
  IDImportFee(): BigNumber {
    return this.importFees.clone();
  }
  feePricingCurrency(): string {
    return this.isFractional() &&
      !this.importFees.isNeg() &&
      this.importFees.lt(new BN(this.currencies.length))
      ? this.currencies[this.importFees.toNumber()]
      : this.currencyID;
  }
}
