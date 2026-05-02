import { WALLET_BACKUP_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { WalletBackup, WalletBackupJson } from "../backup/WalletBackup";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class WalletBackupOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: WalletBackup;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<WalletBackup> = {
      data: new WalletBackup()
    }
  ) {
    super(
      {
        type: WALLET_BACKUP_VDXF_ORDINAL,
        data: request.data
      },
      WalletBackup
    );
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<WalletBackupJson>): WalletBackupOrdinalVDXFObject {
    return new WalletBackupOrdinalVDXFObject({
      data: WalletBackup.fromJson(details.data)
    });
  }
}
