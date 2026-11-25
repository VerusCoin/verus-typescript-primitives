import { isHexString } from "./string";

const UINT32_MAX = 0xffffffff;
const HEX_DIGITS_PER_BYTE = 2;

/** Require an object whose enumerable fields belong to the supplied schema. */
export function rejectUnknownFields(
  value: unknown,
  allowed: readonly string[]
): void {
  if (
    value == null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((key) => !allowed.includes(key))
  ) {
    throw new Error("Unsupported object fields");
  }
}

/** Validate an unsigned 32-bit integer without coercion. */
export function assertUint32(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new Error("Expected uint32");
  }

  return value;
}

/** Decode fixed-width hex in display order; callers explicitly reverse transaction IDs. */
export function decodeFixedLengthHex(value: string, bytes: number): Buffer {
  if (!isHexString(value) || value.length !== bytes * HEX_DIGITS_PER_BYTE) {
    throw new Error("Invalid fixed-length hex");
  }

  return Buffer.from(value, "hex");
}

/** Validate fixed-width hex and return its canonical lowercase representation. */
export function normalizeFixedLengthHex(value: string, bytes: number): string {
  return decodeFixedLengthHex(value, bytes).toString("hex");
}
