import { BN } from 'bn.js';
import {
  AppEncryptionRequestOrdinalVDXFObject,
  GeneralTypeOrdinalVDXFObject,
  getOrdinalVDXFObjectClassForType,
  IdentityUpdateRequestOrdinalVDXFObject,
  IdentityUpdateResponseOrdinalVDXFObject,
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseOrdinalVDXFObject,
  OrdinalVDXFObject,
  UserDataRequestOrdinalVDXFObject,
  DataPacketRequestOrdinalVDXFObject,
  DataResponseOrdinalVDXFObject
} from '../../vdxf/classes/ordinals';
import {
  DataDescriptorOrdinalVDXFObject
} from '../../vdxf/classes/ordinals/DataDescriptorOrdinalVDXFObject';
import { DataDescriptor, DEST_PKH, SaplingPaymentAddress, TransferDestination } from '../../pbaas';
import {
  AppEncryptionRequestDetails,
  CompactAddressObject,
  IdentityUpdateRequestDetails,
  IdentityUpdateResponseDetails,
  AuthenticationRequestDetails,
  AuthenticationResponseDetails,
  ProvisionIdentityDetails,
  RequestURI,
  ResponseURI,
  VerusPayInvoiceDetails,
  UserDataRequestDetails,
  DataPacketRequestDetails,
  AppEncryptionResponseOrdinalVDXFObject,
  AppEncryptionResponseDetails,
  CompactIAddressObject,
  RecipientConstraint
} from '../../vdxf/classes';
import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';
import { fromBase58Check } from '../../utils/address';
import { VDXF_OBJECT_RESERVED_BYTE_I_ADDR, APP_ENCRYPTION_REQUEST_VDXF_ORDINAL, APP_ENCRYPTION_RESPONSE_VDXF_ORDINAL, DATA_DESCRIPTOR_VDXF_ORDINAL, IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL, IDENTITY_UPDATE_RESPONSE_VDXF_ORDINAL, AUTHENTICATION_REQUEST_VDXF_ORDINAL, PROVISION_IDENTITY_DETAILS_VDXF_ORDINAL, VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL, VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING, VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY } from '../../constants/ordinals/ordinals';
import { VerusPayInvoiceDetailsOrdinalVDXFObject } from '../../vdxf/classes/ordinals/VerusPayInvoiceDetailsOrdinalVDXFObject';
import { TEST_CHALLENGE_ID, TEST_CLI_ID_UPDATE_REQUEST_JSON_HEX, TEST_EXPIRYHEIGHT, TEST_IDENTITY_ID_1, TEST_IDENTITY_ID_2, TEST_IDENTITY_ID_3, TEST_REQUESTID, TEST_SYSTEMID, TEST_TXID } from '../constants/fixtures';
import { ProvisionIdentityDetailsOrdinalVDXFObject } from '../../vdxf/classes/ordinals/ProvisionIdentityDetailsOrdinalVDXFObject';
import { BigNumber } from '../../utils/types/BigNumber';
import { DataResponseDetails } from '../../vdxf/classes/data/DataResponseDetails';
import { VerifiableSignatureData } from '../../vdxf/classes/VerifiableSignatureData';
import { SaplingExtendedSpendingKey } from '../../pbaas/SaplingExtendedSpendingKey';
import { SaplingExtendedViewingKey } from '../../pbaas/SaplingExtendedViewingKey';
import { VERUSPAY_INVOICE_DETAILS_VDXF_KEY } from '../../vdxf';

// Helper function to create TransferDestination from address string
function createCompactAddressObject(type: BigNumber, address: string): CompactIAddressObject {
  const obj = new CompactIAddressObject({
    type,
    address
  });

  return obj;
}

describe('OrdinalVDXFObject and subclasses round-trip serialization', () => {
  function roundTripBuffer<T extends OrdinalVDXFObject>(obj: T): T {
    const buf = obj.toBuffer();
    // Use the factory createFromBuffer so the correct subclass is used
    const { obj: parsed } = OrdinalVDXFObject.createFromBuffer(buf);

    // Type assertion
    const parsedTyped = parsed as T;

    expect(parsedTyped.toBuffer().toString('hex')).toBe(buf.toString('hex'));

    return parsedTyped;
  }

  function roundTripJson<T extends OrdinalVDXFObject>(obj: T): T {
    const json = obj.toJson();
    // Depending on subclass, call static fromJson
    let newObj: OrdinalVDXFObject;
    if (obj instanceof DataDescriptorOrdinalVDXFObject) {
      newObj = DataDescriptorOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof VerusPayInvoiceDetailsOrdinalVDXFObject) {
      newObj = VerusPayInvoiceDetailsOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof GeneralTypeOrdinalVDXFObject) {
      newObj = GeneralTypeOrdinalVDXFObject.fromJson(json);
    } else if (obj instanceof IdentityUpdateRequestOrdinalVDXFObject) {
      newObj = IdentityUpdateRequestOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof IdentityUpdateResponseOrdinalVDXFObject) {
      newObj = IdentityUpdateResponseOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof AuthenticationRequestOrdinalVDXFObject) {
      newObj = AuthenticationRequestOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof AuthenticationResponseOrdinalVDXFObject) {
      newObj = AuthenticationResponseOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof ProvisionIdentityDetailsOrdinalVDXFObject) {
      newObj = ProvisionIdentityDetailsOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof AppEncryptionRequestOrdinalVDXFObject) {
      newObj = AppEncryptionRequestOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof DataResponseOrdinalVDXFObject) {
      newObj = DataResponseOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof UserDataRequestOrdinalVDXFObject) {
      newObj = UserDataRequestOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof DataPacketRequestOrdinalVDXFObject) {
      newObj = DataPacketRequestOrdinalVDXFObject.fromJson(json as any);
    } else if (obj instanceof AppEncryptionResponseOrdinalVDXFObject) {
      newObj = AppEncryptionResponseOrdinalVDXFObject.fromJson(json as any);
    } else {
      throw new Error("Unrecognized type");
    }

    return newObj as T;
  }

  it('should serialize / deserialize a GeneralTypeOrdinalVDXFObject (opaque buffer) via buffer with I address key', () => {
    const sample = Buffer.from('deadbeef', 'hex');
    const obj = new GeneralTypeOrdinalVDXFObject({ data: sample, key: VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid });

    // check some properties
    expect(obj.isDefinedByVdxfKey()).toBe(true);
    expect(obj.getIAddressKey()).toBe(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(obj.data).toEqual(sample);
    expect(obj.key).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((round as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((round as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(((round as GeneralTypeOrdinalVDXFObject).key)).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);

    // Their JSON should match hex
    const j = obj.toJson();
    expect(j.data).toEqual(sample.toString('hex'));
    const roundJ = roundTripJson<GeneralTypeOrdinalVDXFObject>(obj);
    expect(roundJ).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(((roundJ as GeneralTypeOrdinalVDXFObject).key)).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
  });

  it('should serialize / deserialize a GeneralTypeOrdinalVDXFObject (opaque buffer) via buffer with vdxfkey text key', () => {
    const sample = Buffer.from('deadbeef', 'hex');
    const obj = new GeneralTypeOrdinalVDXFObject({ 
      data: sample, 
      key: VERUSPAY_INVOICE_DETAILS_VDXF_KEY.qualifiedname.name,
      type: VDXF_OBJECT_RESERVED_BYTE_VDXF_ID_STRING
    });

    // check some properties
    expect(obj.isDefinedByTextVdxfKey()).toBe(true);
    expect(obj.getIAddressKey()).toBe(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(obj.data).toEqual(sample);
    expect(obj.key).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.qualifiedname.name);

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((round as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((round as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(((round as GeneralTypeOrdinalVDXFObject).key)).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.qualifiedname.name);

    // Their JSON should match hex
    const j = obj.toJson();
    expect(j.data).toEqual(sample.toString('hex'));
    const roundJ = roundTripJson<GeneralTypeOrdinalVDXFObject>(obj);
    expect(roundJ).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.vdxfid);
    expect(((roundJ as GeneralTypeOrdinalVDXFObject).key)).toEqual(VERUSPAY_INVOICE_DETAILS_VDXF_KEY.qualifiedname.name);
  });

  it('should serialize / deserialize a GeneralTypeOrdinalVDXFObject (opaque buffer) via buffer with FQN key', () => {
    const sample = Buffer.from('deadbeef', 'hex');
    const obj = new GeneralTypeOrdinalVDXFObject({ 
      data: sample, 
      key: "service.VRSCTEST",
      type: VDXF_OBJECT_RESERVED_BYTE_ID_OR_CURRENCY
    });

    // check some properties
    expect(obj.isDefinedByIDOrCurrencyFQN()).toBe(true);
    expect(obj.getIAddressKey()).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm");
    expect(obj.data).toEqual(sample);
    expect(obj.key).toEqual("service.VRSCTEST");

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((round as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((round as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm");
    expect(((round as GeneralTypeOrdinalVDXFObject).key)).toEqual("service.VRSCTEST");

    // Their JSON should match hex
    const j = obj.toJson();
    expect(j.data).toEqual(sample.toString('hex'));
    const roundJ = roundTripJson<GeneralTypeOrdinalVDXFObject>(obj);
    expect(roundJ).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).data).toEqual(sample);
    expect((roundJ as GeneralTypeOrdinalVDXFObject).getIAddressKey()).toEqual("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm");
    expect(((roundJ as GeneralTypeOrdinalVDXFObject).key)).toEqual("service.VRSCTEST");
  });

  it('should serialize / deserialize a DataDescriptorOrdinalVDXFObject via buffer', () => {
    // Create a DataDescriptor with some fields
    const dd = DataDescriptor.fromJson({
      version: 1,
      "flags": 2,
      "objectdata": {
        "i4GC1YGEVD21afWudGoFJVdnfjJ5XWnCQv": {
          "version": 1,
          "flags": 96,
          "mimetype": "text/plain",
          "objectdata": {
            "message": "Something 1"
          },
          "label": "label 1"
        }
      },
      "salt": "4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2"
    });

    // Force flags, etc.
    dd.setFlags();

    const obj = new DataDescriptorOrdinalVDXFObject({ data: dd });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(DataDescriptorOrdinalVDXFObject);
    const dd2 = (round as DataDescriptorOrdinalVDXFObject).data;
    expect(dd2.version.toString()).toEqual(dd.version.toString());
    expect(dd2.flags.toString()).toEqual(dd.flags.toString());
    expect(dd2.objectdata).toEqual(dd.objectdata);
    expect(dd2.label).toEqual(dd.label);
    expect(dd2.mimeType).toEqual(dd.mimeType);

    // Now JSON round trip
    const json = obj.toJson();

    // The JSON data field should be the DataDescriptor JSON
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(DataDescriptorOrdinalVDXFObject);
    const dd3 = (roundJ as DataDescriptorOrdinalVDXFObject).data;
    expect(dd3.version.toString()).toBe(dd.version.toString());
    expect(dd3.flags.toString()).toBe(dd.flags.toString());
    expect(dd3.objectdata).toEqual(dd.objectdata);
    expect(dd3.label).toBe(dd.label);
    expect(dd3.mimeType).toBe(dd.mimeType);
  });

  it('should serialize / deserialize a VerusPayInvoiceDetailsOrdinalVDXFObject via buffer', () => {
    // Create a VerusPayInvoiceDetails with some fields
    const details = new VerusPayInvoiceDetails({
      amount: new BN(10000000000, 10),
      destination: new TransferDestination({
        type: DEST_PKH,
        destination_bytes: fromBase58Check("R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx").hash
      }),
      requestedcurrencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"
    });

    details.amount = new BN(12345);
    details.requestedcurrencyid = DEFAULT_VERUS_CHAINID;

    const obj = new VerusPayInvoiceDetailsOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(VerusPayInvoiceDetailsOrdinalVDXFObject);
    const d2 = (round as VerusPayInvoiceDetailsOrdinalVDXFObject).data;
    expect(d2.requestedcurrencyid).toEqual(details.requestedcurrencyid);
    expect(d2.amount.toString()).toEqual(details.amount.toString());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(VerusPayInvoiceDetailsOrdinalVDXFObject);
    const d3 = (roundJ as VerusPayInvoiceDetailsOrdinalVDXFObject).data;
    expect(d3.requestedcurrencyid).toEqual(details.requestedcurrencyid);
    expect(d3.amount.toString()).toEqual(details.amount.toString());
  });

  it('should serialize / deserialize a IdentityUpdateRequestOrdinalVDXFObject via buffer', () => {
    const details = IdentityUpdateRequestDetails.fromCLIJson(
      TEST_CLI_ID_UPDATE_REQUEST_JSON_HEX,
      {
        systemid: TEST_SYSTEMID.toAddress() as string,
        requestid: TEST_REQUESTID.toJson(),
        expiryheight: TEST_EXPIRYHEIGHT.toString(),
        txid: TEST_TXID
      }
    );

    const obj = new IdentityUpdateRequestOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(IdentityUpdateRequestOrdinalVDXFObject);

    const d2 = (round as IdentityUpdateRequestOrdinalVDXFObject).data;
    expect(d2.systemID!.toAddress()).toEqual(details.systemID!.toAddress());
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.expiryHeight!.toString()).toEqual(details.expiryHeight!.toString());
    expect(d2.txid!.toString('hex')).toEqual(details.txid!.toString('hex'));

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(IdentityUpdateRequestOrdinalVDXFObject);

    const d3 = (roundJ as IdentityUpdateRequestOrdinalVDXFObject).data;
    expect(d3.systemID!.toAddress()).toEqual(details.systemID!.toAddress());
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d3.expiryHeight!.toString()).toEqual(details.expiryHeight!.toString());
    expect(d3.txid!.toString('hex')).toEqual(details.txid!.toString('hex'));
  });

  it('should serialize / deserialize a IdentityUpdateResponseOrdinalVDXFObject via buffer', () => {
    const details = new IdentityUpdateResponseDetails({
      requestID: TEST_REQUESTID,
      txid: Buffer.from(TEST_TXID, 'hex').reverse()
    });

    const obj = new IdentityUpdateResponseOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(IdentityUpdateResponseOrdinalVDXFObject);

    const d2 = (round as IdentityUpdateResponseOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.txid!.toString('hex')).toEqual(details.txid!.toString('hex'));

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(IdentityUpdateResponseOrdinalVDXFObject);

    const d3 = (roundJ as IdentityUpdateResponseOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d3.txid!.toString('hex')).toEqual(details.txid!.toString('hex'));
  });

  it('should serialize / deserialize a AuthenticationRequestOrdinalVDXFObject via buffer', () => {
    const details = new AuthenticationRequestDetails({
      requestID: CompactIAddressObject.fromAddress(TEST_CHALLENGE_ID, TEST_SYSTEMID.toAddress()!),
      recipientConstraints: [
        { type: RecipientConstraint.REQUIRED_ID, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_1, rootSystemName: "VRSC" }) },
        { type: RecipientConstraint.REQUIRED_SYSTEM, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_2, rootSystemName: "VRSC" }) },
        { type: RecipientConstraint.REQUIRED_PARENT, identity: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_3, rootSystemName: "VRSC" }) }
      ],
      expiryTime: new BN(2938475938457)
    });

    const obj = new AuthenticationRequestOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(AuthenticationRequestOrdinalVDXFObject);

    const d2 = (round as AuthenticationRequestOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.expiryTime!.toNumber()).toEqual(details.expiryTime!.toNumber());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(AuthenticationRequestOrdinalVDXFObject);

    const d3 = (roundJ as AuthenticationRequestOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d3.expiryTime!.toNumber()).toEqual(details.expiryTime!.toNumber());
  });

  it('should serialize / deserialize a AuthenticationResponseOrdinalVDXFObject via buffer', () => {
    const details = new AuthenticationResponseDetails({
      requestID: CompactIAddressObject.fromAddress(TEST_CHALLENGE_ID, TEST_SYSTEMID.toAddress()!)
    });

    const obj = new AuthenticationResponseOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(AuthenticationResponseOrdinalVDXFObject);

    const d2 = (round as AuthenticationResponseOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(AuthenticationResponseOrdinalVDXFObject);

    const d3 = (roundJ as AuthenticationResponseOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
  });

  it('should serialize / deserialize a ProvisionIdentityDetailsOrdinalVDXFObject', () => {
    const details = new ProvisionIdentityDetails({
      version: new BN(1, 10),
      flags: ProvisionIdentityDetails.FLAG_HAS_SYSTEMID.or(ProvisionIdentityDetails.FLAG_HAS_PARENTID),
      uri: RequestURI.fromUriString("https://127.0.0.1/provision"),
      systemID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_1, rootSystemName: "VRSC" }),
      parentID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: TEST_IDENTITY_ID_2, rootSystemName: "VRSC" })
    });

    const obj = new ProvisionIdentityDetailsOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(ProvisionIdentityDetailsOrdinalVDXFObject);

    const d2 = (round as ProvisionIdentityDetailsOrdinalVDXFObject).data;
    expect(d2.systemID!.toIAddress()).toEqual(details.systemID!.toIAddress());
    expect(d2.parentID!.toIAddress()).toEqual(details.parentID!.toIAddress());
    expect(d2.hasUri()).toBe(true);
    expect(d2.uri!.getUriString()).toEqual(details.uri!.getUriString());
    expect(d2.uri!.type.toString()).toEqual(ResponseURI.TYPE_POST.toString());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(ProvisionIdentityDetailsOrdinalVDXFObject);

    const d3 = (roundJ as ProvisionIdentityDetailsOrdinalVDXFObject).data;
    expect(d3.systemID!.toIAddress()).toEqual(details.systemID!.toIAddress());
    expect(d3.parentID!.toIAddress()).toEqual(details.parentID!.toIAddress());
    expect(d3.hasUri()).toBe(true);
    expect(d3.uri!.getUriString()).toEqual(details.uri!.getUriString());
    expect(d3.uri!.type.toString()).toEqual(ResponseURI.TYPE_POST.toString());
  });

  it('should serialize / deserialize an AppEncryptionRequestOrdinalVDXFObject', () => {
    const details = new AppEncryptionRequestDetails({
      version: AppEncryptionRequestDetails.DEFAULT_VERSION,
      flags: AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID
        .or(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID),
      encryptResponseToAddress: SaplingPaymentAddress.fromAddressString("zs1sthrnsx5vmpmdl3pcd0paltcq9jf56hjjzu87shf90mt54y3szde6zaauvxw5sfuqh565arhmh4"),
      derivationNumber: new BN(42),
      derivationID: createCompactAddressObject(CompactAddressObject.TYPE_I_ADDRESS, "i9nwxtKuVYX4MSbeULLiK2ttVi6rUEhh4X"),
      requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ")
    });

    const obj = new AppEncryptionRequestOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(AppEncryptionRequestOrdinalVDXFObject);

    const d2 = (round as AppEncryptionRequestOrdinalVDXFObject).data;
    expect(d2.encryptResponseToAddress!.toAddressString()).toEqual(details.encryptResponseToAddress!.toAddressString());
    expect(d2.derivationNumber!.toString()).toEqual(details.derivationNumber!.toString());
    expect(d2.derivationID!.toIAddress()).toEqual(details.derivationID!.toIAddress());
    expect(d2.requestID?.toAddress()).toEqual(details.requestID?.toAddress());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(AppEncryptionRequestOrdinalVDXFObject);

    const d3 = (roundJ as AppEncryptionRequestOrdinalVDXFObject).data;
    expect(d3.encryptResponseToAddress!.toAddressString()).toEqual(details.encryptResponseToAddress!.toAddressString());
    expect(d3.derivationNumber!.toString()).toEqual(details.derivationNumber!.toString());
    expect(d3.derivationID!.toIAddress()).toEqual(details.derivationID!.toIAddress());
    expect(d3.requestID?.toAddress()).toEqual(details.requestID?.toAddress());
  });

  it('getOrdinalVDXFObjectClassForType should map to correct classes', () => {
    expect(getOrdinalVDXFObjectClassForType(DATA_DESCRIPTOR_VDXF_ORDINAL))
      .toBe(DataDescriptorOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL))
      .toBe(VerusPayInvoiceDetailsOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL))
      .toBe(IdentityUpdateRequestOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(IDENTITY_UPDATE_RESPONSE_VDXF_ORDINAL))
      .toBe(IdentityUpdateResponseOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(VDXF_OBJECT_RESERVED_BYTE_I_ADDR))
      .toBe(GeneralTypeOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(AUTHENTICATION_REQUEST_VDXF_ORDINAL))
      .toBe(AuthenticationRequestOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(PROVISION_IDENTITY_DETAILS_VDXF_ORDINAL))
      .toBe(ProvisionIdentityDetailsOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(APP_ENCRYPTION_REQUEST_VDXF_ORDINAL))
      .toBe(AppEncryptionRequestOrdinalVDXFObject);
    expect(getOrdinalVDXFObjectClassForType(APP_ENCRYPTION_RESPONSE_VDXF_ORDINAL))
      .toBe(AppEncryptionResponseOrdinalVDXFObject);

    // unrecognized
    expect(() => getOrdinalVDXFObjectClassForType(new BN(999))).toThrow();
  });

  it('base OrdinalVDXFObject buffer round trip (no key path)', () => {
    // This tests the fallback when no key is provided
    const base = new OrdinalVDXFObject({ type: DATA_DESCRIPTOR_VDXF_ORDINAL });
    const buf = base.toBuffer();
    const parsed = new OrdinalVDXFObject();
    parsed.fromBuffer(buf);

    expect(parsed.type.toString()).toBe(base.type.toString());
    expect(parsed.version.toString()).toBe(base.version.toString());

    // data is undefined or empty
    expect(parsed.data).toBeUndefined();
  });

  it('should serialize / deserialize a DataResponseDetails via buffer', () => {
    const details = new DataResponseDetails({
      flags: new BN(0),
      requestID: CompactIAddressObject.fromAddress(TEST_CHALLENGE_ID),
      data: new DataDescriptor({
        version: new BN(1, 10),
        "flags": new BN(2, 10),
        "objectdata": Buffer.from("deadbeef", "hex"),
        "salt": Buffer.from("4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2", "hex")
      })
    });

    const obj = new DataResponseOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(DataResponseOrdinalVDXFObject);

    const d2 = (round as DataResponseOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(DataResponseOrdinalVDXFObject);

    const d3 = (roundJ as DataResponseOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
  });

  it('should serialize / deserialize a UserDataRequestOrdinalVDXFObject via buffer', () => {
    const details = new UserDataRequestDetails({
      version: new BN(1),
      flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
      dataType: UserDataRequestDetails.FULL_DATA,
      requestType: UserDataRequestDetails.ATTESTATION,
      searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": "Attestation Name" }],
      signer: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", rootSystemName: "VRSC" }),
      requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ")
    });

    const obj = new UserDataRequestOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(UserDataRequestOrdinalVDXFObject);

    const d2 = (round as UserDataRequestOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.searchDataKey).toEqual(details.searchDataKey);
    expect(d2.signer!.toIAddress()).toEqual(details.signer!.toIAddress());

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(UserDataRequestOrdinalVDXFObject);

    const d3 = (roundJ as UserDataRequestOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d3.searchDataKey).toEqual(details.searchDataKey);
    expect(d3.signer!.toIAddress()).toEqual(details.signer!.toIAddress());
  });

  it('should serialize / deserialize a DataPacketRequestOrdinalVDXFObject via buffer', () => {
    const details = new DataPacketRequestDetails({
      version: new BN(1),
      flags: DataPacketRequestDetails.FLAG_HAS_STATEMENTS.or(DataPacketRequestDetails.FLAG_HAS_SIGNATURE).or(DataPacketRequestDetails.FLAG_HAS_SALT),
      signableObjects: [DataDescriptor.fromJson({ version: new BN(1), label: "123", objectdata: "0011223344aabbcc", flags: DataDescriptor.FLAG_LABEL_PRESENT })],
      statements: ["Statement 1", "Statement 2"],
      signature: new VerifiableSignatureData({
        version: new BN(1),
        signatureAsVch: Buffer.from("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf", 'hex'),
        hashType: new BN(1),
        flags: new BN(0),
        identityID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_I_ADDRESS, address: "i7LaXD2cdy1zeh33eHzZaEPyueT4yQmBfW", rootSystemName: "VRSC" }),
        systemID: new CompactIAddressObject({ version: CompactAddressObject.DEFAULT_VERSION, type: CompactAddressObject.TYPE_FQN, address: "VRSC", rootSystemName: "VRSC" }),
      }),
      requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ"),
      salt: Buffer.from("4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2", "hex")
    });

    const obj = new DataPacketRequestOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(DataPacketRequestOrdinalVDXFObject);

    const d2 = (round as DataPacketRequestOrdinalVDXFObject).data;
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.signableObjects.length).toBe(1);
    expect(d2.statements?.length).toBe(2);
    expect(d2.signature?.signatureAsVch.toString('hex')).toBe("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf");
    expect(d2.salt?.toString('hex')).toBe("4f66603f256d3f757b6dc3ea44802d4041d2a1901e06005028fd60b85a5878a2");

    const json = obj.toJson();
    expect(json.data).toBeDefined();
    const roundJ = roundTripJson(obj);
    expect(roundJ).toBeInstanceOf(DataPacketRequestOrdinalVDXFObject);

    const d3 = (roundJ as DataPacketRequestOrdinalVDXFObject).data;
    expect(d3.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d3.signableObjects.length).toBe(1);
    expect(d3.statements?.length).toBe(2);
    expect(d3.signature?.signatureAsVch.toString('hex')).toBe("efc8d6b60c5b6efaeb3fce4b2c0749c317f2167549ec22b1bee411b8802d5aaf");
  });

  it('should serialize / deserialize an AppEncryptionResponseOrdinalVDXFObject', () => {

    const testViewingKey = 'zxviews1q0njl87fqqqqpq8vghkp6nz9wx48mwelukvhx3yfwg7msatglv4xy8rrh87k9z472edvlrt950qyy6r766dxnpqktxug7t2wy80s4ug325dwp9hf4vw9a6ethf2mwc9wan28p88dq8q2e8sdlw2mhffg6hy92tjyuquz7a8reqdz905x6xt6kqdx5wn7jvas0733hends8q6s8k87emn6m060xdnhgmvn4zmx0ssrwve84lzxkqu2dnfq5qsjwrtlject0an0k282rsnx0kq4';
    const testSpendingKey = 'secret-extended-key-main1q0njl87fqqqqpq8vghkp6nz9wx48mwelukvhx3yfwg7msatglv4xy8rrh87k9z472el95h53ym2tku2dazny0j2vfukgmp6fu3k7edzcx9n8egesc32sdy3xr4s2ep4skgc7t5j5zds4ws7hf2nuszf7ltfn2nc5rk3k77gyeqdz905x6xt6kqdx5wn7jvas0733hends8q6s8k87emn6m060xdnhgmvn4zmx0ssrwve84lzxkqu2dnfq5qsjwrtlject0an0k282rs0gws78';
    const testAddress = 'zs1anxaua04mnl7dz2mjpflhw0mt73uxy9rjac53lgduk02kh3lnf0hxufk9d76j5uep5j55f5h5rk';
    const testIncomingViewingKey = Buffer.from('ba9af283ecfe0552480dd7e1ce9af68a12e64da4927e8011a795cb223f4afc00"', 'hex');

    const details = new AppEncryptionResponseDetails({
      version: new BN(1),
      flags: AppEncryptionResponseDetails.FLAG_HAS_REQUEST_ID.or(AppEncryptionResponseDetails.FLAG_HAS_EXTENDED_SPENDING_KEY),
      requestID: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ"),
      incomingViewingKey: testIncomingViewingKey,
      extendedViewingKey: SaplingExtendedViewingKey.fromKeyString(testViewingKey),
      extendedSpendingKey: SaplingExtendedSpendingKey.fromKeyString(testSpendingKey),
      address: SaplingPaymentAddress.fromAddressString(testAddress)
    });

    const obj = new AppEncryptionResponseOrdinalVDXFObject({ data: details });

    const round = roundTripBuffer(obj);
    expect(round).toBeInstanceOf(AppEncryptionResponseOrdinalVDXFObject);

    const d2 = (round as AppEncryptionResponseOrdinalVDXFObject).data;
    expect(d2.incomingViewingKey.toString('hex')).toEqual(testIncomingViewingKey.toString('hex'));
    expect(d2.requestID!.toString()).toEqual(details.requestID!.toString());
    expect(d2.extendedViewingKey!.toKeyString()).toEqual(details.extendedViewingKey!.toKeyString());
    expect(d2.extendedSpendingKey!.toKeyString()).toEqual(details.extendedSpendingKey!.toKeyString());
    expect(d2.address!.toAddressString()).toEqual(details.address!.toAddressString());

  });
});
