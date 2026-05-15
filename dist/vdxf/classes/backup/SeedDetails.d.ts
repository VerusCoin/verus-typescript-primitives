import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
export interface SeedDetailsInterface {
    flags?: BigNumber;
    seedFormat?: BigNumber;
    encryptionFormat?: BigNumber;
    KDFIters?: BigNumber;
    data?: Buffer;
    encrypted?: boolean;
    containsKDFIters?: boolean;
}
export interface SeedDetailsJson {
    flags: number;
    seedformat: number;
    encryptionformat: number;
    KDFIters?: number;
    data: string;
}
export declare class SeedDetails implements SerializableEntity {
    flags: BigNumber;
    seedFormat: BigNumber;
    encryptionFormat: BigNumber;
    KDFIters: BigNumber;
    data: Buffer;
    static FLAG_ENCRYPTED: import("bn.js");
    static FLAG_CONTAINS_KDF_ITERS: import("bn.js");
    static SEED_FORMAT_BIP39: import("bn.js");
    static DEFAULT_SEED_FORMAT: import("bn.js");
    static ENCRYPTION_FORMAT_NONE: import("bn.js");
    static ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM: import("bn.js");
    static DEFAULT_ENCRYPTION_FORMAT: import("bn.js");
    constructor(data?: SeedDetailsInterface);
    isEncrypted(): boolean;
    containsKDFIters(): boolean;
    setEncrypted(): void;
    setContainsKDFIters(): void;
    isBIP39(): boolean;
    usesSaltedTaggedAes256Gcm(): boolean;
    isValid(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): SeedDetailsJson;
    static fromJson(json: SeedDetailsJson): SeedDetails;
}
