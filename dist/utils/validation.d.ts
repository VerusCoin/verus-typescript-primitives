/** Require an object whose enumerable fields belong to the supplied schema. */
export declare function rejectUnknownFields(value: unknown, allowed: readonly string[]): void;
/** Validate an unsigned 32-bit integer without coercion. */
export declare function assertUint32(value: number): number;
/** Decode fixed-width hex in display order; callers explicitly reverse transaction IDs. */
export declare function decodeFixedLengthHex(value: string, bytes: number): Buffer;
/** Validate fixed-width hex and return its canonical lowercase representation. */
export declare function normalizeFixedLengthHex(value: string, bytes: number): string;
