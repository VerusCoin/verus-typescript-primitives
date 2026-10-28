#!/usr/bin/env node
'use strict';

// Independent CIdentity/MakeMofNCCScript encoding; the daemon is the JSON oracle.
// No primitives from src/ or dist/ are used to assemble these fixtures.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const bs58check = require('bs58check');
const { requestRPC, CHAIN_ID } = require('./generate-identity-registration-fixtures');

function uint32(value) { const result = Buffer.alloc(4); result.writeUInt32LE(value); return result; }
function compactSize(value) {
  if (value < 253) return Buffer.from([value]);
  assert(value <= 65535);
  const result = Buffer.alloc(3); result[0] = 253; result.writeUInt16LE(value, 1); return result;
}
function vector(bytes) { return Buffer.concat([compactSize(bytes.length), bytes]); }
function rawAddress(address) { return bs58check.decode(address).subarray(1); }
function address(raw, version = 102) { return bs58check.encode(Buffer.concat([Buffer.from([version]), raw])); }
function push(bytes) {
  if (bytes.length < 76) return Buffer.concat([Buffer.from([bytes.length]), bytes]);
  if (bytes.length < 256) return Buffer.concat([Buffer.from([76, bytes.length]), bytes]);
  const header = Buffer.alloc(3); header[0] = 77; header.writeUInt16LE(bytes.length, 1);
  return Buffer.concat([header, bytes]);
}
function condition(evalCode, destinations, data = []) {
  return Buffer.concat([
    push(Buffer.from([3, evalCode, 1, destinations.length])),
    ...destinations.map(value => push(Buffer.concat([Buffer.from([4]), rawAddress(value)]))),
    ...data.map(push),
  ]);
}
function identityBytes(data) {
  const content = data.content.map(([key, value]) => [Buffer.from(key, 'hex'), Buffer.from(value, 'hex')]);
  const multimap = data.multimap.map(([key, values]) => [Buffer.from(key, 'hex'), values.map(value => Buffer.from(value, 'hex'))]);
  content.sort((a, b) => a[0].compare(b[0]));
  multimap.sort((a, b) => a[0].compare(b[0]));
  return Buffer.concat([
    uint32(data.version), uint32(data.flags), compactSize(data.keys.length),
    ...data.keys.map(key => vector(Buffer.from(key, 'hex'))), uint32(data.minimumSignatures),
    rawAddress(data.parent), vector(Buffer.from(data.name, 'utf8')),
    ...(data.version >= 3 ? [compactSize(multimap.length), ...multimap.map(([key, values]) =>
      Buffer.concat([key, compactSize(values.length), ...values.map(vector)]))] : []),
    ...(data.version < 3 ? [compactSize(content.length), ...content.flat()] : []),
    compactSize(content.length), ...content.flat(),
    rawAddress(data.revocationAuthority), rawAddress(data.recoveryAuthority),
    compactSize(data.privateAddresses.length), ...data.privateAddresses.map(value => Buffer.from(value, 'hex')),
    ...(data.version >= 2 ? [rawAddress(data.systemID), uint32(data.timelock)] : []),
  ]);
}
function identityScript(data, bytes) {
  const master = condition(0, [data.identityID, data.revocationAuthority, data.recoveryAuthority]);
  const params = condition(14, [data.identityID], [bytes,
    condition(15, [data.revocationAuthority]), condition(16, [data.recoveryAuthority])]);
  return Buffer.concat([push(master), Buffer.from([204]), push(params), Buffer.from([117])]);
}

async function main() {
  const info = await requestRPC('getinfo');
  assert.strictEqual(info.chainid, CHAIN_ID);
  const identityID = (await requestRPC('getvdxfid', ['Parity.VRSCTEST.@'])).vdxfid;
  const aliceID = (await requestRPC('getvdxfid', ['Alice.VRSCTEST.@'])).vdxfid;
  const nullParent = address(Buffer.alloc(20));
  const base = {
    name: 'Parity', version: 3, flags: 0, keys: ['11'.repeat(20)], minimumSignatures: 1,
    parent: CHAIN_ID, systemID: CHAIN_ID, identityID,
    revocationAuthority: identityID, recoveryAuthority: identityID,
    timelock: 0, content: [], multimap: [], privateAddresses: [],
  };
  const content = [
    ['01' + '00'.repeat(18) + 'ff', '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f'],
    ['ff' + '00'.repeat(18) + '01', 'ffeeddccbbaa99887766554433221100'.repeat(2)],
  ];
  const definitions = [
    ['current-basic', {}],
    ['current-external-authorities', { revocationAuthority: address(Buffer.alloc(20, 0x31)), recoveryAuthority: address(Buffer.alloc(20, 0x32)) }],
    ['current-multisig', { keys: ['22'.repeat(20), '11'.repeat(20), '33'.repeat(20)], minimumSignatures: 2 }],
    ['current-max-keys-threshold', { keys: Array.from({length: 25}, (_, index) => Buffer.alloc(20, index + 1).toString('hex')), minimumSignatures: 13 }],
    ['current-content-map', { content }],
    ['current-content-multimap', { multimap: [[content[0][0], ['00', 'ffff', 'a1'.repeat(252), 'b2'.repeat(253)]], [content[1][0], ['c3'.repeat(256)]]] }],
    ['current-reversed-content-input', { content: [...content].reverse(), multimap: [[content[1][0], ['b2']], [content[0][0], ['a1']]] }],
    ['current-empty-multimap-data', { multimap: [[content[0][0], ['', '00']]] }],
    ['current-private-address', { privateAddresses: ['000102030405060708090a' + '12'.repeat(32)] }],
    ['current-combined-content', { content, multimap: [[content[0][0], ['abcd', 'ef']]], privateAddresses: ['000102030405060708090a' + '12'.repeat(32)] }],
    ['historical-version-1', { version: 1, content }],
    ['historical-version-2', { version: 2, content }],
    ['historical-version-1-null-root', { version: 1, name: 'VRSCTEST', parent: nullParent, identityID: CHAIN_ID,
      revocationAuthority: CHAIN_ID, recoveryAuthority: CHAIN_ID }],
    ['current-null-parent-explicit-root', { name: 'Alice', parent: nullParent, identityID: aliceID,
      revocationAuthority: aliceID, recoveryAuthority: aliceID }],
    ['current-null-multimap-key', { multimap: [['00'.repeat(20), ['ab']]] }],
  ];
  const cases = [];
  for (const [label, overrides] of definitions) {
    const input = {...base, ...overrides};
    const bytes = identityBytes(input);
    const script = identityScript(input, bytes);
    const decoded = await requestRPC('decodescript', [script.toString('hex')]);
    if (label !== 'current-null-multimap-key') {
      assert.strictEqual(decoded.identityprimary.name, input.name, label);
      assert.strictEqual(decoded.identityprimary.identityaddress, input.identityID, label);
      assert.strictEqual(decoded.identityprimary.minimumsignatures, input.minimumSignatures, label);
    }
    cases.push({name: label, provenance: 'independent-wire-daemon-decoded', input,
      payloadHex: bytes.toString('hex'), scriptHex: script.toString('hex'), decoded});
  }
  const fixture = {schemaVersion: 1, provenance: {
    generator: 'scripts/generate-identity-registration-identity-fixtures.js',
    chain: info.name, chainID: info.chainid, daemonVersion: info.version,
    readOnlyRPCMethods: ['getinfo', 'getvdxfid', 'decodescript'],
    note: 'Synthetic decoding checks serialization and JSON only, not transaction or consensus acceptance.',
  }, cases};
  const output = path.resolve(__dirname, '../src/__tests__/fixtures/identity-registration/identities-v1.json');
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(`Captured ${cases.length} identity serialization cases\n`);
}

main().catch(error => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
