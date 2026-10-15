import { createHash } from 'crypto';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../../../constants/vdxf';
// Exercise the public package exports as well as the wire implementation.
import {
  AdvancedNameReservation, AdvancedNameReservationJSON, CommitmentHash, CommitmentHashJSON,
  IdentityID, KeyID, NameReservation, NameReservationJSON, TxDestination,
  IdentityCommitmentScript, IdentityReservation, IdentityReservationScript,
  Identity, IdentityScript, VerusCLIVerusIDJson
} from '../../../index';
import { fromBase58Check } from '../../../utils/address';
import { EVALS } from '../../../utils/evals';

interface CapturedOutput<T> {
  txid: string;
  height: number;
  blockHash: string;
  vout: number;
  valueSat: number;
  scriptHex: string;
  destinations: string[];
  requiredSignatures: number;
  payload: { evalCode: number; hex: string };
  json: T;
}

interface RegistrationFixture {
  name: string;
  parentContext: string | null;
  commitment: CapturedOutput<CommitmentHashJSON>;
  reservation: CapturedOutput<NameReservationJSON | AdvancedNameReservationJSON>;
  identity: CapturedOutput<VerusCLIVerusIDJson>;
}

const fixtures: {
  schemaVersion: number;
  provenance: { chain: string; chainID: string; daemonVersion: number; protocolVersion: number };
  advancedCommitmentKey: { vdxfid: string; hash160result: string };
  registrations: RegistrationFixture[];
} = require('../../fixtures/identity-registration/veruscoin-v1.json');

function parseReservation(fixture: RegistrationFixture): IdentityReservation {
  return fixture.reservation.payload.evalCode === EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION
    ? AdvancedNameReservation.fromHex(fixture.reservation.payload.hex)
    : NameReservation.fromHex(fixture.reservation.payload.hex);
}

function destination(address: string): TxDestination {
  const decoded = fromBase58Check(address);
  if (decoded.version === I_ADDR_VERSION) return new TxDestination(new IdentityID(decoded.hash));
  if (decoded.version === R_ADDR_VERSION) return new TxDestination(new KeyID(decoded.hash));
  throw new Error('Unsupported captured destination version');
}

describe('offline VRSCTEST identity registration parity', () => {
  test('retains mined legacy, native, subidentity, Unicode, and referral coverage', () => {
    expect(fixtures.schemaVersion).toBe(1);
    expect(fixtures.provenance.chain).toBe('VRSCTEST');
    expect(fixtures.registrations.map(row => row.name)).toEqual([
      'legacy-root', 'advanced-native', 'advanced-subidentity',
      'advanced-unicode-subidentity-referral', 'advanced-mixed-case-referral', 'advanced-emoji-referral'
    ]);
    expect(fixtures.registrations.filter(row => row.parentContext === null)).toHaveLength(1);
    expect(fixtures.registrations.filter(row => row.parentContext !== null && row.parentContext !== fixtures.provenance.chainID)).toHaveLength(2);
    expect(fixtures.registrations.filter(row => /[^\x00-\x7f]/.test(row.reservation.json.name))).toHaveLength(2);
    expect(fixtures.registrations.filter(row => row.reservation.json.referral !== '')).toHaveLength(3);
  });

  test('matches the daemon advanced commitment marker in raw and displayed byte order', () => {
    const raw = CommitmentHash.getAdvancedCommitmentHashKey();
    expect(raw).toEqual(fromBase58Check(fixtures.advancedCommitmentKey.vdxfid).hash);
    expect(Buffer.from(raw).reverse().toString('hex')).toBe(fixtures.advancedCommitmentKey.hash160result);
    expect(raw.toString('hex')).toBe('2767181a4f6abe2090a7dca2c689477d163900f6');
  });

  describe.each(fixtures.registrations)('$name', fixture => {
    test('round-trips the full mined identity payload, JSON and primary script', () => {
      const captured = fixture.identity;
      const payload = Buffer.from(captured.payload.hex, 'hex');
      const identity = new Identity();
      expect(identity.fromBuffer(payload)).toBe(payload.length);
      expect(identity.toBuffer()).toEqual(payload);
      expect(identity.getByteLength()).toBe(payload.length);
      expect(identity.toJson()).toEqual(captured.json);
      expect(identity.getIdentityAddress()).toBe(fixture.reservation.json.nameid);
      expect(Identity.fromJson(captured.json).toBuffer()).toEqual(payload);
      const script = new IdentityScript();
      const bytes = Buffer.from(captured.scriptHex, 'hex');
      expect(script.fromBuffer(bytes)).toBe(bytes.length);
      expect(script.toBuffer()).toEqual(bytes);
      expect(script.getIdentity().toBuffer()).toEqual(payload);
      expect(IdentityScript.fromIdentity(identity).toBuffer()).toEqual(bytes);
      expect(captured.payload.evalCode).toBe(EVALS.EVAL_IDENTITY_PRIMARY);
      expect(captured.valueSat).toBe(0);
    });

    test('matches exact mined reservation bytes and daemon JSON', () => {
      const reservation = parseReservation(fixture);
      const captured = fixture.reservation;
      expect(reservation.toBuffer().toString('hex')).toBe(captured.payload.hex);
      expect(reservation.getByteLength()).toBe(captured.payload.hex.length / 2);
      expect(reservation.name).toBe(captured.json.name);
      expect(Buffer.from(reservation.salt).reverse().toString('hex')).toBe(captured.json.salt);
      expect(reservation.isValid()).toBe(true);

      if (reservation instanceof AdvancedNameReservation) {
        expect(captured.payload.evalCode).toBe(EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION);
        expect(reservation.toJSON()).toEqual(captured.json);
        expect(reservation.parent.toAddress()).toBe(fixture.parentContext);
        expect(reservation.getIdentityAddress()).toBe(captured.json.nameid);
        expect(AdvancedNameReservation.fromJSON(captured.json as AdvancedNameReservationJSON).toBuffer().toString('hex')).toBe(captured.payload.hex);
      } else {
        expect(captured.payload.evalCode).toBe(EVALS.EVAL_IDENTITY_RESERVATION);
        expect(fixture.parentContext).toBeNull();
        // This historical root reservation's RPC JSON reports the active chain
        // as parent. The binary has no parent; its actual derivation is root/null.
        expect(captured.json.parent).toBe(fixtures.provenance.chainID);
        expect(reservation.toJSONWithParent(null)).toEqual({ ...captured.json, parent: '' });
        expect(reservation.getIdentityAddress(null)).toBe(captured.json.nameid);
        expect(reservation.getIdentityAddress(captured.json.parent)).not.toBe(captured.json.nameid);
        expect(NameReservation.fromJSON(captured.json, fixture.parentContext).toBuffer().toString('hex')).toBe(captured.payload.hex);
      }
    });

    test('matches the earlier mined commitment using independent SHA256d and daemon JSON', () => {
      const reservation = parseReservation(fixture);
      const payload = Buffer.from(fixture.reservation.payload.hex, 'hex');
      const digest = createHash('sha256').update(createHash('sha256').update(payload).digest()).digest();
      const commitment = reservation.getCommitment();
      expect(commitment.hash).toEqual(digest);
      expect(commitment.toBuffer().toString('hex')).toBe(fixture.commitment.payload.hex);
      expect(commitment.toJSON()).toEqual(fixture.commitment.json);
      expect(commitment.isAdvanced()).toBe(false);
      expect(commitment.getByteLength()).toBe(32);
      expect(CommitmentHash.fromHex(fixture.commitment.payload.hex).toJSON()).toEqual(fixture.commitment.json);
      expect(CommitmentHash.fromJSON(fixture.commitment.json).toBuffer().toString('hex')).toBe(fixture.commitment.payload.hex);
      expect(fixture.commitment.payload.evalCode).toBe(EVALS.EVAL_IDENTITY_COMMITMENT);
      expect(fixture.commitment.height).toBeGreaterThan(0);
      expect(fixture.commitment.height).toBeLessThan(fixture.reservation.height);
      expect(fixture.commitment.blockHash).not.toBe(fixture.reservation.blockHash);
    });

    test('parses and rebuilds the exact mined commitment script from its captured controller', () => {
      const captured = fixture.commitment;
      const bytes = Buffer.from(captured.scriptHex, 'hex');
      const parsed = new IdentityCommitmentScript();
      expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getByteLength()).toBe(bytes.length);
      expect(parsed.getCommitment().toBuffer().toString('hex')).toBe(captured.payload.hex);
      expect(parsed.getController().toAddress()).toBe(captured.destinations[0]);
      expect(parsed.paramsOptCC.destinations.map(dest => dest.toAddress())).toEqual(captured.destinations);
      expect(parsed.paramsOptCC.m.toNumber()).toBe(captured.requiredSignatures);
      expect(parsed.paramsOptCC.vData).toHaveLength(1);
      expect(parsed.masterOptCC.destinations).toHaveLength(1);
      expect(captured.valueSat).toBe(0);

      const rebuilt = IdentityCommitmentScript.fromCommitment(
        parseReservation(fixture).getCommitment(),
        destination(captured.destinations[0]),
        captured.destinations.length > 1 ? destination(captured.destinations[1]) : undefined
      );
      expect(rebuilt.toBuffer()).toEqual(bytes);
    });

    test('parses and rebuilds the exact mined reveal script addressed to the new identity', () => {
      const captured = fixture.reservation;
      const bytes = Buffer.from(captured.scriptHex, 'hex');
      const parsed = new IdentityReservationScript();
      expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getByteLength()).toBe(bytes.length);
      expect(parsed.getReservation().toBuffer().toString('hex')).toBe(captured.payload.hex);
      expect(parsed.getIdentityAddress(fixture.parentContext)).toBe(captured.json.nameid);
      expect(parsed.paramsOptCC.destinations.map(dest => dest.toAddress())).toEqual(captured.destinations);
      expect(parsed.paramsOptCC.evalCode.toNumber()).toBe(captured.payload.evalCode);
      expect(parsed.paramsOptCC.isValid()).toBe(true);
      expect(parsed.paramsOptCC.getParamObject().toString('hex')).toBe(captured.payload.hex);
      expect(parsed.paramsOptCC.m.toNumber()).toBe(captured.requiredSignatures);
      expect(parsed.paramsOptCC.vData).toHaveLength(1);
      expect(captured.valueSat).toBe(0);

      const rebuilt = IdentityReservationScript.fromReservation(parseReservation(fixture), fixture.parentContext);
      expect(rebuilt.toBuffer()).toEqual(bytes);
    });
  });
});
