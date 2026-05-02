"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWalletBackupDetailsOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const CreateWalletBackupDetails_1 = require("../backup/CreateWalletBackupDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class CreateWalletBackupDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new CreateWalletBackupDetails_1.CreateWalletBackupDetails()
    }) {
        super({
            type: ordinals_1.CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL,
            data: request.data
        }, CreateWalletBackupDetails_1.CreateWalletBackupDetails);
    }
    static fromJson(details) {
        return new CreateWalletBackupDetailsOrdinalVDXFObject({
            data: CreateWalletBackupDetails_1.CreateWalletBackupDetails.fromJson(details.data)
        });
    }
}
exports.CreateWalletBackupDetailsOrdinalVDXFObject = CreateWalletBackupDetailsOrdinalVDXFObject;
