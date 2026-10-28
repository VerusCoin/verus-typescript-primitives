"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMMRProofIndex = void 0;
const bn_js_1 = require("bn.js");
const INT32_MAX = 0x7fffffff;
/**
 * Return the daemon's uint64 direction index, or uint64(-1) for a missing leaf.
 * Inputs must be exact JavaScript integers. Right directions beyond bit 63 are
 * rejected because the corresponding C++ shift is undefined.
 */
const GetMMRProofIndex = (pos, mmvSize, extraHashes) => {
    if (!Number.isSafeInteger(pos) ||
        !Number.isSafeInteger(mmvSize) ||
        !Number.isSafeInteger(extraHashes) ||
        pos < 0 ||
        mmvSize < 0 ||
        extraHashes < 0) {
        throw new RangeError('MMR proof index inputs must be non-negative safe integers');
    }
    if (extraHashes > INT32_MAX) {
        throw new RangeError('MMR extra hash count exceeds the signed 32-bit range');
    }
    if (mmvSize === 0 || pos >= mmvSize) {
        return new bn_js_1.BN('ffffffffffffffff', 16);
    }
    // The leftmost path has no right directions, including its peak path.
    if (pos === 0)
        return new bn_js_1.BN(0);
    const index = new bn_js_1.BN(0);
    const layerSizes = [];
    const peakHeights = [];
    let bitPosition = extraHashes;
    const appendDirection = (right) => {
        if (right) {
            if (bitPosition >= 64) {
                throw new RangeError('MMR proof direction exceeds the supported 64-bit index');
            }
            index.setn(bitPosition, true);
        }
        // Zero directions need no uint64 shift, but the daemon's int counter must
        // still fit. Arithmetic avoids looping once per additional hash.
        bitPosition += 1 + extraHashes;
        if (bitPosition > INT32_MAX) {
            throw new RangeError('MMR proof bit counter exceeds the signed 32-bit range');
        }
    };
    while (mmvSize > 0) {
        layerSizes.push(mmvSize);
        mmvSize = Math.floor(mmvSize / 2);
    }
    for (let height = layerSizes.length - 1; height >= 0; height--) {
        if (height === layerSizes.length - 1 || layerSizes[height] % 2 !== 0) {
            peakHeights.push(height);
        }
    }
    let position = pos;
    for (let height = 0; height < layerSizes.length; height++) {
        if (position % 2 !== 0 || position + 1 < layerSizes[height]) {
            appendDirection(position % 2 !== 0);
            position = Math.floor(position / 2);
            continue;
        }
        // Peaks are ordered by decreasing height. Select by location, never hash:
        // distinct peaks may contain equal hashes.
        position = peakHeights.indexOf(height);
        for (let size = peakHeights.length; size > 1; size = Math.ceil(size / 2)) {
            if (position % 2 !== 0 || position + 1 < size) {
                appendDirection(position % 2 !== 0);
            }
            position = Math.floor(position / 2);
        }
        break;
    }
    return index;
};
exports.GetMMRProofIndex = GetMMRProofIndex;
