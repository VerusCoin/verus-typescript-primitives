"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.descriptorInteger = descriptorInteger;
exports.descriptorUtf8 = descriptorUtf8;
exports.validateDescriptorText = validateDescriptorText;
exports.validateDaemonMetadata = validateDaemonMetadata;
const bn_js_1 = require("bn.js");
/** Validate before BN conversion can truncate fractions or flags can be normalized. */
function descriptorInteger(value, bits, field) {
    if (!bn_js_1.BN.isBN(value) &&
        (typeof value !== 'number' || !Number.isSafeInteger(value))) {
        throw new RangeError(`${field} must be an unsigned ${bits}-bit integer`);
    }
    const integer = new bn_js_1.BN(value);
    if (integer.isNeg() || integer.bitLength() > bits) {
        throw new RangeError(`${field} must be an unsigned ${bits}-bit integer`);
    }
    return integer;
}
/** A decode/encode round trip detects malformed UTF-8 without replacement bytes. */
function descriptorUtf8(bytes) {
    const text = bytes.toString('utf8');
    if (!Buffer.from(text, 'utf8').equals(bytes)) {
        throw new Error('Descriptor contains invalid UTF-8');
    }
    return text;
}
function validateDescriptorText(text, limit, field) {
    if (typeof text !== 'string' ||
        Buffer.from(text, 'utf8').toString('utf8') !== text) {
        throw new Error(`${field} must contain valid Unicode without unpaired surrogates`);
    }
    if (Buffer.byteLength(text, 'utf8') > limit) {
        throw new Error(`${field} too long`);
    }
}
/** Only accept metadata for which the daemon's TrimSpaces is an identity operation. */
function validateDaemonMetadata(text, limit, field) {
    validateDescriptorText(text, limit, field);
    const spaces = '[ \\u00a0\\u1680\\u2000-\\u200a\\u200c\\u200d\\u202f\\u205f\\u3000]';
    if (/[\0\n\t\r\b\v\f\x1b]/.test(text) ||
        new RegExp(`^${spaces}|${spaces}$|${spaces}{2}`).test(text)) {
        throw new Error(`${field} would be changed by daemon whitespace normalization`);
    }
}
