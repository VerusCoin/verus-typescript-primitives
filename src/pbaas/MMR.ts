// Licence MIT
// Adapted to Verus Blake2b MMR. 

var blake2b = require('blake2b')

import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BN } from 'bn.js';
import varuint from '../utils/varuint'
import varint from '../utils/varint'
import bufferutils from '../utils/bufferutils'
import { GetMMRProofIndex } from '../utils/mmr';
import { hashData } from '../utils/hash';
import type { EHashTypes } from './DataDescriptor';
import { HASH_TYPE_BLAKE2B, HASH_TYPE_SHA256, HASH_TYPE_SHA256D } from '../constants/pbaas';

const { BufferReader, BufferWriter } = bufferutils;
const BRANCH_BTC = 1
const BRANCH_MMRBLAKE_NODE = 2
const BRANCH_MMRBLAKE_POWERNODE = 3
const BRANCH_ETH = 4
const BRANCH_MULTIPART = 5
const BRANCH_LAST = BRANCH_MULTIPART
const UINT32_MAX = 0xffffffff
const INT32_MAX = 0x7fffffff
const COMPACT_SIZE_MAX = 0x02000000
const UINT64_MAX = new BN('ffffffffffffffff', 16)
const rawSerializedBranches = new WeakMap<object, Buffer>()

type MMRBufferReader = InstanceType<typeof BufferReader>

const assertBranchType = (value: number | undefined): number => {
  if (!Number.isInteger(value) || value < BRANCH_BTC || value > BRANCH_LAST) {
    throw new Error(`Invalid MMR branch type ${value}`)
  }
  return value
}

const assertUint32 = (value: number | undefined, label: string): number => {
  if (!Number.isInteger(value) || value < 0 || value > UINT32_MAX) {
    throw new RangeError(`${label} must be an unsigned 32-bit integer`)
  }
  return value
}

const normalizeViewSize = (size: number, maximum: number): number => {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new RangeError('MMR view size must be a non-negative safe integer');
  }
  const clampedSize = Math.min(size, maximum);
  // View/proof traversal still uses signed 32-bit shifts.
  if (!Number.isInteger(clampedSize) || clampedSize < 0 || clampedSize > INT32_MAX) {
    throw new RangeError('MMR view size exceeds the supported signed 32-bit range');
  }
  return clampedSize;
}

const readDaemonVarInt = (
  reader: MMRBufferReader,
  maximum: InstanceType<typeof BN>,
  label: string
): InstanceType<typeof BN> => {
  let value = new BN(0)

  while (true) {
    const next = reader.readUInt8()
    value = value.shln(7).or(new BN(next & 0x7f))
    if (next & 0x80) {
      value = value.addn(1)
    }
    if (value.gt(maximum)) {
      throw new RangeError(`${label} is out of range`)
    }
    if (!(next & 0x80)) {
      return value
    }
  }
}

const readUint32VarInt = (reader: MMRBufferReader, label: string): number =>
  readDaemonVarInt(reader, new BN(UINT32_MAX), label).toNumber()

const readCanonicalCompactSize = (reader: MMRBufferReader, label: string): number => {
  const first = reader.readUInt8()
  let value: number

  if (first < 253) {
    value = first
  } else if (first === 253) {
    value = reader.readUInt16()
    if (value < 253) throw new Error(`Non-canonical CompactSize ${label}`)
  } else if (first === 254) {
    value = reader.readUInt32()
    if (value < 0x10000) throw new Error(`Non-canonical CompactSize ${label}`)
  } else {
    value = reader.readUInt64()
    if (value < 0x100000000) throw new Error(`Non-canonical CompactSize ${label}`)
  }

  if (value > COMPACT_SIZE_MAX) {
    throw new RangeError(`${label} exceeds the daemon CompactSize limit`)
  }
  return value
}

const readByteVector = (reader: MMRBufferReader, label: string): Buffer => {
  const length = readCanonicalCompactSize(reader, `${label} length`)
  return reader.readSlice(length)
}

const skipRlpProof = (reader: MMRBufferReader, label: string): void => {
  const count = readDaemonVarInt(reader, new BN(INT32_MAX), `${label} count`).toNumber()
  if (count > reader.buffer.length - reader.offset) {
    throw new Error(`${label} count exceeds the remaining input`)
  }
  for (let i = 0; i < count; i++) {
    readByteVector(reader, `${label}[${i}]`)
  }
}

const validatedBranchHashes = (branch: Array<Buffer> | undefined): Array<Buffer> => {
  const hashes = branch || [];
  for (let i = 0; i < hashes.length; i++) {
    if (!Buffer.isBuffer(hashes[i]) || hashes[i].length !== 32) {
      throw new Error(`MMR branch hash ${i} must be exactly 32 bytes`);
    }
  }
  return hashes;
}

export class MMRLayer<NODE_TYPE> {

  private vSize: number;
  private nodes: Array<NODE_TYPE>;

  constructor() { this.vSize = 0; }

  size(): number {
    return this.vSize;
  }

  // Borrowed internal node; callers must treat layer access as read-only.
  getIndex(idx: number): NODE_TYPE {
    if (idx < this.vSize) {
      return this.nodes[idx];
    }
    else {
      throw new Error("CChunkedLayer [] index out of range");
    }
  }

  push_back(node: NODE_TYPE) {
    this.vSize++;
    if (!this.nodes) {
      this.nodes = new Array<NODE_TYPE>();
    }
    this.nodes.push(node);
  }

  clear() {
    this.nodes = null;
    this.vSize = 0;
  }

};

export class MMRNode {
  hash: Buffer;

  constructor(hash: Buffer = Buffer.alloc(32)) {
    if (!Buffer.isBuffer(hash) || hash.length !== 32) {
      throw new Error('MMR node hash must be exactly 32 bytes');
    }
    this.hash = Buffer.from(hash);
  }

  /** Copy the hash while preserving subclass methods and hash configuration. */
  clone(): this {
    if (!Buffer.isBuffer(this.hash) || this.hash.length !== 32) {
      throw new Error('MMR node hash must be exactly 32 bytes');
    }
    // Subclasses with private, bound, or mutable state must override clone.
    return Object.assign(Object.create(Object.getPrototypeOf(this)), this, {
      hash: Buffer.from(this.hash),
    });
  }

  digest(input) {
    var out = Buffer.allocUnsafe(32);
    return blake2b(out.length, null, null, Buffer.from("VerusDefaultHash")).update(input).digest(out);
  }

  hashObj(obj: Buffer, onbjR?: Buffer): Buffer {
    if (!onbjR) return this.digest(obj);
    else return this.digest(Buffer.concat([obj, onbjR]));
  }

  // add a right to this left and create a parent node
  createParentNode(nRight: MMRNode): MMRNode {
    return new MMRNode(this.digest(Buffer.concat([this.hash, nRight.hash])));
  }

  getProofHash(opposite: MMRNode): Array<Buffer> {
    return [Buffer.from(this.hash)];
  }

  // leaf nodes that track additional data, such as block power, may need a hash added to the path
  // at the very beginning
  getLeafHash(): Array<Buffer> { return []; }

  getExtraHashCount() {
    // how many extra proof hashes per layer are added with this node
    return 0;
  }
};

//template <typename NODE_TYPE=CDefaultMMRNode, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE>
export class MerkleMountainRange {
  // Storage stays private so callers cannot invalidate cached views.
  private readonly layer0: MMRLayer<MMRNode>;
  private readonly upperNodes: Array<MMRLayer<MMRNode>>;
  private defaultNodesOnly = true;

  constructor() {
    this.layer0 = new MMRLayer<MMRNode>();
    this.upperNodes = new Array<MMRLayer<MMRNode>>();
  }

  getbyteLength(): number {
    throw new Error('MerkleMountainRange serialization is not implemented');
  }

  toBuffer(): Buffer {
    throw new Error('MerkleMountainRange serialization is not implemented');
  }

  fromBuffer(bufferIn: Buffer): MerkleMountainRange {
    throw new Error('MerkleMountainRange deserialization is not implemented');
  }

  add(leaf: MMRNode): number {
    const size = this.size();
    if (!Number.isSafeInteger(size) || size < 0 || size >= INT32_MAX) {
      throw new RangeError(
        'MMR leaf count exceeds the supported signed 32-bit range'
      );
    }

    // Check the limit and copy the leaf before mutating any layer.
    const copiedLeaf = leaf.clone();
    this.layer0.push_back(copiedLeaf);
    this.defaultNodesOnly =
      this.defaultNodesOnly && copiedLeaf.constructor === MMRNode;

    let height = 0;
    let layerSize: number;
    for (layerSize = this.layer0.size(); height <= this.upperNodes.length && layerSize > 1; height++) {
      let newSizeAbove = layerSize >> 1;

      // expand vector of vectors if we are adding a new layer
      if (height == this.upperNodes.length) {
        this.upperNodes.push(new MMRLayer<MMRNode>());
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

  /** Custom node algorithms may construct roots, but have no verified proof tag. */
  supportsProofs(): boolean {
    return this.defaultNodesOnly;
  }

  getNode(height: number, index: number): MMRNode {
    if (
      Number.isSafeInteger(height) &&
      height >= 0 &&
      Number.isSafeInteger(index) &&
      index >= 0 &&
      height < this.height()
    ) {
      const layer =
        height === 0 ? this.layer0 : this.upperNodes[height - 1];
      if (index < layer.size()) return layer.getIndex(index).clone();
    }
    // The daemon returns a value-initialized node for missing coordinates.
    return new MMRNode();
  }

}

/**
 * Build a daemon-compatible MMR root from ordered, prehashed leaves.
 * All input/output hashes are raw 32-byte uint256 wire bytes. One leaf is
 * returned unchanged; an empty range has the all-zero root.
 *
 * This supports root construction only. The existing serialized MMR proofs
 * identify Blake2b branches and do not encode the other hash modes.
 */
export const getMMRRoot = (
  hashes: ReadonlyArray<Buffer>,
  hashType: EHashTypes = HASH_TYPE_BLAKE2B.toNumber()
): Buffer => {
  if (
    hashType !== HASH_TYPE_BLAKE2B.toNumber() &&
    hashType !== HASH_TYPE_SHA256.toNumber() &&
    hashType !== HASH_TYPE_SHA256D.toNumber()
  ) {
    throw new Error(`Unsupported MMR hash type ${hashType}`);
  }

  if (!Array.isArray(hashes)) {
    throw new TypeError('MMR leaf hashes must be an array');
  }

  if (hashes.length > INT32_MAX) {
    throw new RangeError(
      'MMR leaf count exceeds the supported signed 32-bit range'
    );
  }

  // Keep the selected hash algorithm on every parent, including the parents
  // combining uneven peaks. The exported proof nodes retain their Blake2b rules.
  class HashNode extends MMRNode {
    createParentNode(right: MMRNode): MMRNode {
      return new HashNode(
        hashData(Buffer.concat([this.hash, right.hash]), hashType)
      );
    }
  }

  const range = new MerkleMountainRange();

  for (let index = 0; index < hashes.length; index++) {
    const leaf = hashes[index];

    if (!Buffer.isBuffer(leaf) || leaf.length !== 32) {
      throw new Error(`MMR leaf hash ${index} must be exactly 32 bytes`);
    }

    range.add(new HashNode(leaf));
  }

  return new MerkleMountainView(range).getRoot();
};

export class MMRBranch extends SerializableEntityBase {
  branchType?: number;
  nIndex?: number;
  nSize?: number;
  branch?: Array<Buffer>;

  constructor(branchType: number = BRANCH_MMRBLAKE_NODE, nIndex: number = 0, nSize: number = 0, branch: Array<Buffer> = new Array<Buffer>()) {
    super();
    this.branchType = branchType;
    this.nIndex = nIndex;
    this.nSize = nSize;
    this.branch = branch;
  }

  dataByteLength(): number {
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
    let length = 1 + varint.encodingLength(new BN(index));

    if (type === BRANCH_MMRBLAKE_NODE || type === BRANCH_MMRBLAKE_POWERNODE) {
      const size = assertUint32(this.nSize, 'MMR branch size');
      length += varint.encodingLength(new BN(size));
    }

    return length + varuint.encodingLength(hashes.length) + hashes.length * 32;
  }

  toBuffer(): Buffer {
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
    bufferWriter.writeVarInt(new BN(index));
    if (type === BRANCH_MMRBLAKE_NODE || type === BRANCH_MMRBLAKE_POWERNODE) {
      bufferWriter.writeVarInt(new BN(assertUint32(this.nSize, 'MMR branch size')));
    }
    bufferWriter.writeCompactSize(hashes.length);
    for (let i = 0; i < hashes.length; i++) {
      bufferWriter.writeSlice(hashes[i]);
    }

    return bufferWriter.buffer;

  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const startOffset = reader.offset;
    const type = assertBranchType(reader.readUInt8());

    this.branchType = type;
    this.nIndex = 0;
    this.nSize = 0;
    this.branch = [];
    rawSerializedBranches.delete(this);

    if (type === BRANCH_BTC) {
      this.nIndex = readUint32VarInt(reader, 'BTC branch index');
    } else if (
      type === BRANCH_MMRBLAKE_NODE ||
      type === BRANCH_MMRBLAKE_POWERNODE
    ) {
      this.nIndex = readUint32VarInt(reader, 'MMR branch index');
      this.nSize = readUint32VarInt(reader, 'MMR branch size');
    } else if (type === BRANCH_ETH) {
      skipRlpProof(reader, 'ETH account proof');
      reader.readSlice(20);
      reader.readSlice(32);
      reader.readSlice(32);
      readDaemonVarInt(reader, UINT64_MAX, 'ETH nonce');
      reader.readSlice(32);
      reader.readSlice(32);
      skipRlpProof(reader, 'ETH storage proof');
      rawSerializedBranches.set(this, Buffer.from(
        buffer.slice(startOffset, reader.offset)
      ));
      return reader.offset;
    } else {
      readByteVector(reader, 'multipart proof data');
      rawSerializedBranches.set(this, Buffer.from(
        buffer.slice(startOffset, reader.offset)
      ));
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

  /**
   * Compute the daemon proof result. Zero is failure; a nonzero result is only
   * valid when it equals an independently trusted, nonzero root.
   */
  safeCheck(hash: Buffer) {
    const type = assertBranchType(this.branchType);
    if (type !== BRANCH_MMRBLAKE_NODE && type !== BRANCH_MMRBLAKE_POWERNODE) {
      throw new Error(`safeCheck does not support MMR branch type ${type}`);
    }
    if (!Buffer.isBuffer(hash) || hash.length !== 32) {
      throw new Error('MMR proof input hash must be exactly 32 bytes');
    }

    const hashes = validatedBranchHashes(this.branch);
    let index = GetMMRProofIndex(
      assertUint32(this.nIndex, 'MMR branch index'),
      assertUint32(this.nSize, 'MMR branch size'),
      type === BRANCH_MMRBLAKE_POWERNODE ? 1 : 0
    );
    if (index.eq(UINT64_MAX)) return Buffer.alloc(32);

    let hashInProgress = Buffer.from(hash);
    // CMMRBranch stores the uint64 result in int64 before shifting. Preserve
    // its arithmetic right shift when the highest direction bit is set.
    const negativeIndex = index.testn(63);

    for (let i = 0; i < hashes.length; i++) {
      let joined: Buffer;
      if (index.isOdd()) {
        if (hashes[i].equals(hashInProgress)) {
          return Buffer.alloc(32);
        }
        joined = Buffer.concat([hashes[i], hashInProgress]);
      } else {
        joined = Buffer.concat([hashInProgress, hashes[i]]);
      }
      hashInProgress = this.digest(joined);
      index = index.shrn(1);
      if (negativeIndex) index.setn(63, true);
    }

    return hashInProgress;
  }
}

export class MMRProof extends SerializableEntityBase {
  proofSequence: Array<MMRBranch> = new Array<MMRBranch>();

  setProof(proof: MMRBranch) {
    if (!this.proofSequence) {
      this.proofSequence = new Array<MMRBranch>();
    }
    this.proofSequence.push(proof);
  }

  dataByteLength(): number {
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

  toBuffer(): Buffer {
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

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const proofSequenceLength = reader.readInt32();
    this.proofSequence = [];

    if (proofSequenceLength < 0) {
      throw new Error('MMR proof sequence length cannot be negative');
    }
    if (proofSequenceLength > Math.floor((buffer.length - reader.offset) / 3)) {
      throw new Error('MMR proof sequence exceeds the remaining input');
    }

    const parsedProofs: Array<MMRBranch> = [];
    try {
      for (let i = 0; i < proofSequenceLength; i++) {
        const outerType = assertBranchType(reader.readUInt8());
        const proof = new MMRBranch();
        reader.offset = proof.fromBuffer(reader.buffer, reader.offset);
        if (proof.branchType !== outerType) {
          throw new Error(
            `MMR proof branch ${i} has mismatched outer and inner types`
          );
        }
        parsedProofs.push(proof);
      }
    } catch (error) {
      this.proofSequence = [];
      throw error;
    }
    this.proofSequence = parsedProofs;
    return reader.offset;
  }

}

//template <typename NODE_TYPE, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE, typename HASHALGOWRITER=CBLAKE2bWriter>
export class MerkleMountainView {
  private readonly mmr: MerkleMountainRange;
  private sizes: Array<number>;
  private peaks: Array<MMRNode>;
  // Peak-tree layers are cached internally; public getters return owned copies.
  private peakMerkle: Array<Array<MMRNode>>;

  constructor(mountainRange: MerkleMountainRange, viewSize: number = 0) {
    this.mmr = mountainRange;
    const maxSize = this.mmr.size();
    viewSize = normalizeViewSize(viewSize === 0 ? maxSize : viewSize, maxSize);
    this.sizes = new Array<number>();
    this.sizes.push(viewSize);

    for (viewSize >>= 1; viewSize; viewSize >>= 1) {
      this.sizes.push(viewSize);
    }
    this.peakMerkle = new Array<Array<MMRNode>>();
    this.peaks = new Array<MMRNode>();
  }



  // how many elements are stored in this view
  size(): number {
    // zero if empty or the size of the zeroeth layer
    return this.sizes.length == 0 ? 0 : this.sizes[0];
  }

  private calcPeaks() {
    // resize clears both caches; calculate peaks once for the current view.
    if (this.peaks.length == 0 && this.size() != 0) {
      for (let ht = 0; ht < this.sizes.length; ht++) {
        // if we're at the top or the layer above us is smaller than 1/2 the size of this layer, rounded up, we are a peak
        if (ht == (this.sizes.length - 1) || this.sizes[ht + 1] < Math.ceil(this.sizes[ht] / 2)) {
          this.peaks.splice(0, 0, this.mmr.getNode(ht, this.sizes[ht] - 1));
        }
      }
    }
  }

  resize(newSize: number): number {
    newSize = normalizeViewSize(newSize, this.mmr.size());
    if (newSize != this.size()) {

      this.sizes = new Array<number>;
      this.peaks = new Array<MMRNode>;
      this.peakMerkle = new Array<Array<MMRNode>>;

      this.sizes.push(newSize);
      newSize >>= 1;

      while (newSize) {
        this.sizes.push(newSize);
        newSize >>= 1;
      }
    }
    return this.size();
  }

  maxsize(): number {
    return this.mmr.size() - 1;
  }

  getPeaks(): Array<MMRNode> {
    this.calcPeaks();
    return this.peaks.map(peak => peak.clone());
  }

  getRoot(): Buffer {
    let rootHash = Buffer.alloc(32);

    if (this.size() > 0 && this.peakMerkle.length == 0) {
      // get peaks and hash to a root
      this.calcPeaks();

      let layerNum: number = 0, layerSize = this.peaks.length;
      // with an odd number of elements below, the edge passes through
      for (let passThrough: boolean = !!(layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = !!(layerSize & 1), layerNum++) {
        this.peakMerkle.push(Array<MMRNode>());

        let i;
        let layerIndex = layerNum ? layerNum - 1 : 0;      // layerNum is base 1

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
    return Buffer.from(rootHash);
  }

  getRootNode(): MMRNode {
    // The daemon's const pointer is null whenever the computed root is zero.
    if (this.getRoot().equals(Buffer.alloc(32))) return null;
    return this.peakMerkle[this.peakMerkle.length - 1][0].clone();
  }

  // return hash of the element at "index"
  getHash(index: number): Buffer {
    if (Number.isSafeInteger(index) && index >= 0 && index < this.size()) {
      return this.mmr.getNode(0, index).hash;
    }
    else {
      return Buffer.alloc(32);
    }
  }

  getBranchType(): number {
    if (!this.mmr.supportsProofs()) {
      throw new Error(
        'MMR proof construction for custom node classes is unsupported'
      );
    }
    return BRANCH_MMRBLAKE_NODE;
  }

  // return a proof of the element at "pos"
  getProof(retProof: MMRProof, pos: number): boolean {
    // find a path from the indicated position to the root in the current view
    let retBranch = new MMRBranch();

    if (Number.isSafeInteger(pos) && pos >= 0 && pos < this.size()) {
      // The current wire tag identifies Blake2b. Never label a custom hashing
      // subclass with that tag; custom classes remain root-construction only.
      retBranch.branchType = this.getBranchType();

      // just make sure the peakMerkle tree is calculated
      this.getRoot();

      // if we have leaf information, add it
      let toAdd: Array<Buffer> = this.mmr.getNode(0, pos).getLeafHash();
      if (toAdd.length > 0) {
        retBranch.branch.push(...toAdd.map(hash => Buffer.from(hash)));
      }

      let p = pos;
      for (let l = 0; l < this.sizes.length; l++) {
        if ((p & 1) === 1) {
          let proofHashes = this.mmr.getNode(l, p - 1).hash;
          retBranch.branch.push(Buffer.from(proofHashes));
          p >>= 1;
        }
        else {
          // make sure there is one after us to hash with or we are a peak and should be hashed with the rest of the peaks
          if (this.sizes[l] > (p + 1)) {
            let proofHashes = this.mmr.getNode(l, p + 1).hash;
            retBranch.branch.push(Buffer.from(proofHashes));
            p >>= 1;
          }
          else {
            // Locate this peak structurally. Hash identity breaks value
            // semantics; hash equality confuses distinct, equal-valued peaks.
            p = 0;
            for (let height = this.sizes.length - 1; height > l; height--) {
              if (height === this.sizes.length - 1 || this.sizes[height] % 2 !== 0) {
                p++;
              }
            }

            // move up to the top, which is always a peak of size 1
            let layerNum: number, layerSize: number;
            for (layerNum = 0, layerSize = this.peaks.length; layerNum == 0 || layerSize > 1; layerSize = this.peakMerkle[layerNum++].length) {
              let layerIndex = layerNum ? layerNum - 1 : 0;      // layerNum is base 1

              // we are an odd member on the end (even index) and will not hash with the next layer above, we will propagate to its end
              if ((p < layerSize - 1) || (p & 1)) {
                if (p & 1) {
                  // hash with the one before us
                  if (layerNum > 0) {
                    let proofHashes = this.peakMerkle[layerIndex][p - 1].hash;
                    retBranch.branch.push(Buffer.from(proofHashes));
                  }
                  else {
                    let proofHashes = this.peaks[p - 1].hash;
                    retBranch.branch.push(Buffer.from(proofHashes));
                  }
                }
                else {
                  // hash with the one in front of us
                  if (layerNum > 0) {
                    let proofHashes = this.peakMerkle[layerIndex][p + 1].hash;
                    retBranch.branch.push(Buffer.from(proofHashes));
                  }
                  else {
                    let proofHashes = this.peaks[p + 1].hash;
                    retBranch.branch.push(Buffer.from(proofHashes));
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
  getProofBits(pos: number, mmvSize: number) {
    throw new Error("getProofBits not implemented for MMR");
  };
}
