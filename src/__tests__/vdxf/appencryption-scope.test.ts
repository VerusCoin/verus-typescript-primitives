import { BN } from 'bn.js';
import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { VerifiableSignatureData } from '../../vdxf/classes/VerifiableSignatureData';
import { AppEncryptionRequestDetails } from '../../vdxf/classes/appencryption/AppEncryptionRequestDetails';
import { GenericEnvelope } from '../../vdxf/classes/envelope/GenericEnvelope';
import { AppEncryptionRequestOrdinalVDXFObject } from '../../vdxf/classes/ordinals';
import { GenericRequest } from '../../vdxf/classes/request/GenericRequest';
import { GenericResponse } from '../../vdxf/classes/response/GenericResponse';

const APP_ID = 'iPsFBfFoCcxtuZNzE8yxPQhXVn4dmytf8j';
const DERIVATION_ID = 'iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c';
const address = (id: string) => CompactIAddressObject.fromAddress(id);
const detail = (derivationID?: string, secondaryDerivationNumber = 0) => new AppEncryptionRequestOrdinalVDXFObject({
  data: new AppEncryptionRequestDetails({
    flags: new BN(0),
    derivationNumber: new BN(7),
    derivationID: derivationID ? address(derivationID) : undefined,
    secondaryDerivationNumber: new BN(secondaryDerivationNumber),
  }),
});

describe('App encryption scope serialization', () => {
  test.each([GenericEnvelope, GenericRequest, GenericResponse])(
    '%p preserves the app scope in binary and JSON and clears absent scope',
    Envelope => {
      const scoped = new Envelope({ details: [detail()], appOrDelegatorID: address(APP_ID) });
      expect(Envelope.FLAG_HAS_APP_OR_DELEGATOR_ID.toNumber()).toBe(64);
      expect(scoped.hasAppOrDelegatorID()).toBe(true);

      const decoded = new Envelope();
      decoded.fromBuffer(scoped.toBuffer());
      expect(decoded.appOrDelegatorID?.toIAddress()).toBe(APP_ID);
      expect(decoded.toJson().appOrDelegatorID).toEqual(address(APP_ID).toJson());
      expect(decoded.toBuffer()).toEqual(scoped.toBuffer());

      const unscoped = new Envelope({ details: [detail()] });
      const prepopulated = new Envelope({ details: [], appOrDelegatorID: address(APP_ID) });
      prepopulated.fromBuffer(unscoped.toBuffer());
      expect(prepopulated.hasAppOrDelegatorID()).toBe(false);
      expect(prepopulated.appOrDelegatorID).toBeUndefined();
      expect(prepopulated.toJson().appOrDelegatorID).toBeUndefined();
      expect(prepopulated.toBuffer()).toEqual(unscoped.toBuffer());
    },
  );

  test('deeplinks preserve independent app and nested derivation IDs', () => {
    const request = new GenericRequest({
      appOrDelegatorID: address(APP_ID),
      details: [detail(DERIVATION_ID)],
    });
    const decoded = GenericRequest.fromWalletDeeplinkUri(request.toWalletDeeplinkUri());
    const details = (decoded.getDetails() as AppEncryptionRequestOrdinalVDXFObject).data;

    expect(decoded.appOrDelegatorID?.toIAddress()).toBe(APP_ID);
    expect(details.derivationID?.toIAddress()).toBe(DERIVATION_ID);
    expect(AppEncryptionRequestDetails.fromJson(details.toJson()).toBuffer()).toEqual(details.toBuffer());
    expect(decoded.toBuffer()).toEqual(request.toBuffer());
  });

  test('request hashes commit independently to app scope and nested derivation', () => {
    const request = (appID?: string, derivationID?: string, secondaryDerivationNumber = 0) => new GenericRequest({
      appOrDelegatorID: appID ? address(appID) : undefined,
      details: [detail(derivationID, secondaryDerivationNumber)],
      signature: new VerifiableSignatureData({
        systemID: address(DEFAULT_VERUS_CHAINID),
        identityID: address(DEFAULT_VERUS_CHAINID),
      }),
    });
    const original = request(APP_ID, DERIVATION_ID);
    const variants = [
      request(DEFAULT_VERUS_CHAINID, DERIVATION_ID),
      request(APP_ID, DEFAULT_VERUS_CHAINID),
      request(APP_ID, DERIVATION_ID, 1),
      request(undefined, DERIVATION_ID),
      request(APP_ID),
    ];
    for (const changed of variants) {
      expect(changed.getRawDataSha256()).not.toEqual(original.getRawDataSha256());
      expect(changed.getDetailsIdentitySignatureHash(18167))
        .not.toEqual(original.getDetailsIdentitySignatureHash(18167));
    }
  });

  test('parsing details without a derivation clears a prepopulated derivation ID', () => {
    const unscoped = new AppEncryptionRequestDetails({ flags: new BN(0), derivationNumber: new BN(7) });
    const prepopulated = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(0),
      derivationID: address(DERIVATION_ID),
    });
    prepopulated.fromBuffer(unscoped.toBuffer());

    expect(prepopulated.hasDerivationID()).toBe(false);
    expect(prepopulated.derivationID).toBeUndefined();
    expect(prepopulated.toJson().derivationid).toBeUndefined();
    expect(AppEncryptionRequestDetails.fromJson(prepopulated.toJson()).toBuffer()).toEqual(unscoped.toBuffer());
  });
});
