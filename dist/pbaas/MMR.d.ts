import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import type { EHashTypes } from './DataDescriptor';
export declare class MMRLayer<NODE_TYPE> {
    private vSize;
    private nodes;
    constructor();
    size(): number;
    getIndex(idx: number): NODE_TYPE;
    push_back(node: NODE_TYPE): void;
    clear(): void;
}
export declare class MMRNode {
    hash: Buffer;
    constructor(Hash?: Buffer);
    digest(input: any): any;
    hashObj(obj: Buffer, onbjR?: Buffer): Buffer;
    createParentNode(nRight: MMRNode): MMRNode;
    getProofHash(opposite: MMRNode): Array<Buffer>;
    getLeafHash(): Array<Buffer>;
    getExtraHashCount(): number;
}
export declare class MerkleMountainRange {
    layer0: MMRLayer<MMRNode>;
    vSize: number;
    upperNodes: Array<MMRLayer<MMRNode>>;
    _leafLength: number;
    constructor();
    getbyteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(bufferIn: Buffer): MerkleMountainRange;
    add(leaf: MMRNode): number;
    size(): number;
    height(): number;
    getNode(Height: any, Index: any): MMRNode;
}
/**
 * Build a daemon-compatible MMR root from ordered, prehashed leaves.
 * All input/output hashes are raw 32-byte uint256 wire bytes. One leaf is
 * returned unchanged; an empty range has the all-zero root.
 *
 * This supports root construction only. The existing serialized MMR proofs
 * identify Blake2b branches and do not encode the other hash modes.
 */
export declare const getMMRRoot: (hashes: ReadonlyArray<Buffer>, hashType?: EHashTypes) => Buffer;
export declare class MMRBranch extends SerializableEntityBase {
    branchType?: number;
    nIndex?: number;
    nSize?: number;
    branch?: Array<Buffer>;
    constructor(branchType?: number, nIndex?: number, nSize?: number, branch?: Array<Buffer>);
    dataByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    digest(input: any): any;
    safeCheck(hash: Buffer): Buffer<ArrayBufferLike>;
}
export declare class MMRProof extends SerializableEntityBase {
    proofSequence: Array<MMRBranch>;
    setProof(proof: MMRBranch): void;
    dataByteLength(): number;
    toBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
}
export declare class MerkleMountainView {
    mmr: MerkleMountainRange;
    sizes: Array<number>;
    peaks: Array<MMRNode>;
    peakMerkle: Array<Array<MMRNode>>;
    constructor(mountainRange: MerkleMountainRange, viewSize?: number);
    size(): number;
    calcPeaks(force?: boolean): void;
    resize(newSize: number): number;
    maxsize(): number;
    getPeaks(): Array<MMRNode>;
    getRoot(): Buffer;
    getRootNode(): MMRNode;
    getHash(index: number): Buffer;
    getBranchType(): number;
    getProof(retProof: MMRProof, pos: number): boolean;
    getProofBits(pos: number, mmvSize: number): void;
}
