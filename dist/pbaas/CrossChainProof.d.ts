import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { EvidenceData, EvidenceDataInChainObjectJson } from './EvidenceData';
export interface CrossChainProofJson {
    version: number;
    chainobjects: Array<EvidenceDataInChainObjectJson>;
}
export declare enum CHAIN_OBJECT_TYPES {
    CHAINOBJ_INVALID = 0,
    CHAINOBJ_HEADER = 1,// serialized full block header w/proof
    CHAINOBJ_HEADER_REF = 2,// equivalent to header, but only includes non-canonical data
    CHAINOBJ_TRANSACTION_PROOF = 3,// serialized transaction or partial transaction with proof
    CHAINOBJ_PROOF_ROOT = 4,// merkle proof of preceding block or transaction
    CHAINOBJ_COMMITMENTDATA = 5,// prior block commitments to ensure recognition of overlapping notarizations
    CHAINOBJ_RESERVETRANSFER = 6,// serialized transaction, sometimes without an opret, which will be reconstructed
    CHAINOBJ_RESERVED = 7,// unused and reserved
    CHAINOBJ_CROSSCHAINPROOF = 8,// specific composite object, which is a single or multi-proof
    CHAINOBJ_NOTARYSIGNATURE = 9,// notary signature
    CHAINOBJ_EVIDENCEDATA = 10
}
export declare class CrossChainProof implements SerializableEntity {
    version: BigNumber;
    chainObjects: Array<EvidenceData>;
    static VERSION_INVALID: import("bn.js");
    static VERSION_FIRST: import("bn.js");
    static VERSION_CURRENT: import("bn.js");
    static VERSION_LAST: import("bn.js");
    constructor(data?: {
        version?: BigNumber;
        chainObjects?: Array<EvidenceData>;
    });
    /** @deprecated Use chainObjects instead */
    get chain_objects(): Array<EvidenceData>;
    static knownVDXFKeys(): Map<string, CHAIN_OBJECT_TYPES>;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        chainobjects: any[];
    };
    static fromJson(data: CrossChainProofJson): CrossChainProof;
}
