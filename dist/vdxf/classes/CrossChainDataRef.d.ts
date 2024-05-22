/// <reference types="node" />
/// <reference types="bn.js" />
import { BigNumber } from '../../utils/types/BigNumber';
import { SerializableEntity } from '../../utils/types/SerializableEntity';
export declare class CUTXORef implements SerializableEntity {
    hash: Buffer;
    n: BigNumber;
    constructor(data?: {
        hash?: Buffer;
        n?: BigNumber;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class PBaaSEvidenceRef implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    output: CUTXORef;
    objectNum: BigNumber;
    subObject: BigNumber;
    systemID: string;
    static FLAG_ISEVIDENCE: import("bn.js");
    static FLAG_HAS_SYSTEM: import("bn.js");
    constructor(data?: any);
    SetFlags(): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class IdentityMultimapRef implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    idID: string;
    key: string;
    heightStart: BigNumber;
    heightEnd: BigNumber;
    dataHash: Buffer;
    systemID: string;
    static FLAG_NO_DELETION: import("bn.js");
    static FLAG_HAS_DATAHASH: import("bn.js");
    static FLAG_HAS_SYSTEM: import("bn.js");
    constructor(data?: any);
    SetFlags(): void;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class URLRef implements SerializableEntity {
    version: BigNumber;
    url: string;
    constructor(data?: {
        version?: BigNumber;
        url?: string;
    });
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
export declare class CrossChainDataRef implements SerializableEntity {
    ref: PBaaSEvidenceRef | IdentityMultimapRef | URLRef;
    static TYPE_CROSSCHAIN_DATAREF: number;
    static TYPE_IDENTITY_DATAREF: number;
    static TYPE_URL_REF: number;
    constructor(data: PBaaSEvidenceRef | IdentityMultimapRef | URLRef | any);
    which(): number;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
}
