import { AdvancedNameReservation } from '../../pbaas/AdvancedNameReservation';
import { IdentityID } from '../../pbaas/IdentityID';
import { NameReservation } from '../../pbaas/NameReservation';
import { decodeDestination, nameAndParentAddrToIAddr, toIAddress } from '../../utils/address';
import {
  IdentityRegistrationNameRequest,
  resolveIdentityRegistrationName,
  validateIdentityRegistrationName,
} from '../../utils/identityRegistration';
import { TESTNET_VERUS_CHAINID } from '../../constants/pbaas';

// Captured directly from getvdxfid, without using this library to derive the
// expected IDs, parent IDs, or clean names. These tests never contact a daemon.
const fixture = require('../fixtures/identity-registration/names-v1.json');

interface DaemonIdentityName {
  vdxfid: string;
  hash160result: string;
  qualifiedname: { name: string; parentid: string };
}

interface NameFixture {
  label: string;
  RPCInput: string;
  result: DaemonIdentityName;
  parentResult: DaemonIdentityName;
  fullName: string;
  nameUTF8: string;
  requests: IdentityRegistrationNameRequest[];
}

const names: NameFixture[] = fixture.names;
const byLabel = new Map(names.map(one => [one.label, one]));
const vectors = names.flatMap(one => one.requests.map((request, index) => ({
  label: `${one.label}/form-${index + 1}`, request, one,
})));

describe('daemon identity name derivation parity', () => {
  test('records the explicit identity-name RPC path and root context', () => {
    expect(fixture.provenance.chainID).toBe(TESTNET_VERUS_CHAINID);
    expect(fixture.provenance.readOnlyRPCMethods).toEqual(['getinfo', 'getvdxfid']);
    for (const [root, response] of Object.entries(fixture.roots) as [string, DaemonIdentityName][]) {
      expect(toIAddress(root + '.', '')).toBe(response.vdxfid);
      expect(decodeDestination(response.vdxfid).reverse().toString('hex')).toBe(response.hash160result);
      expect(response).not.toHaveProperty('indexid');
    }
    for (const one of names) {
      expect(one.RPCInput.endsWith('.@')).toBe(true);
      expect(one.result).not.toHaveProperty('indexid');
      expect(one.result.qualifiedname).not.toHaveProperty('namespace');
      expect(one.result.qualifiedname.parentid).toBe(one.parentResult.vdxfid);
    }
  });

  test.each(vectors)('$label resolves to the daemon ID, parent and exact UTF-8 bytes', ({request, one}) => {
    const resolved = resolveIdentityRegistrationName(request);
    expect(resolved.identityID).toBe(one.result.vdxfid);
    expect(resolved.parent).toBe(one.result.qualifiedname.parentid);
    expect(resolved.name).toBe(one.result.qualifiedname.name);
    expect(resolved.nameBytes.toString('hex')).toBe(one.nameUTF8);
    expect(resolved.fullName).toBe(one.fullName);
    expect(resolved.rootSystemName).toBe(request.rootSystemName);
    // systemID is caller-selected execution context, independent of name parent.
    expect(resolved.systemID).toBe(request.systemID);
    expect(decodeDestination(resolved.identityID).reverse().toString('hex')).toBe(one.result.hash160result);
    expect(toIAddress(one.RPCInput, '')).toBe(one.result.vdxfid);
    expect(nameAndParentAddrToIAddr(resolved.name, resolved.parent)).toBe(one.result.vdxfid);
  });

  test.each(names)('$label binds both reservation formats to the daemon identity ID', one => {
    const name = one.result.qualifiedname.name;
    const parent = one.result.qualifiedname.parentid;
    const salt = Buffer.alloc(32, 1);
    const legacy = new NameReservation({name, salt});
    const advanced = new AdvancedNameReservation({name, parent: IdentityID.fromAddress(parent), salt});
    expect(() => legacy.validateForCreation()).not.toThrow();
    expect(() => advanced.validateForCreation()).not.toThrow();
    expect(legacy.getIdentityAddress(parent)).toBe(one.result.vdxfid);
    expect(advanced.getIdentityAddress()).toBe(one.result.vdxfid);
    expect(legacy.toJSONWithParent(parent).nameid).toBe(one.result.vdxfid);
    expect(advanced.toJSON().nameid).toBe(one.result.vdxfid);
    expect(NameReservation.fromHex(legacy.toBuffer().toString('hex')).name).toBe(name);
    expect(AdvancedNameReservation.fromHex(advanced.toBuffer().toString('hex')).name).toBe(name);
  });

  test.each(['VRSCTEST', 'VRSC'])('%s folds ASCII only and never normalizes Unicode', root => {
    const ID = (label: string) => byLabel.get(`${root}/${label}`)!.result.vdxfid;
    expect(ID('ascii-mixed')).toBe(ID('ascii-lower'));
    expect(ID('ascii-upper')).toBe(ID('ascii-lower'));
    expect(ID('latin-composed')).not.toBe(ID('latin-decomposed'));
    expect(ID('latin-composed')).not.toBe(ID('latin-uppercase'));
    expect(ID('german-sharp-s')).not.toBe(ID('german-capital-sharp-s'));
    expect(ID('ordinary-space')).not.toBe(ID('nonbreaking-space'));
    expect(ID('unicode-parent-uppercase')).not.toBe(ID('unicode-parent-lowercase'));

    const salts = Buffer.alloc(32, 1);
    const upper = new NameReservation({name: 'ALICE', salt: salts});
    const lower = new NameReservation({name: 'alice', salt: salts});
    expect(upper.getCommitment().hash).not.toEqual(lower.getCommitment().hash);
    expect(upper.getIdentityAddress(fixture.roots[root].vdxfid)).toBe(ID('ascii-mixed'));
    expect(lower.getIdentityAddress(fixture.roots[root].vdxfid)).toBe(ID('ascii-mixed'));
  });

  test('separates global roots even when executed on the same testnet daemon', () => {
    for (const testnet of names.filter(one => one.label.startsWith('VRSCTEST/'))) {
      const mainnetName = byLabel.get(testnet.label.replace('VRSCTEST/', 'VRSC/'))!;
      expect(testnet.result.vdxfid).not.toBe(mainnetName.result.vdxfid);
      expect(testnet.result.qualifiedname.parentid).not.toBe(mainnetName.result.qualifiedname.parentid);
    }
  });
});

describe('daemon lookup behavior versus strict creation policy', () => {
  test.each(fixture.rejectedNames)('$label: $reason', (one: any) => {
    expect(() => validateIdentityRegistrationName(one.name)).toThrow();
    expect(() => resolveIdentityRegistrationName({
      name: one.name, rootSystemName: 'VRSCTEST', systemID: TESTNET_VERUS_CHAINID,
    })).toThrow();
    if (one.outcome === 'error') {
      expect(one.error).toEqual({code: -8, message: 'Invalid ID or URI format'});
      expect(one.result).toBeUndefined();
    } else if (one.outcome === 'VDXF-key') {
      // A successful RPC return can be a data-key result, not an identity name.
      expect(one.result.indexid).toEqual(expect.any(String));
      expect(one.result.qualifiedname.namespace).toEqual(expect.any(String));
      expect(one.result.qualifiedname).not.toHaveProperty('parentid');
    } else {
      expect(one.outcome).toBe('identity');
      expect(one.result).not.toHaveProperty('indexid');
      expect(one.result.qualifiedname.parentid).toBe(TESTNET_VERUS_CHAINID);
    }
  });

  test('records daemon truncation without applying it to user-approved creation bytes', () => {
    for (const [invalidLabel, validLabel] of [
      ['ascii-65-bytes', 'ascii-64-bytes'],
      ['two-byte-66-bytes', 'two-byte-64-bytes'],
      ['four-byte-68-bytes', 'four-byte-64-bytes'],
    ]) {
      const tooLong = fixture.rejectedNames.find((one: any) => one.label === invalidLabel);
      const boundary = byLabel.get(`VRSCTEST/${validLabel}`)!;
      expect(tooLong.result).toEqual(boundary.result);
      expect(Buffer.byteLength(tooLong.name)).toBeGreaterThan(64);
      expect(Buffer.byteLength(tooLong.result.qualifiedname.name)).toBe(64);
    }
  });

  test('records the daemon C-string NUL alias that creation helpers reject', () => {
    const nul = fixture.rejectedNames.find((one: any) => one.label === 'nul');
    const alice = byLabel.get('VRSCTEST/ascii-mixed')!;
    expect(nul.result.qualifiedname.name).toBe('Alice\0Suffix');
    expect(nul.result.vdxfid).toBe(alice.result.vdxfid);
    expect(nul.result.hash160result).toBe(alice.result.hash160result);
  });
});
