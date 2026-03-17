import { CurrencyValueMap } from './CurrencyValueMap';
import { BigNumber } from '../utils/types/BigNumber';
import { TokenOutput } from './TokenOutput';
import { TransferDestination } from './TransferDestination';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export declare const RESERVE_TRANSFER_INVALID: import("bn.js");
export declare const RESERVE_TRANSFER_VALID: import("bn.js");
export declare const RESERVE_TRANSFER_CONVERT: import("bn.js");
export declare const RESERVE_TRANSFER_PRECONVERT: import("bn.js");
export declare const RESERVE_TRANSFER_FEE_OUTPUT: import("bn.js");
export declare const RESERVE_TRANSFER_DOUBLE_SEND: import("bn.js");
export declare const RESERVE_TRANSFER_MINT_CURRENCY: import("bn.js");
export declare const RESERVE_TRANSFER_CROSS_SYSTEM: import("bn.js");
export declare const RESERVE_TRANSFER_BURN_CHANGE_PRICE: import("bn.js");
export declare const RESERVE_TRANSFER_BURN_CHANGE_WEIGHT: import("bn.js");
export declare const RESERVE_TRANSFER_IMPORT_TO_SOURCE: import("bn.js");
export declare const RESERVE_TRANSFER_RESERVE_TO_RESERVE: import("bn.js");
export declare const RESERVE_TRANSFER_REFUND: import("bn.js");
export declare const RESERVE_TRANSFER_IDENTITY_EXPORT: import("bn.js");
export declare const RESERVE_TRANSFER_CURRENCY_EXPORT: import("bn.js");
export declare const RESERVE_TRANSFER_ARBITRAGE_ONLY: import("bn.js");
export declare const RESERVE_TRANSFER_DESTINATION: TransferDestination;
export declare class ReserveTransfer extends TokenOutput implements SerializableEntity {
    flags: BigNumber;
    feeCurrencyID: string;
    feeAmount: BigNumber;
    transferDestination: TransferDestination;
    destCurrencyID: string;
    secondReserveID: string;
    destSystemID: string;
    constructor(data?: {
        values?: CurrencyValueMap;
        version?: BigNumber;
        flags?: BigNumber;
        feeCurrencyID?: string;
        feeAmount?: BigNumber;
        transferDestination?: TransferDestination;
        destCurrencyID?: string;
        secondReserveID?: string;
        destSystemID?: string;
    });
    /** @deprecated Use feeCurrencyID instead */
    get fee_currency_id(): string;
    /** @deprecated Use feeAmount instead */
    get fee_amount(): BigNumber;
    /** @deprecated Use transferDestination instead */
    get transfer_destination(): TransferDestination;
    /** @deprecated Use destCurrencyID instead */
    get dest_currency_id(): string;
    /** @deprecated Use secondReserveID instead */
    get second_reserve_id(): string;
    /** @deprecated Use destSystemID instead */
    get dest_system_id(): string;
    isReserveToReserve(): boolean;
    isCrossSystem(): boolean;
    isConversion(): boolean;
    isPreConversion(): boolean;
    isFeeOutput(): boolean;
    isDoubleSend(): boolean;
    isMint(): boolean;
    isBurnChangeWeight(): boolean;
    isBurnChangePrice(): boolean;
    isImportToSource(): boolean;
    isRefund(): boolean;
    isIdentityExport(): boolean;
    isCurrencyExport(): boolean;
    isArbitrageOnly(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
