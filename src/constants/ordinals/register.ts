import { APP_ENCRYPTION_REQUEST_VDXF_KEY, APP_ENCRYPTION_RESPONSE_VDXF_KEY, CREATE_WALLET_BACKUP_DETAILS_VDXF_KEY, DATA_RESPONSE_VDXF_KEY, DATA_DESCRIPTOR_VDXF_KEY, AUTHENTICATION_REQUEST_VDXF_KEY, AUTHENTICATION_RESPONSE_VDXF_KEY, PROVISION_IDENTITY_DETAILS_VDXF_KEY, USER_DATA_REQUEST_VDXF_KEY, DATA_PACKET_REQUEST_VDXF_KEY, VERUSPAY_INVOICE_DETAILS_VDXF_KEY, IDENTITY_UPDATE_RESPONSE_VDXF_KEY, IDENTITY_UPDATE_REQUEST_VDXF_KEY } from "../../vdxf";
import { AppEncryptionRequestOrdinalVDXFObject } from "../../vdxf/classes/ordinals/AppEncryptionRequestOrdinalVDXFObject";
import { DataDescriptorOrdinalVDXFObject } from "../../vdxf/classes/ordinals/DataDescriptorOrdinalVDXFObject";
import { DataResponseOrdinalVDXFObject } from "../../vdxf/classes/ordinals/DataResponseOrdinalVDXFObject";
import { UserDataRequestOrdinalVDXFObject } from "../../vdxf/classes/ordinals/UserDataRequestOrdinalVDXFObject";
import { DataPacketRequestOrdinalVDXFObject } from "../../vdxf/classes/ordinals/DataPacketRequestOrdinalVDXFObject";
import { IdentityUpdateRequestOrdinalVDXFObject } from "../../vdxf/classes/ordinals/IdentityUpdateRequestOrdinalVDXFObject";
import { IdentityUpdateResponseOrdinalVDXFObject } from "../../vdxf/classes/ordinals/IdentityUpdateResponseOrdinalVDXFObject";
import { AuthenticationRequestOrdinalVDXFObject } from "../../vdxf/classes/ordinals/AuthenticationRequestOrdinalVDXFObject";
import { AuthenticationResponseOrdinalVDXFObject } from "../../vdxf/classes/ordinals/AuthenticationResponseOrdinalVDXFObject";
import { OrdinalVDXFObjectOrdinalMap } from "../../vdxf/classes/ordinals/OrdinalVDXFObjectOrdinalMap";
import { ProvisionIdentityDetailsOrdinalVDXFObject } from "../../vdxf/classes/ordinals/ProvisionIdentityDetailsOrdinalVDXFObject";
import { VerusPayInvoiceDetailsOrdinalVDXFObject } from "../../vdxf/classes/ordinals/VerusPayInvoiceDetailsOrdinalVDXFObject";
import { APP_ENCRYPTION_REQUEST_VDXF_ORDINAL, APP_ENCRYPTION_RESPONSE_VDXF_ORDINAL, CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL, DATA_DESCRIPTOR_VDXF_ORDINAL, DATA_RESPONSE_VDXF_ORDINAL, IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL, IDENTITY_UPDATE_RESPONSE_VDXF_ORDINAL, AUTHENTICATION_REQUEST_VDXF_ORDINAL, AUTHENTICATION_RESPONSE_VDXF_ORDINAL, PROVISION_IDENTITY_DETAILS_VDXF_ORDINAL, USER_DATA_REQUEST_VDXF_ORDINAL, DATA_PACKET_REQUEST_VDXF_ORDINAL, VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL } from "./ordinals";
import { AppEncryptionResponseOrdinalVDXFObject } from "../../vdxf/classes/ordinals/AppEncryptionResponseOrdinalVDXFObject";
import { CreateWalletBackupDetailsOrdinalVDXFObject } from "../../vdxf/classes/ordinals/CreateWalletBackupDetailsOrdinalVDXFObject";

// This is where all ordinals are currently registered for ordinal VDXF objects. Standard naming convention for the VDXF keys is to
// include the word "response" at the end if it is a response and "request" at the end if it is a request. In case it isn't a request
// (an object expecting a response) or a response, you can use the world "details" at the end, but best not to mix request + details
// or response + details
export const registerOrdinals = () => {
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(DATA_DESCRIPTOR_VDXF_ORDINAL.toNumber(), DATA_DESCRIPTOR_VDXF_KEY.vdxfid, DataDescriptorOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL.toNumber(), VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid, VerusPayInvoiceDetailsOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(AUTHENTICATION_REQUEST_VDXF_ORDINAL.toNumber(), AUTHENTICATION_REQUEST_VDXF_KEY.vdxfid, AuthenticationRequestOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(AUTHENTICATION_RESPONSE_VDXF_ORDINAL.toNumber(), AUTHENTICATION_RESPONSE_VDXF_KEY.vdxfid, AuthenticationResponseOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL.toNumber(), IDENTITY_UPDATE_REQUEST_VDXF_KEY.vdxfid, IdentityUpdateRequestOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(IDENTITY_UPDATE_RESPONSE_VDXF_ORDINAL.toNumber(), IDENTITY_UPDATE_RESPONSE_VDXF_KEY.vdxfid, IdentityUpdateResponseOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(PROVISION_IDENTITY_DETAILS_VDXF_ORDINAL.toNumber(), PROVISION_IDENTITY_DETAILS_VDXF_KEY.vdxfid, ProvisionIdentityDetailsOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(APP_ENCRYPTION_REQUEST_VDXF_ORDINAL.toNumber(), APP_ENCRYPTION_REQUEST_VDXF_KEY.vdxfid, AppEncryptionRequestOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(APP_ENCRYPTION_RESPONSE_VDXF_ORDINAL.toNumber(), APP_ENCRYPTION_RESPONSE_VDXF_KEY.vdxfid, AppEncryptionResponseOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(DATA_PACKET_REQUEST_VDXF_ORDINAL.toNumber(), DATA_PACKET_REQUEST_VDXF_KEY.vdxfid, DataPacketRequestOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(USER_DATA_REQUEST_VDXF_ORDINAL.toNumber(), USER_DATA_REQUEST_VDXF_KEY.vdxfid, UserDataRequestOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(DATA_RESPONSE_VDXF_ORDINAL.toNumber(), DATA_RESPONSE_VDXF_KEY.vdxfid, DataResponseOrdinalVDXFObject, false);
  OrdinalVDXFObjectOrdinalMap.registerOrdinal(CREATE_WALLET_BACKUP_DETAILS_VDXF_ORDINAL.toNumber(), CREATE_WALLET_BACKUP_DETAILS_VDXF_KEY.vdxfid, CreateWalletBackupDetailsOrdinalVDXFObject, false);
}
