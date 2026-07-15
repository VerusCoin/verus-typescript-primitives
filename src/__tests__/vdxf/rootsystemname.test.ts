import { BN } from 'bn.js';
import {
  CompactAddressObject,
  CompactIAddressObject,
  CompactXAddressObject,
  GenericRequest,
  GenericResponse,
  UserDataRequestDetails,
  UserDataRequestOrdinalVDXFObject,
  AppEncryptionRequestDetails,
  AppEncryptionRequestOrdinalVDXFObject,
  AuthenticationRequestDetails,
  AuthenticationRequestOrdinalVDXFObject,
  RecipientConstraint,
  ProvisionIdentityDetails,
  ProvisionIdentityDetailsOrdinalVDXFObject,
  VerusPayInvoiceDetails,
  VerusPayInvoiceDetailsOrdinalVDXFObject,
  DataPacketRequestDetails,
  DataPacketRequestOrdinalVDXFObject
} from '../../vdxf/classes';
import { DataDescriptor } from '../../pbaas';

const TEST_SEARCH_DATA_HASH = Buffer.alloc(32, 1);

describe('rootSystemName propagation through object tree', () => {
  describe('GenericRequest with testnet flag', () => {
    test('UserDataRequestDetails in testnet request receives VRSCTEST', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "alice.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const ordinal = new UserDataRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({
        details: [ordinal],
        flags: GenericRequest.FLAG_IS_TESTNET
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      expect(deserialized.isTestnet()).toBe(true);
      const deserializedDetails = deserialized.getDetails(0) as UserDataRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.signer!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.signer!.address).toBe('alice');
    });

    test('UserDataRequestDetails in mainnet request receives VRSC', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "bob.vrsc",
          rootSystemName: "VRSC"
        })
      });

      const ordinal = new UserDataRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({ details: [ordinal] });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      expect(deserialized.isTestnet()).toBe(false);
      const deserializedDetails = deserialized.getDetails(0) as UserDataRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.signer!.rootSystemName).toBe('VRSC');
      expect(deserializedDetails.data.signer!.address).toBe('bob');
    });

    test('AppEncryptionRequestDetails derivationID and requestID receive correct rootSystemName', () => {
      const details = new AppEncryptionRequestDetails({
        version: AppEncryptionRequestDetails.DEFAULT_VERSION,
        flags: AppEncryptionRequestDetails.FLAG_HAS_DERIVATION_ID.or(AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID),
        derivationNumber: new BN(1),
        derivationID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "derivation.vrsctest",
          rootSystemName: "VRSCTEST"
        }),
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "request.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const ordinal = new AppEncryptionRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({
        details: [ordinal],
        flags: GenericRequest.FLAG_IS_TESTNET
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as AppEncryptionRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.derivationID!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.derivationID!.address).toBe('derivation');
      expect(deserializedDetails.data.requestID!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.requestID!.address).toBe('request');
    });
  });

  describe('RecipientConstraint nested in AuthenticationRequestDetails', () => {
    test('RecipientConstraint identity receives correct rootSystemName in testnet', () => {
      const constraint = new RecipientConstraint({
        type: RecipientConstraint.REQUIRED_SYSTEM,
        identity: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const details = new AuthenticationRequestDetails({
        flags: AuthenticationRequestDetails.FLAG_HAS_RECIPIENT_CONSTRAINTS,
        recipientConstraints: [constraint]
      });

      const ordinal = new AuthenticationRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({
        details: [ordinal],
        flags: GenericRequest.FLAG_IS_TESTNET
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as AuthenticationRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.recipientConstraints![0].identity.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.recipientConstraints![0].identity.address).toBe('vrsctest');
    });

    test('Multiple RecipientConstraints all receive correct rootSystemName', () => {
      const constraints = [
        new RecipientConstraint({
          type: RecipientConstraint.REQUIRED_SYSTEM,
          identity: new CompactIAddressObject({
            type: CompactAddressObject.TYPE_FQN,
            address: "system.vrsc",
            rootSystemName: "VRSC"
          })
        }),
        new RecipientConstraint({
          type: RecipientConstraint.REQUIRED_PARENT,
          identity: new CompactIAddressObject({
            type: CompactAddressObject.TYPE_FQN,
            address: "parent.vrsc@",
            rootSystemName: "VRSC"
          })
        })
      ];

      const details = new AuthenticationRequestDetails({
        flags: AuthenticationRequestDetails.FLAG_HAS_RECIPIENT_CONSTRAINTS,
        recipientConstraints: constraints
      });

      const ordinal = new AuthenticationRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({ details: [ordinal] });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as AuthenticationRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.recipientConstraints![0].identity.rootSystemName).toBe('VRSC');
      expect(deserializedDetails.data.recipientConstraints![0].identity.address).toBe('system');
      expect(deserializedDetails.data.recipientConstraints![1].identity.rootSystemName).toBe('VRSC');
      expect(deserializedDetails.data.recipientConstraints![1].identity.address).toBe('parent@');
    });
  });

  describe('ProvisionIdentityDetails with multiple CompactAddressObjects', () => {
    test('systemID, parentID, and identityID all receive correct rootSystemName', () => {
      const details = new ProvisionIdentityDetails({
        flags: ProvisionIdentityDetails.FLAG_HAS_SYSTEMID
          .or(ProvisionIdentityDetails.FLAG_HAS_PARENTID)
          .or(ProvisionIdentityDetails.FLAG_HAS_IDENTITY_ID),
        systemID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "vrsctest",
          rootSystemName: "VRSCTEST"
        }),
        parentID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "parent.vrsctest",
          rootSystemName: "VRSCTEST"
        }),
        identityID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "identity.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const ordinal = new ProvisionIdentityDetailsOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({
        details: [ordinal],
        flags: GenericRequest.FLAG_IS_TESTNET
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as ProvisionIdentityDetailsOrdinalVDXFObject;
      expect(deserializedDetails.data.systemID!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.systemID!.address).toBe('vrsctest');
      expect(deserializedDetails.data.parentID!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.parentID!.address).toBe('parent');
      expect(deserializedDetails.data.identityID!.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.identityID!.address).toBe('identity');
    });
  });

  describe('VerusPayInvoiceDetails with tag', () => {
    test('tag CompactXAddressObject receives correct rootSystemName', () => {
      const details = new VerusPayInvoiceDetails({
        amount: new BN(1000000),
        requestedcurrencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
        tag: new CompactXAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "tag.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });
      details.setFlags({
        isTagged: true,
        isTestnet: true,
        acceptsAnyDestination: true
      });

      const ordinal = new VerusPayInvoiceDetailsOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({
        details: [ordinal],
        flags: GenericRequest.FLAG_IS_TESTNET
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as VerusPayInvoiceDetailsOrdinalVDXFObject;
      expect(deserializedDetails.data.tag.rootSystemName).toBe('VRSCTEST');
      expect(deserializedDetails.data.tag.address).toBe('tag');
    });
  });

  describe('DataPacketRequestDetails with requestID', () => {
    test('requestID receives correct rootSystemName in mainnet', () => {
      const details = new DataPacketRequestDetails({
        flags: DataPacketRequestDetails.FLAG_HAS_REQUEST_ID,
        signableObjects: [new DataDescriptor()],
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "packet.vrsc",
          rootSystemName: "VRSC"
        })
      });

      const ordinal = new DataPacketRequestOrdinalVDXFObject({ data: details });
      const request = new GenericRequest({ details: [ordinal] });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      const deserializedDetails = deserialized.getDetails(0) as DataPacketRequestOrdinalVDXFObject;
      expect(deserializedDetails.data.requestID!.rootSystemName).toBe('VRSC');
      expect(deserializedDetails.data.requestID!.address).toBe('packet');
    });
  });

  describe('Complex nested structures', () => {
    test('Multiple Details classes in same envelope all receive correct rootSystemName', () => {
      const userDataDetails = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER.or(UserDataRequestDetails.FLAG_HAS_REQUEST_ID),
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "signer.vrsctest",
          rootSystemName: "VRSCTEST"
        }),
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "request1.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const appEncryptionDetails = new AppEncryptionRequestDetails({
        version: AppEncryptionRequestDetails.DEFAULT_VERSION,
        flags: AppEncryptionRequestDetails.FLAG_HAS_REQUEST_ID,
        derivationNumber: new BN(1),
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "request2.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const request = new GenericRequest({
        details: [
          new UserDataRequestOrdinalVDXFObject({ data: userDataDetails }),
          new AppEncryptionRequestOrdinalVDXFObject({ data: appEncryptionDetails })
        ],
        flags: GenericRequest.FLAG_IS_TESTNET.or(GenericRequest.FLAG_MULTI_DETAILS)
      });

      const buffer = request.toBuffer();
      const deserialized = new GenericRequest();
      deserialized.fromBuffer(buffer);

      expect(deserialized.hasMultiDetails()).toBe(true);
      expect(deserialized.isTestnet()).toBe(true);

      // Check first detail
      const detail1 = deserialized.getDetails(0) as UserDataRequestOrdinalVDXFObject;
      expect(detail1.data.signer!.rootSystemName).toBe('VRSCTEST');
      expect(detail1.data.signer!.address).toBe('signer');
      expect(detail1.data.requestID!.rootSystemName).toBe('VRSCTEST');
      expect(detail1.data.requestID!.address).toBe('request1');

      // Check second detail
      const detail2 = deserialized.getDetails(1) as AppEncryptionRequestOrdinalVDXFObject;
      expect(detail2.data.requestID!.rootSystemName).toBe('VRSCTEST');
      expect(detail2.data.requestID!.address).toBe('request2');
    });
  });
});
