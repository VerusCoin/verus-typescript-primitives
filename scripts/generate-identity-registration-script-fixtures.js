#!/usr/bin/env node
'use strict';

// Independent C++ wire encoder. Do not import dist or the serializers under test.
// The daemon is used only as a decoder; these scripts are never funded or sent.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const bs58check = require('bs58check');
const { requestRPC, CHAIN_ID } = require('./generate-identity-registration-fixtures');

const ZERO_ID = '00'.repeat(20);
const PARENT = 'a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4';
const REFERRAL = '3132333435363738393a3b3c3d3e3f4041424344';
const KEY = '6162636465666768696a6b6c6d6e6f7071727374';
const PUBLIC_KEY = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const SALTS = [
  '01' + '00'.repeat(31),
  '00'.repeat(31) + '01',
  Array.from({ length: 32 }, (_, index) => index.toString(16).padStart(2, '0')).join(''),
  'ff'.repeat(32),
];

function digest(algorithm, data) { return crypto.createHash(algorithm).update(data).digest(); }
function SHA256d(data) { return digest('sha256', digest('sha256', data)); }
function HASH160(data) { return digest('ripemd160', digest('sha256', data)); }
function identityID(name, parentHex) {
  const folded = name.replace(/[A-Z]/g, value => value.toLowerCase());
  let bytes = SHA256d(Buffer.from(folded));
  if (parentHex !== ZERO_ID) bytes = SHA256d(Buffer.concat([Buffer.from(parentHex, 'hex'), bytes]));
  return HASH160(bytes);
}
function compactSize(value) {
  if (value < 253) return Buffer.from([value]);
  const result = Buffer.alloc(3); result[0] = 253; result.writeUInt16LE(value, 1); return result;
}
function push(bytes) {
  if (bytes.length < 76) return Buffer.concat([Buffer.from([bytes.length]), bytes]);
  if (bytes.length <= 255) return Buffer.concat([Buffer.from([76, bytes.length]), bytes]);
  const prefix = Buffer.alloc(3); prefix[0] = 77; prefix.writeUInt16LE(bytes.length, 1);
  return Buffer.concat([prefix, bytes]);
}
function VARINT(value) {
  let remaining = BigInt(value);
  const bytes = [];
  for (;;) {
    bytes.push(Number(remaining & 127n) | (bytes.length ? 128 : 0));
    if (remaining <= 127n) break;
    remaining = (remaining >> 7n) - 1n;
  }
  return Buffer.from(bytes.reverse());
}
function destination(type, hex) {
  const data = Buffer.from(hex, 'hex');
  return type === 'identity' ? Buffer.concat([Buffer.from([4]), data]) : data;
}
function script(evalCode, destinations, object) {
  const master = Buffer.concat([push(Buffer.from([3, 0, 1, 1])), push(destinations[0])]);
  const params = Buffer.concat([
    push(Buffer.from([3, evalCode, destinations.length, destinations.length])),
    ...destinations.map(push), push(object),
  ]);
  return Buffer.concat([push(master), Buffer.from([204]), push(params), Buffer.from([117])]).toString('hex');
}
function reservationPayload(input) {
  const name = Buffer.from(input.name);
  const prefix = input.format === 'advanced' ? Buffer.alloc(4) : Buffer.alloc(0);
  if (prefix.length) prefix.writeUInt32LE(input.version);
  return Buffer.concat([
    prefix, compactSize(name.length), name,
    ...(input.format === 'advanced' ? [Buffer.from(input.parentHex, 'hex')] : []),
    Buffer.from(input.referralHex, 'hex'), Buffer.from(input.saltHex, 'hex'),
  ]);
}
function tokenPayload(entries) {
  if (entries.length === 1) {
    return Buffer.concat([VARINT(1), Buffer.from(entries[0].currencyHex, 'hex'), VARINT(entries[0].amount)]);
  }
  const sorted = [...entries].sort((a, b) => Buffer.compare(Buffer.from(a.currencyHex, 'hex'), Buffer.from(b.currencyHex, 'hex')));
  return Buffer.concat([
    VARINT(0x80000001), compactSize(entries.length),
    ...sorted.map(entry => {
      const amount = Buffer.alloc(8); amount.writeBigInt64LE(BigInt(entry.amount));
      return Buffer.concat([Buffer.from(entry.currencyHex, 'hex'), amount]);
    }),
  ]);
}

async function main() {
  const info = await requestRPC('getinfo');
  assert(info.testnet && info.chainid === CHAIN_ID && info.name === 'VRSCTEST', 'VRSCTEST required');
  const chainHex = bs58check.decode(CHAIN_ID).subarray(1).toString('hex');
  const marker = await requestRPC('getvdxfid', ['vrsc::system.identity.advancedcommitmenthash']);
  const markerHex = bs58check.decode(marker.vdxfid).subarray(1).toString('hex');
  const cases = [];
  async function capture(name, kind, input, payload, destinations, evalCode, extra = {}) {
    const scriptHex = script(evalCode, destinations, payload);
    const response = await requestRPC('decodescript', [scriptHex], true);
    const exact = {};
    if (kind === 'tagged-commitment') {
      // Preserve daemon decimal tokens before JSON.parse can round int64 amounts.
      const match = response.rawJSON.match(/"currencyvalues"\s*:\s*(\{[^}]*\})/);
      assert(match, 'token currencyvalues required');
      exact.currencyValuesJSON = match[1];
      exact.exactCurrencyValues = JSON.parse(match[1].replace(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ':"$1"'));
    }
    cases.push({ name, kind, input, payloadHex: payload.toString('hex'), scriptHex, decoded: response.result, ...exact, ...extra });
  }
  const names = [
    ['one-byte', 'A'], ['mixed-case', 'ALIce'], ['lower-case', 'alice'],
    ['ascii-64', 'a'.repeat(64)], ['utf8-two-byte-64', 'é'.repeat(32)],
    ['utf8-four-byte-64', '🌐'.repeat(16)], ['composed', 'é'], ['decomposed', 'e\u0301'],
    ['upper-accent', 'Éxample'], ['lower-accent', 'éxample'],
    ['internal-space', 'Alice Smith'], ['internal-nbsp', 'Alice\u00a0Smith'],
    ['mixed-unicode', '⚡spark'],
  ];
  for (const format of ['legacy', 'advanced']) {
    for (let index = 0; index < names.length; index++) {
      const [label, name] = names[index];
      const input = {
        format, version: 1, name,
        parentHex: format === 'advanced' && index % 2 ? PARENT : chainHex,
        referralHex: index % 3 ? ZERO_ID : REFERRAL,
        saltHex: SALTS[index % SALTS.length],
      };
      const payload = reservationPayload(input);
      await capture(`${format}-${label}`, 'reservation', input, payload,
        [destination('identity', identityID(name, input.parentHex).toString('hex'))], format === 'advanced' ? 10 : 18);
    }
  }
  // Null-parent roots are historical data, not eligible new sub-identity requests.
  for (const format of ['legacy', 'advanced']) {
    const input = { format, version: 1, name: 'VRSCTEST', parentHex: ZERO_ID, referralHex: ZERO_ID, saltHex: SALTS[0] };
    await capture(`${format}-null-parent-root`, 'reservation', input, reservationPayload(input),
      [destination('identity', chainHex)], format === 'advanced' ? 10 : 18, { creationAllowed: format === 'legacy' });
  }
  const ordinaryHash = SHA256d(reservationPayload({ format: 'advanced', version: 1, name: 'Alice', parentHex: PARENT, referralHex: REFERRAL, saltHex: SALTS[2] })).toString('hex');
  for (const [controllerLabel, controllerHex] of [['key', KEY], ['identity', PARENT], ['public-key', PUBLIC_KEY], ['public-key-odd', '03' + PUBLIC_KEY.slice(2)]]) {
    const controllerType = controllerLabel.startsWith('public-key') ? 'public-key' : controllerLabel;
    for (const restricted of [false, true]) {
      const authorizationHex = restricted ? REFERRAL : null;
      const input = { hashHex: ordinaryHash, controllerType, controllerHex, authorizationHex };
      const destinations = [destination(controllerType, controllerHex)];
      if (restricted) destinations.push(destination('identity', authorizationHex));
      await capture(`commitment-${controllerLabel}-${restricted ? 'two-party' : 'single-party'}`, 'commitment', input,
        Buffer.from(ordinaryHash, 'hex'), destinations, 17);
    }
  }
  const taggedCases = [
    ['empty-map', []],
    ...['0', '1', '127', '128', '255', '16383', '16384', '16511', '16512', '100000000', '123456789', '1000000000000', '9007199254740991', '9007199254740992', '9223372036854775807'].map(amount =>
      [`single-${amount}`, [{ currencyHex: PARENT, amount }]]),
    ['two-currency-unsorted', [{ currencyHex: PARENT, amount: '123456789' }, { currencyHex: REFERRAL, amount: '100000000' }]],
    ['two-currency-zero', [{ currencyHex: PARENT, amount: '0' }, { currencyHex: REFERRAL, amount: '1' }]],
    ['two-currency-negative', [{ currencyHex: PARENT, amount: '-1' }, { currencyHex: REFERRAL, amount: '123456789' }]],
    ['signed-int64-extremes', [{ currencyHex: PARENT, amount: '-9223372036854775807' }, { currencyHex: REFERRAL, amount: '9223372036854775807' }]],
    ['raw-byte-sort', [{ currencyHex: '01ff' + '00'.repeat(18), amount: '2' }, { currencyHex: '0200' + '00'.repeat(18), amount: '3' }]],
    ['pushdata2-eight-currencies', Array.from({ length: 8 }, (_, index) => ({ currencyHex: (8 - index).toString(16).padStart(2, '0') + 'ab'.repeat(19), amount: String(128 + index) }))],
  ];
  for (const [label, entries] of taggedCases) {
    const hashHex = markerHex + '00'.repeat(12);
    const input = { hashHex, entries, controllerType: 'key', controllerHex: KEY, authorizationHex: null };
    await capture(`tagged-${label}`, 'tagged-commitment', input,
      Buffer.concat([Buffer.from(hashHex, 'hex'), tokenPayload(entries)]), [destination('key', KEY)], 17);
  }
  const differentialCases = [];
  const base = { format: 'advanced', version: 1, name: 'Alice', parentHex: PARENT, referralHex: ZERO_ID, saltHex: SALTS[0] };
  for (const [label, changes, policy] of [
    ['unknown-version', { version: 2 }, 'unsupported-version'],
    ['zero-version', { version: 0 }, 'unsupported-version'],
    ['overlong-name', { name: 'a'.repeat(65) }, 'reject-truncation'],
    ['empty-name', { name: '' }, 'invalid-name'],
    ['zero-salt', { saltHex: '00'.repeat(32) }, 'invalid-salt'],
    ['legacy-overlong-name', { format: 'legacy', name: 'a'.repeat(65) }, 'invalid-name'],
    ['null-parent-relative-leaf', { parentHex: ZERO_ID }, 'contextual-null-parent'],
  ]) {
    const input = { ...base, ...changes };
    const payload = reservationPayload(input);
    const scriptHex = script(input.format === 'advanced' ? 10 : 18, [destination('identity', PARENT)], payload);
    differentialCases.push({ name: label, policy, input, payloadHex: payload.toString('hex'), scriptHex, decoded: await requestRPC('decodescript', [scriptHex]) });
  }
  const minimumEntries = [{ currencyHex: PARENT, amount: '-9223372036854775808' }, { currencyHex: REFERRAL, amount: '9223372036854775807' }];
  const minimumPayload = Buffer.concat([Buffer.from(markerHex + '00'.repeat(12), 'hex'), tokenPayload(minimumEntries)]);
  const minimumScript = script(17, [destination('key', KEY)], minimumPayload);
  const rawMinimumResponse = await requestRPC('decodescript', [minimumScript], 'raw');
  assert.throws(() => JSON.parse(rawMinimumResponse), 'pinned daemon INT64_MIN formatting behavior changed');
  const daemonLimitations = [{
    name: 'signed-int64-minimum-invalid-json',
    entries: minimumEntries,
    payloadHex: minimumPayload.toString('hex'), scriptHex: minimumScript,
    rawRPCJSON: rawMinimumResponse,
    explanation: 'The daemon decodes signed INT64_MIN bytes but ValueFromAmount emits a double minus sign, so the RPC response is invalid JSON. This is not a TS wire-range restriction.',
  }];
  const fixture = {
    schemaVersion: 1,
    provenance: {
      generator: 'scripts/generate-identity-registration-script-fixtures.js',
      readOnlyRPCMethods: ['getinfo', 'getvdxfid', 'decodescript'],
      chain: info.name, chainID: info.chainid, daemonVersion: info.version, protocolVersion: info.protocolversion,
      interpretation: 'Independent synthetic bytes decoded by the daemon. Decoding does not establish consensus validity or registration eligibility.',
    },
    cases, differentialCases, daemonLimitations,
  };
  const output = path.resolve(__dirname, '../src/__tests__/fixtures/identity-registration/scripted-v1.json');
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(`Captured ${cases.length} script vectors and ${differentialCases.length} policy comparisons in ${output}\n`);
}

if (require.main === module) main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
