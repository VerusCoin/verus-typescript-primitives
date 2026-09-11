import { BN } from 'bn.js';
import {
  AuthenticationRequestOrdinalVDXFObject,
  CompactIAddressObject,
  GenericRequest,
  HASH_TYPE_SHA256,
  TESTNET_VERUS_CHAINID,
  VerifiableSignatureData,
} from '../../';

// AUDIT_RECHECK.md P1: the envelope's testnet flag must also govern compact
// signature fields. Identical wire bytes alone cannot detect a changed signer.
describe('P1 regression: testnet FQN signature context', () => {
  test.each([
    {
      field: 'identityID',
      identityID: () => CompactIAddressObject.fromFQN('alice.VRSCTEST@', 'VRSCTEST'),
      systemID: () => CompactIAddressObject.fromAddress(TESTNET_VERUS_CHAINID, 'VRSCTEST'),
      expectedIdentity: 'i5f5njYtso65186mo5WHMkRme9YG6hrZE2',
    },
    {
      field: 'systemID',
      identityID: () => CompactIAddressObject.fromAddress('i4M7ar436N7wKHgZodjGAWdsBSNjG7cz8s', 'VRSCTEST'),
      systemID: () => CompactIAddressObject.fromFQN('VRSCTEST', 'VRSCTEST'),
      expectedIdentity: 'i4M7ar436N7wKHgZodjGAWdsBSNjG7cz8s',
    },
  ])('preserves the $field FQN address and signing digest through a request round trip', ({
    identityID,
    systemID,
    expectedIdentity,
  }) => {
    const request = new GenericRequest({
      flags: GenericRequest.FLAG_IS_TESTNET,
      createdAt: new BN(1800000000),
      signature: new VerifiableSignatureData({
        version: new BN(1),
        signatureVersion: new BN(2),
        hashType: HASH_TYPE_SHA256,
        isTestnet: true,
        identityID: identityID(),
        systemID: systemID(),
      }),
      details: [new AuthenticationRequestOrdinalVDXFObject()],
    });

    expect(request.signature.identityID.toIAddress()).toBe(expectedIdentity);
    expect(request.signature.systemID.toIAddress()).toBe(TESTNET_VERUS_CHAINID);

    const wire = request.toBuffer();
    const expectedDigest = request.getDetailsIdentitySignatureHash(1).toString('hex');
    const restored = new GenericRequest();

    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.isTestnet()).toBe(true);
    expect(restored.toBuffer()).toEqual(wire);
    expect({
      identityID: restored.signature.identityID.toIAddress(),
      systemID: restored.signature.systemID.toIAddress(),
      digest: restored.getDetailsIdentitySignatureHash(1).toString('hex'),
    }).toEqual({
      identityID: expectedIdentity,
      systemID: TESTNET_VERUS_CHAINID,
      digest: expectedDigest,
    });
  });
});
