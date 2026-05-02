"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWalletBackupDetails = void 0;
const bn_js_1 = require("bn.js");
const bufferutils_1 = require("../../../utils/bufferutils");
const varuint_1 = require("../../../utils/varuint");
const { BufferReader, BufferWriter } = bufferutils_1.default;
class CreateWalletBackupDetails {
    constructor(data) {
        this.backupType = (data === null || data === void 0 ? void 0 : data.backupType) || CreateWalletBackupDetails.DEFAULT_BACKUP_TYPE;
    }
    isValid() {
        return this.backupType.gte(new bn_js_1.BN(0, 10));
    }
    getByteLength() {
        return varuint_1.default.encodingLength(this.backupType.toNumber());
    }
    toBuffer() {
        const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));
        writer.writeCompactSize(this.backupType.toNumber());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        this.backupType = new bn_js_1.BN(reader.readCompactSize(), 10);
        return reader.offset;
    }
    toJson() {
        return {
            backuptype: this.backupType.toNumber()
        };
    }
    static fromJson(json) {
        var _a;
        return new CreateWalletBackupDetails({
            backupType: new bn_js_1.BN((_a = json.backuptype) !== null && _a !== void 0 ? _a : json.backupType, 10)
        });
    }
}
exports.CreateWalletBackupDetails = CreateWalletBackupDetails;
CreateWalletBackupDetails.NFC_NDEF_BACKUP = new bn_js_1.BN(1, 10);
CreateWalletBackupDetails.DEFAULT_BACKUP_TYPE = CreateWalletBackupDetails.NFC_NDEF_BACKUP;
