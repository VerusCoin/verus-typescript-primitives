import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { WalletBackup, WalletBackupJson } from "../backup/WalletBackup";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class WalletBackupOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: WalletBackup;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<WalletBackup>);
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<WalletBackupJson>): WalletBackupOrdinalVDXFObject;
}
