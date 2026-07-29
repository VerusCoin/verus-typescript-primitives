
import { CompactAddressObject, CompactIAddressObject, UserDataRequestDetails, UserDataRequestJson } from "../../vdxf/classes";
import { DEFAULT_HASH_TYPE, HASH_TYPE_SHA256D } from "../../constants/pbaas";

const TEST_SEARCH_DATA_HASH = Buffer.alloc(32, 1);

describe('Serializes and deserializes UserDataRequestDetails', () => {
  test('(de)serialize UserDataRequestDetails', () => {

    const provisionJson: UserDataRequestJson = {
      version: 1,
      flags: UserDataRequestDetails.FLAG_HAS_SIGNER.toNumber(),
      datatype: UserDataRequestDetails.FULL_DATA.toNumber(),
      requesttype: UserDataRequestDetails.ATTESTATION.toNumber(),
      searchdatakey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
      signer: { version: 1, type: CompactAddressObject.TYPE_I_ADDRESS.toNumber(), address: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", rootsystemname: "VRSC" },
      requestid: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ").toJson()
    }

    const e = UserDataRequestDetails.fromJson(provisionJson);
    const r = e.toBuffer();
    const rFromBuf = new UserDataRequestDetails();
    rFromBuf.fromBuffer(r);

    expect(e.searchDataKeyHashType.eq(DEFAULT_HASH_TYPE)).toBe(true);
    expect(Buffer.isBuffer(rFromBuf.searchDataKey[0]["iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1"])).toBe(true);
    expect(rFromBuf.searchDataKeyHashType.eq(DEFAULT_HASH_TYPE)).toBe(true);
    expect(rFromBuf.toBuffer().toString('hex')).toBe(r.toString('hex'))
  });
  test('(de)serialize UserDataRequestDetails with requestedkeys', async () => {

    const provisionJson: UserDataRequestJson = {
      version: 1,
      flags: UserDataRequestDetails.FLAG_HAS_SIGNER.toNumber(),
      datatype: UserDataRequestDetails.PARTIAL_DATA.toNumber(),
      requesttype: UserDataRequestDetails.ATTESTATION.toNumber(),
      searchdatakeyhashtype: HASH_TYPE_SHA256D.toNumber(),
      searchdatakey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
      signer: { version: 1, type: CompactAddressObject.TYPE_FQN.toNumber(), address: "bob@", rootsystemname: "VRSC" },
      requestedkeys: ["iLB8SG7ErJtTYcG1f4w9RLuMJPpAsjFkiL"],
      requestid: CompactIAddressObject.fromAddress("iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ").toJson()
    }

    const e = UserDataRequestDetails.fromJson(provisionJson);
    const r = e.toBuffer();
    const rFromBuf = new UserDataRequestDetails();
    rFromBuf.fromBuffer(r);

    expect(rFromBuf.searchDataKeyHashType.eq(HASH_TYPE_SHA256D)).toBe(true);
    expect(rFromBuf.toBuffer().toString('hex')).toBe(r.toString('hex'))
  });

  describe('rootSystemName propagation and FQN suffix optimization', () => {
    test('FQN with .vrsc suffix is stripped when rootSystemName is VRSC', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "alice.vrsc",
          rootSystemName: "VRSC"
        })
      });

      const buffer = details.toBuffer();
      const deserialized = new UserDataRequestDetails();
      deserialized.fromBuffer(buffer, 0, 'VRSC');

      // The suffix should be stripped during serialization
      expect(deserialized.signer!.address).toBe('alice');
      expect(deserialized.signer!.rootSystemName).toBe('VRSC');
    });

    test('FQN with .vrsctest suffix is stripped when rootSystemName is VRSCTEST', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "bob.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const buffer = details.toBuffer();
      const deserialized = new UserDataRequestDetails();
      deserialized.fromBuffer(buffer, 0, 'VRSCTEST');

      // The suffix should be stripped during serialization
      expect(deserialized.signer!.address).toBe('bob');
      expect(deserialized.signer!.rootSystemName).toBe('VRSCTEST');
    });

    test('FQN with @ symbol preserves @ after suffix stripping', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "charlie.vrsc@",
          rootSystemName: "VRSC"
        })
      });

      const buffer = details.toBuffer();
      const deserialized = new UserDataRequestDetails();
      deserialized.fromBuffer(buffer, 0, 'VRSC');

      // The suffix should be stripped but @ should remain
      expect(deserialized.signer!.address).toBe('charlie@');
      expect(deserialized.signer!.rootSystemName).toBe('VRSC');
    });

    test('requestID CompactAddressObject receives correct rootSystemName', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_REQUEST_ID,
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "request.vrsctest",
          rootSystemName: "VRSCTEST"
        })
      });

      const buffer = details.toBuffer();
      const deserialized = new UserDataRequestDetails();
      deserialized.fromBuffer(buffer, 0, 'VRSCTEST');

      expect(deserialized.requestID!.address).toBe('request');
      expect(deserialized.requestID!.rootSystemName).toBe('VRSCTEST');
    });

    test('both signer and requestID receive correct rootSystemName', () => {
      const details = new UserDataRequestDetails({
        version: UserDataRequestDetails.DEFAULT_VERSION,
        flags: UserDataRequestDetails.FLAG_HAS_SIGNER.or(UserDataRequestDetails.FLAG_HAS_REQUEST_ID),
        dataType: UserDataRequestDetails.FULL_DATA,
        requestType: UserDataRequestDetails.ATTESTATION,
        searchDataKey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH }],
        signer: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "signer.vrsc",
          rootSystemName: "VRSC"
        }),
        requestID: new CompactIAddressObject({
          type: CompactAddressObject.TYPE_FQN,
          address: "request.vrsc",
          rootSystemName: "VRSC"
        })
      });

      const buffer = details.toBuffer();
      const deserialized = new UserDataRequestDetails();
      deserialized.fromBuffer(buffer, 0, 'VRSC');

      expect(deserialized.signer!.address).toBe('signer');
      expect(deserialized.signer!.rootSystemName).toBe('VRSC');
      expect(deserialized.requestID!.address).toBe('request');
      expect(deserialized.requestID!.rootSystemName).toBe('VRSC');
    });
  });
});
