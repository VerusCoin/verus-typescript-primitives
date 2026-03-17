import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
export interface IdentityMultimapRefJson {
    version: number;
    flags: number;
    vdxfkey: string;
    identityid?: string;
    startheight: number;
    endheight: number;
    datahash?: string;
    systemid?: string;
}
export declare class IdentityMultimapRef implements SerializableEntity {
    version: BigNumber;
    flags: BigNumber;
    idID: string;
    key: string;
    heightStart: BigNumber;
    heightEnd: BigNumber;
    dataHash: Buffer;
    systemId: string;
    static FLAG_NO_DELETION: import("bn.js");
    static FLAG_HAS_DATAHASH: import("bn.js");
    static FLAG_HAS_SYSTEM: import("bn.js");
    static FIRST_VERSION: import("bn.js");
    static LAST_VERSION: import("bn.js");
    static CURRENT_VERSION: import("bn.js");
    constructor(data?: any);
    /** @deprecated Use idID instead */
    get id_ID(): string;
    /** @deprecated Use heightStart instead */
    get height_start(): BigNumber;
    /** @deprecated Use heightEnd instead */
    get height_end(): BigNumber;
    /** @deprecated Use dataHash instead */
    get data_hash(): Buffer;
    /** @deprecated Use systemId instead */
    get system_id(): string;
    setFlags(): void;
    getByteLength(): number;
    toBuffer(): Buffer<ArrayBufferLike>;
    fromBuffer(buffer: Buffer, offset?: number): number;
    isValid(): boolean;
    hasDataHash(): boolean;
    hasSystemID(): boolean;
    toJson(): IdentityMultimapRefJson;
    static fromJson(data: IdentityMultimapRefJson): IdentityMultimapRef;
}
