import { BigNumber } from '../utils/types/BigNumber';
/** Validate before BN conversion can truncate fractions or flags can be normalized. */
export declare function descriptorInteger(value: unknown, bits: number, field: string): BigNumber;
/** A decode/encode round trip detects malformed UTF-8 without replacement bytes. */
export declare function descriptorUtf8(bytes: Buffer): string;
export declare function validateDescriptorText(text: string, limit: number, field: string): void;
/** Only accept metadata for which the daemon's TrimSpaces is an identity operation. */
export declare function validateDaemonMetadata(text: string, limit: number, field: string): void;
