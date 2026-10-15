import { Identity } from '../../pbaas/Identity';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { BN } from 'bn.js';

const fixture = require('../fixtures/identity-registration/names-v1.json');
const definition = {
  minSigs: new BN(1), primaryAddresses: [new KeyID(Buffer.alloc(20, 1))],
  revocationAuthority: IdentityID.fromAddress(fixture.roots.VRSCTEST.vdxfid),
  recoveryAuthority: IdentityID.fromAddress(fixture.roots.VRSCTEST.vdxfid),
  unlockAfter: new BN(0),
};

describe('identity address derivation with a null serialized parent', () => {
  test.each(['VRSC', 'VRSCTEST'])('%s genesis root derives from its explicit stored system ID', rootSystemName => {
    const rootID = fixture.roots[rootSystemName].vdxfid;
    for (const name of [rootSystemName, rootSystemName.toLowerCase()]) {
      const identity = new Identity({
        ...definition, name, parent: new IdentityID(Buffer.alloc(20)), systemId: IdentityID.fromAddress(rootID),
      });
      expect(identity.getIdentityAddress()).toBe(rootID);
      expect(identity.getIdentityAddress(rootSystemName)).toBe(rootID);
      expect(identity.toJson().identityaddress).toBe(rootID);
    }
  });

  test('a null parent never silently changes an ordinary leaf into an absolute global root', () => {
    const identity = new Identity({
      ...definition, name: 'Alice', parent: new IdentityID(Buffer.alloc(20)),
      systemId: IdentityID.fromAddress(fixture.roots.VRSCTEST.vdxfid),
    });
    expect(() => identity.getIdentityAddress()).toThrow('explicit root system');
    expect(() => identity.toJson()).toThrow('explicit root system');
    for (const rootSystemName of ['VRSC', 'VRSCTEST']) {
      const vector = fixture.names.find((one: any) => one.label === `${rootSystemName}/ascii-mixed`);
      expect(identity.getIdentityAddress(rootSystemName)).toBe(vector.result.vdxfid);
      expect(identity.toJson(rootSystemName).identityaddress).toBe(vector.result.vdxfid);
      expect(identity.toJson(rootSystemName).systemid).toBe(fixture.roots.VRSCTEST.vdxfid);
    }
  });

  test('missing or null legacy system IDs require an explicit root', () => {
    for (const systemId of [undefined, new IdentityID(Buffer.alloc(20))]) {
      const identity = new Identity({name: 'VRSCTEST', parent: new IdentityID(Buffer.alloc(20)), systemId});
      expect(() => identity.getIdentityAddress()).toThrow('explicit root system');
      expect(identity.getIdentityAddress('VRSCTEST')).toBe(fixture.roots.VRSCTEST.vdxfid);
    }
  });

  test('ordinary explicit parent derivation remains independent of root context', () => {
    const vector = fixture.names.find((one: any) => one.label === 'VRSCTEST/nested-subidentity');
    const identity = new Identity({
      name: vector.result.qualifiedname.name,
      parent: IdentityID.fromAddress(vector.result.qualifiedname.parentid),
    });
    expect(identity.getIdentityAddress()).toBe(vector.result.vdxfid);
    expect(identity.getIdentityAddress('VRSC')).toBe(vector.result.vdxfid);
  });

  test.each(['VRSC', 'VRSCTEST'])('reconstructs omitted version-1 %s root system ID with explicit parse context', rootSystemName => {
    const original = new Identity({
      ...definition, name: rootSystemName, version: new BN(1),
      parent: new IdentityID(Buffer.alloc(20)),
      systemId: IdentityID.fromAddress(fixture.roots[rootSystemName].vdxfid),
    });
    const bytes = original.toBuffer();
    const parsed = new Identity();
    expect(parsed.fromBuffer(bytes, 0, false, rootSystemName)).toBe(bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(parsed.systemId.toAddress()).toBe(fixture.roots[rootSystemName].vdxfid);
    expect(parsed.getIdentityAddress()).toBe(fixture.roots[rootSystemName].vdxfid);
    expect(parsed.toJson(rootSystemName).systemid).toBe(fixture.roots[rootSystemName].vdxfid);
    expect(parsed.toJson(rootSystemName).identityaddress).toBe(fixture.roots[rootSystemName].vdxfid);

    const structural = new Identity();
    expect(structural.fromBuffer(bytes)).toBe(bytes.length);
    expect(structural.toBuffer()).toEqual(bytes);
    expect(structural.systemId.hash).toEqual(Buffer.alloc(20));
    expect(() => structural.getIdentityAddress()).toThrow('explicit root system');
    expect(structural.getIdentityAddress(rootSystemName)).toBe(fixture.roots[rootSystemName].vdxfid);
  });

  test('root parse context does not overwrite a serialized system ID in current identities', () => {
    const original = new Identity({
      ...definition, name: 'Alice', parent: new IdentityID(Buffer.alloc(20)),
      systemId: IdentityID.fromAddress(fixture.roots.VRSCTEST.vdxfid),
    });
    const parsed = new Identity();
    const bytes = original.toBuffer();
    expect(parsed.fromBuffer(bytes, 0, false, 'VRSC')).toBe(bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(parsed.systemId.toAddress()).toBe(fixture.roots.VRSCTEST.vdxfid);
    const vector = fixture.names.find((one: any) => one.label === 'VRSC/ascii-mixed');
    expect(parsed.toJson('VRSC').identityaddress).toBe(vector.result.vdxfid);
  });
});
