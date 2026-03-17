import { BN } from 'bn.js';
import base64url from 'base64url';
import { DATA_TYPE_MMRDATA, DEFAULT_VERUS_CHAINID, HASH_TYPE_SHA256, NULL_I_ADDR } from '../../constants/pbaas';
import { ContentMultiMap, DEST_PKH, fromBase58Check, GenericRequest, IDENTITY_VERSION_PBAAS, IdentityID, IdentityUpdateRequestDetails, KeyID, PartialIdentity, PartialMMRData, PartialSignData, PartialSignDataInitData, ResponseURI, SaplingPaymentAddress, TransferDestination, VerusPayInvoiceDetails } from '../../';
import { VerifiableSignatureData, VerifiableSignatureDataInterface } from '../../vdxf/classes/VerifiableSignatureData';
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { KvMap } from '../../utils/KvMap';
import { GeneralTypeOrdinalVDXFObject, IdentityUpdateRequestOrdinalVDXFObject, VerusPayInvoiceDetailsOrdinalVDXFObject } from '../../vdxf/classes/ordinals';
import { DEEPLINK_PROTOCOL_URL_CURRENT_VERSION, DEEPLINK_PROTOCOL_URL_STRING } from '../../constants/deeplink';

describe('GenericRequest — buffer / URI / QR operations', () => {
  function roundTripBuffer(req: GenericRequest): GenericRequest {
    const buf = req.toBuffer();
    const clone = new GenericRequest();
    clone.fromBuffer(buf, 0);
    
    return GenericRequest.fromQrString((GenericRequest.fromWalletDeeplinkUri(clone.toWalletDeeplinkUri())).toQrString());
  }

  it('round trips with a single detail (no signature / createdAt)', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('cafebabe', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericRequest({ details: [detail] });

    expect(req.hasMultiDetails()).toBe(false);
    expect(req.hasCreatedAt()).toBe(false);
    expect(req.isSigned()).toBe(false);

    const round = roundTripBuffer(req);
    expect(round.version.toString()).toEqual(req.version.toString());
    expect(round.flags.toString()).toEqual(req.flags.toString());
    expect(round.details.length).toBe(1);
    const d2 = round.getDetails(0);
    expect(d2).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
    expect((d2 as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    expect((d2 as GeneralTypeOrdinalVDXFObject).key).toEqual(detail.key);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with multiple details', () => {
    const d1 = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('aa', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const d2 = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('bb', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericRequest({ details: [d1, d2] });
    expect(req.hasMultiDetails()).toBe(true);

    const round = roundTripBuffer(req);
    expect(round.details.length).toBe(2);
    expect((round.getDetails(0) as GeneralTypeOrdinalVDXFObject).data).toEqual(d1.data);
    expect((round.getDetails(1) as GeneralTypeOrdinalVDXFObject).data).toEqual(d2.data);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with createdAt, signature, responseURI, requestID, encryptResponseToAddress, and appOrDelegatedID', () => {
    const sig = new VerifiableSignatureData({
      flags: new BN(0),
      version: new BN(1),
      systemID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      hashType: HASH_TYPE_SHA256,
      identityID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      signatureAsVch: Buffer.from('AgX3RgAAAUEgHAVIHuui1Sc9oLxLbglKvmrv47JJLiM0/RBQwzYL1dlamI/2o9qBc93d79laLXWMhQomqZ4U3Mlr3ueuwl4JFA==', 'base64'),
      vdxfKeys: [DEFAULT_VERUS_CHAINID, DEFAULT_VERUS_CHAINID],
      vdxfKeyNames: ["VRSC", "VRSC"],
      boundHashes: [Buffer.from('abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd', 'hex')],
      statements: [Buffer.from('1234123412341234123412341234123412341234123412341234123412341234', 'hex')]
    });

    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('abcd', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });

    const createdAt = new BN(9999);
    const saplingAddr = "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"

    const req = new GenericRequest({
      details: [detail],
      signature: sig,
      requestID: CompactIAddressObject.fromAddress(NULL_I_ADDR),
      createdAt,
      encryptResponseToAddress: SaplingPaymentAddress.fromAddressString(saplingAddr),
      appOrDelegatedID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      responseURIs: [ResponseURI.fromUriString("https://verus.io/callback", ResponseURI.TYPE_POST), ResponseURI.fromUriString("https://example.com/callback", ResponseURI.TYPE_REDIRECT)]
    });

    expect(req.isSigned()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);

    const round = roundTripBuffer(req);
    expect(round.signature).toBeDefined();
    expect(round.signature?.signatureAsVch.toString('base64')).toBe(sig.signatureAsVch.toString('base64'))
    expect(round.createdAt?.toString()).toEqual(createdAt.toString());
    expect(round.hasResponseURIs()).toBe(true)
    expect(round.responseURIs![0].getUriString()).toBe("https://verus.io/callback")
    expect(round.responseURIs![0].type.toString()).toBe(ResponseURI.TYPE_POST.toString())
    expect(round.responseURIs![1].getUriString()).toBe("https://example.com/callback")
    expect(round.responseURIs![1].type.toString()).toBe(ResponseURI.TYPE_REDIRECT.toString())
    expect(round.requestID?.toAddress()).toBe(NULL_I_ADDR)
    expect(round.appOrDelegatedID?.toIAddress()).toBe(DEFAULT_VERUS_CHAINID)
    expect(round.hasEncryptResponseToAddress()).toBe(true)
    expect(round.encryptResponseToAddress?.toAddressString()).toBe(saplingAddr)
    const d2 = round.getDetails(0);
    expect((d2 as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with createdAt, and valid signature that can be hashed', () => {
    const sig = new VerifiableSignatureData({
      systemID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      identityID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      signatureAsVch: Buffer.from('AgX3RgAAAUEgHAVIHuui1Sc9oLxLbglKvmrv47JJLiM0/RBQwzYL1dlamI/2o9qBc93d79laLXWMhQomqZ4U3Mlr3ueuwl4JFA==', 'base64'),
    });

    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('abcd', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });

    const createdAt = new BN(9999);
    const saplingAddr = "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"

    const req = new GenericRequest({
      details: [detail],
      signature: sig,
      createdAt,
      encryptResponseToAddress: SaplingPaymentAddress.fromAddressString(saplingAddr)
    });

    expect(req.isSigned()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);
    expect(req.getDetailsIdentitySignatureHash(1000)).toBeDefined();
    expect(req.signature?.signatureVersion.toString()).toBe("2");

    const round = roundTripBuffer(req);
    expect(round.signature).toBeDefined();
    expect(round.signature?.signatureAsVch.toString('base64')).toBe(sig.signatureAsVch.toString('base64'))
    expect(round.createdAt?.toString()).toEqual(createdAt.toString());
    expect(round.hasEncryptResponseToAddress()).toBe(true)
    expect(round.encryptResponseToAddress?.toAddressString()).toBe(saplingAddr)
    const d2 = round.getDetails(0);
    expect((d2 as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with createdAt, signature that can be hashed, and invoice', () => {
    const sig = new VerifiableSignatureData({
      systemID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      identityID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      signatureAsVch: Buffer.from('AgX3RgAAAUEgHAVIHuui1Sc9oLxLbglKvmrv47JJLiM0/RBQwzYL1dlamI/2o9qBc93d79laLXWMhQomqZ4U3Mlr3ueuwl4JFA==', 'base64'),
    });

    const details = new VerusPayInvoiceDetails({
      amount: new BN(10000000000, 10),
      destination: new TransferDestination({
        type: DEST_PKH,
        destinationBytes: fromBase58Check("R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx").hash
      }),
      requestedcurrencyid: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
      maxestimatedslippage: new BN(40000000, 10),
      expiryheight: new BN(2000000, 10),
      acceptedsystems: ["iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu", "iBDkVJqik6BrtcDBQfFygffiYzTMy6EuhU"]
    })

    details.setFlags({
      acceptsConversion: true,
      expires: true,
      acceptsNonVerusSystems: true
    })

    const createdAt = new BN(9999);
    const saplingAddr = "zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"

    const req = new GenericRequest({
      details: [new VerusPayInvoiceDetailsOrdinalVDXFObject({
        data: details,
      })],
      signature: sig,
      createdAt,
      encryptResponseToAddress: SaplingPaymentAddress.fromAddressString(saplingAddr)
    });

    expect(req.isSigned()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);
    expect(req.getDetailsIdentitySignatureHash(1000)).toBeDefined();
    expect(req.signature?.signatureVersion.toString()).toBe("2");

    const round = roundTripBuffer(req);
    expect(round.signature).toBeDefined();
    expect(round.signature?.signatureAsVch.toString('base64')).toBe(sig.signatureAsVch.toString('base64'))
    expect(round.createdAt?.toString()).toEqual(createdAt.toString());
    expect(round.hasEncryptResponseToAddress()).toBe(true)
    expect(round.encryptResponseToAddress?.toAddressString()).toBe(saplingAddr)
    const d2 = round.getDetails(0);
    expect((d2 as VerusPayInvoiceDetailsOrdinalVDXFObject).data).toEqual(details);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('same hash before/after signature', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const systemID = IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    const requestID = CompactIAddressObject.fromAddress("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j");
    const createdAt = new BN("1700000000", 10);
    const expiryHeight = new BN("123456");
    const salt = Buffer.from('=H319X:)@H2Z');

    const partialIdentity = new PartialIdentity({
      flags: new BN("0"),
      version: IDENTITY_VERSION_PBAAS,
      minSigs: new BN(1),
      primaryAddresses: [
        KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"),
        KeyID.fromAddress("RP4Qct9197i5vrS11qHVtdyRRoAHVNJS47")
      ],
      parent: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      systemId: IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq"),
      name: "TestID",
      contentMap: contentmap,
      contentMultiMap: ContentMultiMap.fromJson({
        iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j: [
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' },
          { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
        ],
        iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq: '6868686868686868686868686868686868686868',
        i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7: [
          '6868686868686868686868686868686868686868',
          '6868686868686868686868686868686868686868',
          '6868686868686868686868686868686868686868'
        ],
        i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz: { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'Test String 123454321' }
      }),
      recoveryAuthority: IdentityID.fromAddress("i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz"),
      revocationAuthority: IdentityID.fromAddress("i5v3h9FWVdRFbNHU7DfcpGykQjRaHtMqu7"),
      unlockAfter: new BN("123456", 10),
      privateAddresses: [SaplingPaymentAddress.fromAddressString("zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa")]
    });

    const mmrData = new PartialMMRData({
      flags: new BN('0', 10),
      data: [
        { type: new BN('2', 10), data: Buffer.from('src/__tests__/pbaas/partialmmrdata.test.ts', 'utf-8') },
        { type: new BN('3', 10), data: Buffer.from('Hello test message 12345', 'utf-8') },
      ],
      salt: [Buffer.from('=H319X:)@H2Z'), Buffer.from('s*1UHmVr?feI')],
      mmrhashtype: new BN('1', 10), // e.g. PartialMMRData.HASH_TYPE_SHA256
      priormmr: [
        Buffer.from('80a28cdff6bd91a2e96a473c234371fd8b67705a8c4956255ce7b8c7bf20470f02381c9a935f06cdf986a7c5facd77625befa11cf9fd4b59857b457394a8af979ab2830087a3b27041b37bc318484175'), 
        Buffer.from('d97fd4bbd9e88ca0c5822c12d5c9b272b2044722aa48b1c8fde178be6b59ccea509f403d3acd226c16ba3c32f0cb92e2fcaaa02b40d0bc5257e0fbf2e6c3d3d7f1a1df066967b193d131158ba5bef732')
      ],
    })

    const baseSignDataWithMMR: PartialSignDataInitData = {
      flags: new BN('0', 10),
      address: IdentityID.fromAddress('iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq'),
      prefixString: Buffer.from('example prefix', 'utf8'),
      vdxfKeys: [IdentityID.fromAddress('i81XL8ZpuCo9jmWLv5L5ikdxrGuHrrpQLz')],
      vdxfKeyNames: [Buffer.from('VDXFNAME', 'utf8')],
      boundHashes: [Buffer.from('0873c6ba879ce87f5c207a4382b273cac164361af0b9fe63d6d7b0d7af401fec', 'hex'), Buffer.from('0873c6ba879ce87f5c207a4382b273cac164361af0b9fe63d6d7b0d7af401fec', 'hex')],
      hashType: new BN('1', 10),
      encryptToAddress: SaplingPaymentAddress.fromAddressString(
        'zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa'
      ),
      createMMR: true,
      signature: Buffer.from('AeNjMwABQSAPBEuajDkRyy+OBJsWmDP3EUoqN9UjCJK9nmoSQiNoZWBK19OgGCYdEqr1CiFfBf8SFHVoUv4r2tb5Q3qsMTrp', 'base64'),
      dataType: DATA_TYPE_MMRDATA,
      data: mmrData, // This is the PartialMMRData object
    }

    const signdatamap = new KvMap<PartialSignData>();
    signdatamap.set(CompactIAddressObject.fromAddress("iBvyi1nuCrTA4g44xN9N7EU1t6a7gwb4h8"), new PartialSignData(baseSignDataWithMMR))

    const requestDetails = new IdentityUpdateRequestDetails({ 
      requestID: requestID,
      systemID: systemID, 
      identity: partialIdentity, 
      expiryHeight: expiryHeight,
      signDataMap: signdatamap
    });

    const unsignedSigData: VerifiableSignatureDataInterface = {
      systemID: CompactIAddressObject.fromAddress(systemID.toAddress()!),
      identityID: CompactIAddressObject.fromAddress(systemID.toAddress()!)
    }

    const req = new GenericRequest({
      createdAt: createdAt,
      salt,
      encryptResponseToAddress: SaplingPaymentAddress.fromAddressString("zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa"),
      details: [
        new IdentityUpdateRequestOrdinalVDXFObject({ data: requestDetails })
      ],
      signature: new VerifiableSignatureData(unsignedSigData)
    });

    const height = 18167;

    req.setSigned();

    const preSigHash = req.getDetailsIdentitySignatureHash(height);

    req.signature!.signatureAsVch = Buffer.from("AgX3RgAAAUEgrnmmyGip2lFhWM0pA2zDifZnAX+ZhPhFEzhhQuPOzr8vLYDpa1PzJNMmMm4dKOfwTdohSFeIPE3SCPR99cZ1vg==", 'base64');

    const postSigHash = req.getDetailsIdentitySignatureHash(height);

    expect(preSigHash.toString('hex')).toBe(postSigHash.toString('hex'));
  });

  it('toString / fromQrString consistency', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('feed', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericRequest({ details: [detail] });

    const str = req.toString();
    const buf = base64url.toBuffer(str);
    const parsed = new GenericRequest();
    parsed.fromBuffer(buf, 0);
    expect(parsed.details[0].toJson()).toEqual(detail.toJson());
  });

  it('deeplink URI round trip', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('face', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericRequest({ details: [detail] });
    const uri = req.toWalletDeeplinkUri();

    expect(uri).toContain(`${DEEPLINK_PROTOCOL_URL_STRING}://${DEEPLINK_PROTOCOL_URL_CURRENT_VERSION}/`);

    const parsed = GenericRequest.fromWalletDeeplinkUri(uri);
    expect(parsed.version.toString()).toEqual(req.version.toString());
    expect(parsed.details[0].toJson()).toEqual(detail.toJson());
    expect(parsed.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('fromQrString should parse correctly', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('bead', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericRequest({ details: [detail] });
    const qr = req.toQrString();
    const parsed = GenericRequest.fromQrString(qr);
    expect(parsed.details[0].toJson()).toEqual(detail.toJson());
    expect(parsed.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('fromBuffer with empty buffer should throw', () => {
    const empty = Buffer.alloc(0);
    const req = new GenericRequest();
    expect(() => {
      req.fromBuffer(empty, 0);
    }).toThrow("Cannot create request from empty buffer");
  });
});