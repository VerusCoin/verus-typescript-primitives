/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { EvidenceData, EvidenceDataInChainObjectJson } from './EvidenceData';
export interface CrossChainProofJson {
    version: number;
    chainobjects: Array<EvidenceDataInChainObjectJson>;
}
export declare enum CHAIN_OBJECT_TYPES {
    CHAINOBJ_INVALID = 0,
    CHAINOBJ_HEADER = 1,
    CHAINOBJ_HEADER_REF = 2,
    CHAINOBJ_TRANSACTION_PROOF = 3,
    CHAINOBJ_PROOF_ROOT = 4,
    CHAINOBJ_COMMITMENTDATA = 5,
    CHAINOBJ_RESERVETRANSFER = 6,
    CHAINOBJ_RESERVED = 7,
    CHAINOBJ_CROSSCHAINPROOF = 8,
    CHAINOBJ_NOTARYSIGNATURE = 9,
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
        version: any;
        chainObjects: any;
    });
    static KnownVDXFKeys(): Map<string, CHAIN_OBJECT_TYPES>;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        version: string;
        chainobjects: any[];
    };
    static fromJson(data: CrossChainProofJson): CrossChainProof;
}
