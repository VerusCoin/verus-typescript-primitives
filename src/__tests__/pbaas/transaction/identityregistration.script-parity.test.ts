import { BN } from 'bn.js';
import { createHash } from 'crypto';
import {
  AdvancedNameReservation, AdvancedNameReservationJSON, CommitmentHash, CommitmentHashJSON,
  CurrencyValueMap, IdentityCommitmentScript, IdentityID, IdentityReservationScript,
  KeyID, NameReservation, NameReservationJSON, PubKey, TokenOutput, TxDestination,
} from '../../../index';

type ReservationInput = {
  format: 'legacy' | 'advanced'; version: number; name: string;
  parentHex: string; referralHex: string; saltHex: string;
};
type CommitmentInput = {
  hashHex: string; controllerType: 'key' | 'identity' | 'public-key';
  controllerHex: string; authorizationHex: string | null;
  entries?: { currencyHex: string; amount: string }[];
};
type Fixture<Input> = {
  name: string; kind: string; input: Input; payloadHex: string; scriptHex: string;
  decoded: {
    type: string; reqSigs: number; addresses: string[];
    identityreservation?: NameReservationJSON | AdvancedNameReservationJSON | 'invalid';
    commitmenthash?: CommitmentHashJSON;
  };
  creationAllowed?: boolean;
  currencyValuesJSON?: string;
  exactCurrencyValues?: { [currency: string]: string };
};
const fixtures: {
  schemaVersion: number;
  provenance: { chain: string; chainID: string; readOnlyRPCMethods: string[] };
  cases: Fixture<ReservationInput | CommitmentInput>[];
  differentialCases: (Fixture<ReservationInput> & { policy: string })[];
  daemonLimitations: { name: string; entries: { currencyHex: string; amount: string }[];
    payloadHex: string; scriptHex: string; rawRPCJSON: string }[];
} = require('../../fixtures/identity-registration/scripted-v1.json');

const reservations = fixtures.cases.filter(row => row.kind === 'reservation') as Fixture<ReservationInput>[];
const ordinaryCommitments = fixtures.cases.filter(row => row.kind === 'commitment') as Fixture<CommitmentInput>[];
const taggedCommitments = fixtures.cases.filter(row => row.kind === 'tagged-commitment') as Fixture<CommitmentInput>[];

function identity(hex: string): IdentityID { return new IdentityID(Buffer.from(hex, 'hex')); }
function parent(input: ReservationInput): string | null {
  return /^0+$/.test(input.parentHex) ? null : identity(input.parentHex).toAddress();
}
function makeReservation(input: ReservationInput): AdvancedNameReservation | NameReservation {
  const data = {
    version: input.version, name: input.name, parent: identity(input.parentHex),
    referral: identity(input.referralHex), salt: Buffer.from(input.saltHex, 'hex'),
  };
  return input.format === 'advanced' ? new AdvancedNameReservation(data) : new NameReservation(data);
}
function controller(input: CommitmentInput): TxDestination {
  const bytes = Buffer.from(input.controllerHex, 'hex');
  return new TxDestination(input.controllerType === 'identity' ? new IdentityID(bytes)
    : input.controllerType === 'key' ? new KeyID(bytes) : new PubKey(bytes));
}
function address(destination: TxDestination): string {
  if (destination.data instanceof PubKey) {
    const SHA256 = createHash('sha256').update(destination.data.bytes).digest();
    return new KeyID(createHash('ripemd160').update(SHA256).digest()).toAddress();
  }
  return destination.toAddress();
}
// Independent exact decimal normalization for comparison with original daemon tokens.
function atomic(decimal: string): string {
  const match = /^(-?)(\d+)(?:\.(\d{1,8}))?$/.exec(decimal);
  if (!match) throw new Error('Unexpected captured currency amount');
  const digits = (match[2] + (match[3] || '').padEnd(8, '0')).replace(/^0+/, '') || '0';
  return (match[1] && digits !== '0' ? '-' : '') + digits;
}

describe('daemon-decoded independently encoded registration scripts', () => {
  test('records read-only oracle provenance and every supported wire branch', () => {
    expect(fixtures.schemaVersion).toBe(1);
    expect(fixtures.provenance.chain).toBe('VRSCTEST');
    expect(fixtures.provenance.readOnlyRPCMethods).toEqual(['getinfo', 'getvdxfid', 'decodescript']);
    expect(reservations).toHaveLength(28);
    expect(ordinaryCommitments).toHaveLength(8);
    expect(taggedCommitments).toHaveLength(22);
    expect(reservations.filter(row => Buffer.byteLength(row.input.name) === 64)).toHaveLength(6);
  });

  describe.each(reservations)('$name', fixture => {
    test('encodes and decodes the exact daemon-recognized object and salt bytes', () => {
      const reservation = makeReservation(fixture.input);
      const bytes = Buffer.from(fixture.payloadHex, 'hex');
      const parsed = fixture.input.format === 'advanced'
        ? AdvancedNameReservation.fromHex(fixture.payloadHex) : NameReservation.fromHex(fixture.payloadHex);
      expect(reservation.toBuffer()).toEqual(bytes);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getByteLength()).toBe(bytes.length);
      expect(parsed.name).toBe(fixture.input.name);
      expect(parsed.salt.toString('hex')).toBe(fixture.input.saltHex);
      const framed = Buffer.concat([Buffer.alloc(5, 0x7f), bytes, Buffer.alloc(3, 0xab)]);
      const framedParsed = fixture.input.format === 'advanced' ? new AdvancedNameReservation() : new NameReservation();
      expect(framedParsed.fromBuffer(framed, 5, bytes.length)).toBe(5 + bytes.length);
      expect(framedParsed.toBuffer()).toEqual(bytes);
      const SHA256 = createHash('sha256').update(bytes).digest();
      expect(reservation.getCommitment().hash).toEqual(createHash('sha256').update(SHA256).digest());
    });

    test('matches daemon JSON and independent identity-name derivation', () => {
      const reservation = makeReservation(fixture.input);
      const daemonJSON = fixture.decoded.identityreservation as NameReservationJSON | AdvancedNameReservationJSON;
      if (reservation instanceof AdvancedNameReservation) {
        expect(reservation.toJSONWithRootSystem('VRSCTEST')).toEqual(daemonJSON);
        expect(reservation.getIdentityAddress('VRSCTEST')).toBe(daemonJSON.nameid);
        expect(AdvancedNameReservation.fromJSON(daemonJSON as AdvancedNameReservationJSON, 'VRSCTEST').toBuffer().toString('hex')).toBe(fixture.payloadHex);
      } else {
        const parentAddress = parent(fixture.input);
        // CNameReservation RPC parent metadata special-cases the historical global root.
        expect(reservation.toJSONWithParent(parentAddress)).toEqual({ ...daemonJSON, parent: parentAddress || '' });
        expect(reservation.getIdentityAddress(parentAddress)).toBe(daemonJSON.nameid);
        expect(NameReservation.fromJSON(daemonJSON, parentAddress).toBuffer().toString('hex')).toBe(fixture.payloadHex);
      }
      expect(fixture.decoded.addresses).toEqual([daemonJSON.nameid]);
    });

    test('parses exact daemon scripts and builds creation scripts for eligible structural requests', () => {
      const bytes = Buffer.from(fixture.scriptHex, 'hex');
      const parsed = new IdentityReservationScript();
      expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
      expect(parsed.toBuffer()).toEqual(bytes);
      expect(parsed.getReservation().toBuffer().toString('hex')).toBe(fixture.payloadHex);
      expect(parsed.getIdentityAddress(parent(fixture.input), 'VRSCTEST')).toBe(fixture.decoded.addresses[0]);
      expect(parsed.paramsOptCC.evalCode.toNumber()).toBe(fixture.input.format === 'advanced' ? 10 : 18);
      expect(parsed.paramsOptCC.m.toNumber()).toBe(1);
      expect(parsed.masterOptCC.m.toNumber()).toBe(fixture.decoded.reqSigs);
      const reservation = makeReservation(fixture.input);
      if (fixture.creationAllowed === false) {
        expect(() => IdentityReservationScript.fromReservation(reservation, parent(fixture.input))).toThrow();
      } else {
        expect(IdentityReservationScript.fromReservation(reservation, parent(fixture.input)).toBuffer()).toEqual(bytes);
      }
    });
  });

  describe.each(ordinaryCommitments)('$name', fixture => {
    test('builds exact controller/authorization destinations and inner thresholds', () => {
      const input = fixture.input;
      const authorization = input.authorizationHex ? new TxDestination(identity(input.authorizationHex)) : undefined;
      const script = IdentityCommitmentScript.fromCommitment(
        new CommitmentHash({ hash: Buffer.from(input.hashHex, 'hex') }), controller(input), authorization
      );
      expect(script.toBuffer().toString('hex')).toBe(fixture.scriptHex);
      expect(script.paramsOptCC.destinations.map(address)).toEqual(fixture.decoded.addresses);
      expect(script.paramsOptCC.m.toNumber()).toBe(authorization ? 2 : 1);
      expect(script.paramsOptCC.n.toNumber()).toBe(authorization ? 2 : 1);
      // RPC reqSigs describes the 1-of-1 master index, including restricted 2-of-2 conditions.
      expect(script.masterOptCC.m.toNumber()).toBe(fixture.decoded.reqSigs);
      expect(script.paramsOptCC.vData).toHaveLength(1);
      expect(script.masterOptCC.vData).toHaveLength(0);
    });

    test('round-trips daemon-recognized commitment JSON and script bytes', () => {
      const script = new IdentityCommitmentScript();
      const bytes = Buffer.from(fixture.scriptHex, 'hex');
      expect(script.fromBuffer(bytes)).toBe(bytes.length);
      expect(script.toBuffer()).toEqual(bytes);
      expect(script.getController().toChunk()).toEqual(controller(fixture.input).toChunk());
      expect(script.getCommitment().toJSON()).toEqual(fixture.decoded.commitmenthash);
      expect(CommitmentHash.fromJSON(fixture.decoded.commitmenthash).toBuffer().toString('hex')).toBe(fixture.payloadHex);
    });
  });

  describe.each(taggedCommitments)('$name', fixture => {
    test('preserves exact marker, VARINT/multivalue wire format, map ordering and signed amounts', () => {
      const entries = fixture.input.entries;
      const tokenOutput = new TokenOutput({ version: new BN(1), values: new CurrencyValueMap({
        valueMap: new Map(entries.map(entry => [identity(entry.currencyHex).toAddress(), new BN(entry.amount)]))
      }) });
      const commitment = new CommitmentHash({ tokenOutput });
      expect(commitment.toBuffer().toString('hex')).toBe(fixture.payloadHex);
      expect(commitment.hash.toString('hex')).toBe(fixture.input.hashHex);
      expect(commitment.isAdvanced()).toBe(true);
      const parsed = CommitmentHash.fromHex(fixture.payloadHex);
      expect(parsed.toBuffer()).toEqual(commitment.toBuffer());
      expect(parsed.getByteLength()).toBe(fixture.payloadHex.length / 2);
      expect(parsed.tokenOutput.reserveValues.valueMap.size).toBe(entries.length);
      for (const entry of entries) {
        const currencyID = identity(entry.currencyHex).toAddress();
        expect(parsed.tokenOutput.reserveValues.valueMap.get(currencyID).toString()).toBe(entry.amount);
        expect(atomic(fixture.exactCurrencyValues[currencyID])).toBe(entry.amount);
        expect(atomic(parsed.toJSON().currencyvalues[currencyID] as string)).toBe(entry.amount);
      }
      expect(parsed.toJSON().hash).toBe(fixture.decoded.commitmenthash.hash);
      expect(parsed.toJSON().version).toBe(fixture.decoded.commitmenthash.version);
      const script = new IdentityCommitmentScript();
      const bytes = Buffer.from(fixture.scriptHex, 'hex');
      expect(script.fromBuffer(bytes)).toBe(bytes.length);
      expect(script.toBuffer()).toEqual(bytes);
      expect(script.getCommitment().toBuffer()).toEqual(commitment.toBuffer());
      expect(() => IdentityCommitmentScript.fromCommitment(commitment, controller(fixture.input))).toThrow('ordinary');
    });

    test('imports daemon decimal tokens exactly without JavaScript number rounding', () => {
      const exactJSON = { ...fixture.decoded.commitmenthash, currencyvalues: fixture.exactCurrencyValues };
      expect(CommitmentHash.fromJSON(exactJSON).toBuffer().toString('hex')).toBe(fixture.payloadHex);
    });
  });

  describe('documented differences between RPC decoding and creation policy', () => {
    test.each(fixtures.differentialCases.filter(row => row.policy !== 'contextual-null-parent'))('$name', fixture => {
      expect(() => fixture.input.format === 'advanced'
        ? AdvancedNameReservation.fromHex(fixture.payloadHex) : NameReservation.fromHex(fixture.payloadHex)).toThrow();
      if (fixture.policy === 'invalid-name' || fixture.policy === 'invalid-salt') {
        expect(fixture.decoded.identityreservation).toBe('invalid');
      } else {
        const daemonJSON = fixture.decoded.identityreservation as AdvancedNameReservationJSON;
        expect(typeof daemonJSON).toBe('object');
        if (fixture.policy === 'unsupported-version') expect(daemonJSON.version).toBe(fixture.input.version);
        if (fixture.policy === 'reject-truncation') {
          expect(Buffer.byteLength(fixture.input.name)).toBe(65);
          expect(Buffer.byteLength(daemonJSON.name)).toBe(64);
        }
      }
    });

    test('retains a null-parent payload but refuses it for new identity creation', () => {
      const fixture = fixtures.differentialCases.find(row => row.policy === 'contextual-null-parent');
      const reservation = AdvancedNameReservation.fromHex(fixture.payloadHex);
      expect(reservation.toBuffer().toString('hex')).toBe(fixture.payloadHex);
      expect(reservation.parent.hash).toEqual(Buffer.alloc(20));
      expect(() => reservation.validateForCreation()).toThrow();
      expect(() => reservation.getIdentityAddress()).toThrow();
      expect(() => reservation.toJSON()).toThrow();
      // The daemon derives this display name using its implicit VRSCTEST root.
      const daemonJSON = fixture.decoded.identityreservation as AdvancedNameReservationJSON;
      expect(reservation.getIdentityAddress('VRSCTEST')).toBe(daemonJSON.nameid);
      expect(reservation.toJSONWithRootSystem('VRSCTEST')).toEqual(daemonJSON);
      expect(AdvancedNameReservation.fromJSON(daemonJSON, 'VRSCTEST').toBuffer().toString('hex')).toBe(fixture.payloadHex);
      expect(daemonJSON.nameid).toBe(reservations.find(row => row.name === 'legacy-lower-case').decoded.addresses[0]);
    });
  });

  test('preserves signed INT64_MIN despite the daemon JSON formatting defect', () => {
    expect(fixtures.daemonLimitations).toHaveLength(1);
    const fixture = fixtures.daemonLimitations[0];
    expect(fixture.rawRPCJSON).toContain('--92233720368.-54775808');
    expect(() => JSON.parse(fixture.rawRPCJSON)).toThrow();
    const commitment = CommitmentHash.fromHex(fixture.payloadHex);
    expect(commitment.toBuffer().toString('hex')).toBe(fixture.payloadHex);
    for (const entry of fixture.entries) {
      const currencyID = identity(entry.currencyHex).toAddress();
      expect(commitment.tokenOutput.reserveValues.valueMap.get(currencyID).toString()).toBe(entry.amount);
      expect(atomic(commitment.toJSON().currencyvalues[currencyID] as string)).toBe(entry.amount);
    }
    expect(CommitmentHash.fromJSON(commitment.toJSON()).toBuffer().toString('hex')).toBe(fixture.payloadHex);
  });
});
