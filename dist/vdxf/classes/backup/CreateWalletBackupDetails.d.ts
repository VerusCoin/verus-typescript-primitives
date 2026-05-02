import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
export interface CreateWalletBackupDetailsInterface {
    backupType?: BigNumber;
}
export interface CreateWalletBackupDetailsJson {
    backuptype: number;
}
export declare class CreateWalletBackupDetails implements SerializableEntity {
    backupType: BigNumber;
    static NFC_NDEF_BACKUP: import("bn.js");
    static DEFAULT_BACKUP_TYPE: import("bn.js");
    constructor(data?: CreateWalletBackupDetailsInterface);
    isValid(): boolean;
    getByteLength(): number;
    toBuffer(): Buffer;
    fromBuffer(buffer: Buffer, offset?: number): number;
    toJson(): CreateWalletBackupDetailsJson;
    static fromJson(json: CreateWalletBackupDetailsJson | {
        backupType: number;
    }): CreateWalletBackupDetails;
}
