import { BN } from 'bn.js';
import { DEFAULT_VERUS_CHAINID, NULL_I_ADDR, TESTNET_VERUS_CHAINID } from '../../constants/pbaas';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../../constants/vdxf';
import { ContentMultiMap } from '../../pbaas/ContentMultiMap';
import { AdvancedNameReservation } from '../../pbaas/AdvancedNameReservation';
import { Identity } from '../../pbaas/Identity';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { NameReservation } from '../../pbaas/NameReservation';
import { PartialIdentity } from '../../pbaas/PartialIdentity';
import { SaplingPaymentAddress } from '../../pbaas/SaplingPaymentAddress';
import { nameAndParentAddrToIAddr, toBase58Check, toIAddress } from '../../utils/address';
import {
  IDENTITY_REGISTRATION_MAX_BYTES,
  identityFromJSONForRegistration,
  resolveIdentityRegistrationName,
  validateIdentityForRegistration,
  validateIdentityRegistrationName,
} from '../../utils/identityRegistration';

const bs58check = require('bs58check');
const context = { rootSystemName: 'VRSCTEST', systemID: TESTNET_VERUS_CHAINID };

describe('strict registration leaf names', () => {
  test.each(['Alice', 'Alice Smith', 'Alice\u00a0Smith', 'é'.repeat(32), '😀'.repeat(16), 'a'.repeat(64)])('accepts approved bytes: %s', name => {
    expect(() => validateIdentityRegistrationName(name)).not.toThrow();
  });

  test.each([
    '', 'a'.repeat(65), 'é'.repeat(33), '😀'.repeat(17), 'a'.repeat(63) + 'é',
    '\ud800', '\udfff', 'A\ud800B', 'a.b', 'a@', 'a@chain', 'a\\b', 'a/b',
    'a:b', 'a*b', 'a?b', 'a"b', 'a<b', 'a>b', 'a|b', ' a', 'a ',
    '\u00a0a', 'a\u200d', 'a  b', 'a \u00a0b', 'a\u200c\u200db',
    'a\0b', 'a\nb', 'a\tb', 'a\x1bb', 'a\x7fb',
  ])('rejects invalid or silently normalized input: %j', name => {
    expect(() => validateIdentityRegistrationName(name)).toThrow();
  });

  test('rejects Base58Check names with every payload length greater than 20, regardless of version', () => {
    for (const length of [21, 22, 23, 32]) {
      expect(() => validateIdentityRegistrationName(bs58check.encode(Buffer.alloc(length, 0x15)))).toThrow(/Base58Check/);
    }
    expect(() => validateIdentityRegistrationName(bs58check.encode(Buffer.alloc(20, 0x15)))).not.toThrow();
    expect(() => validateIdentityRegistrationName(TESTNET_VERUS_CHAINID)).toThrow(/Base58Check/);
    expect(() => validateIdentityRegistrationName(toBase58Check(Buffer.alloc(20, 4), R_ADDR_VERSION))).toThrow(/Base58Check/);
  });

  test('preserves NUL names in historical payloads while refusing ambiguous identity derivation', () => {
    const data = { name: 'Alice\0Suffix', salt: Buffer.alloc(32, 1) };
    const legacy = new NameReservation(data);
    const advanced = new AdvancedNameReservation({ ...data, parent: IdentityID.fromAddress(TESTNET_VERUS_CHAINID) });
    const legacyBytes = legacy.toBuffer();
    const advancedBytes = advanced.toBuffer();
    expect(NameReservation.fromHex(legacyBytes.toString('hex')).toBuffer()).toEqual(legacyBytes);
    expect(AdvancedNameReservation.fromHex(advancedBytes.toString('hex')).toBuffer()).toEqual(advancedBytes);
    expect(() => legacy.getIdentityAddress(TESTNET_VERUS_CHAINID)).toThrow(/NUL/);
    expect(() => advanced.getIdentityAddress()).toThrow(/NUL/);
    expect(() => legacy.validateForCreation()).toThrow();
    expect(() => advanced.validateForCreation()).toThrow();
    expect(legacy.getCommitment().hash).toHaveLength(32);
    expect(advanced.getCommitment().hash).toHaveLength(32);
  });
});

describe('registration name resolution', () => {
  test('requires explicit network context and resolves native parents', () => {
    const testnet = resolveIdentityRegistrationName({ name: 'Alice', ...context });
    const mainnet = resolveIdentityRegistrationName({ name: 'Alice@', rootSystemName: 'VRSC', systemID: DEFAULT_VERUS_CHAINID });
    expect(testnet.parent).toBe(TESTNET_VERUS_CHAINID);
    expect(mainnet.parent).toBe(DEFAULT_VERUS_CHAINID);
    expect(testnet.identityID).not.toBe(mainnet.identityID);
    expect(testnet.fullName).toBe('Alice.VRSCTEST@');
    expect(testnet.nameBytes).toEqual(Buffer.from('Alice'));
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', systemID: TESTNET_VERUS_CHAINID } as any)).toThrow();
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', ...context, systemID: NULL_I_ADDR })).toThrow(/null/);
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', ...context, systemID: toBase58Check(Buffer.alloc(20, 2), R_ADDR_VERSION) })).toThrow(/i-address/);
  });

  test('preserves the reserved case and Unicode bytes, with C-locale identity hashing', () => {
    const upper = resolveIdentityRegistrationName({ name: 'ALIce.Éxample.VRSCTEST@', ...context });
    const lower = resolveIdentityRegistrationName({ name: 'alice.Éxample.vrsctest.@', ...context });
    expect(upper.name).toBe('ALIce');
    expect(upper.nameBytes).toEqual(Buffer.from('ALIce'));
    expect(upper.identityID).toBe(lower.identityID);
    expect(upper.parent).toBe(lower.parent);
    expect(upper.parent).not.toBe(resolveIdentityRegistrationName({ name: 'alice.éxample', ...context }).parent);
    expect(resolveIdentityRegistrationName({ name: 'é', ...context }).identityID)
      .not.toBe(resolveIdentityRegistrationName({ name: 'e\u0301', ...context }).identityID);
  });

  test('resolves nested namespace and explicit-parent forms once', () => {
    const parent = toIAddress('Tokens.Example.VRSCTEST.', '');
    const fqn = resolveIdentityRegistrationName({ name: 'Alice.Tokens.Example.VRSCTEST@', parent, ...context });
    const leaf = resolveIdentityRegistrationName({ name: 'Alice', parentName: 'Tokens.Example', parent, ...context });
    const absolute = resolveIdentityRegistrationName({ name: 'Alice.Tokens.Example.VRSCTEST.', ...context });
    expect(fqn).toEqual(leaf);
    expect(fqn).toEqual(absolute);
    expect(fqn.parent).toBe(parent);
    expect(fqn.identityID).toBe(nameAndParentAddrToIAddr('Alice', parent));
    expect(resolveIdentityRegistrationName({ name: 'Alice', parent: TESTNET_VERUS_CHAINID, ...context }).parent).toBe(TESTNET_VERUS_CHAINID);
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', parent, ...context })).toThrow(/parentName/);
  });

  test('rejects mismatched explicit parents and names', () => {
    expect(() => resolveIdentityRegistrationName({ name: 'Alice.Example', parent: TESTNET_VERUS_CHAINID, ...context })).toThrow(/parent i-address/);
    expect(() => resolveIdentityRegistrationName({ name: 'Alice.Example', parentName: 'Other', ...context })).toThrow(/parent name/);
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', parentName: 'Example', parent: TESTNET_VERUS_CHAINID, ...context })).toThrow(/parent i-address/);
    expect(() => resolveIdentityRegistrationName({ name: 'Alice', parent: NULL_I_ADDR, ...context })).toThrow(/null/);
  });

  test.each(['Alice..Example', '.Alice', 'Alice.@', 'Alice.VRSC.', 'Alice@other', 'Alice@@', 'Alice.' + 'x'.repeat(65)])('rejects malformed/overlong/out-of-root names: %s', name => {
    expect(() => resolveIdentityRegistrationName({ name, ...context })).toThrow();
  });

  test('does not claim a locally resolved namespace is eligible to issue identities', () => {
    const namespace = 'Unregistered Personal Identity';
    const systemID = toBase58Check(Buffer.alloc(20, 8), I_ADDR_VERSION);
    const resolved = resolveIdentityRegistrationName({ name: 'Alice', parentName: namespace, ...context, systemID });
    expect(resolved.parent).toBe(toIAddress(namespace + '.VRSCTEST.', ''));
    expect(resolved.systemID).toBe(systemID);
    expect(resolved).not.toHaveProperty('eligible');
  });
});

describe('pure current identity creation validation', () => {
  const expected = resolveIdentityRegistrationName({ name: 'Alice', ...context });
  const createIdentity = () => new Identity({
    name: expected.name,
    parent: IdentityID.fromAddress(expected.parent),
    systemId: IdentityID.fromAddress(expected.systemID),
    primaryAddresses: [new KeyID(Buffer.alloc(20, 1))],
    minSigs: new BN(1),
    revocationAuthority: IdentityID.fromAddress(expected.identityID),
    recoveryAuthority: IdentityID.fromAddress(expected.identityID),
    unlockAfter: new BN(0),
  });

  test('accepts explicit self and external authorities without chain-state claims or mutation', () => {
    const identity = createIdentity();
    const before = identity.toBuffer();
    expect(() => validateIdentityForRegistration(identity, expected)).not.toThrow();
    expect(identity.toBuffer()).toEqual(before);
    identity.recoveryAuthority = new IdentityID(Buffer.alloc(20, 9));
    expect(() => validateIdentityForRegistration(identity, expected)).not.toThrow();
  });

  test('parses explicit creation JSON without mutating it', () => {
    const json = createIdentity().toJson();
    const before = JSON.stringify(json);
    const parsed = identityFromJSONForRegistration(json, expected);
    expect(parsed.toBuffer()).toEqual(createIdentity().toBuffer());
    expect(JSON.stringify(json)).toBe(before);
    delete json.contentmap;
    delete json.contentmultimap;
    delete json.identityaddress;
    expect(() => identityFromJSONForRegistration(json, expected)).not.toThrow();
  });

  test('rejects original JSON address types before permissive legacy parsers coerce them', () => {
    const json = createIdentity().toJson();
    // The historical parser reinterprets an i-address payload as a KeyID.
    expect(Identity.fromJson({ ...json, primaryaddresses: [expected.identityID] }).primaryAddresses[0].version).toBe(R_ADDR_VERSION);
    expect(() => identityFromJSONForRegistration({ ...json, primaryaddresses: [expected.identityID] }, expected)).toThrow(/R-addresses/);
    for (const field of ['parent', 'systemid', 'revocationauthority', 'recoveryauthority']) {
      expect(() => identityFromJSONForRegistration({ ...json, [field]: json.primaryaddresses[0] }, expected)).toThrow(/i-address/);
    }
    expect(() => identityFromJSONForRegistration({ ...json, identityaddress: TESTNET_VERUS_CHAINID }, expected)).toThrow(/does not match/);
  });

  test('requires explicit complete JSON authority and numeric fields without silently applying defaults', () => {
    for (const field of ['version', 'flags', 'minimumsignatures', 'timelock', 'name', 'parent', 'systemid', 'primaryaddresses', 'recoveryauthority', 'revocationauthority']) {
      const json = createIdentity().toJson();
      delete json[field];
      expect(() => identityFromJSONForRegistration(json, expected)).toThrow();
    }
    for (const field of ['version', 'flags', 'minimumsignatures', 'timelock']) {
      for (const value of [1.5, '1', Number.MAX_SAFE_INTEGER + 1, NaN, null]) {
        expect(() => identityFromJSONForRegistration({ ...createIdentity().toJson(), [field]: value }, expected)).toThrow(/explicit integer/);
      }
    }
  });

  test('rejects malformed original JSON content before hex decoding can truncate it', () => {
    const json = createIdentity().toJson();
    for (const value of ['ab'.repeat(31), 'ab'.repeat(32) + 'z', 'ab'.repeat(32) + '0']) {
      expect(() => identityFromJSONForRegistration({ ...json, contentmap: { ['01'.repeat(20)]: value } }, expected)).toThrow(/contentmap/);
    }
    for (const value of ['abz', 'abc', ['00', 'ffz'], [null], [1]]) {
      expect(() => identityFromJSONForRegistration({ ...json, contentmultimap: { [TESTNET_VERUS_CHAINID]: value } } as any, expected)).toThrow(/contentmultimap/);
    }
    expect(() => identityFromJSONForRegistration({
      ...json,
      contentmap: { ['01'.repeat(20)]: '02'.repeat(32) },
      contentmultimap: { [TESTNET_VERUS_CHAINID]: ['ab', 'cdef'] },
    }, expected)).not.toThrow();
    expect(() => identityFromJSONForRegistration({
      ...json,
      contentmap: { ['ab'.repeat(20)]: '01'.repeat(32), ['AB'.repeat(20)]: '02'.repeat(32) },
    }, expected)).toThrow(/duplicate key bytes/);
    expect(() => identityFromJSONForRegistration({ ...json, privateaddresses: [] } as any, expected)).toThrow(/Unsupported.*privateaddresses/);
  });

  test('binds exact approved leaf bytes, parent, system, and derived identity', () => {
    const identity = createIdentity();
    identity.name = 'alice';
    expect(identity.getIdentityAddress()).toBe(expected.identityID);
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/exactly/);
    identity.name = expected.name;
    identity.parent = new IdentityID(Buffer.alloc(20, 2));
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/parent/);
    identity.parent = IdentityID.fromAddress(expected.parent);
    identity.systemId = new IdentityID(Buffer.alloc(20, 2));
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/system/);
    expect(() => validateIdentityForRegistration(createIdentity(), { ...expected, identityID: TESTNET_VERUS_CHAINID })).toThrow(/inconsistent/);
    expect(() => validateIdentityForRegistration(createIdentity(), { ...expected, nameBytes: Buffer.from('alice') })).toThrow(/inconsistent/);
  });

  test('requires full current identities with ordinary flags and explicit zero timelock', () => {
    expect(() => validateIdentityForRegistration(new PartialIdentity(), expected)).toThrow(/full Identity/);
    for (const version of [0, 1, 2, 4]) {
      const identity = createIdentity();
      identity.version = new BN(version);
      expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/version/);
    }
    for (const flags of [1, 2, 4, 0x8000, 0x10000, -1]) {
      const identity = createIdentity();
      identity.flags = new BN(flags);
      expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/zero flags/);
    }
    const identity = createIdentity();
    identity.unlockAfter = new BN(1);
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/timelock/);
    identity.unlockAfter = undefined;
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/timelock/);
  });

  test('checks key uniqueness, key-hash-only capability and threshold boundaries', () => {
    const identity = createIdentity();
    identity.primaryAddresses = Array.from({ length: 25 }, (_, i) => new KeyID(Buffer.alloc(20, i + 1)));
    identity.minSigs = new BN(13);
    expect(() => validateIdentityForRegistration(identity, expected)).not.toThrow();
    identity.minSigs = new BN(14);
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/threshold/);
    identity.minSigs = new BN(13);
    identity.primaryAddresses.push(new KeyID(Buffer.alloc(20, 26)));
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/1 to 25/);
    identity.primaryAddresses = [new KeyID(Buffer.alloc(20, 1)), new KeyID(Buffer.alloc(20, 1))];
    identity.minSigs = new BN(1);
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/unique/);
    for (const key of [new IdentityID(Buffer.alloc(20, 1)), new KeyID(Buffer.alloc(33, 2)), new KeyID(Buffer.alloc(20)), new KeyID(Buffer.alloc(19))]) {
      identity.primaryAddresses = [key];
      expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/KeyID/);
    }
    identity.primaryAddresses = [new KeyID(Buffer.alloc(20, 1))];
    for (const threshold of [0, -1, 2]) {
      identity.minSigs = new BN(threshold);
      expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/threshold/);
    }
  });

  test('rejects null, missing, wrongly typed, or variable-length identity fields', () => {
    for (const field of ['parent', 'systemId', 'revocationAuthority', 'recoveryAuthority']) {
      for (const value of [undefined, new IdentityID(Buffer.alloc(20)), new IdentityID(Buffer.alloc(19)), new KeyID(Buffer.alloc(20, 3))]) {
        const identity = createIdentity();
        identity[field] = value;
        expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/identity destination/);
      }
      const identity = createIdentity();
      identity[field].varlength = true;
      expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/identity destination/);
    }
  });

  test('validates optional content and serialized identity size', () => {
    const identity = createIdentity();
    identity.contentMap.set(TESTNET_VERUS_CHAINID, Buffer.alloc(32));
    identity.privateAddresses = [new SaplingPaymentAddress({ d: Buffer.alloc(11), pkD: Buffer.alloc(32, 1) })];
    expect(() => validateIdentityForRegistration(identity, expected)).not.toThrow();
    identity.contentMap.set(TESTNET_VERUS_CHAINID, Buffer.alloc(31));
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/32 bytes/);
    identity.contentMap.clear();
    identity.privateAddresses[0].d = Buffer.alloc(10);
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/11-byte/);
    identity.privateAddresses = [];
    identity.contentMultiMap = ContentMultiMap.fromJson({ [TESTNET_VERUS_CHAINID]: '01'.repeat(IDENTITY_REGISTRATION_MAX_BYTES) });
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/size limit/);
  });

  test('honors the exact PBaaS serialized identity size boundary', () => {
    const identity = createIdentity();
    identity.contentMultiMap = ContentMultiMap.fromJson({ [TESTNET_VERUS_CHAINID]: '01'.repeat(5000) });
    const payloadLength = 5000 + IDENTITY_REGISTRATION_MAX_BYTES - identity.getByteLength();
    identity.contentMultiMap = ContentMultiMap.fromJson({ [TESTNET_VERUS_CHAINID]: '01'.repeat(payloadLength) });
    expect(identity.getByteLength()).toBe(IDENTITY_REGISTRATION_MAX_BYTES);
    expect(() => validateIdentityForRegistration(identity, expected)).not.toThrow();
    identity.contentMultiMap = ContentMultiMap.fromJson({ [TESTNET_VERUS_CHAINID]: '01'.repeat(payloadLength + 1) });
    expect(() => validateIdentityForRegistration(identity, expected)).toThrow(/size limit/);
  });
});
