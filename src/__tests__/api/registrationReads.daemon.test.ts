import {
  CurrencyDefinition, CurrencyStateResult, CurrencyStateVolume,
  GetCurrencyStateRequest, GetCurrencyStateResponse,
  GetIdentityHistoryRequest, GetIdentityHistoryResponse,
  GetTxOutRequest, GetTxOutResponse, Identity, IdentityReservationScript,
} from '../../index';
import { fromBase58Check } from '../../utils/address';

type Capture<T> = {
  name: string;
  request: { method: string; params: any[] };
  result: T;
};
type HistoricalDefinition = Omit<CurrencyDefinition, 'bestheight'>;
const fixture: {
  provenance: { chain: string; chainID: string; captureTip: { height: number; blockHash: string } };
  blockAnchors: Array<{ height: number; blockHash: string }>;
  currencies: Array<Capture<HistoricalDefinition> & { definitionHeight: number; definitionBlockHash: string }>;
  histories: Array<Capture<GetIdentityHistoryResponse['result']>>;
  states: Array<Capture<GetCurrencyStateResponse['result']>>;
  spentOutputs: Array<Capture<GetTxOutResponse['result']>>;
  unspentOutputs: Array<Capture<GetTxOutResponse['result']>>;
} = require('../fixtures/identity-registration/data-v1.json');
const wire = require('../fixtures/identity-registration/veruscoin-v1.json');
const CHAIN = fixture.provenance.chain;

describe('daemon identity history, currency data, and UTXO parity', () => {
  test('retains explicit historical anchors and real spent/unspent zero-output observations', () => {
    expect(CHAIN).toBe('VRSCTEST');
    expect(fixture.currencies).toHaveLength(8);
    expect(fixture.histories).toHaveLength(6);
    expect(fixture.states).toHaveLength(6);
    expect(fixture.spentOutputs).toHaveLength(6);
    expect(fixture.unspentOutputs).toHaveLength(1);
    expect(fixture.blockAnchors.length).toBeGreaterThan(20);
    for (const row of fixture.blockAnchors) {
      expect(row.height).toBeLessThan(fixture.provenance.captureTip.height);
      expect(row.blockHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  describe.each(fixture.histories)('$name historical registration', row => {
    test('sends the captured inclusive height and explicit proof height without changing positions', () => {
      const [identityID, start, end, proofs, proofHeight] = row.request.params;
      const request = new GetIdentityHistoryRequest(CHAIN, identityID, start, end, proofs, proofHeight);
      expect(request.prepare()).toEqual([CHAIN, row.request.method, row.request.params]);
      expect(GetIdentityHistoryRequest.fromJSON(request.toJSON()).getParams()).toEqual(row.request.params);
      expect(start).toBe(end);
      expect(proofs).toBe(true);
      expect(proofHeight).toBe(end + 20);
    });

    test('preserves original identity data, output reference and serialized transaction proof', () => {
      const response = new GetIdentityHistoryResponse(row.result);
      expect(JSON.parse(JSON.stringify(response))).toEqual(row.result);
      expect(response.toJson()).toEqual(row.result);
      const registration = wire.registrations.find(value => value.name === row.name);
      const [entry] = response.result.history;
      expect(entry.height).toBe(registration.reservation.height);
      expect(entry.blockhash).toBe(registration.reservation.blockHash);
      expect(entry.output).toEqual({ txid: registration.identity.txid, voutnum: registration.identity.vout });
      expect(entry.identity).toEqual(registration.identity.json);
      expect(entry.identity.identityaddress).toBe(registration.reservation.json.nameid);
      expect(entry.proof).toMatch(/^(?:[0-9a-f]{2})+$/);
      // CPartialTransactionProof carries the referenced CTxOut bytes. This
      // checks the actual proof payload without claiming cryptographic verification.
      expect(entry.proof).toContain(registration.identity.scriptHex);
      const identity = Identity.fromJson(entry.identity as Parameters<typeof Identity.fromJson>[0]);
      expect(identity.toBuffer().toString('hex')).toBe(registration.identity.payload.hex);
    });
  });

  describe.each(fixture.states)('$name currency state', row => {
    test('matches daemon positional request and preserves optional reserve/volume data', () => {
      const [currencyID, height, volumeCurrency] = row.request.params;
      const request = new GetCurrencyStateRequest(CHAIN, currencyID, height, volumeCurrency);
      expect(request.prepare()).toEqual([CHAIN, row.request.method, row.request.params]);
      expect(GetCurrencyStateRequest.fromJSON(request.toJSON()).getParams()).toEqual(row.request.params);
      const response = new GetCurrencyStateResponse(row.result);
      expect(JSON.parse(JSON.stringify(response))).toEqual(row.result);
      for (const entry of response.result) {
        if ('height' in entry) {
          expect(entry.currencystate.currencyid).toBe(currencyID);
          expect(fixture.blockAnchors.some(anchor => anchor.height === entry.height)).toBe(true);
          expect(entry.blocktime).toBeGreaterThan(0);
        } else {
          const volume: CurrencyStateVolume = entry;
          expect(volume.totalvolume).toBeGreaterThan(0);
          expect(response.result[response.result.length - 1]).toBe(entry);
        }
      }
    });
  });

  test('keeps the final requested height even when the step does not divide the range', () => {
    const row = fixture.states.find(value => value.name === 'range-includes-final-height');
    expect(row.result.map(entry => 'height' in entry ? entry.height : undefined)).toEqual([975796, 975798, 975799]);
  });

  test('models real conversion rows followed by a separate totalvolume summary', () => {
    const row = fixture.states.find(value => value.name === 'fractional-volume-summary');
    const states = row.result.filter((entry): entry is CurrencyStateResult => 'height' in entry);
    expect(states.map(entry => entry.height)).toEqual([1000000, 1100000]);
    expect(states[0].conversiondata).toBeUndefined();
    expect(states[1].conversiondata.volumecurrency).toBe('VRSCTEST');
    expect(states[1].conversiondata.volumepairs).toHaveLength(10);
    expect(states[1].conversiondata.volumethisinterval).toBe(3761.00047319);
    expect(row.result[row.result.length - 1]).toEqual({ totalvolume: 3761.00047319 });
    for (const pair of states[1].conversiondata.volumepairs) {
      expect(pair.low).toBeLessThanOrEqual(pair.open);
      expect(pair.low).toBeLessThanOrEqual(pair.close);
      expect(pair.high).toBeGreaterThanOrEqual(pair.open);
      expect(pair.high).toBeGreaterThanOrEqual(pair.close);
    }
  });

  test('keeps native, fractional reserves and non-fractional launch currencies distinct', () => {
    const native = fixture.states.find(row => row.name === 'native-at-registration').result[0] as CurrencyStateResult;
    const fractional = fixture.states.find(row => row.name === 'subnamespace-at-registration').result[0] as CurrencyStateResult;
    const NFT = fixture.states.find(row => row.name === 'NFT-launch-state').result[0] as CurrencyStateResult;
    expect(native.currencystate.reservecurrencies).toBeUndefined();
    expect(fractional.currencystate.reservecurrencies).toHaveLength(4);
    expect(fractional.currencystate.launchcurrencies).toBeUndefined();
    expect(NFT.currencystate.launchcurrencies).toHaveLength(1);
    expect(NFT.currencystate.supply).toBe(0.00000001);
  });

  test.each(fixture.currencies)('$name definition retains daemon names, ID byte order and defining transaction', row => {
    const definition = row.result;
    expect(Buffer.from(fromBase58Check(definition.currencyid).hash).reverse().toString('hex')).toBe(definition.currencyidhex);
    expect(row.request).toEqual({ method: 'getcurrency', params: [definition.currencyid] });
    expect(fixture.blockAnchors).toContainEqual({ height: row.definitionHeight, blockHash: row.definitionBlockHash });
    expect(definition.definitiontxid).toMatch(/^[0-9a-f]{64}$/);
    expect(Number.isInteger(definition.magicnumber)).toBe(true);
    expect(definition).not.toHaveProperty('bestheight');
    expect(definition).not.toHaveProperty('bestcurrencystate');
  });

  test('models native allocation special keys and one-atom NFT preallocations', () => {
    const native = fixture.currencies.find(row => row.name === 'native-referrals').result;
    const NFT = fixture.currencies.find(row => row.name === 'NFT-no-identities').result;
    expect(native.preallocations).toEqual([{ blockoneminer: 50000000 }]);
    expect(NFT.preallocations).toEqual([{ i6mRtX44LuUqrvAJ2tap3deziWxN3kAcQE: 0.00000001 }]);
    expect(NFT.parent).toBe(fixture.currencies.find(row => row.name === 'subnamespace-reserve-index-one').result.currencyid);
    expect(NFT.fullyqualifiedname).toBe('⚡spark.Kaiju');
  });

  test.each(fixture.spentOutputs)('$name gettxout reports the commitment consumed by registration as null', row => {
    const [txid, n, includeMempool] = row.request.params;
    const request = new GetTxOutRequest(CHAIN, txid, n, includeMempool);
    expect(request.prepare()).toEqual([CHAIN, row.request.method, row.request.params]);
    expect(includeMempool).toBe(false);
    expect(n).toBe(0);
    expect(new GetTxOutResponse(row.result).toJSON()).toBeNull();
    const registration = wire.registrations.find(value => value.name === row.name);
    expect(txid).toBe(registration.commitment.txid);
  });

  test.each(fixture.unspentOutputs)('$name gettxout preserves a real unspent zero-value reservation script', row => {
    const response = new GetTxOutResponse(row.result);
    expect(JSON.parse(JSON.stringify(response))).toEqual(row.result);
    expect(response.result.value).toBe(0);
    expect(response.result.confirmations).toBeGreaterThan(0);
    expect(response.result.bestblock).toMatch(/^[0-9a-f]{64}$/);
    expect(response.result.coinbase).toBe(false);
    const registration = wire.registrations.find(value => value.name === row.name);
    const bytes = Buffer.from(response.result.scriptPubKey.hex, 'hex');
    const script = new IdentityReservationScript();
    expect(script.fromBuffer(bytes)).toBe(bytes.length);
    expect(script.toBuffer().toString('hex')).toBe(registration.reservation.scriptHex);
    expect(response.result.scriptPubKey.identityreservation).toEqual(registration.reservation.json);
  });
});
