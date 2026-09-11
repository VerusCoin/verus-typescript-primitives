import { BigNumber } from '../utils/types/BigNumber';
/**
 * Converts a BN instance to a number with 8 decimal places.
 * @param value BN instance representing the integer value (multiplied by 1e8)
 * @returns number with 8 decimal places
 */
export declare function bnToDecimal(value: BigNumber): string;
/**
 * Converts a decimal number (string or number) to a BN instance representing the integer value (multiplied by 1e8)
 * Uses string manipulation to avoid floating point errors.
 * Limits the scaled magnitude to 10^18 - 1, matching the daemon's ParseFixedPoint.
 * @param value number or string representing a number with up to 8 decimal places (e.g., "1000000000.11111111" or 1000000000.11111111)
 * @returns BN instance
 */
export declare function decimalToBn(value: string | number): BigNumber;
