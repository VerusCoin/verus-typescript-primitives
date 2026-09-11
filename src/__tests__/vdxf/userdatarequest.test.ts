
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
      searchdatakey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH.toString('hex') }],
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
      searchdatakey: [{ "iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1": TEST_SEARCH_DATA_HASH.toString('hex') }],
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

  test('preserves search hashes and optional fields through JSON text and binary round-trips', () => {
    const firstHash = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
    const secondHash = 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100';
    const details = new UserDataRequestDetails({
      flags: UserDataRequestDetails.FLAG_HAS_SIGNER,
      dataType: UserDataRequestDetails.PARTIAL_DATA,
      requestType: UserDataRequestDetails.CREDENTIAL,
      searchDataKeyHashType: HASH_TYPE_SHA256D,
      searchDataKey: [
        { 'iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1': Buffer.from(firstHash, 'hex') },
        { 'iAJUD5mgT6MHz8ymF49XUtBDRS7uvYqNWZ': Buffer.from(secondHash, 'hex') }
      ],
      signer: CompactIAddressObject.fromAddress('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq'),
      requestedKeys: ['iLB8SG7ErJtTYcG1f4w9RLuMJPpAsjFkiL'],
      requestID: CompactIAddressObject.fromAddress('iD4CrjbJBZmwEZQ4bCWgbHx9tBHGP9mdSQ')
    });

    const buffer = details.toBuffer();
    const json: UserDataRequestJson = JSON.parse(JSON.stringify(details.toJson()));
    expect(json.searchdatakey).toEqual([
      { 'iEEjVkvM9Niz4u2WCr6QQzx1zpVSvDFub1': firstHash },
      { 'iAJUD5mgT6MHz8ymF49XUtBDRS7uvYqNWZ': secondHash }
    ]);

    const restored = UserDataRequestDetails.fromJson(json);
    expect(restored.isValid()).toBe(true);
    expect(restored.searchDataKey).toEqual(details.searchDataKey);
    for (const entry of restored.searchDataKey) {
      expect(Buffer.isBuffer(Object.values(entry)[0])).toBe(true);
    }
    expect(restored.toBuffer()).toEqual(buffer);
    expect(restored.toJson()).toEqual(details.toJson());

    const decoded = new UserDataRequestDetails();
    expect(decoded.fromBuffer(restored.toBuffer())).toBe(buffer.length);
    expect(decoded.toJson()).toEqual(details.toJson());
  });

  test.each([
    { name: 'omitted', searchdatakey: undefined },
    { name: 'empty', searchdatakey: [] }
  ])('handles $name searchdatakey', ({ searchdatakey }) => {
    const json: UserDataRequestJson = {
      version: 1,
      flags: 0,
      datatype: UserDataRequestDetails.FULL_DATA.toNumber(),
      requesttype: UserDataRequestDetails.ATTESTATION.toNumber(),
      searchdatakey
    };

    const restored = UserDataRequestDetails.fromJson(JSON.parse(JSON.stringify(json)));
    expect(restored.searchDataKey).toEqual([]);
    expect(restored.isValid()).toBe(false);
    expect(restored.toBuffer()).toEqual(new UserDataRequestDetails().toBuffer());
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
