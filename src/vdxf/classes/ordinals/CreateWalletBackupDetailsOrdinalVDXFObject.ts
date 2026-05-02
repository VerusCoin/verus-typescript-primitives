import { CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { CreateWalletBackupDetails, CreateWalletBackupDetailsJson } from "../backup/CreateWalletBackupDetails";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class CreateWalletBackupDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: CreateWalletBackupDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<CreateWalletBackupDetails> = {
      data: new CreateWalletBackupDetails()
    }
  ) {
    super(
      {
        type: CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL,
        data: request.data
      },
      CreateWalletBackupDetails
    );
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<CreateWalletBackupDetailsJson>): CreateWalletBackupDetailsOrdinalVDXFObject {
    return new CreateWalletBackupDetailsOrdinalVDXFObject({
      data: CreateWalletBackupDetails.fromJson(details.data)
    });
  }
}
