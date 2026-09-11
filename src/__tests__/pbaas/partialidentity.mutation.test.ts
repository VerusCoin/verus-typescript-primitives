import { Identity, VerusCLIVerusIDJson } from '../../pbaas/Identity';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { PartialIdentity } from '../../pbaas/PartialIdentity';
import { BigNumber } from '../../utils/types/BigNumber';

const name = 'UpdateMe';
const primaryAddress = new KeyID(Buffer.alloc(20, 0x31)).toAddress();
const authorityAddress = new IdentityID(Buffer.alloc(20, 0x42)).toAddress();
const privateAddress = 'zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa';

function expectRoundTrips(identity: PartialIdentity, json: VerusCLIVerusIDJson) {
  expect(identity.toJson()).toEqual(json);
  const wire = identity.toBuffer();
  const binaryRestored = new PartialIdentity();

  expect(binaryRestored.fromBuffer(wire)).toBe(wire.length);
  expect(binaryRestored.toJson()).toEqual(json);
  expect(binaryRestored.toBuffer()).toEqual(wire);

  const jsonRestored = PartialIdentity.fromJson(JSON.parse(JSON.stringify(json)));
  expect(jsonRestored.toJson()).toEqual(json);
  expect(jsonRestored.toBuffer()).toEqual(wire);
}

const setters: Array<{
  method: string;
  mutate: (identity: PartialIdentity) => void;
  presence: BigNumber;
  json: VerusCLIVerusIDJson;
}> = [
  {
    method: 'setPrimaryAddresses',
    mutate: identity => identity.setPrimaryAddresses([primaryAddress]),
    presence: PartialIdentity.PARTIAL_ID_CONTAINS_PRIMARY_ADDRS,
    json: { primaryaddresses: [primaryAddress] },
  },
  {
    method: 'setRevocation',
    mutate: identity => identity.setRevocation(authorityAddress),
    presence: PartialIdentity.PARTIAL_ID_CONTAINS_REVOCATION,
    json: { revocationauthority: authorityAddress },
  },
  {
    method: 'setRecovery',
    mutate: identity => identity.setRecovery(authorityAddress),
    presence: PartialIdentity.PARTIAL_ID_CONTAINS_RECOVERY,
    json: { recoveryauthority: authorityAddress },
  },
  {
    method: 'setPrivateAddress',
    mutate: identity => identity.setPrivateAddress(privateAddress),
    presence: PartialIdentity.PARTIAL_ID_CONTAINS_PRIV_ADDRS,
    json: { privateaddress: privateAddress },
  },
  {
    method: 'clearContentMultiMap',
    mutate: identity => identity.clearContentMultiMap(),
    presence: PartialIdentity.PARTIAL_ID_CONTAINS_CONTENT_MULTIMAP,
    json: { contentmultimap: {} },
  },
];

describe('PartialIdentity mutation presence', () => {
  test.each(setters)('$method adds its field to a name-only partial and stays present when repeated', ({ mutate, presence, json }) => {
    const identity = new PartialIdentity({ name });
    expect(identity.contains.isZero()).toBe(true);

    mutate(identity);
    expect(identity.contains.eq(presence)).toBe(true);
    mutate(identity);
    expect(identity.contains.eq(presence)).toBe(true);

    expectRoundTrips(identity, { name, ...json });
  });

  test('setting an empty primary address list preserves an explicit clearing operation', () => {
    const identity = new PartialIdentity({ name });
    identity.setPrimaryAddresses([primaryAddress]);
    identity.setPrimaryAddresses([]);
    identity.setPrimaryAddresses([]);

    expect(identity.containsPrimaryAddresses()).toBe(true);
    expectRoundTrips(identity, { name, primaryaddresses: [] });
  });

  test.each([
    ['setPrimaryAddresses', (identity: PartialIdentity) => identity.setPrimaryAddresses([primaryAddress, 'invalid'])],
    ['setRevocation', (identity: PartialIdentity) => identity.setRevocation('invalid')],
    ['setRecovery', (identity: PartialIdentity) => identity.setRecovery('invalid')],
    ['setPrivateAddress', (identity: PartialIdentity) => identity.setPrivateAddress('invalid')],
  ])('a rejected %s leaves the partial unchanged', (_method, mutate) => {
    const identity = new PartialIdentity({ name });
    const wire = identity.toBuffer();

    expect(() => mutate(identity)).toThrow();
    expect(identity.contains.isZero()).toBe(true);
    expect(identity.toJson()).toEqual({ name });
    expect(identity.toBuffer()).toEqual(wire);
  });

  test.each([
    ['VERUSID', Identity.VERSION_VERUSID, true],
    ['VAULT', Identity.VERSION_VAULT, false],
  ])('upgrading from %s includes only fields changed by the upgrade', (_versionName, version, changesSystemId) => {
    const identity = new PartialIdentity({ name });
    // Supply the known context without including it in the partial update.
    identity.version = version;
    identity.parent = IdentityID.fromAddress(authorityAddress);

    identity.upgradeVersion();
    expect(identity.containsVersion()).toBe(true);
    expect(identity.containsSystemId()).toBe(changesSystemId);
    const presence = changesSystemId
      ? PartialIdentity.PARTIAL_ID_CONTAINS_VERSION.or(PartialIdentity.PARTIAL_ID_CONTAINS_SYSTEM_ID)
      : PartialIdentity.PARTIAL_ID_CONTAINS_VERSION;
    expect(identity.contains.eq(presence)).toBe(true);
    expectRoundTrips(identity, {
      name,
      version: Identity.VERSION_CURRENT.toNumber(),
      ...(changesSystemId ? { systemid: authorityAddress } : {}),
    });
  });

  test.each([
    ['same version', Identity.VERSION_CURRENT, Identity.VERSION_CURRENT, false],
    ['downgrade', Identity.VERSION_CURRENT, Identity.VERSION_VERUSID, true],
    ['pre-PBAAS target', Identity.VERSION_VERUSID, Identity.VERSION_VAULT, true],
    ['unknown target', Identity.VERSION_VERUSID, Identity.VERSION_CURRENT.addn(1), true],
  ])('a %s upgrade leaves fields and presence unchanged', (_description, version, target, rejects) => {
    const identity = new PartialIdentity({ name });
    identity.version = version;
    const wire = identity.toBuffer();

    if (rejects) expect(() => identity.upgradeVersion(target)).toThrow();
    else expect(() => identity.upgradeVersion(target)).not.toThrow();

    expect(identity.version.eq(version)).toBe(true);
    expect(identity.systemId).toBeUndefined();
    expect(identity.contains.isZero()).toBe(true);
    expect(identity.toJson()).toEqual({ name });
    expect(identity.toBuffer()).toEqual(wire);
  });
});
