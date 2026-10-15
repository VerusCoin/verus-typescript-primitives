#!/usr/bin/env node
'use strict';

// Public chain reads only. No wallet, signing, registration or broadcast RPCs.
// Supply the same VRSCTEST_RPC_* environment variables as the wire generator.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { requestRPC, CHAIN_ID } = require('./generate-identity-registration-fixtures');
const wire = require('../src/__tests__/fixtures/identity-registration/veruscoin-v1.json');
const output = path.resolve(__dirname, '../src/__tests__/fixtures/identity-registration/data-v1.json');
const previousAnchors = fs.existsSync(output)
  ? new Map(JSON.parse(fs.readFileSync(output, 'utf8')).blockAnchors.map(row => [row.height, row.blockHash]))
  : new Map();

const CURRENCIES = [
  ['native-referrals', CHAIN_ID],
  ['subnamespace-reserve-index-one', 'iHBwQo7LUmb7QKKqbsd8Kw9BxdQvgTdK9f'],
  ['fractional-reserve-index-three', 'i3zeobcYAJt6rkteDehA3UKnw4HydPunwR'],
  ['restricted-required-referral', 'iF6hHpRXpmhLq77eksQzqQrWuminKtzmxT'],
  ['required-referral', 'iNZzqYdmfCPCcVSTBjbPT8Q7rqeFohxATu'],
  ['one-atomic-unit-fee', 'i4PSUkTzQRdweq2PETgYkjNtknzXih8mL5'],
  ['NFT-no-identities', 'iGF2NLZXSqkUAspMH5sZzKLKxzxEQLuEpg'],
  ['five-referral-levels', 'iLPtPNgBLnDy8MWQXE8h79BKpnJyHohgPS'],
];
// getcurrency has no historical-height parameter. Its immutable definition is
// pinned by its defining transaction; omit mutable tip-dependent RPC metadata.
const OMITTED_CURRENCY_FIELDS = [
  'bestheight', 'lastconfirmedheight', 'bestcurrencystate', 'lastconfirmedcurrencystate',
];
const STATES = [
  ['native-at-registration', [CHAIN_ID, 975796]],
  ['subnamespace-at-registration', ['iHBwQo7LUmb7QKKqbsd8Kw9BxdQvgTdK9f', 21349]],
  ['fractional-inclusive-range', ['iHBwQo7LUmb7QKKqbsd8Kw9BxdQvgTdK9f', '975796,975798,1', CHAIN_ID]],
  ['fractional-volume-summary', ['iHBwQo7LUmb7QKKqbsd8Kw9BxdQvgTdK9f', '1000000,1100000,100000', CHAIN_ID]],
  ['range-includes-final-height', [CHAIN_ID, '975796,975799,2']],
  ['NFT-launch-state', ['iGF2NLZXSqkUAspMH5sZzKLKxzxEQLuEpg', 978400]],
];

async function capture(method, params) {
  return { request: { method, params }, result: await requestRPC(method, params) };
}

async function main() {
  const info = await requestRPC('getinfo');
  assert(info.testnet && info.chainid === CHAIN_ID && info.name === 'VRSCTEST');
  const captureTip = { height: info.blocks, blockHash: await requestRPC('getblockhash', [info.blocks]) };
  const blockAnchors = new Map();
  async function anchor(height, expected) {
    const blockHash = await requestRPC('getblockhash', [height]);
    if (expected) assert.strictEqual(blockHash, expected, 'historical block changed');
    if (previousAnchors.has(height)) {
      assert.strictEqual(blockHash, previousAnchors.get(height), 'previous data fixture block changed');
    }
    blockAnchors.set(height, blockHash);
  }
  const currencies = [];
  for (const [name, currencyID] of CURRENCIES) {
    const row = await capture('getcurrency', [currencyID]);
    assert.strictEqual(row.result.currencyid, currencyID);
    for (const field of OMITTED_CURRENCY_FIELDS) delete row.result[field];
    const definition = await requestRPC('getrawtransaction', [row.result.definitiontxid, 1]);
    await anchor(definition.height, definition.blockhash);
    currencies.push({ name, ...row, definitionHeight: definition.height, definitionBlockHash: definition.blockhash });
  }
  const histories = [];
  const spentOutputs = [];
  const unspentOutputs = [];
  for (const registration of wire.registrations) {
    const { height, blockHash, json } = registration.reservation;
    await anchor(height, blockHash);
    await anchor(height + 20);
    const row = await capture('getidentityhistory', [json.nameid, height, height, true, height + 20]);
    assert.strictEqual(row.result.history.length, 1, 'expected original registration only');
    assert.strictEqual(row.result.history[0].output.txid, registration.reservation.txid);
    histories.push({ name: registration.name, ...row });
    const { txid, vout } = registration.commitment;
    const spent = await capture('gettxout', [txid, vout, false]);
    assert.strictEqual(spent.result, null, 'mined registration must have spent its commitment');
    spentOutputs.push({ name: registration.name, ...spent });
    if (!unspentOutputs.length) {
      const reservation = registration.reservation;
      const unspent = await capture('gettxout', [reservation.txid, reservation.vout, false]);
      if (unspent.result) {
        assert.strictEqual(unspent.result.value, 0);
        assert.strictEqual(unspent.result.scriptPubKey.hex, reservation.scriptHex);
        unspentOutputs.push({ name: registration.name, ...unspent });
      }
    }
  }
  const states = [];
  for (const [name, params] of STATES) {
    const row = await capture('getcurrencystate', params);
    // Independently verify the string heights required by the Rust proxy against
    // the original daemon requests. All numeric fixture heights are positive.
    const proxyCompatibleParams = params.map((value, index) => index === 1 && typeof value === 'number' ? String(value) : value);
    assert.deepStrictEqual(await requestRPC('getcurrencystate', proxyCompatibleParams), row.result);
    for (const state of row.result) if (state.height != null) await anchor(state.height);
    states.push({ name, ...row, proxyCompatibleParams });
  }
  const fixture = {
    schemaVersion: 1,
    provenance: {
      generator: 'scripts/generate-identity-registration-data-fixtures.js',
      readOnlyRPCMethods: ['getinfo', 'getblockhash', 'getcurrency', 'getrawtransaction', 'getidentityhistory', 'getcurrencystate', 'gettxout'],
      chain: info.name, chainID: info.chainid, daemonVersion: info.version, protocolVersion: info.protocolversion,
      captureTip, omittedCurrencyFields: OMITTED_CURRENCY_FIELDS,
      notes: [
        'Histories and currency states use explicit historical heights; block hashes are retained below.',
        'Currency definitions are immutable and pinned by their defining transaction; mutable getcurrency state fields are omitted.',
        'gettxout is tip-relative. UTXO presence does not imply consensus spendability; reservation outputs are unspendable.',
        'History cansignfor/canspendfor are daemon wallet capability observations, not identity authorization rules.',
      ],
    },
    blockAnchors: Array.from(blockAnchors, ([height, blockHash]) => ({ height, blockHash })).sort((a, b) => a.height - b.height),
    currencies, histories, states, spentOutputs, unspentOutputs,
  };
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(`Captured ${currencies.length} currency definitions, ${histories.length} histories, ${states.length} state queries and ${spentOutputs.length + unspentOutputs.length} UTXO queries in ${output}\n`);
}

if (require.main === module) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
