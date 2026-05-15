"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOrdinals = void 0;
const vdxf_1 = require("../../vdxf");
const AppEncryptionRequestOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/AppEncryptionRequestOrdinalVDXFObject");
const DataDescriptorOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/DataDescriptorOrdinalVDXFObject");
const DataResponseOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/DataResponseOrdinalVDXFObject");
const UserDataRequestOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/UserDataRequestOrdinalVDXFObject");
const DataPacketRequestOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/DataPacketRequestOrdinalVDXFObject");
const IdentityUpdateRequestOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/IdentityUpdateRequestOrdinalVDXFObject");
const IdentityUpdateResponseOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/IdentityUpdateResponseOrdinalVDXFObject");
const AuthenticationRequestOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/AuthenticationRequestOrdinalVDXFObject");
const AuthenticationResponseOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/AuthenticationResponseOrdinalVDXFObject");
const OrdinalVDXFObjectOrdinalMap_1 = require("../../vdxf/classes/ordinals/OrdinalVDXFObjectOrdinalMap");
const ProvisionIdentityDetailsOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/ProvisionIdentityDetailsOrdinalVDXFObject");
const VerusPayInvoiceDetailsOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/VerusPayInvoiceDetailsOrdinalVDXFObject");
const ordinals_1 = require("./ordinals");
const AppEncryptionResponseOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/AppEncryptionResponseOrdinalVDXFObject");
const CreateWalletBackupDetailsOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/CreateWalletBackupDetailsOrdinalVDXFObject");
const WalletBackupOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/WalletBackupOrdinalVDXFObject");
const SpendableKeyDetailsOrdinalVDXFObject_1 = require("../../vdxf/classes/ordinals/SpendableKeyDetailsOrdinalVDXFObject");
// This is where all ordinals are currently registered for ordinal VDXF objects. Standard naming convention for the VDXF keys is to
// include the word "response" at the end if it is a response and "request" at the end if it is a request. In case it isn't a request
// (an object expecting a response) or a response, you can use the world "details" at the end, but best not to mix request + details
// or response + details
const registerOrdinals = () => {
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.DATA_DESCRIPTOR_VDXF_ORDINAL.toNumber(), vdxf_1.DATA_DESCRIPTOR_VDXF_KEY.vdxfid, DataDescriptorOrdinalVDXFObject_1.DataDescriptorOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL.toNumber(), vdxf_1.VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid, VerusPayInvoiceDetailsOrdinalVDXFObject_1.VerusPayInvoiceDetailsOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.AUTHENTICATION_REQUEST_VDXF_ORDINAL.toNumber(), vdxf_1.AUTHENTICATION_REQUEST_VDXF_KEY.vdxfid, AuthenticationRequestOrdinalVDXFObject_1.AuthenticationRequestOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.AUTHENTICATION_RESPONSE_VDXF_ORDINAL.toNumber(), vdxf_1.AUTHENTICATION_RESPONSE_VDXF_KEY.vdxfid, AuthenticationResponseOrdinalVDXFObject_1.AuthenticationResponseOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL.toNumber(), vdxf_1.IDENTITY_UPDATE_REQUEST_VDXF_KEY.vdxfid, IdentityUpdateRequestOrdinalVDXFObject_1.IdentityUpdateRequestOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.IDENTITY_UPDATE_RESPONSE_VDXF_ORDINAL.toNumber(), vdxf_1.IDENTITY_UPDATE_RESPONSE_VDXF_KEY.vdxfid, IdentityUpdateResponseOrdinalVDXFObject_1.IdentityUpdateResponseOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.PROVISION_IDENTITY_DETAILS_VDXF_ORDINAL.toNumber(), vdxf_1.PROVISION_IDENTITY_DETAILS_VDXF_KEY.vdxfid, ProvisionIdentityDetailsOrdinalVDXFObject_1.ProvisionIdentityDetailsOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.APP_ENCRYPTION_REQUEST_VDXF_ORDINAL.toNumber(), vdxf_1.APP_ENCRYPTION_REQUEST_VDXF_KEY.vdxfid, AppEncryptionRequestOrdinalVDXFObject_1.AppEncryptionRequestOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.APP_ENCRYPTION_RESPONSE_VDXF_ORDINAL.toNumber(), vdxf_1.APP_ENCRYPTION_RESPONSE_VDXF_KEY.vdxfid, AppEncryptionResponseOrdinalVDXFObject_1.AppEncryptionResponseOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.DATA_PACKET_REQUEST_VDXF_ORDINAL.toNumber(), vdxf_1.DATA_PACKET_REQUEST_VDXF_KEY.vdxfid, DataPacketRequestOrdinalVDXFObject_1.DataPacketRequestOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.USER_DATA_REQUEST_VDXF_ORDINAL.toNumber(), vdxf_1.USER_DATA_REQUEST_VDXF_KEY.vdxfid, UserDataRequestOrdinalVDXFObject_1.UserDataRequestOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.DATA_RESPONSE_VDXF_ORDINAL.toNumber(), vdxf_1.DATA_RESPONSE_VDXF_KEY.vdxfid, DataResponseOrdinalVDXFObject_1.DataResponseOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL.toNumber(), vdxf_1.CREATE_WALLET_BACKUP_DETAILS_VDXF_KEY.vdxfid, CreateWalletBackupDetailsOrdinalVDXFObject_1.CreateWalletBackupDetailsOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.WALLET_BACKUP_VDXF_ORDINAL.toNumber(), vdxf_1.WALLET_BACKUP.vdxfid, WalletBackupOrdinalVDXFObject_1.WalletBackupOrdinalVDXFObject, false);
    OrdinalVDXFObjectOrdinalMap_1.OrdinalVDXFObjectOrdinalMap.registerOrdinal(ordinals_1.SPENDABLE_KEY_DETAILS_VDXF_ORDINAL.toNumber(), vdxf_1.SPENDABLE_KEY_DETAILS_VDXF_KEY.vdxfid, SpendableKeyDetailsOrdinalVDXFObject_1.SpendableKeyDetailsOrdinalVDXFObject, false);
};
exports.registerOrdinals = registerOrdinals;
