/// <reference types="bn.js" />
/// <reference types="node" />
import { BigNumber } from '../utils/types/BigNumber';
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { EHashTypes } from './DataDescriptor';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface MMRDescriptorJson {
    version: number;
    objecthashtype?: number;
    mmrhashtype?: number;
    mmrroot?: DataDescriptorJson;
    mmrhashes?: DataDescriptorJson;
    datadescriptors?: DataDescriptorJson[];
}
export declare class MMRDescriptor implements SerializableEntity {
    static VERSION_INVALID: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static DEFAULT_VERSION: import("bn.js");
    version: BigNumber;
    objectHashType: EHashTypes;
    mmrHashType: EHashTypes;
    mmrRoot: DataDescriptor;
    mmrHashes: DataDescriptor;
    dataDescriptors: DataDescriptor[];
    constructor(data?: {
        version?: BigNumber;
        objectHashType?: EHashTypes;
        mmrHashType?: EHashTypes;
        mmrRoot?: DataDescriptor;
        mmrHashes?: DataDescriptor;
        dataDescriptors?: DataDescriptor[];
    });
    static fromJson(data: MMRDescriptorJson): MMRDescriptor;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    hasData(): boolean;
    isValid(): boolean;
    toJson(): MMRDescriptorJson;
}
