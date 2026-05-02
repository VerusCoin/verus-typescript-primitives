"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const register_1 = require("../../../constants/ordinals/register");
__exportStar(require("./DataDescriptorOrdinalVDXFObject"), exports);
__exportStar(require("./IdentityUpdateRequestOrdinalVDXFObject"), exports);
__exportStar(require("./IdentityUpdateResponseOrdinalVDXFObject"), exports);
__exportStar(require("./OrdinalVDXFObject"), exports);
__exportStar(require("./OrdinalVDXFObjectOrdinalMap"), exports);
__exportStar(require("./SerializableEntityOrdinalVDXFObject"), exports);
__exportStar(require("./VerusPayInvoiceDetailsOrdinalVDXFObject"), exports);
__exportStar(require("./AuthenticationRequestOrdinalVDXFObject"), exports);
__exportStar(require("./AuthenticationResponseOrdinalVDXFObject"), exports);
__exportStar(require("./AppEncryptionRequestOrdinalVDXFObject"), exports);
__exportStar(require("./AppEncryptionResponseOrdinalVDXFObject"), exports);
__exportStar(require("./ProvisionIdentityDetailsOrdinalVDXFObject"), exports);
__exportStar(require("./DataResponseOrdinalVDXFObject"), exports);
__exportStar(require("./UserDataRequestOrdinalVDXFObject"), exports);
__exportStar(require("./DataPacketRequestOrdinalVDXFObject"), exports);
__exportStar(require("./CreateWalletBackupDetailsOrdinalVDXFObject"), exports);
__exportStar(require("./WalletBackupOrdinalVDXFObject"), exports);
(0, register_1.registerOrdinals)();
