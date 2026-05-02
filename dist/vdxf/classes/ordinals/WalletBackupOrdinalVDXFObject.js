"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBackupOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const WalletBackup_1 = require("../backup/WalletBackup");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class WalletBackupOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new WalletBackup_1.WalletBackup()
    }) {
        super({
            type: ordinals_1.WALLET_BACKUP_VDXF_ORDINAL,
            data: request.data
        }, WalletBackup_1.WalletBackup);
    }
    static fromJson(details) {
        return new WalletBackupOrdinalVDXFObject({
            data: WalletBackup_1.WalletBackup.fromJson(details.data)
        });
    }
}
exports.WalletBackupOrdinalVDXFObject = WalletBackupOrdinalVDXFObject;
