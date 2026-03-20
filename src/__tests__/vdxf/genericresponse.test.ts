import { BN } from 'bn.js';
import base64url from 'base64url';
import { DEFAULT_VERUS_CHAINID, HASH_TYPE_SHA256, NULL_I_ADDR } from '../../constants/pbaas';
import { GenericResponse, IdentityID, IdentityUpdateResponseDetails } from '../../';
import { createHash } from 'crypto';
import { VerifiableSignatureData, VerifiableSignatureDataInterface } from '../../vdxf/classes/VerifiableSignatureData';
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { GeneralTypeOrdinalVDXFObject, IdentityUpdateResponseOrdinalVDXFObject } from '../../vdxf/classes/ordinals';
import { TEST_TXID } from '../constants/fixtures';

describe('GenericResponse — buffer / URI / QR operations', () => {
  function roundTripBuffer(req: GenericResponse): GenericResponse {
    const buf = req.toBuffer();
    const clone = new GenericResponse();
    clone.fromBuffer(buf, 0);

    return clone;
  }

  function rawDetailsSha256(req: GenericResponse): Buffer {
    // replicate the same behavior as getRawDetailsSha256()
    const buf = req['toBufferOptionalSig'](false);  // call internal method
    return createHash("sha256").update(buf).digest();
  }

  it('round trips with a single detail (no signature / createdAt)', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('cafebabe', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericResponse({ details: [detail] });

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
    const req = new GenericResponse({ details: [d1, d2] });
    expect(req.hasMultiDetails()).toBe(true);

    const round = roundTripBuffer(req);
    expect(round.details.length).toBe(2);
    expect((round.getDetails(0) as GeneralTypeOrdinalVDXFObject).data).toEqual(d1.data);
    expect((round.getDetails(1) as GeneralTypeOrdinalVDXFObject).data).toEqual(d2.data);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with createdAt, signature, requestID, and requestHash/requestHashType', () => {
    const sig = new VerifiableSignatureData({
      flags: new BN(0),
      version: new BN(1),
      systemID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      hashType: HASH_TYPE_SHA256,
      identityID: CompactIAddressObject.fromAddress(DEFAULT_VERUS_CHAINID),
      signatureAsVch: Buffer.from('abcd', 'hex'),
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
    const requestHash = Buffer.from('abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd', 'hex');
    const requestHashType = HASH_TYPE_SHA256;

    const req = new GenericResponse({
      details: [detail],
      requestID: CompactIAddressObject.fromAddress(NULL_I_ADDR),
      signature: sig,
      createdAt,
      requestHash: requestHash,
      requestHashType: requestHashType
    });

    expect(req.isSigned()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);

    const round = roundTripBuffer(req);
    expect(round.signature).toBeDefined();
    expect(round.createdAt?.toString()).toEqual(createdAt.toString());
    expect(round.hasRequestHash()).toBe(true)
    expect(round.requestHash?.toString('hex')).toBe(requestHash.toString('hex'))
    expect(round.requestHashType?.toNumber()).toBe(requestHashType.toNumber())
    expect(round.requestID?.toAddress()).toBe(NULL_I_ADDR)
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
    const requestHash = Buffer.from('abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd', 'hex');
    const requestHashType = HASH_TYPE_SHA256;

    const req = new GenericResponse({
      details: [detail],
      signature: sig,
      createdAt,
      requestHash: requestHash,
      requestHashType: requestHashType
    });

    expect(req.isSigned()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);
    expect(req.getDetailsIdentitySignatureHash(1000)).toBeDefined();
    expect(req.signature?.signatureVersion.toString()).toBe("2");

    const round = roundTripBuffer(req);
    expect(round.signature).toBeDefined();
    expect(round.createdAt?.toString()).toEqual(createdAt.toString());
    expect(round.hasRequestHash()).toBe(true)
    expect(round.requestHash?.toString('hex')).toBe(requestHash.toString('hex'))
    expect(round.requestHashType?.toNumber()).toBe(requestHashType.toNumber())
    const d2 = round.getDetails(0);
    expect((d2 as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('same hash before/after signature', () => {
    const contentmap = new Map();
    contentmap.set("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j", Buffer.alloc(32));
    contentmap.set("iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c", Buffer.alloc(32));

    const systemID = IdentityID.fromAddress("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    const requestID = CompactIAddressObject.fromAddress("iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j")
    const createdAt = new BN("1700000000", 10);
    const salt = Buffer.from('=H319X:)@H2Z');

    const responseDetails = new IdentityUpdateResponseDetails({
      requestID: requestID,
      txid: Buffer.from(TEST_TXID, 'hex')
    });

    const unsignedSigData: VerifiableSignatureDataInterface = {
      systemID: CompactIAddressObject.fromAddress(systemID.toAddress()!),
      identityID: CompactIAddressObject.fromAddress(systemID.toAddress()!)
    }

    const req = new GenericResponse({
      createdAt: createdAt,
      salt,
      details: [
        new IdentityUpdateResponseOrdinalVDXFObject({ data: responseDetails })
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
    const req = new GenericResponse({ details: [detail] });

    const str = req.toString();
    const buf = base64url.toBuffer(str);
    const parsed = new GenericResponse();
    parsed.fromBuffer(buf, 0);
    expect(parsed.details[0].toJson()).toEqual(detail.toJson());
  });

  it('round trips with handledBy set to 0', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('cafebabe', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericResponse({ details: [detail], handledBy: 0 });

    expect(req.hasHandledBy()).toBe(true);
    expect(req.handledBy).toBe(0);

    const round = roundTripBuffer(req);
    expect(round.hasHandledBy()).toBe(true);
    expect(round.handledBy).toBe(0);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('round trips with handledBy set to 1', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('cafebabe', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericResponse({ details: [detail], handledBy: 1 });

    expect(req.hasHandledBy()).toBe(true);
    expect(req.handledBy).toBe(1);

    const round = roundTripBuffer(req);
    expect(round.hasHandledBy()).toBe(true);
    expect(round.handledBy).toBe(1);
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));

    const json = round.toJson();
    expect(json.handledby).toBe(1);
  });

  it('round trips with handledBy and requestHash', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('abcd', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const requestHash = Buffer.from('abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd', 'hex');
    const requestHashType = HASH_TYPE_SHA256;

    const req = new GenericResponse({
      details: [detail],
      createdAt: new BN(9999),
      requestHash,
      requestHashType,
      handledBy: 1
    });

    expect(req.hasHandledBy()).toBe(true);
    expect(req.hasRequestHash()).toBe(true);
    expect(req.hasCreatedAt()).toBe(true);

    const round = roundTripBuffer(req);
    expect(round.hasHandledBy()).toBe(true);
    expect(round.handledBy).toBe(1);
    expect(round.hasRequestHash()).toBe(true);
    expect(round.requestHash?.toString('hex')).toBe(requestHash.toString('hex'));
    expect(round.requestHashType?.toNumber()).toBe(requestHashType.toNumber());
    expect(round.createdAt?.toString()).toEqual("9999");
    expect(round.toBuffer().toString('hex')).toEqual(req.toBuffer().toString('hex'));
  });

  it('does not set handledBy flag when handledBy is undefined', () => {
    const detail = new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from('cafebabe', 'hex'),
      key: DEFAULT_VERUS_CHAINID
    });
    const req = new GenericResponse({ details: [detail] });

    expect(req.hasHandledBy()).toBe(false);

    const round = roundTripBuffer(req);
    expect(round.hasHandledBy()).toBe(false);
    expect(round.handledBy).toBeUndefined();
  });

  it('fromBuffer with empty buffer should throw', () => {
    const empty = Buffer.alloc(0);
    const req = new GenericResponse();
    expect(() => {
      req.fromBuffer(empty, 0);
    }).toThrow("Cannot create response from empty buffer");
  });
});