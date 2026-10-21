import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { DataDescriptor, DataDescriptorJson } from './DataDescriptor';
import { EHashTypes } from './DataDescriptor';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface MMRDescriptorJson {
    version?: number;
    objecthashtype?: number;
    mmrhashtype?: number;
    mmrroot?: DataDescriptorJson;
    mmrhashes?: DataDescriptorJson;
    datadescriptors?: DataDescriptorJson[];
}
export declare class MMRDescriptor extends SerializableEntityBase implements SerializableEntity {
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
    /** Daemon JSON uses zero for absent numeric fields and invalid nested descriptors. */
    static fromJson(data?: MMRDescriptorJson | null): MMRDescriptor;
    /** Explicit alias for the canonical daemon JSON representation. */
    static fromDaemonJson(data?: MMRDescriptorJson | null): MMRDescriptor;
    private validateIntegers;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    hasData(): boolean;
    isValid(): boolean;
    toJson(): MMRDescriptorJson;
    /** Explicit alias for the canonical daemon JSON representation. */
    toDaemonJson(): MMRDescriptorJson;
}
