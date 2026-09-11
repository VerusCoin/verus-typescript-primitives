import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { PBaaSEvidenceRef, PBaaSEvidenceRefJson } from './PBaaSEvidenceRef';
import { IdentityMultimapRef, IdentityMultimapRefJson } from './IdentityMultimapRef';
import { URLRef, URLRefJson } from './URLRef';
export type CrossChainDataRefJson = (PBaaSEvidenceRefJson & {
    type: number;
}) | (IdentityMultimapRefJson & {
    type: number;
}) | (URLRefJson & {
    type: number;
});
export declare class CrossChainDataRef extends SerializableEntityBase implements SerializableEntity {
    ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef;
    static TYPE_CROSSCHAIN_DATAREF: number;
    static TYPE_IDENTITY_DATAREF: number;
    static TYPE_URL_REF: number;
    constructor(data?: PBaaSEvidenceRef | IdentityMultimapRef | URLRef | any);
    which(): number;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    toJson(): {
        type: number;
        version: number;
        flags: number;
        vdxfkey: string;
        identityid?: string;
        startheight: number;
        endheight: number;
        datahash?: string;
        systemid?: string;
    } | {
        type: number;
        version: number;
        flags: number;
        output: any;
        objectnum: number;
        subobject: number;
        systemid: string;
        datahash?: string;
    } | {
        type: number;
        version: number;
        flags: number;
        datahash: string;
        url: string;
    };
    static fromJson(data: CrossChainDataRefJson): CrossChainDataRef;
}
