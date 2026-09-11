"use strict";
// Licence MIT
// Adapted to Verus Blake2b MMR. 
Object.defineProperty(exports, "__esModule", { value: true });
exports.MerkleMountainView = exports.MMRProof = exports.MMRBranch = exports.MerkleMountainRange = exports.MMRNode = exports.MMRLayer = void 0;
var blake2b = require('blake2b');
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const bn_js_1 = require("bn.js");
const varuint_1 = require("../utils/varuint");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const mmr_1 = require("../utils/mmr");
const { BufferReader, BufferWriter } = bufferutils_1.default;
const BRANCH_BTC = 1;
const BRANCH_MMRBLAKE_NODE = 2;
const BRANCH_MMRBLAKE_POWERNODE = 3;
const BRANCH_ETH = 4;
const BRANCH_MULTIPART = 5;
const BRANCH_LAST = BRANCH_MULTIPART;
const UINT32_MAX = 0xffffffff;
const INT32_MAX = 0x7fffffff;
const COMPACT_SIZE_MAX = 0x02000000;
const UINT64_MAX = new bn_js_1.BN('ffffffffffffffff', 16);
const rawSerializedBranches = new WeakMap();
const assertBranchType = (value) => {
    if (!Number.isInteger(value) || value < BRANCH_BTC || value > BRANCH_LAST) {
        throw new Error(`Invalid MMR branch type ${value}`);
    }
    return value;
};
const assertUint32 = (value, label) => {
    if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
        throw new RangeError(`${label} must be an unsigned 32-bit integer`);
    }
    return value;
};
const normalizeViewSize = (size, maximum) => {
    if (!Number.isSafeInteger(size) || size < 0) {
        throw new RangeError('MMR view size must be a non-negative safe integer');
    }
    const clampedSize = Math.min(size, maximum);
    // View/proof traversal still uses signed 32-bit shifts.
    if (!Number.isInteger(clampedSize) || clampedSize < 0 || clampedSize > INT32_MAX) {
        throw new RangeError('MMR view size exceeds the supported signed 32-bit range');
    }
    return clampedSize;
};
const readDaemonVarInt = (reader, maximum, label) => {
    let value = new bn_js_1.BN(0);
    while (true) {
        const next = reader.readUInt8();
        value = value.shln(7).or(new bn_js_1.BN(next & 0x7f));
        if (next & 0x80) {
            value = value.addn(1);
        }
        if (value.gt(maximum)) {
            throw new RangeError(`${label} is out of range`);
        }
        if (!(next & 0x80)) {
            return value;
        }
    }
};
const readUint32VarInt = (reader, label) => readDaemonVarInt(reader, new bn_js_1.BN(UINT32_MAX), label).toNumber();
const readCanonicalCompactSize = (reader, label) => {
    const first = reader.readUInt8();
    let value;
    if (first < 253) {
        value = first;
    }
    else if (first === 253) {
        value = reader.readUInt16();
        if (value < 253)
            throw new Error(`Non-canonical CompactSize ${label}`);
    }
    else if (first === 254) {
        value = reader.readUInt32();
        if (value < 0x10000)
            throw new Error(`Non-canonical CompactSize ${label}`);
    }
    else {
        value = reader.readUInt64();
        if (value < 0x100000000)
            throw new Error(`Non-canonical CompactSize ${label}`);
    }
    if (value > COMPACT_SIZE_MAX) {
        throw new RangeError(`${label} exceeds the daemon CompactSize limit`);
    }
    return value;
};
const readByteVector = (reader, label) => {
    const length = readCanonicalCompactSize(reader, `${label} length`);
    return reader.readSlice(length);
};
const skipRlpProof = (reader, label) => {
    const count = readDaemonVarInt(reader, new bn_js_1.BN(INT32_MAX), `${label} count`).toNumber();
    if (count > reader.buffer.length - reader.offset) {
        throw new Error(`${label} count exceeds the remaining input`);
    }
    for (let i = 0; i < count; i++) {
        readByteVector(reader, `${label}[${i}]`);
    }
};
const validatedBranchHashes = (branch) => {
    const hashes = branch || [];
    for (let i = 0; i < hashes.length; i++) {
        if (!Buffer.isBuffer(hashes[i]) || hashes[i].length !== 32) {
            throw new Error(`MMR branch hash ${i} must be exactly 32 bytes`);
        }
    }
    return hashes;
};
class MMRLayer {
    constructor() { this.vSize = 0; }
    size() {
        return this.vSize;
    }
    getIndex(idx) {
        if (idx < this.vSize) {
            return this.nodes[idx];
        }
        else {
            throw new Error("CChunkedLayer [] index out of range");
        }
    }
    push_back(node) {
        this.vSize++;
        if (!this.nodes) {
            this.nodes = new Array();
        }
        this.nodes.push(node);
    }
    clear() {
        this.nodes = null;
        this.vSize = 0;
    }
}
exports.MMRLayer = MMRLayer;
;
class MMRNode {
    constructor(Hash) {
        if (Hash) {
            this.hash = Hash;
        }
    }
    digest(input) {
        var out = Buffer.allocUnsafe(32);
        return blake2b(out.length, null, null, Buffer.from("VerusDefaultHash")).update(input).digest(out);
    }
    hashObj(obj, onbjR) {
        if (!onbjR)
            return this.digest(obj);
        else
            return this.digest(Buffer.concat([obj, onbjR]));
    }
    // add a right to this left and create a parent node
    createParentNode(nRight) {
        return new MMRNode(this.digest(Buffer.concat([this.hash, nRight.hash])));
    }
    getProofHash(opposite) {
        return [this.hash];
    }
    // leaf nodes that track additional data, such as block power, may need a hash added to the path
    // at the very beginning
    getLeafHash() { return []; }
    getExtraHashCount() {
        // how many extra proof hashes per layer are added with this node
        return 0;
    }
}
exports.MMRNode = MMRNode;
;
//template <typename NODE_TYPE=CDefaultMMRNode, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE>
class MerkleMountainRange {
    constructor() {
        this.layer0 = new MMRLayer();
        this.vSize = 0;
        this.upperNodes = new Array();
        this._leafLength = 0;
    }
    getbyteLength() {
        throw new Error('MerkleMountainRange serialization is not implemented');
    }
    toBuffer() {
        throw new Error('MerkleMountainRange serialization is not implemented');
    }
    fromBuffer(bufferIn) {
        throw new Error('MerkleMountainRange deserialization is not implemented');
    }
    add(leaf) {
        this.layer0.push_back(leaf);
        let height = 0;
        let layerSize;
        for (layerSize = this.layer0.size(); height <= this.upperNodes.length && layerSize > 1; height++) {
            let newSizeAbove = layerSize >> 1;
            // expand vector of vectors if we are adding a new layer
            if (height == this.upperNodes.length) {
                this.upperNodes.push(new MMRLayer());
            }
            let curSizeAbove = this.upperNodes[height].size();
            // if we need to add an element to the vector above us, do it
            if (!(layerSize & 1) && newSizeAbove > curSizeAbove) {
                let idx = layerSize - 2;
                if (height > 0) {
                    this.upperNodes[height].push_back(this.upperNodes[height - 1].getIndex(idx).createParentNode(this.upperNodes[height - 1].getIndex(idx + 1)));
                }
                else {
                    this.upperNodes[height].push_back(this.layer0.getIndex(idx).createParentNode(this.layer0.getIndex(idx + 1)));
                }
            }
            layerSize = newSizeAbove;
        }
        // return new index
        return this.layer0.size() - 1;
    }
    size() {
        return this.layer0.size();
    }
    height() {
        return this.layer0.size() > 0 ? this.upperNodes.length + 1 : 0;
    }
    getNode(Height, Index) {
        let layers = this.height();
        if (Height < layers) {
            if (Height) {
                if (Index < this.upperNodes[Height - 1].size()) {
                    return this.upperNodes[Height - 1].getIndex(Index);
                }
            }
            else {
                if (Index < this.layer0.size()) {
                    return this.layer0.getIndex(Index);
                }
            }
        }
        return null;
    }
}
exports.MerkleMountainRange = MerkleMountainRange;
class MMRBranch extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(branchType = BRANCH_MMRBLAKE_NODE, nIndex = 0, nSize = 0, branch = new Array()) {
        super();
        this.branchType = branchType;
        this.nIndex = nIndex;
        this.nSize = nSize;
        this.branch = branch;
    }
    dataByteLength() {
        const type = assertBranchType(this.branchType);
        if (type === BRANCH_ETH || type === BRANCH_MULTIPART) {
            const rawSerializedBranch = rawSerializedBranches.get(this);
            if (!rawSerializedBranch || rawSerializedBranch[0] !== type) {
                throw new Error(`Branch type ${type} requires parsed daemon wire data`);
            }
            return rawSerializedBranch.length;
        }
        const index = assertUint32(this.nIndex, 'MMR branch index');
        const hashes = validatedBranchHashes(this.branch);
        let length = 1 + varint_1.default.encodingLength(new bn_js_1.BN(index));
        if (type === BRANCH_MMRBLAKE_NODE || type === BRANCH_MMRBLAKE_POWERNODE) {
            const size = assertUint32(this.nSize, 'MMR branch size');
            length += varint_1.default.encodingLength(new bn_js_1.BN(size));
        }
        return length + varuint_1.default.encodingLength(hashes.length) + hashes.length * 32;
    }
    toBuffer() {
        const type = assertBranchType(this.branchType);
        if (type === BRANCH_ETH || type === BRANCH_MULTIPART) {
            const rawSerializedBranch = rawSerializedBranches.get(this);
            if (!rawSerializedBranch || rawSerializedBranch[0] !== type) {
                throw new Error(`Branch type ${type} requires parsed daemon wire data`);
            }
            return Buffer.from(rawSerializedBranch);
        }
        const index = assertUint32(this.nIndex, 'MMR branch index');
        const hashes = validatedBranchHashes(this.branch);
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeUInt8(type);
        bufferWriter.writeVarInt(new bn_js_1.BN(index));
        if (type === BRANCH_MMRBLAKE_NODE || type === BRANCH_MMRBLAKE_POWERNODE) {
            bufferWriter.writeVarInt(new bn_js_1.BN(assertUint32(this.nSize, 'MMR branch size')));
        }
        bufferWriter.writeCompactSize(hashes.length);
        for (let i = 0; i < hashes.length; i++) {
            bufferWriter.writeSlice(hashes[i]);
        }
        return bufferWriter.buffer;
    }
    fromBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const startOffset = reader.offset;
        const type = assertBranchType(reader.readUInt8());
        this.branchType = type;
        this.nIndex = 0;
        this.nSize = 0;
        this.branch = [];
        rawSerializedBranches.delete(this);
        if (type === BRANCH_BTC) {
            this.nIndex = readUint32VarInt(reader, 'BTC branch index');
        }
        else if (type === BRANCH_MMRBLAKE_NODE ||
            type === BRANCH_MMRBLAKE_POWERNODE) {
            this.nIndex = readUint32VarInt(reader, 'MMR branch index');
            this.nSize = readUint32VarInt(reader, 'MMR branch size');
        }
        else if (type === BRANCH_ETH) {
            skipRlpProof(reader, 'ETH account proof');
            reader.readSlice(20);
            reader.readSlice(32);
            reader.readSlice(32);
            readDaemonVarInt(reader, UINT64_MAX, 'ETH nonce');
            reader.readSlice(32);
            reader.readSlice(32);
            skipRlpProof(reader, 'ETH storage proof');
            rawSerializedBranches.set(this, Buffer.from(buffer.slice(startOffset, reader.offset)));
            return reader.offset;
        }
        else {
            readByteVector(reader, 'multipart proof data');
            rawSerializedBranches.set(this, Buffer.from(buffer.slice(startOffset, reader.offset)));
            return reader.offset;
        }
        const branchLength = readCanonicalCompactSize(reader, 'branch hash count');
        if (branchLength > Math.floor((buffer.length - reader.offset) / 32)) {
            throw new Error('MMR branch hash count exceeds the remaining input');
        }
        for (let i = 0; i < branchLength; i++) {
            this.branch.push(reader.readSlice(32));
        }
        return reader.offset;
    }
    digest(input) {
        var out = Buffer.allocUnsafe(32);
        return blake2b(out.length, null, null, Buffer.from("VerusDefaultHash")).update(input).digest(out);
    }
    safeCheck(hash) {
        const type = assertBranchType(this.branchType);
        if (type !== BRANCH_MMRBLAKE_NODE && type !== BRANCH_MMRBLAKE_POWERNODE) {
            throw new Error(`safeCheck does not support MMR branch type ${type}`);
        }
        if (!Buffer.isBuffer(hash) || hash.length !== 32) {
            throw new Error('MMR proof input hash must be exactly 32 bytes');
        }
        const hashes = validatedBranchHashes(this.branch);
        let index = (0, mmr_1.GetMMRProofIndex)(assertUint32(this.nIndex, 'MMR branch index'), assertUint32(this.nSize, 'MMR branch size'), type === BRANCH_MMRBLAKE_POWERNODE ? 1 : 0);
        let hashInProgress = hash;
        for (let i = 0; i < hashes.length; i++) {
            let joined;
            if (index.isOdd()) {
                if (hashes[i].equals(hashInProgress)) {
                    throw new Error("Value can be equal to node but never on the right");
                }
                joined = Buffer.concat([hashes[i], hashInProgress]);
            }
            else {
                joined = Buffer.concat([hashInProgress, hashes[i]]);
            }
            hashInProgress = this.digest(joined);
            index = index.shrn(1);
        }
        return hashInProgress;
    }
}
exports.MMRBranch = MMRBranch;
class MMRProof extends SerializableEntityBase_1.SerializableEntityBase {
    constructor() {
        super(...arguments);
        this.proofSequence = new Array();
    }
    setProof(proof) {
        if (!this.proofSequence) {
            this.proofSequence = new Array();
        }
        this.proofSequence.push(proof);
    }
    dataByteLength() {
        if (!Array.isArray(this.proofSequence) || this.proofSequence.length > INT32_MAX) {
            throw new RangeError('MMR proof sequence length is out of int32 range');
        }
        let length = 4;
        for (let i = 0; i < this.proofSequence.length; i++) {
            assertBranchType(this.proofSequence[i].branchType);
            length += 1 + this.proofSequence[i].dataByteLength();
        }
        return length;
    }
    toBuffer() {
        const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));
        bufferWriter.writeInt32(this.proofSequence.length);
        for (let i = 0; i < this.proofSequence.length; i++) {
            const type = assertBranchType(this.proofSequence[i].branchType);
            const serializedBranch = this.proofSequence[i].toBuffer();
            if (serializedBranch.length === 0 || serializedBranch[0] !== type) {
                throw new Error(`MMR proof branch ${i} has mismatched type data`);
            }
            bufferWriter.writeUInt8(type);
            bufferWriter.writeSlice(serializedBranch);
        }
        return bufferWriter.buffer;
    }
    fromDataBuffer(buffer, offset) {
        const reader = new bufferutils_1.default.BufferReader(buffer, offset);
        const proofSequenceLength = reader.readInt32();
        this.proofSequence = [];
        if (proofSequenceLength < 0) {
            throw new Error('MMR proof sequence length cannot be negative');
        }
        if (proofSequenceLength > Math.floor((buffer.length - reader.offset) / 3)) {
            throw new Error('MMR proof sequence exceeds the remaining input');
        }
        const parsedProofs = [];
        try {
            for (let i = 0; i < proofSequenceLength; i++) {
                const outerType = assertBranchType(reader.readUInt8());
                const proof = new MMRBranch();
                reader.offset = proof.fromBuffer(reader.buffer, reader.offset);
                if (proof.branchType !== outerType) {
                    throw new Error(`MMR proof branch ${i} has mismatched outer and inner types`);
                }
                parsedProofs.push(proof);
            }
        }
        catch (error) {
            this.proofSequence = [];
            throw error;
        }
        this.proofSequence = parsedProofs;
        return reader.offset;
    }
}
exports.MMRProof = MMRProof;
//template <typename NODE_TYPE, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE, typename HASHALGOWRITER=CBLAKE2bWriter>
class MerkleMountainView {
    constructor(mountainRange, viewSize = 0) {
        this.mmr = mountainRange;
        const maxSize = this.mmr.size();
        viewSize = normalizeViewSize(viewSize === 0 ? maxSize : viewSize, maxSize);
        this.sizes = new Array();
        this.sizes.push(viewSize);
        for (viewSize >>= 1; viewSize; viewSize >>= 1) {
            this.sizes.push(viewSize);
        }
        this.peakMerkle = new Array();
        this.peaks = new Array();
    }
    // how many elements are stored in this view
    size() {
        // zero if empty or the size of the zeroeth layer
        return this.sizes.length == 0 ? 0 : this.sizes[0];
    }
    calcPeaks(force = false) {
        // if we don't yet have calculated peaks, calculate them
        if (force || (this.peaks.length == 0 && this.size() != 0)) {
            // reset the peak merkle tree, in case this is forced
            this.peaks = new Array;
            this.peakMerkle = new Array;
            for (let ht = 0; ht < this.sizes.length; ht++) {
                // if we're at the top or the layer above us is smaller than 1/2 the size of this layer, rounded up, we are a peak
                if (ht == (this.sizes.length - 1) || this.sizes[ht + 1] < Math.ceil(this.sizes[ht] / 2)) {
                    this.peaks.splice(0, 0, this.mmr.getNode(ht, this.sizes[ht] - 1));
                }
            }
        }
    }
    resize(newSize) {
        newSize = normalizeViewSize(newSize, this.mmr.size());
        if (newSize != this.size()) {
            this.sizes = new Array;
            this.peaks = new Array;
            this.peakMerkle = new Array;
            this.sizes.push(newSize);
            newSize >>= 1;
            while (newSize) {
                this.sizes.push(newSize);
                newSize >>= 1;
            }
        }
        return this.size();
    }
    maxsize() {
        return this.mmr.size() - 1;
    }
    getPeaks() {
        this.calcPeaks();
        return this.peaks;
    }
    getRoot() {
        let rootHash = Buffer.alloc(32);
        if (this.size() > 0 && this.peakMerkle.length == 0) {
            // get peaks and hash to a root
            this.calcPeaks();
            let layerNum = 0, layerSize = this.peaks.length;
            // with an odd number of elements below, the edge passes through
            for (let passThrough = !!(layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = !!(layerSize & 1), layerNum++) {
                this.peakMerkle.push(Array());
                let i;
                let layerIndex = layerNum ? layerNum - 1 : 0; // layerNum is base 1
                for (i = 0; i < (layerSize >> 1); i++) {
                    if (layerNum > 0) {
                        this.peakMerkle[this.peakMerkle.length - 1].push(this.peakMerkle[layerIndex][i << 1].createParentNode(this.peakMerkle[layerIndex][(i << 1) + 1]));
                    }
                    else {
                        this.peakMerkle[this.peakMerkle.length - 1].push(this.peaks[i << 1].createParentNode(this.peaks[(i << 1) + 1]));
                    }
                }
                if (passThrough) {
                    if (layerNum > 0) {
                        // pass the end of the prior layer through
                        this.peakMerkle[this.peakMerkle.length - 1].push(this.peakMerkle[layerIndex][this.peakMerkle[layerIndex].length - 1]);
                    }
                    else {
                        this.peakMerkle[this.peakMerkle.length - 1].push(this.peaks[this.peaks.length - 1]);
                    }
                }
                // each entry in the next layer should be either combined two of the prior layer, or a duplicate of the prior layer's end
                layerSize = this.peakMerkle[this.peakMerkle.length - 1].length;
            }
            rootHash = this.peakMerkle[this.peakMerkle.length - 1][0].hash;
        }
        else if (this.peakMerkle.length > 0) {
            rootHash = this.peakMerkle[this.peakMerkle.length - 1][0].hash;
        }
        return rootHash;
    }
    getRootNode() {
        // ensure merkle tree is calculated
        this.getRoot();
        if (this.size() > 0) {
            return this.peakMerkle[this.peakMerkle.length - 1][0];
        }
        else {
            return null;
        }
    }
    // return hash of the element at "index"
    getHash(index) {
        if (Number.isSafeInteger(index) && index >= 0 && index < this.size()) {
            return this.mmr.layer0.getIndex(index).hash;
        }
        else {
            return Buffer.alloc(32);
        }
    }
    getBranchType() {
        return BRANCH_MMRBLAKE_NODE;
    }
    // return a proof of the element at "pos"
    getProof(retProof, pos) {
        // find a path from the indicated position to the root in the current view
        let retBranch = new MMRBranch();
        if (Number.isSafeInteger(pos) && pos >= 0 && pos < this.size()) {
            // just make sure the peakMerkle tree is calculated
            this.getRoot();
            // if we have leaf information, add it
            let toAdd = this.mmr.layer0.getIndex(pos).getLeafHash();
            if (toAdd.length > 0) {
                retBranch.branch.splice(retBranch.branch.length, 0, toAdd[0]);
            }
            let p = pos;
            for (let l = 0; l < this.sizes.length; l++) {
                if ((p & 1) === 1) {
                    let proofHashes = this.mmr.getNode(l, p - 1).hash;
                    retBranch.branch = retBranch.branch.concat(proofHashes);
                    p >>= 1;
                }
                else {
                    // make sure there is one after us to hash with or we are a peak and should be hashed with the rest of the peaks
                    if (this.sizes[l] > (p + 1)) {
                        let proofHashes = this.mmr.getNode(l, p + 1).hash;
                        retBranch.branch = retBranch.branch.concat(proofHashes);
                        p >>= 1;
                    }
                    else {
                        /* for (auto &oneNode : peaks)
                        {
                            printf("peaknode: ");
                            for (auto oneHash : oneNode.getProofHash(oneNode))
                            {
                                printf("%s:", oneHash.GetHex().c_str());
                            }
                            printf("\n");
                        } */
                        // we are at a peak, the alternate peak to us, or the next thing we should be hashed with, if there is one, is next on our path
                        let peakHash = this.mmr.getNode(l, p).hash;
                        // linear search to find out which peak we are in the base of the peakMerkle
                        for (p = 0; p < this.peaks.length; p++) {
                            if (this.peaks[p].hash == peakHash) {
                                break;
                            }
                        }
                        // p is the position in the merkle tree of peaks
                        if (p > this.peaks.length)
                            throw new Error("peak not found");
                        // move up to the top, which is always a peak of size 1
                        let layerNum, layerSize;
                        for (layerNum = 0, layerSize = this.peaks.length; layerNum == 0 || layerSize > 1; layerSize = this.peakMerkle[layerNum++].length) {
                            let layerIndex = layerNum ? layerNum - 1 : 0; // layerNum is base 1
                            // we are an odd member on the end (even index) and will not hash with the next layer above, we will propagate to its end
                            if ((p < layerSize - 1) || (p & 1)) {
                                if (p & 1) {
                                    // hash with the one before us
                                    if (layerNum > 0) {
                                        let proofHashes = this.peakMerkle[layerIndex][p - 1].hash;
                                        retBranch.branch = retBranch.branch.concat(proofHashes);
                                    }
                                    else {
                                        let proofHashes = this.peaks[p - 1].hash;
                                        retBranch.branch = retBranch.branch.concat(proofHashes);
                                    }
                                }
                                else {
                                    // hash with the one in front of us
                                    if (layerNum > 0) {
                                        let proofHashes = this.peakMerkle[layerIndex][p + 1].hash;
                                        retBranch.branch = retBranch.branch.concat(proofHashes);
                                    }
                                    else {
                                        let proofHashes = this.peaks[p + 1].hash;
                                        retBranch.branch = retBranch.branch.concat(proofHashes);
                                    }
                                }
                            }
                            p >>= 1;
                        }
                        // finished
                        break;
                    }
                }
            }
            retBranch.branchType = this.getBranchType();
            retBranch.nSize = this.size();
            retBranch.nIndex = pos;
            retProof.setProof(retBranch);
            return true;
        }
        return false;
    }
    // return a vector of the bits, either 1 or 0 in each byte, to represent both the size
    // of the proof by the size of the vector, and the expected bit in each position for the given
    // position in a Merkle Mountain View of the specified size
    getProofBits(pos, mmvSize) {
        throw new Error("getProofBits not implemented for MMR");
    }
    ;
}
exports.MerkleMountainView = MerkleMountainView;
