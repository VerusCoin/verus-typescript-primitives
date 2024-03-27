/// <reference types="node" />
declare class CLayer<NODE_TYPE> {
    private vSize;
    private nodes;
    constructor();
    size(): number;
    getIndex(idx: number): NODE_TYPE;
    push_back(node: NODE_TYPE): void;
    clear(): void;
}
export declare class CMMRNode {
    hash: Buffer;
    constructor(Hash?: Buffer);
    digest(input: any): any;
    HashObj(obj: Buffer, onbjR?: Buffer): Buffer;
    CreateParentNode(nRight: CMMRNode): CMMRNode;
    GetProofHash(opposite: CMMRNode): Array<Buffer>;
    GetLeafHash(): Array<Buffer>;
    GetExtraHashCount(): number;
}
export declare class CMerkleMountainRange {
    layer0: CLayer<CMMRNode>;
    vSize: number;
    upperNodes: Array<CLayer<CMMRNode>>;
    _leafLength: number;
    constructor();
    getbyteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(bufferIn: Buffer): CMerkleMountainRange;
    add(leaf: CMMRNode): number;
    size(): number;
    height(): number;
    getNode(Height: any, Index: any): CMMRNode;
}
export declare class CMMRBranch {
    branchType?: number;
    nIndex?: number;
    nSize?: number;
    branch?: Array<Buffer>;
    constructor(branchType?: number, nIndex?: number, nSize?: number, branch?: Array<Buffer>);
    dataByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    digest(input: any): any;
    safeCheck(hash: Buffer): Buffer;
}
export declare class CMMRProof {
    proofSequence: Array<CMMRBranch>;
    setProof(proof: CMMRBranch): void;
    dataByteLength(): number;
    toBuffer(): Buffer;
    fromDataBuffer(buffer: Buffer, offset?: number): number;
}
export declare class CMerkleMountainView {
    mmr: CMerkleMountainRange;
    sizes: Array<number>;
    peaks: Array<CMMRNode>;
    peakMerkle: Array<Array<CMMRNode>>;
    constructor(mountainRange: CMerkleMountainRange, viewSize?: number);
    size(): number;
    CalcPeaks(force?: boolean): void;
    resize(newSize: number): number;
    maxsize(): number;
    GetPeaks(): Array<CMMRNode>;
    GetRoot(): Buffer;
    GetRootNode(): CMMRNode;
    GetHash(index: number): Buffer;
    GetBranchType(): number;
    GetProof(retProof: CMMRProof, pos: number): boolean;
    GetProofBits(pos: number, mmvSize: number): void;
}
export {};
