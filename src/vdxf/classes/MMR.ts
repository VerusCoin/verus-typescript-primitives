// Licence MIT
// Adapted to Verus Blake2b MMR. 

var blake2b = require('blake2b')

import { BN } from 'bn.js';
import { VDXFObject } from "../";
import varuint from '../../utils/varuint'
import bufferutils from '../../utils/bufferutils'

const { BufferReader, BufferWriter } = bufferutils;
const BRANCH_MMRBLAKE_NODE = 2

class CLayer<NODE_TYPE>
{

  private vSize: number;
  private nodes: Array<NODE_TYPE>;

  constructor() { this.vSize = 0; }

  size(): number {
    return this.vSize;
  }

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

//template <typename NODE_TYPE, typename UNDERLYING>
class COverlayNodeLayer<NODE_TYPE, UNDERLYING> {

  private nodeSource: UNDERLYING;
  private vSize: number;

  constructor(NodeSource: UNDERLYING) {
    this.nodeSource = NodeSource;
    this.vSize = 0;
  }

  size(): number {
    return this.vSize;
  }

  getIndex(idx: number): NODE_TYPE {
    if (idx < this.vSize) {
      let retval: NODE_TYPE;
      return retval;
    }
    else {
      throw new Error("COverlayNodeLayer [] index out of range");

    }
  }

  // node type must be moveable just to be passed here, but the default overlay has no control over the underlying storage
  // and only tracks size changes
  push_back(node: NODE_TYPE) { this.vSize++; }
  clear() { this.vSize = 0; }
  resize(newSize: number) { this.vSize = newSize; }
};
export class CMMRNode {
  hash: Buffer;

  constructor(Hash?: Buffer) {
    if (Hash) {
      this.hash = Hash;
    }
  }

  digest(input) {
    var out = Buffer.allocUnsafe(32);
    return blake2b(out.length, null, null, Buffer.from("VerusDefaultHash")).update(input).digest(out);
  }

  HashObj(obj: Buffer, onbjR?: Buffer): Buffer {
    if (!onbjR) return this.digest(obj);
    else return this.digest(Buffer.concat([obj, onbjR]));
  }

  // add a right to this left and create a parent node
  CreateParentNode(nRight: CMMRNode): CMMRNode {
    return new CMMRNode(this.digest(Buffer.concat([this.hash, nRight.hash])));
  }

  GetProofHash(opposite: CMMRNode): Array<Buffer> {
    return [this.hash];
  }

  // leaf nodes that track additional data, such as block power, may need a hash added to the path
  // at the very beginning
  GetLeafHash(): Array<Buffer> { return []; }

  GetExtraHashCount() {
    // how many extra proof hashes per layer are added with this node
    return 0;
  }
};

function loggingIdentity<Type>(arg: Type[]): Type[] {
  console.log(arg.length);
  return arg;
}

//template <typename NODE_TYPE=CDefaultMMRNode, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE>
export class CMerkleMountainRange {
  layer0: CLayer<CMMRNode>;
  vSize: number;
  upperNodes: Array<CLayer<CMMRNode>>;
  _leafLength: number;

  constructor() {
    this.layer0 = new CLayer<CMMRNode>();
    this.vSize = 0;
    this.upperNodes = new Array<CLayer<CMMRNode>>();
    this._leafLength = 0;
  }

  getbyteLength(): number {
    return 1;
  }

  toBuffer(): Buffer {
    return Buffer.from([]);
  }

  fromBuffer(bufferIn: Buffer): CMerkleMountainRange {
    return new CMerkleMountainRange();
  }

  add(leaf: CMMRNode): number {
    this.layer0.push_back(leaf);

    let height = 0;
    let layerSize: number;
    for (layerSize = this.layer0.size(); height <= this.upperNodes.length && layerSize > 1; height++) {
      let newSizeAbove = layerSize >> 1;

      // expand vector of vectors if we are adding a new layer
      if (height == this.upperNodes.length) {
        this.upperNodes.push(new CLayer<CMMRNode>());
      }

      let curSizeAbove = this.upperNodes[height].size();

      // if we need to add an element to the vector above us, do it

      if (!(layerSize & 1) && newSizeAbove > curSizeAbove) {
        let idx = layerSize - 2;
        if (height > 0) {

          this.upperNodes[height].push_back(this.upperNodes[height - 1].getIndex(idx).CreateParentNode(this.upperNodes[height - 1].getIndex(idx + 1)));
        }
        else {
          this.upperNodes[height].push_back(this.layer0.getIndex(idx).CreateParentNode(this.layer0.getIndex(idx + 1)));

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

  getNode(Height, Index): CMMRNode {
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

export class CMMRBranch {
  branchType?: number;
  nIndex?: number;
  nSize?: number;
  branch?: Array<Buffer>;

  constructor(branchType: number = BRANCH_MMRBLAKE_NODE, nIndex: number = 0, nSize: number = 0, branch: Array<Buffer> = new Array<Buffer>()) {
    this.branchType = branchType;
    this.nIndex = nIndex;
    this.nSize = nSize;
    this.branch = branch;
  }

  dataByteLength(): number {

    let length = 0;

    length += varuint.encodingLength(this.branchType);
    length += varuint.encodingLength(this.nIndex);
    length += varuint.encodingLength(this.nSize);
    length += varuint.encodingLength(this.branch.length);

    for (let i = 0; i < this.branch.length; i++) {
      length += this.branch[i].length;
    }

    return length;

  }

  toBuffer(): Buffer {

    const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));

    bufferWriter.writeCompactSize(this.branchType);
    bufferWriter.writeCompactSize(this.nIndex);
    bufferWriter.writeCompactSize(this.nSize);
    bufferWriter.writeCompactSize(this.branch.length);

    for (let i = 0; i < this.branch.length; i++) {
      bufferWriter.writeSlice(this.branch[i]);

    }

    return bufferWriter.buffer;

  }

  fromBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);

    this.branchType = reader.readCompactSize();
    this.nIndex = reader.readCompactSize();
    this.nSize = reader.readCompactSize();

    let branchLength = reader.readCompactSize();

    this.branch = new Array<Buffer>();

    for (let i = 0; i < branchLength; i++) {
      this.branch.push(reader.readSlice(32));
    }

    return reader.offset;
  }

  digest(input) {
    var out = Buffer.allocUnsafe(32);
    return blake2b(out.length, null, null, Buffer.from("VerusDefaultHash")).update(input).digest(out);
  }

  safeCheck(hash: Buffer) {

    let index = GetMMRProofIndex(this.nIndex, this.nSize, 0);

    let joined = Buffer.allocUnsafe(64);
    let hashInProgress = hash;

    for (let i = 0; i < this.branch.length; i++) {

      if (index.and(new BN(1)).gt(new BN(0))) {
        if (this.branch[i] === hashInProgress) throw new Error("Value can be equal to node but never on the right");
        joined = Buffer.concat([this.branch[i], hashInProgress]);
      } else {
        joined = Buffer.concat([hashInProgress, this.branch[i]]);
      }
      hashInProgress = this.digest(joined);

      index = index.shrn(1);
    }

    return hashInProgress;
  }
}

export class CMMRProof {
  proofSequence: Array<CMMRBranch>;

  setProof(proof: CMMRBranch) {
    if (!this.proofSequence) {
      this.proofSequence = new Array<CMMRBranch>();
    }
    this.proofSequence.push(proof);
  }

  dataByteLength(): number {

    let length = 0;

    length += varuint.encodingLength(this.proofSequence.length);

    for (let i = 0; i < this.proofSequence.length; i++) {
      length += this.proofSequence[i].dataByteLength();
    }

    return length;
  }

  toBuffer(): Buffer {

    const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));

    bufferWriter.writeCompactSize(this.proofSequence.length);

    for (let i = 0; i < this.proofSequence.length; i++) {
      bufferWriter.writeSlice(this.proofSequence[i].toBuffer());

    }

    return bufferWriter.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);

    let proofSequenceLength = reader.readCompactSize();

    this.proofSequence = new Array<CMMRBranch>();

    for (let i = 0; i < proofSequenceLength; i++) {
      let proof = new CMMRBranch();
      reader.offset = proof.fromBuffer(reader.buffer, reader.offset);
      this.setProof(proof);
    }

    return reader.offset;
  }

}

//template <typename NODE_TYPE, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE, typename HASHALGOWRITER=CBLAKE2bWriter>
export class CMerkleMountainView {
  mmr: CMerkleMountainRange; // the underlying mountain range, which provides the hash vectors
  sizes: Array<number>;                    // sizes that we will use as proxies for the size of each vector at each height
  peaks: Array<CMMRNode>;      // peaks
  peakMerkle: Array<Array<CMMRNode>>;  // cached layers for the peak merkle if needed

  constructor(mountainRange: CMerkleMountainRange, viewSize: number = 0) {
    this.mmr = mountainRange;
    let maxSize = this.mmr.size();
    if (viewSize > maxSize || viewSize == 0) {
      viewSize = maxSize;
    }
    this.sizes = new Array<number>();
    this.sizes.push(viewSize);

    for (viewSize >>= 1; viewSize; viewSize >>= 1) {
      this.sizes.push(viewSize);
    }
    this.peakMerkle = new Array<Array<CMMRNode>>();
    this.peaks = new Array<CMMRNode>();
  }



  // how many elements are stored in this view
  size(): number {
    // zero if empty or the size of the zeroeth layer
    return this.sizes.length == 0 ? 0 : this.sizes[0];
  }

  CalcPeaks(force = false) {
    // if we don't yet have calculated peaks, calculate them
    if (force || (this.peaks.length == 0 && this.size() != 0)) {
      // reset the peak merkle tree, in case this is forced
      this.peaks = new Array<CMMRNode>;
      this.peakMerkle = new Array<Array<CMMRNode>>;
      for (let ht = 0; ht < this.sizes.length; ht++) {
        // if we're at the top or the layer above us is smaller than 1/2 the size of this layer, rounded up, we are a peak
        if (ht == (this.sizes.length - 1) || this.sizes[ht + 1] < ((this.sizes[ht] + 1) >> 1)) {
          this.peaks.splice(0, 0, this.mmr.getNode(ht, this.sizes[ht] - 1));
        }
      }
    }
  }

  resize(newSize: number): number {
    if (newSize != this.size()) {

      this.sizes = new Array<number>;
      this.peaks = new Array<CMMRNode>;
      this.peakMerkle = new Array<Array<CMMRNode>>;

      let maxSize = this.mmr.size();
      if (newSize > maxSize) {
        newSize = maxSize;
      }
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

  GetPeaks(): Array<CMMRNode> {
    this.CalcPeaks();
    return this.peaks;
  }

  GetRoot(): Buffer {
    let rootHash = Buffer.allocUnsafe(32);

    if (this.size() > 0 && this.peakMerkle.length == 0) {
      // get peaks and hash to a root
      this.CalcPeaks();

      let layerNum: number = 0, layerSize = this.peaks.length;
      // with an odd number of elements below, the edge passes through
      for (let passThrough: boolean = !!(layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = !!(layerSize & 1), layerNum++) {
        this.peakMerkle.push(Array<CMMRNode>());

        let i;
        let layerIndex = layerNum ? layerNum - 1 : 0;      // layerNum is base 1

        for (i = 0; i < (layerSize >> 1); i++) {
          if (layerNum > 0) {
            this.peakMerkle[this.peakMerkle.length - 1].push(this.peakMerkle[layerIndex][i << 1].CreateParentNode(this.peakMerkle[layerIndex][(i << 1) + 1]));
          }
          else {
            this.peakMerkle[this.peakMerkle.length - 1].push(this.peaks[i << 1].CreateParentNode(this.peaks[(i << 1) + 1]));
          }
        }
        if (passThrough) {
          if (layerNum > 0) {
            // pass the end of the prior layer through
            this.peakMerkle[this.peakMerkle.length - 1].push(this.peakMerkle[layerIndex][this.peakMerkle[layerIndex].length - 1]);
          }
          else {
            this.peakMerkle[this.peakMerkle.length].push(this.peaks[this.peaks.length - 1]);
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

  GetRootNode(): CMMRNode {
    // ensure merkle tree is calculated
    let root = this.GetRoot();
    if (root.length > 0) {
      return this.peakMerkle[this.peakMerkle.length - 1][0];
    }
    else {
      return null;
    }
  }

  // return hash of the element at "index"
  GetHash(index: number): Buffer {
    if (index < this.size()) {
      return this.mmr.layer0[index].hash;
    }
    else {
      return Buffer.allocUnsafe(32);
    }
  }

  GetBranchType(): number {

    return BRANCH_MMRBLAKE_NODE;
  }

  // return a proof of the element at "pos"
  GetProof(retProof: CMMRProof, pos: number): boolean {
    // find a path from the indicated position to the root in the current view
    let retBranch = new CMMRBranch();

    if (pos < this.size()) {
      // just make sure the peakMerkle tree is calculated
      this.GetRoot();

      // if we have leaf information, add it
      let toAdd: Array<Buffer> = this.mmr.layer0.getIndex(pos).GetLeafHash();
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
                for (auto oneHash : oneNode.GetProofHash(oneNode))
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
            if (p > this.peaks.length) throw new Error("peak not found");

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
      retBranch.branchType = this.GetBranchType();
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
  GetProofBits(pos: number, mmvSize: number) {
    //NOTE: Not implmented.
  };
}

const GetMMRProofIndex = (pos: number, mmvSize: number, extraHashes: number): InstanceType<typeof BN> => {
  let index = new BN(0);
  let layerSizes = [];
  let merkleSizes = [];
  let peakIndexes = [];
  let bitPos = 0;

  //start at the beginning
  //create a simulation of a mmr based on size
  if (!(pos > 0 && pos < mmvSize)) return new BN(0);

  //create an array of all the sizes
  while (mmvSize) {
    layerSizes.push(mmvSize);
    mmvSize = mmvSize >> 1
  }

  for (let height = 0; height < layerSizes.length; height++) {
    if (height == layerSizes.length - 1 || layerSizes[height] & 1) {
      peakIndexes.push(height);
    }
  }

  //array flip peak indexes
  peakIndexes.reverse();

  let layerNum = 0;
  let layerSize = peakIndexes.length;

  for (let passThrough = (layerSize & 1); layerNum == 0 || layerSize > 1; passThrough = (layerSize & 1), layerNum++) {
    layerSize = (layerSize >> 1) + passThrough;
    if (layerSize) {
      merkleSizes.push(layerSize);
    }
  }
  //flip the merklesizes

  for (let i = 0; i < extraHashes; i++) {
    bitPos++;
  }

  let p = pos;
  for (let l = 0; l < layerSizes.length; l++) {
    if (p & 1) {
      index = index.or(new BN(1).shln(bitPos++));

      p >>= 1;

      for (let i = 0; i < extraHashes; i++) {
        bitPos++;
      }

    } else {
      if (layerSizes[l] > (p + 1)) {

        bitPos++;
        p >>= 1;
        for (let i = 0; i < extraHashes; i++) {
          bitPos++;
        }
      } else {

        for (p = 0; p < peakIndexes.length; p++) {

          if (peakIndexes[p] == l) {
            break;
          }
        }

        for (let layerNum = -1, layerSize = peakIndexes.length; layerNum == -1 || layerSize > 1; layerSize = merkleSizes[++layerNum]) {

          if (p < (layerSize - 1) || (p & 1)) {


            if (p & 1) {
              // hash with the one before us
              index = index.or(new BN(1).shln(bitPos++));

              for (let i = 0; i < extraHashes; i++) {
                bitPos++;
              }
            } else {
              // hash with the one in front of us
              bitPos++;

              for (let i = 0; i < extraHashes; i++) {
                bitPos++;
              }
            }
          }
          p >>= 1;
        }

        break;
      }

    }
  }
  return index;
}


