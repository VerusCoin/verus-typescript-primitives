import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { CreateWalletBackupDetails, CreateWalletBackupDetailsJson } from "../backup/CreateWalletBackupDetails";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class CreateWalletBackupDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: CreateWalletBackupDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<CreateWalletBackupDetails>);
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<CreateWalletBackupDetailsJson>): CreateWalletBackupDetailsOrdinalVDXFObject;
}
