import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
export interface WalletBackupInterface {
    flags?: BigNumber;
    seedFormat?: BigNumber;
    encryptionFormat?: BigNumber;
    data?: Buffer;
    encrypted?: boolean;
    containsKdfIters?: boolean;
}
export interface WalletBackupJson {
    flags: number;
    seedformat: number;
    encryptionformat: number;
    data: string;
}
export declare class WalletBackup implements SerializableEntity {
    flags: BigNumber;
    seedFormat: BigNumber;
    encryptionFormat: BigNumber;
    data: Buffer;
    static FLAG_ENCRYPTED: import("bn.js");
    static FLAG_CONTAINS_KDF_ITERS: import("bn.js");
    static SEED_FORMAT_BIP39: import("bn.js");
    static DEFAULT_SEED_FORMAT: import("bn.js");
    static ENCRYPTION_FORMAT_NONE: import("bn.js");
    static ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM: import("bn.js");
    static DEFAULT_ENCRYPTION_FORMAT: import("bn.js");
    constructor(data?: WalletBackupInterface);
    isEncrypted(): boolean;
    containsKdfIters(): boolean;
    setEncrypted(): void;
    setContainsKdfIters(): void;
    isBIP39(): boolean;
    usesSaltedTaggedAes256Gcm(): boolean;
    isValid(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): WalletBackupJson;
    static fromJson(json: WalletBackupJson): WalletBackup;
}
