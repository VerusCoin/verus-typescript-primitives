"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLimitedString = exports.isHexString = void 0;
const isHexString = (s) => {
    return typeof s === 'string' && s.length % 2 === 0 && !/[^0-9a-fA-F]/.test(s);
};
exports.isHexString = isHexString;
const readLimitedString = (reader, limit) => {
    const size = reader.readCompactSize();
    if (size > limit) {
        throw new Error("String length limit exceeded");
    }
    return reader.readSlice(size);
};
exports.readLimitedString = readLimitedString;
