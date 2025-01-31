/// <reference types="bn.js" />
/// <reference types="node" />
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
}
export declare class PBaaSEvidenceRef implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    output: UTXORef;
    object_num: BigNumber;
    sub_object: BigNumber;
    system_id: string;
    static FLAG_ISEVIDENCE: import("bn.js");
    static FLAG_HAS_SYSTEM: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    constructor(data?: {
        version?: BigNumber;
        flags?: BigNumber;
        output?: UTXORef;
        object_num?: BigNumber;
        sub_object?: BigNumber;
        system_id?: string;
    });
    setFlags(): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): PBaaSEvidenceRefJson;
    static fromJson(json: PBaaSEvidenceRefJson): PBaaSEvidenceRef;
}
