"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readLimitedString = exports.isHexString = void 0;
const isHexString = (s) => {
    try {
        const striBuf = Buffer.from(s, 'hex');
        striBuf.toString('hex');
        return true;
    }
    catch (e) {
        return false;
    }
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
