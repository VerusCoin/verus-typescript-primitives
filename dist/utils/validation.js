"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectUnknownFields = rejectUnknownFields;
exports.assertUint32 = assertUint32;
exports.decodeFixedLengthHex = decodeFixedLengthHex;
exports.normalizeFixedLengthHex = normalizeFixedLengthHex;
const string_1 = require("./string");
const UINT32_MAX = 0xffffffff;
const HEX_DIGITS_PER_BYTE = 2;
/** Require an object whose enumerable fields belong to the supplied schema. */
function rejectUnknownFields(value, allowed) {
    if (value == null ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        Object.keys(value).some((key) => !allowed.includes(key))) {
        throw new Error("Unsupported object fields");
    }
}
/** Validate an unsigned 32-bit integer without coercion. */
function assertUint32(value) {
    if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
        throw new Error("Expected uint32");
    }
    return value;
}
/** Decode fixed-width hex in display order; callers explicitly reverse transaction IDs. */
function decodeFixedLengthHex(value, bytes) {
    if (!(0, string_1.isHexString)(value) || value.length !== bytes * HEX_DIGITS_PER_BYTE) {
        throw new Error("Invalid fixed-length hex");
    }
    return Buffer.from(value, "hex");
}
/** Validate fixed-width hex and return its canonical lowercase representation. */
function normalizeFixedLengthHex(value, bytes) {
    return decodeFixedLengthHex(value, bytes).toString("hex");
}
