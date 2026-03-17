import { BN } from 'bn.js';
import { IdentityUpdateRequestDetails, SignDataMap } from '../../vdxf/classes/identity/IdentityUpdateRequestDetails';
import { PartialSignData } from '../../pbaas/PartialSignData';
import { PartialIdentity } from '../../pbaas/PartialIdentity';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { CompactIAddressObject } from '../../vdxf/classes/CompactAddressObject';
import { KvMap } from '../../utils/KvMap';
import { IDENTITY_VERSION_PBAAS } from '../../pbaas/Identity';
import { DATA_TYPE_MESSAGE, DATA_TYPE_VDXFDATA } from '../../constants/pbaas';
import { FqnVdxfUniValue } from '../../pbaas/VdxfUniValue';
import { FqnContentMultiMap } from '../../pbaas/ContentMultiMap';
import * as VDXF_Data from '../../vdxf/vdxfdatakeys';
import {
  TEST_PARTIAL_IDENTITY,
  TEST_REQUESTID,
  TEST_SYSTEMID,
  TEST_EXPIRYHEIGHT,
  TEST_TXID,
  TEST_BASE_SIGN_DATA_WITH_MMR_DATA,
} from '../constants/fixtures';

// ────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────────────────────

const IADDR_A = 'iBvyi1nuCrTA4g44xN9N7EU1t6a7gwb4h8';
const IADDR_B = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
const FQN_KEY  = VDXF_Data.ContentMultiMapRemoveKeyName;   // 'vrsc::identity.multimapremove'
const FQN_IADDR = VDXF_Data.ContentMultiMapRemoveKey.vdxfid;

const CMM_PAYLOAD = { version: 1, action: 3, entrykey: 'iD3yzD6KnrSG75d8RzirMD6SyvrAS2HxjH' };

function makePsd(msg = 'hello'): PartialSignData {
  return new PartialSignData({
    dataType: DATA_TYPE_MESSAGE,
    data: Buffer.from(msg, 'utf-8'),
  });
}

function makePsdWithFqnVdxf(): PartialSignData {
  return new PartialSignData({
    dataType: DATA_TYPE_VDXFDATA,
    data: FqnVdxfUniValue.fromJson({ [FQN_KEY]: CMM_PAYLOAD }),
  });
}

function baseIdentity(): PartialIdentity {
  return new PartialIdentity({
    version: IDENTITY_VERSION_PBAAS,
    minSigs: new BN(1),
    primaryAddresses: [KeyID.fromAddress('RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH')],
    parent: IdentityID.fromAddress(IADDR_B),
    systemId: IdentityID.fromAddress(IADDR_B),
    name: 'TestID',
    recoveryAuthority: IdentityID.fromAddress(IADDR_B),
    revocationAuthority: IdentityID.fromAddress(IADDR_B),
  });
}

function signDataMap(entries: [CompactIAddressObject, PartialSignData][]): SignDataMap {
  const m = new KvMap<PartialSignData>();
  for (const [k, v] of entries) m.set(k, v);
  return m;
}

function roundTripBuffer(details: IdentityUpdateRequestDetails): IdentityUpdateRequestDetails {
  const restored = new IdentityUpdateRequestDetails();
  restored.fromBuffer(details.toBuffer());
  return restored;
}

function roundTripJson(details: IdentityUpdateRequestDetails): IdentityUpdateRequestDetails {
  return IdentityUpdateRequestDetails.fromJson(details.toJson());
}

function roundTripCLI(details: IdentityUpdateRequestDetails): IdentityUpdateRequestDetails {
  return IdentityUpdateRequestDetails.fromCLIJson(details.toCLIJson());
}

// ────────────────────────────────────────────────────────────────────────────
// Flag / field-presence behaviour
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails flag/field presence', () => {
  test('no optional fields → no flags set', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    expect(d.containsSignData()).toBe(false);
    expect(d.containsRequestID()).toBe(false);
    expect(d.expires()).toBe(false);
    expect(d.containsSystem()).toBe(false);
    expect(d.containsTxid()).toBe(false);
  });

  test('signDataMap present → containsSignData flag set', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    expect(d.containsSignData()).toBe(true);
  });

  test('requestID present → containsRequestID flag set', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity(), requestID: TEST_REQUESTID });
    expect(d.containsRequestID()).toBe(true);
  });

  test('expiryHeight present → expires flag set', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity(), expiryHeight: TEST_EXPIRYHEIGHT });
    expect(d.expires()).toBe(true);
  });

  test('systemID present → containsSystem flag set', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity(), systemID: TEST_SYSTEMID });
    expect(d.containsSystem()).toBe(true);
  });

  test('txid present → containsTxid flag set', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      txid: Buffer.from(TEST_TXID, 'hex').reverse(),
    });
    expect(d.containsTxid()).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Binary round-trips (toBuffer / fromBuffer)
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails binary round-trips', () => {
  test('minimal (no optional fields)', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });

  test('fully populated with iaddress signDataMap key', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: TEST_PARTIAL_IDENTITY,
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID,
      expiryHeight: TEST_EXPIRYHEIGHT,
      txid: Buffer.from(TEST_TXID, 'hex').reverse(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });

  test('signDataMap with FQN key round-trips without losing FQN type', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromFQN(FQN_KEY), makePsd()]]),
    });

    const restored = roundTripBuffer(d);
    expect(restored.toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));

    const [[key]] = [...restored.signDataMap.entries()];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY);
  });

  test('iaddress signDataMap key round-trips as TYPE_I_ADDRESS', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });

    const [[key]] = [...roundTripBuffer(d).signDataMap.entries()];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });

  test('FQN and iaddress key for same identity produce different buffers', () => {
    const withFqn = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromFQN(FQN_KEY), makePsd()]]),
    });
    const withIaddr = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(FQN_IADDR), makePsd()]]),
    });
    expect(withFqn.toBuffer().toString('hex')).not.toBe(withIaddr.toBuffer().toString('hex'));
  });

  test('multiple entries in signDataMap all round-trip correctly', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([
        [CompactIAddressObject.fromAddress(IADDR_A), makePsd('first')],
        [CompactIAddressObject.fromFQN(FQN_KEY),    makePsd('second')],
      ]),
    });
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });

  test('signDataMap with vdxfdata payload round-trips', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsdWithFqnVdxf()]]),
    });
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });

  test('full TEST_BASE_SIGN_DATA_WITH_MMR_DATA payload round-trips', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: TEST_PARTIAL_IDENTITY,
      signDataMap: signDataMap([
        [CompactIAddressObject.fromAddress(IADDR_A), new PartialSignData(TEST_BASE_SIGN_DATA_WITH_MMR_DATA)],
      ]),
    });
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });
});

// ────────────────────────────────────────────────────────────────────────────
// JSON round-trips (toJson / fromJson)
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails JSON round-trips', () => {
  test('minimal round-trip', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    expect(roundTripJson(d).toJson()).toEqual(d.toJson());
  });

  test('fully populated with iaddress key', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: TEST_PARTIAL_IDENTITY,
      requestID: TEST_REQUESTID,
      systemID: TEST_SYSTEMID,
      expiryHeight: TEST_EXPIRYHEIGHT,
      txid: Buffer.from(TEST_TXID, 'hex').reverse(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    expect(roundTripJson(d).toJson()).toEqual(d.toJson());
  });

  test('toJson serializes signDataMap key as iaddress string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    const json = d.toJson();
    expect(Object.keys(json.signdatamap!)).toEqual([IADDR_A]);
  });

  test('FQN key is resolved to iaddress in toJson output', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromFQN(FQN_KEY), makePsd()]]),
    });
    const json = d.toJson();
    // FQN key resolves to its iaddress in JSON
    expect(Object.keys(json.signdatamap!)).toEqual([FQN_IADDR]);
  });

  test('fromJson reconstructs signDataMap as TYPE_I_ADDRESS keys', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    const restored = roundTripJson(d);
    const [[key]] = [...restored.signDataMap.entries()];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });

  test('multiple entries round-trip through JSON', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([
        [CompactIAddressObject.fromAddress(IADDR_A), makePsd('a')],
        [CompactIAddressObject.fromAddress(IADDR_B), makePsd('b')],
      ]),
    });
    expect(roundTripJson(d).toJson()).toEqual(d.toJson());
  });
});

// ────────────────────────────────────────────────────────────────────────────
// CLI JSON round-trips (toCLIJson / fromCLIJson)
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails CLI JSON round-trips', () => {
  test('minimal identity round-trips through CLI JSON', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    expect(roundTripCLI(d).toCLIJson()).toEqual(d.toCLIJson());
  });

  test('iaddress signDataMap key round-trips through CLI JSON', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    expect(roundTripCLI(d).toCLIJson()).toEqual(d.toCLIJson());
  });

  test('fromCLIJson with FQN key in contentmultimap.data creates FQN CompactIAddressObject key', () => {
    const cliJson = {
      ...baseIdentity().toJson(),
      contentmultimap: {
        [FQN_KEY]: { data: { message: 'hello' } },
      },
    } as any;

    const d = IdentityUpdateRequestDetails.fromCLIJson(cliJson);
    expect(d.containsSignData()).toBe(true);
    const [[key]] = [...d.signDataMap.entries()];
    expect(key.isFQN()).toBe(true);
    expect(key.address).toBe(FQN_KEY);
  });

  test('fromCLIJson with iaddress key in contentmultimap.data creates TYPE_I_ADDRESS key', () => {
    const cliJson = {
      ...baseIdentity().toJson(),
      contentmultimap: {
        [IADDR_A]: { data: { message: 'hello' } },
      },
    } as any;

    const d = IdentityUpdateRequestDetails.fromCLIJson(cliJson);
    expect(d.containsSignData()).toBe(true);
    const [[key]] = [...d.signDataMap.entries()];
    expect(key.isIaddress()).toBe(true);
    expect(key.toIAddress()).toBe(IADDR_A);
  });

  test('toCLIJson puts signDataMap entries into contentmultimap as { data: ... }', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd('msg')]]),
    });
    const cli = d.toCLIJson();
    expect(cli.contentmultimap).toBeDefined();
    expect(cli.contentmultimap[IADDR_A]).toBeDefined();
    expect((cli.contentmultimap[IADDR_A] as any).data).toBeDefined();
  });

  test('FQN key in toCLIJson output uses iaddress (resolved)', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromFQN(FQN_KEY), makePsd()]]),
    });
    const cli = d.toCLIJson();
    // toCLIJson resolves to iaddress
    expect(cli.contentmultimap[FQN_IADDR]).toBeDefined();
    expect(cli.contentmultimap[FQN_KEY]).toBeUndefined();
  });

  test('multiple signDataMap entries all appear in toCLIJson output', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([
        [CompactIAddressObject.fromAddress(IADDR_A), makePsd('a')],
        [CompactIAddressObject.fromAddress(IADDR_B), makePsd('b')],
      ]),
    });
    const cli = d.toCLIJson();
    expect(cli.contentmultimap[IADDR_A]).toBeDefined();
    expect(cli.contentmultimap[IADDR_B]).toBeDefined();
  });

  test('contentmultimap entries without .data are not treated as signData', () => {
    const cliJson = {
      ...baseIdentity().toJson(),
      contentmultimap: {
        [IADDR_A]: { data: { message: 'signdata' } },
        [IADDR_B]: ['6868686868686868686868686868686868686868'],
      },
    } as any;

    const d = IdentityUpdateRequestDetails.fromCLIJson(cliJson);
    // Only IADDR_A has .data → only one signDataMap entry
    expect(d.signDataMap?.size).toBe(1);
    // IADDR_B stays in the identity's content_multimap
    expect(d.identity.contentMultiMap.kvContent.size).toBeGreaterThan(0);
  });

  test('details param populates requestID, expiryHeight, systemID, txid', () => {
    const d = IdentityUpdateRequestDetails.fromCLIJson(
      baseIdentity().toJson() as any,
      {
        requestid: TEST_REQUESTID.toJson(),
        expiryheight: TEST_EXPIRYHEIGHT.toString(),
        systemid: TEST_SYSTEMID.toAddress() as string,
        txid: TEST_TXID,
      }
    );

    expect(d.containsRequestID()).toBe(true);
    expect(d.expires()).toBe(true);
    expect(d.containsSystem()).toBe(true);
    expect(d.containsTxid()).toBe(true);
    expect(d.getTxidString()).toBe(TEST_TXID);

    expect(roundTripCLI(d).toCLIJson()).toEqual(d.toCLIJson());
    expect(roundTripJson(d).toJson()).toEqual(d.toJson());
    expect(roundTripBuffer(d).toBuffer().toString('hex')).toBe(d.toBuffer().toString('hex'));
  });
});

// ────────────────────────────────────────────────────────────────────────────
// KvMap collision detection
// ────────────────────────────────────────────────────────────────────────────

describe('SignDataMap (KvMap<PartialSignData>) collision detection', () => {
  test('setting FQN and iaddress keys that resolve to the same iaddress throws', () => {
    const m = new KvMap<PartialSignData>();
    m.set(CompactIAddressObject.fromFQN(FQN_KEY), makePsd('first'));

    expect(() => {
      m.set(CompactIAddressObject.fromAddress(FQN_IADDR), makePsd('second'));
    }).toThrow();
  });

  test('two distinct iaddresses do not collide', () => {
    const m = new KvMap<PartialSignData>();
    m.set(CompactIAddressObject.fromAddress(IADDR_A), makePsd('a'));
    expect(() => {
      m.set(CompactIAddressObject.fromAddress(IADDR_B), makePsd('b'));
    }).not.toThrow();
    expect(m.size).toBe(2);
  });

  test('overwriting the same key (same hex) does not throw', () => {
    const m = new KvMap<PartialSignData>();
    const key = CompactIAddressObject.fromAddress(IADDR_A);
    m.set(key, makePsd('first'));
    expect(() => m.set(key, makePsd('updated'))).not.toThrow();
    expect(m.size).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Txid helpers
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails txid helpers', () => {
  test('setTxidFromString sets buffer in reversed byte order and flag', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    d.setTxidFromString(TEST_TXID);
    expect(d.containsTxid()).toBe(true);
    expect(d.getTxidString()).toBe(TEST_TXID);
    expect(d.txid.toString('hex')).toBe(Buffer.from(TEST_TXID, 'hex').reverse().toString('hex'));
  });

  test('txid round-trips through buffer', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    d.setTxidFromString(TEST_TXID);
    expect(roundTripBuffer(d).getTxidString()).toBe(TEST_TXID);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getContentMultiMapKeys
// ────────────────────────────────────────────────────────────────────────────

describe('IdentityUpdateRequestDetails.getContentMultiMapKeys()', () => {
  function identityWithFqnCmm(cmmJson: Record<string, any>): PartialIdentity {
    return new PartialIdentity({
      version: IDENTITY_VERSION_PBAAS,
      minSigs: new BN(1),
      primaryAddresses: [KeyID.fromAddress('RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH')],
      parent: IdentityID.fromAddress(IADDR_B),
      systemId: IdentityID.fromAddress(IADDR_B),
      name: 'TestID',
      recoveryAuthority: IdentityID.fromAddress(IADDR_B),
      revocationAuthority: IdentityID.fromAddress(IADDR_B),
      contentMultiMap: FqnContentMultiMap.fromJson(cmmJson),
    });
  }

  test('identity with no CMM entries and no signDataMap → returns []', () => {
    const d = new IdentityUpdateRequestDetails({ identity: baseIdentity() });
    expect(d.getContentMultiMapKeys()).toEqual([]);
  });

  test('identity with iaddress outer CMM key → returns iaddress string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: identityWithFqnCmm({ [IADDR_A]: 'aabbccdd' }),
    });
    expect(d.getContentMultiMapKeys()).toContain(IADDR_A);
  });

  test('identity with FQN outer CMM key → returns FQN string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: identityWithFqnCmm({ [FQN_KEY]: 'aabbccdd' }),
    });
    expect(d.getContentMultiMapKeys()).toContain(FQN_KEY);
  });

  test('identity with FqnVdxfUniValue inner FQN key → outer + inner key both returned', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: identityWithFqnCmm({ [IADDR_A]: [{ [FQN_KEY]: CMM_PAYLOAD }] }),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, FQN_KEY]);
  });

  test('signDataMap with iaddress key, message data → returns key as iaddress string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd()]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A]);
  });

  test('signDataMap with FQN key, message data → returns FQN string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromFQN(FQN_KEY), makePsd()]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([FQN_KEY]);
  });

  test('signDataMap FqnVdxfUniValue with FQN inner key → outer key + inner FQN string', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsdWithFqnVdxf()]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, FQN_KEY]);
  });

  test('signDataMap FqnVdxfUniValue with iaddress inner key → outer key + inner iaddress string', () => {
    const psd = new PartialSignData({
      dataType: DATA_TYPE_VDXFDATA,
      data: FqnVdxfUniValue.fromJson({ [FQN_IADDR]: CMM_PAYLOAD }),
    });
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), psd]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, FQN_IADDR]);
  });

  test('message-type psd produces no inner keys', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), makePsd('hello')]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A]);
  });

  test('FqnVdxfUniValue with raw bytes (empty inner key) is skipped', () => {
    const psd = new PartialSignData({
      dataType: DATA_TYPE_VDXFDATA,
      data: FqnVdxfUniValue.fromJson({ serializedhex: 'deadbeef' }),
    });
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_A), psd]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A]);
  });

  test('identity CMM keys and signDataMap keys are concatenated', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: identityWithFqnCmm({ [IADDR_A]: 'aabbccdd' }),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_B), makePsd()]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, IADDR_B]);
  });

  test('multiple signDataMap entries produce keys in insertion order', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: baseIdentity(),
      signDataMap: signDataMap([
        [CompactIAddressObject.fromAddress(IADDR_A), makePsd()],
        [CompactIAddressObject.fromAddress(IADDR_B), makePsdWithFqnVdxf()],
      ]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, IADDR_B, FQN_KEY]);
  });

  test('identity CMM inner key + signDataMap outer + signDataMap inner all present', () => {
    const d = new IdentityUpdateRequestDetails({
      identity: identityWithFqnCmm({ [IADDR_A]: [{ [FQN_KEY]: CMM_PAYLOAD }] }),
      signDataMap: signDataMap([[CompactIAddressObject.fromAddress(IADDR_B), makePsdWithFqnVdxf()]]),
    });
    expect(d.getContentMultiMapKeys()).toEqual([IADDR_A, FQN_KEY, IADDR_B, FQN_KEY]);
  });
});
