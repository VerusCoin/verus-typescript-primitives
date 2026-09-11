import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { UTXORef } from './UTXORef';
export interface PBaaSEvidenceRefJson {
    version: number;
    flags: number;
    output: any;
    objectnum: number;
    subobject: number;
    systemid: string;
    datahash?: string;
}
export declare class PBaaSEvidenceRef extends SerializableEntityBase implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    output: UTXORef;
    objectNum: BigNumber;
    subObject: BigNumber;
    systemId: string;
    dataHash: Buffer;
    static FLAG_ISEVIDENCE: import("bn.js");
    static FLAG_HAS_SYSTEM: import("bn.js");
    static FLAG_HAS_HASH: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        output?: UTXORef;
        objectNum?: BigNumber;
        subObject?: BigNumber;
        systemId?: string;
        dataHash?: Buffer;
    });
    /** @deprecated Use objectNum instead */
    get object_num(): BigNumber;
    /** @deprecated Use subObject instead */
    get sub_object(): BigNumber;
    /** @deprecated Use systemId instead */
    get system_id(): string;
    /** @deprecated Use dataHash instead */
    get data_hash(): Buffer;
    private validateDataHashLength;
    private hasNonNullDataHash;
    hasDataHash(): boolean;
    setFlags(): void;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): PBaaSEvidenceRefJson;
    static fromJson(json: PBaaSEvidenceRefJson): PBaaSEvidenceRef;
}
