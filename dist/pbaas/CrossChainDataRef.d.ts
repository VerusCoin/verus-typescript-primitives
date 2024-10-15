/// <reference types="node" />
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { PBaaSEvidenceRef, PBaaSEvidenceRefJson } from './PBaaSEvidenceRef';
import { IdentityMultimapRef, IdentityMultimapRefJson } from './IdentityMultimapRef';
import { URLRef, URLRefJson } from './URLRef';
export declare type CrossChainDataRefJson = (PBaaSEvidenceRefJson & {
    type: number;
}) | (IdentityMultimapRefJson & {
    type: number;
}) | (URLRefJson & {
    type: number;
});
export declare class CrossChainDataRef implements SerializableEntity {
    ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef;
    static TYPE_CROSSCHAIN_DATAREF: number;
    static TYPE_IDENTITY_DATAREF: number;
    static TYPE_URL_REF: number;
    constructor(data?: PBaaSEvidenceRef | IdentityMultimapRef | URLRef | any);
    which(): number;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        type: number;
    } | {
        type: number;
        version: number;
        flags: number;
        output: any;
        objectnum: number;
        subobject: number;
        systemid: string;
    } | {
        type: number;
        version: string;
        url: string;
    };
    static fromJson(data: CrossChainDataRefJson): CrossChainDataRef;
}
