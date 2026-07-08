import { DataDescriptor, DataDescriptorJson } from "../../pbaas";
import { 
  AppEncryptionRequestDetails, 
  AppEncryptionRequestDetailsJson, 
  IdentityUpdateRequestDetails, 
  IdentityUpdateRequestDetailsJson, 
  IdentityUpdateResponseDetails, 
  IdentityUpdateResponseDetailsJson, 
  AuthenticationRequestDetails, 
  AuthenticationRequestDetailsJson, 
  AuthenticationResponseDetails, 
  AuthenticationResponseDetailsJson, 
  ProvisionIdentityDetails, 
  ProvisionIdentityDetailsJson, 
  UserDataRequestDetails,
  UserDataRequestJson,
  DataPacketRequestDetails,
  DataPacketRequestDetailsJson,
  CreateWalletBackupDetails,
  CreateWalletBackupDetailsJson,
  WalletBackup,
  WalletBackupJson,
  SpendableKeyDetails,
  SpendableKeyDetailsJson,
  VerusPayInvoiceDetails,
  AppEncryptionResponseDetails,
  AppEncryptionResponseDetailsJson,
  MarketplaceMakeOfferRequestDetails,
  MarketplaceMakeOfferRequestDetailsJson,
  MarketplaceTakeOfferRequestDetails,
  MarketplaceTakeOfferRequestDetailsJson,
  MarketplaceCloseOfferRequestDetails,
  MarketplaceCloseOfferRequestDetailsJson
} from "../../vdxf/classes";
import { VerusPayInvoiceDetailsJson } from "../../vdxf/classes/payment/VerusPayInvoiceDetails";
import { DataResponseDetails, DataResponseDetailsJson } from "../../vdxf/classes/data/DataResponseDetails";

export type OrdinalVDXFObjectReservedData = 
  DataDescriptor | 
  VerusPayInvoiceDetails | 
  IdentityUpdateRequestDetails | 
  IdentityUpdateResponseDetails | 
  AuthenticationRequestDetails | 
  AuthenticationResponseDetails |
  ProvisionIdentityDetails |
  AppEncryptionRequestDetails |
  DataResponseDetails |
  UserDataRequestDetails |
  DataPacketRequestDetails |
  CreateWalletBackupDetails |
  WalletBackup |
  SpendableKeyDetails |
  AppEncryptionResponseDetails |
  MarketplaceMakeOfferRequestDetails |
  MarketplaceTakeOfferRequestDetails |
  MarketplaceCloseOfferRequestDetails;

export type OrdinalVDXFObjectReservedDataJson = 
  DataDescriptorJson | 
  VerusPayInvoiceDetailsJson | 
  IdentityUpdateRequestDetailsJson | 
  IdentityUpdateResponseDetailsJson | 
  AuthenticationRequestDetailsJson | 
  AuthenticationResponseDetailsJson |
  ProvisionIdentityDetailsJson |
  AppEncryptionRequestDetailsJson |
  DataResponseDetailsJson |
  UserDataRequestJson |
  DataPacketRequestDetailsJson |
  CreateWalletBackupDetailsJson |
  WalletBackupJson |
  SpendableKeyDetailsJson |
  AppEncryptionResponseDetailsJson |
  MarketplaceMakeOfferRequestDetailsJson |
  MarketplaceTakeOfferRequestDetailsJson |
  MarketplaceCloseOfferRequestDetailsJson;
