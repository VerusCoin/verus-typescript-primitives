import { BN } from 'bn.js';
import { SaplingPaymentAddress } from '../../pbaas/SaplingPaymentAddress';
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { AppEncryptionRequestDetails } from '../../vdxf/classes/appencryption/AppEncryptionRequestDetails';

const DERIVATION_ID = 'iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j';
const REQUEST_ID = 'iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c';
const REPLY_ADDRESS = 'zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa';

// Verus VarInt vectors, deliberately independent of the encoder and its length helper.
const SECONDARY_VECTORS = [
  { number: 0, hex: '00' },
  { number: 127, hex: '7f' },
  { number: 128, hex: '8000' },
  { number: 253, hex: '807d' },
  { number: 16512, hex: '808000' },
];

describe('AppEncryptionRequestDetails secondary derivation number', () => {
  test.each(SECONDARY_VECTORS)('encodes secondary number $number as VarInt $hex', ({ number, hex }) => {
    const derivationID = CompactIAddressObject.fromAddress(DERIVATION_ID);
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(42),
      derivationID,
      secondaryDerivationNumber: new BN(number),
    });
    const canonical = Buffer.concat([
      Buffer.from('042a', 'hex'),
      derivationID.toBuffer(),
      Buffer.from(hex, 'hex'),
    ]);

    expect(details.isValid()).toBe(true);
    expect(details.getByteLength()).toBe(canonical.length);
    expect(details.toBuffer()).toEqual(canonical);

    const decoded = new AppEncryptionRequestDetails();
    expect(decoded.fromBuffer(canonical)).toBe(canonical.length);
    expect(decoded.derivationNumber.toNumber()).toBe(42);
    expect(decoded.secondaryDerivationNumber.toNumber()).toBe(number);
    expect(decoded.toBuffer()).toEqual(canonical);
    expect(decoded.toJson().secondaryderivationnumber).toBe(number);
    expect(AppEncryptionRequestDetails.fromJson(decoded.toJson()).toBuffer()).toEqual(canonical);
  });

  test('defaults omitted constructor and JSON secondary numbers to zero', () => {
    const derivationID = CompactIAddressObject.fromAddress(DERIVATION_ID);
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(42),
      derivationID,
    });
    const canonical = Buffer.concat([Buffer.from('042a', 'hex'), derivationID.toBuffer(), Buffer.from('00', 'hex')]);
    const fromJson = AppEncryptionRequestDetails.fromJson({
      version: 1,
      flags: 4,
      derivationnumber: 42,
      derivationid: derivationID.toJson(),
    });

    for (const value of [details, fromJson]) {
      expect(value.secondaryDerivationNumber.toNumber()).toBe(0);
      expect(value.toJson().secondaryderivationnumber).toBe(0);
      expect(value.toBuffer()).toEqual(canonical);
    }
  });

  test('rejects a scoped payload missing its mandatory secondary number', () => {
    const truncated = Buffer.concat([
      Buffer.from('042a', 'hex'),
      CompactIAddressObject.fromAddress(DERIVATION_ID).toBuffer(),
    ]);
    expect(() => new AppEncryptionRequestDetails().fromBuffer(truncated)).toThrow();
  });

  test('keeps reply and request fields aligned when parsing at an offset', () => {
    const derivationID = CompactIAddressObject.fromAddress(DERIVATION_ID);
    const requestID = CompactIAddressObject.fromAddress(REQUEST_ID);
    const reply = SaplingPaymentAddress.fromAddressString(REPLY_ADDRESS);
    const canonical = Buffer.concat([
      Buffer.from('07', 'hex'),
      reply.toBuffer(),
      Buffer.from('2a', 'hex'),
      derivationID.toBuffer(),
      Buffer.from('808000', 'hex'),
      requestID.toBuffer(),
    ]);
    const framed = Buffer.concat([Buffer.from('aabb', 'hex'), canonical, Buffer.from('ccdd', 'hex')]);
    const decoded = new AppEncryptionRequestDetails();
    const end = decoded.fromBuffer(framed, 2);

    expect(end).toBe(2 + canonical.length);
    expect(framed.subarray(end).toString('hex')).toBe('ccdd');
    expect(decoded.encryptResponseToAddress?.toAddressString()).toBe(REPLY_ADDRESS);
    expect(decoded.derivationID?.toIAddress()).toBe(DERIVATION_ID);
    expect(decoded.secondaryDerivationNumber.toNumber()).toBe(16512);
    expect(decoded.requestID?.toIAddress()).toBe(REQUEST_ID);
    expect(decoded.getByteLength()).toBe(canonical.length);
    expect(decoded.toBuffer()).toEqual(canonical);
  });

  test('omits secondary numbers without a derivation ID and resets prepopulated values on parse', () => {
    const withoutDerivation = new AppEncryptionRequestDetails({ flags: new BN(0), derivationNumber: new BN(42) });
    expect(withoutDerivation.secondaryDerivationNumber.toNumber()).toBe(0);
    expect(withoutDerivation.toBuffer().toString('hex')).toBe('002a');
    expect(JSON.parse(JSON.stringify(withoutDerivation.toJson()))).not.toHaveProperty('secondaryderivationnumber');
    expect(AppEncryptionRequestDetails.fromJson(withoutDerivation.toJson()).secondaryDerivationNumber.toNumber()).toBe(0);

    const prepopulated = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(0),
      derivationID: CompactIAddressObject.fromAddress(DERIVATION_ID),
      secondaryDerivationNumber: new BN(128),
    });
    prepopulated.fromBuffer(withoutDerivation.toBuffer());
    expect(prepopulated.secondaryDerivationNumber.toNumber()).toBe(0);
    expect(prepopulated.toJson().secondaryderivationnumber).toBeUndefined();
    expect(prepopulated.toBuffer()).toEqual(withoutDerivation.toBuffer());
  });

  test('rejects a negative secondary number as invalid', () => {
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(42),
      derivationID: CompactIAddressObject.fromAddress(DERIVATION_ID),
      secondaryDerivationNumber: new BN(-1),
    });
    expect(details.isValid()).toBe(false);
  });
});
