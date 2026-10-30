import { ApiPrimitiveJson } from "../api/ApiPrimitive";
import { IdentityDefinition } from "../identity/IdentityDefinition";
import { CurrencyState } from "./CurrencyState";

/** CTransferDestination JSON used for a currency's native-system identifier. */
export type CurrencyNativeCurrencyID = {
  type: number;
  address?: string | { contract: string; tokenid: string };
  identity?: IdentityDefinition;
  currency?: RawCurrencyDefinition;
  serializeddata?: string;
  nestedtransfer?: ApiPrimitiveJson;
  undefined?: string;
  gateway?: string;
  fees?: number;
  auxdests?: CurrencyNativeCurrencyID[];
};

/** Fields emitted by CCurrencyDefinition::ToUniValue, without RPC metadata. */
export type RawCurrencyDefinition = {
  version: number;
  options: number;
  name: string;
  currencyid: string;
  parent?: string;
  systemid: string;
  nativecurrencyid?: CurrencyNativeCurrencyID;
  maxpreconversion?: Array<number>;
  minpreconversion?: Array<number>;
  notarizationprotocol: number;
  proofprotocol: number;
  launchsystemid?: string;
  startblock: number;
  endblock: number;
  currencies?: Array<string>;
  weights?: Array<number>;
  conversions?: Array<number>;
  initialsupply?: number;
  prelaunchcarveout?: number;
  prelaunchdiscount?: number;
  initialcontributions?: Array<number>;
  preallocations?: Array<{ [identityID: string]: number }>;
  gateway?: string;
  gatewayconverterid?: string;
  gatewayconvertername?: string;
  gatewayconverterissuance?: number;
  notaries?: string[];
  minnotariesconfirm?: number;
  currencyregistrationfee?: number;
  pbaassystemregistrationfee?: number;
  currencyimportfee?: number;
  transactionimportfee?: number;
  transactionexportfee?: number;
  initialtarget?: string;
  blocktime?: number;
  powaveragingwindow?: number;
  notarizationperiod?: number;
  eras?: Array<{
    reward: number;
    decay: number;
    halving: number;
    eraend: number;
  }>;
  idregistrationfees: number;
  idreferrallevels: number;
  idimportfees: number;
};

/** Currency definition enriched by getcurrency. */
export type CurrencyDefinition = RawCurrencyDefinition & {
  currencyidhex: string;
  fullyqualifiedname: string;
  magicnumber?: number;
  currencynames?: { [key: string]: string };
  definitiontxid?: string;
  definitiontxout?: number;
  bestheight: number;
  lastconfirmedheight?: number;
  bestcurrencystate?: CurrencyState;
  lastconfirmedcurrencystate?: CurrencyState;
};
