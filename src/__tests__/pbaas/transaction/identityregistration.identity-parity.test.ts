import {
  Identity, IdentityScript, IdentityID, KeyID, ContentMultiMap, SaplingPaymentAddress,
  identityFromJSONForRegistration, resolveIdentityRegistrationName, validateIdentityForRegistration,
  toBase58Check, VerusCLIVerusIDJson, I_ADDR_VERSION
} from '../../../index';
import { BN } from 'bn.js';

const fixture = require('../../fixtures/identity-registration/identities-v1.json');

function fromInput(input): Identity {
  return new Identity({
    version: new BN(input.version), flags: new BN(input.flags), name: input.name,
    primaryAddresses: input.keys.map(key => new KeyID(Buffer.from(key, 'hex'))),
    minSigs: new BN(input.minimumSignatures), parent: IdentityID.fromAddress(input.parent),
    systemId: IdentityID.fromAddress(input.systemID),
    revocationAuthority: IdentityID.fromAddress(input.revocationAuthority),
    recoveryAuthority: IdentityID.fromAddress(input.recoveryAuthority), unlockAfter: new BN(input.timelock),
    contentMap: new Map(input.content.map(([key, value]) => [toBase58Check(Buffer.from(key, 'hex'), I_ADDR_VERSION), Buffer.from(value, 'hex')])),
    contentMultiMap: ContentMultiMap.fromJson(Object.fromEntries(input.multimap.map(([key, values]) => [toBase58Check(Buffer.from(key, 'hex'), I_ADDR_VERSION), values]))),
    privateAddresses: input.privateAddresses.map(bytes => {
      const address = new SaplingPaymentAddress(); address.fromBuffer(Buffer.from(bytes, 'hex')); return address;
    }),
  });
}

describe('independent full identity encoding compared with VRSCTEST', () => {
  for (const row of fixture.cases.filter(row => row.decoded.identityprimary !== 'invalid' && row.name !== 'current-empty-multimap-data' && !row.name.includes('null-'))) {
    test(row.name, () => {
      const bytes = Buffer.from(row.payloadHex, 'hex');
      const parsed = new Identity();
      expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getByteLength()).toBe(bytes.length);
      expect(parsed.toJson()).toEqual(row.decoded.identityprimary);
      expect(Identity.fromJson(row.decoded.identityprimary).toBuffer()).toEqual(bytes);
      expect(fromInput(row.input).toBuffer()).toEqual(bytes);
      const script = new IdentityScript();
      script.fromBuffer(Buffer.from(row.scriptHex, 'hex'));
      expect(script.toBuffer().toString('hex')).toBe(row.scriptHex);
      expect(script.getIdentity().toBuffer()).toEqual(bytes);
      if (row.input.version === 3) {
        const resolved = resolveIdentityRegistrationName({name: row.input.name,
          rootSystemName: 'VRSCTEST', systemID: fixture.provenance.chainID});
        expect(IdentityScript.fromIdentity(parsed).toBuffer().toString('hex')).toBe(row.scriptHex);
        validateIdentityForRegistration(parsed, resolved);
        expect(identityFromJSONForRegistration(row.decoded.identityprimary as VerusCLIVerusIDJson, resolved).toBuffer()).toEqual(bytes);
      }
    });
  }

  test.each(['historical-version-1-null-root', 'current-null-parent-explicit-root'])(
    'uses explicit daemon-root context for %s', name => {
      const row = fixture.cases.find(row => row.name === name);
      const bytes = Buffer.from(row.payloadHex, 'hex');
      const parsed = new Identity();
      expect(parsed.fromBuffer(bytes, 0, false, 'VRSCTEST')).toBe(bytes.length);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getIdentityAddress('VRSCTEST')).toBe(row.input.identityID);
      expect(parsed.toJson('VRSCTEST')).toEqual(row.decoded.identityprimary);
      expect(Identity.fromJson(row.decoded.identityprimary).toBuffer()).toEqual(bytes);
    }
  );

  test('preserves empty multimap bytes while matching the daemon lossy JSON projection', () => {
    const row = fixture.cases.find(row => row.name === 'current-empty-multimap-data');
    const bytes = Buffer.from(row.payloadHex, 'hex');
    const parsed = new Identity();
    expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(parsed.toJson()).toEqual(row.decoded.identityprimary);
    expect(Identity.fromJson(row.decoded.identityprimary).toBuffer()).not.toEqual(bytes);
    expect(fromInput(row.input).toBuffer()).toEqual(bytes);
  });

  test('daemon rejects a null content-multimap key and so does creation validation', () => {
    const row = fixture.cases.find(row => row.name === 'current-null-multimap-key');
    expect(row.decoded.identityprimary).toBe('invalid');
    const resolved = resolveIdentityRegistrationName({name: row.input.name,
      rootSystemName: 'VRSCTEST', systemID: fixture.provenance.chainID});
    expect(() => validateIdentityForRegistration(fromInput(row.input), resolved)).toThrow();
  });
});
