import { BN } from 'bn.js';
import { AdvancedNameReservation } from '../../../pbaas/AdvancedNameReservation';
import { CommitmentHash } from '../../../pbaas/CommitmentHash';
import { CurrencyValueMap } from '../../../pbaas/CurrencyValueMap';
import { IdentityID } from '../../../pbaas/IdentityID';
import { KeyID } from '../../../pbaas/KeyID';
import { NameReservation } from '../../../pbaas/NameReservation';
import { OptCCParams } from '../../../pbaas/OptCCParams';
import { PubKey } from '../../../pbaas/PubKey';
import { TxDestination } from '../../../pbaas/TxDestination';
import { TokenOutput } from '../../../pbaas/TokenOutput';
import { IdentityCommitmentScript } from '../../../pbaas/transaction/IdentityCommitmentScript';
import { IdentityReservationScript } from '../../../pbaas/transaction/IdentityReservationScript';
import { SmartTransactionScript } from '../../../pbaas/transaction/SmartTransactionScript';
import { EVALS } from '../../../utils/evals';
import { OPS } from '../../../utils/ops';
import { compile } from '../../../utils/script';

// Fixed-byte vectors independently assembled from CNameReservation/CAdvancedNameReservation
// and the single-object MakeMofNCCScript in ../VerusCoin/src/cc/CCinclude.h.
// SHA256d and identity raw bytes were computed with Python hashlib, not these serializers.
const vectors = {
  legacyPayload: '05416c6963653132333435363738393a3b3c3d3e3f4041424344000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  advancedPayload: '0100000005416c696365a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b43132333435363738393a3b3c3d3e3f4041424344000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  advancedCommitment: '62dd15ac56fdcedb6efe9c57adb850d5c11873517f77796a39f26719c8f4ba26',
  identityRaw: '8190173a0a560fe16b1bd2e0082974253ccb3543',
  legacyScript: '1b040300010115048190173a0a560fe16b1bd2e0082974253ccb3543cc4c56040312010115048190173a0a560fe16b1bd2e0082974253ccb35433a05416c6963653132333435363738393a3b3c3d3e3f4041424344000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f75',
  advancedScript: '1b040300010115048190173a0a560fe16b1bd2e0082974253ccb3543cc4c6f04030a010115048190173a0a560fe16b1bd2e0082974253ccb35434c520100000005416c696365a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b43132333435363738393a3b3c3d3e3f4041424344000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f75',
  ordinaryScript: '1a0403000101146162636465666768696a6b6c6d6e6f7071727374cc3b0403110101146162636465666768696a6b6c6d6e6f70717273742062dd15ac56fdcedb6efe9c57adb850d5c11873517f77796a39f26719c8f4ba2675',
  restrictedScript: '1a0403000101146162636465666768696a6b6c6d6e6f7071727374cc4c510403110202146162636465666768696a6b6c6d6e6f70717273741504a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b42062dd15ac56fdcedb6efe9c57adb850d5c11873517f77796a39f26719c8f4ba2675'
};

const parent = new IdentityID(Buffer.from('a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4', 'hex'));
const controller = new TxDestination(new KeyID(Buffer.from('6162636465666768696a6b6c6d6e6f7071727374', 'hex')));
const authority = new TxDestination(parent);

function advanced(): AdvancedNameReservation {
  const reservation = new AdvancedNameReservation();
  reservation.fromBuffer(Buffer.from(vectors.advancedPayload, 'hex'));
  return reservation;
}

function legacy(): NameReservation {
  const reservation = new NameReservation();
  reservation.fromBuffer(Buffer.from(vectors.legacyPayload, 'hex'));
  return reservation;
}

function generic(hex: string): SmartTransactionScript {
  const script = new SmartTransactionScript();
  script.fromBuffer(Buffer.from(hex, 'hex'));
  return script;
}

describe('identity commitment scripts', () => {
  test.each([false, true])('matches fixed bytes for restricted=%s', restricted => {
    const expected = restricted ? vectors.restrictedScript : vectors.ordinaryScript;
    const built = IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), controller, restricted ? authority : undefined);
    expect(built.toBuffer().toString('hex')).toBe(expected);
    expect(built.getByteLength()).toBe(expected.length / 2);
    expect(built.masterOptCC.n.toNumber()).toBe(1);
    expect(built.paramsOptCC.n.toNumber()).toBe(restricted ? 2 : 1);
    // The C++ script parser appends the master to vData; the wire params do not.
    expect(built.paramsOptCC.vData).toHaveLength(1);

    const parsed = new IdentityCommitmentScript();
    const bytes = Buffer.from(expected, 'hex');
    expect(parsed.fromBuffer(Buffer.concat([Buffer.alloc(3), bytes, Buffer.from([255])]), 3, bytes.length)).toBe(3 + bytes.length);
    expect(parsed.getCommitment().hash.toString('hex')).toBe(vectors.advancedCommitment);
    expect(parsed.getController().toChunk()).toEqual(controller.toChunk());
    expect(parsed.getAuthorization()?.toChunk()).toEqual(restricted ? authority.toChunk() : undefined);
    expect(parsed.toBuffer()).toEqual(bytes);
  });

  test('supports identity controllers even when controller and authorization overlap', () => {
    const script = IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), authority, authority);
    const parsed = new IdentityCommitmentScript();
    parsed.fromBuffer(script.toBuffer());
    expect(parsed.paramsOptCC.m.toNumber()).toBe(2);
    expect(parsed.getController().toChunk()).toEqual(parsed.getAuthorization().toChunk());
  });

  test('supports compressed public-key controllers', () => {
    const publicKey = new TxDestination(new PubKey(Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex')));
    const script = IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), publicKey);
    const parsed = new IdentityCommitmentScript();
    parsed.fromBuffer(script.toBuffer());
    expect(parsed.getController().toChunk()).toEqual(publicKey.toChunk());
  });

  test('rejects non-identity authorization and invalid controller hashes', () => {
    expect(() => IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), controller, controller)).toThrow();
    for (const invalid of [Buffer.alloc(19, 1), Buffer.alloc(21, 1), Buffer.alloc(20)]) {
      expect(() => IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), new TxDestination(new KeyID(invalid)))).toThrow();
    }
    const invalidPublicKey = new TxDestination(new PubKey(Buffer.alloc(33, 4)));
    expect(() => IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), invalidPublicKey)).toThrow('compressed');
  });

  test.each(['wrong eval', 'wrong threshold', 'extra payload', 'trailing payload', 'truncated payload', 'zero hash', 'wrong index', 'master payload'])('rejects %s', kind => {
    const script = generic(vectors.restrictedScript);
    if (kind === 'wrong eval') script.paramsOptCC.evalCode = new BN(EVALS.EVAL_IDENTITY_PRIMARY);
    if (kind === 'wrong threshold') script.paramsOptCC.m = new BN(1);
    if (kind === 'extra payload') script.paramsOptCC.vData.push(Buffer.from([1]));
    if (kind === 'trailing payload') script.paramsOptCC.vData[0] = Buffer.concat([script.paramsOptCC.vData[0], Buffer.from([0])]);
    if (kind === 'truncated payload') script.paramsOptCC.vData[0] = script.paramsOptCC.vData[0].subarray(0, 31);
    if (kind === 'zero hash') script.paramsOptCC.vData[0] = Buffer.alloc(32);
    if (kind === 'wrong index') script.masterOptCC.destinations = [authority];
    if (kind === 'master payload') script.masterOptCC.vData.push(script.paramsOptCC.vData[0]);
    expect(() => new IdentityCommitmentScript().fromBuffer(script.toBuffer())).toThrow();
  });

  test('rejects nonminimal outer and inner script pushes', () => {
    const canonical = Buffer.from(vectors.ordinaryScript, 'hex');
    const nonminimalOuter = Buffer.concat([Buffer.from([OPS.OP_PUSHDATA1]), canonical]);
    expect(() => new IdentityCommitmentScript().fromBuffer(nonminimalOuter)).toThrow('noncanonical');
    const script = generic(vectors.ordinaryScript);
    const nonminimalMaster = Buffer.concat([Buffer.from([OPS.OP_PUSHDATA1]), script.masterOptCC.toChunk()]);
    const nonminimalInner = compile([nonminimalMaster, OPS.OP_CHECKCRYPTOCONDITION, script.paramsOptCC.toChunk(), OPS.OP_DROP]);
    expect(() => new IdentityCommitmentScript().fromBuffer(nonminimalInner)).toThrow('noncanonical');
  });

  test('revalidates exposed mutable parameters before serialization', () => {
    const script = IdentityCommitmentScript.fromCommitment(advanced().getCommitment(), controller);
    script.paramsOptCC.evalCode = new BN(EVALS.EVAL_IDENTITY_RESERVATION);
    expect(() => script.toBuffer()).toThrow();
    expect(() => script.getCommitment()).toThrow();
  });

  test('preserves token-bearing offer commitments when parsing but rejects them for name creation', () => {
    const commitment = new CommitmentHash({ tokenOutput: new TokenOutput({
      version: new BN(1),
      values: new CurrencyValueMap({ valueMap: new Map([[parent.toAddress(), new BN(123456789)]]) })
    }) });
    expect(commitment.isAdvanced()).toBe(true);
    expect(() => IdentityCommitmentScript.fromCommitment(commitment, controller)).toThrow('ordinary');
    const script = generic(vectors.ordinaryScript);
    script.paramsOptCC.vData[0] = commitment.toBuffer();
    const bytes = script.toBuffer();
    const parsed = new IdentityCommitmentScript();
    parsed.fromBuffer(bytes);
    expect(parsed.getCommitment().isAdvanced()).toBe(true);
    expect(parsed.getCommitment().tokenOutput.reserveValues.valueMap.get(parent.toAddress()).toString()).toBe('123456789');
    expect(parsed.toBuffer()).toEqual(bytes);
  });
});

describe('identity reservation scripts', () => {
  test.each([false, true])('matches fixed reveal bytes for advanced=%s', isAdvanced => {
    const reservation = isAdvanced ? advanced() : legacy();
    const built = IdentityReservationScript.fromReservation(reservation, parent.toAddress());
    const expected = isAdvanced ? vectors.advancedScript : vectors.legacyScript;
    expect(built.toBuffer().toString('hex')).toBe(expected);
    expect(built.getByteLength()).toBe(expected.length / 2);
    expect(built.getIdentityAddress()).toBe(new IdentityID(Buffer.from(vectors.identityRaw, 'hex')).toAddress());

    const parsed = new IdentityReservationScript();
    const bytes = Buffer.from(expected, 'hex');
    expect(parsed.fromBuffer(Buffer.concat([Buffer.alloc(2), bytes, Buffer.alloc(2)]), 2, bytes.length)).toBe(2 + bytes.length);
    expect(parsed.paramsOptCC.isValid()).toBe(true);
    expect(parsed.paramsOptCC.getParamObject()).toEqual(reservation.toBuffer());
    expect(parsed.getReservation()).toBeInstanceOf(isAdvanced ? AdvancedNameReservation : NameReservation);
    expect(parsed.getReservation().toBuffer()).toEqual(reservation.toBuffer());
    expect(parsed.toBuffer()).toEqual(bytes);
  });

  test('requires explicit legacy parent context and permits explicit null for a root name', () => {
    expect(() => IdentityReservationScript.fromReservation(legacy())).toThrow('explicit parent');
    const root = IdentityReservationScript.fromReservation(legacy(), null);
    expect(root.getIdentityAddress(null)).toBe(legacy().getIdentityAddress(null));
    const child = IdentityReservationScript.fromReservation(legacy(), parent.toAddress());
    expect(child.getIdentityAddress(parent.toAddress())).toBe(legacy().getIdentityAddress(parent.toAddress()));
    expect(() => child.getIdentityAddress(null)).toThrow('supplied parent');
    expect(root.getIdentityAddress()).not.toBe(child.getIdentityAddress());
  });

  test.each(['wrong eval', 'wrong destination', 'wrong parent', 'extra data', 'trailing payload', 'truncated payload', 'two destinations'])('rejects %s', kind => {
    const script = generic(vectors.advancedScript);
    if (kind === 'wrong eval') script.paramsOptCC.evalCode = new BN(EVALS.EVAL_RESERVE_OUTPUT);
    if (kind === 'wrong destination') {
      script.masterOptCC.destinations = [authority];
      script.paramsOptCC.destinations = [authority];
    }
    if (kind === 'wrong parent') script.paramsOptCC.vData[0][10] ^= 1;
    if (kind === 'extra data') script.paramsOptCC.vData.push(script.masterOptCC.toChunk());
    if (kind === 'trailing payload') script.paramsOptCC.vData[0] = Buffer.concat([script.paramsOptCC.vData[0], Buffer.from([0])]);
    if (kind === 'truncated payload') script.paramsOptCC.vData[0] = script.paramsOptCC.vData[0].subarray(0, -1);
    if (kind === 'two destinations') {
      script.paramsOptCC.destinations.push(authority);
      script.paramsOptCC.n = new BN(2);
      script.paramsOptCC.m = new BN(2);
    }
    expect(() => new IdentityReservationScript().fromBuffer(script.toBuffer())).toThrow();
  });

  test('rejects reservation scripts addressed to a key instead of an identity', () => {
    const script = generic(vectors.legacyScript);
    script.masterOptCC.destinations = [controller];
    script.paramsOptCC.destinations = [controller];
    expect(() => new IdentityReservationScript().fromBuffer(script.toBuffer())).toThrow('identities');
  });

  test('rejects malformed envelopes and incomplete script pushes', () => {
    const bytes = Buffer.from(vectors.advancedScript, 'hex');
    for (const malformed of [bytes.subarray(0, -1), bytes.subarray(0, -2), Buffer.concat([bytes, Buffer.from([OPS.OP_1])])]) {
      expect(() => new IdentityReservationScript().fromBuffer(malformed)).toThrow();
    }
  });

  test('requires a payload for advanced optional parameters', () => {
    const params = new OptCCParams({ version: new BN(3), evalCode: new BN(EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION), m: new BN(0), n: new BN(0) });
    expect(params.isValid()).toBe(false);
    expect(params.getParamObject()).toBeNull();
  });
});
