#!/usr/bin/env node
'use strict';

// Read-only capture. Credentials are supplied only through the environment.
// No dependency on the primitives being tested: payload extraction uses script pushes.
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const assert = require('assert');

const CASES = [
  ['legacy-root', 235, '00000005c299c485ea26bb314c6bc1ad5e0cb1f689e1ade463d33f73ccf0f1b2', 'f077b510957a4193a4790f19d4991bc9cb3dd37826691fe60c12e6a340a145b2'],
  ['advanced-native', 16398, '000000000c9f451a282c09c756689123729ec4d0684e5fd3d8f17fa177f37c6c', 'a44b4821e87f5f3f6d3139f6964835b83470f0d08b422c6c3edc515c3700b8ad'],
  ['advanced-subidentity', 21349, '000000000261e97d15c508d8675c07053617bd5847c1f6f259c9c74d077fd8fd', '753f67391aa0d1f7dc8d88b0187b3e8773dac540676d5382afc5d68637e089d9'],
  ['advanced-unicode-subidentity-referral', 975796, '00000000216e3d682f8a6f42aaed371c50bc484c4e4fdadf8a156c9bafdb0510', '0b238fa16ba28a9c8e4f7c64e6ee25e4ac1944e9341b10f7bfdaf52bba33085d'],
  ['advanced-mixed-case-referral', 958455, 'e9b462e439602d7e1afcd79233340b6fd8ef713649d007822ff35f31e9cb2da6', 'ef0a0f9a716d47b48c577db5ae054ab302480398b240c57ef0b6d6deebd9049f'],
  ['advanced-emoji-referral', 671080, '000000009eec4ce44512373180478c5883609d683bc05935952250940291a402', 'b5914c82149df95f7743f7f8baa29f9ffa2b152c07e1431e5e99f4a2f9d40177'],
];
const CHAIN_ID = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
const endpointURL = process.env.VRSCTEST_RPC_URL;
const user = process.env.VRSCTEST_RPC_USER;
const password = process.env.VRSCTEST_RPC_PASSWORD;
if (!endpointURL || !user || !password) {
  throw new Error('Set VRSCTEST_RPC_URL, VRSCTEST_RPC_USER and VRSCTEST_RPC_PASSWORD');
}

// includeRaw retains decimal tokens; 'raw' also permits malformed daemon JSON diagnostics.
async function requestRPC(method, params = [], includeRaw = false) {
  const url = new URL(endpointURL);
  const body = JSON.stringify({jsonrpc: '1.0', id: 'registration-fixture', method, params});
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? https : http).request(url, {
      method: 'POST', auth: `${user}:${password}`,
      headers: {'content-type': 'application/json', 'content-length': Buffer.byteLength(body)},
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        try {
          const rawJSON = Buffer.concat(chunks).toString();
          if (includeRaw === 'raw') {
            if (response.statusCode !== 200) throw new Error(`${method}: HTTP ${response.statusCode}`);
            resolve(rawJSON);
            return;
          }
          const result = JSON.parse(rawJSON);
          if (result.error) throw new Error(`${method}: ${JSON.stringify(result.error)}`);
          if (response.statusCode !== 200) throw new Error(`${method}: HTTP ${response.statusCode}`);
          resolve(includeRaw ? { result: result.result, rawJSON } : result.result);
        } catch (error) { reject(error); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('RPC timeout')));
    req.end(body);
  });
}

function scriptChunks(bytes) {
  const chunks = [];
  for (let offset = 0; offset < bytes.length;) {
    const opcode = bytes[offset++];
    let length;
    if (opcode > 0 && opcode < 76) length = opcode;
    else if (opcode === 76) length = bytes.readUInt8(offset++);
    else if (opcode === 77) { length = bytes.readUInt16LE(offset); offset += 2; }
    else if (opcode === 78) { length = bytes.readUInt32LE(offset); offset += 4; }
    else { chunks.push(opcode); continue; }
    assert(offset + length <= bytes.length, 'truncated script');
    chunks.push(bytes.subarray(offset, offset + length));
    offset += length;
  }
  return chunks;
}

function payload(scriptHex) {
  const chunks = scriptChunks(Buffer.from(scriptHex, 'hex'));
  assert(chunks.length === 4 && chunks[1] === 204 && chunks[3] === 117);
  const params = scriptChunks(chunks[2]);
  const header = params[0];
  assert(header.length === 4 && params.length >= header[3] + 2);
  // Identity scripts also carry revocation/recovery conditions after the object.
  return {evalCode: header[1], hex: params[header[3] + 1].toString('hex')};
}

function captureOutput(transaction, output, property) {
  return {
    txid: transaction.txid, height: transaction.height, blockHash: transaction.blockhash,
    vout: output.n, valueSat: output.valueSat,
    scriptHex: output.scriptPubKey.hex,
    destinations: output.scriptPubKey.addresses,
    requiredSignatures: output.scriptPubKey.reqSigs,
    payload: payload(output.scriptPubKey.hex),
    json: output.scriptPubKey[property],
  };
}

async function main() {
  const info = await requestRPC('getinfo');
  assert(info.testnet && info.chainid === CHAIN_ID && info.name === 'VRSCTEST', 'VRSCTEST required');
  const registrations = [];
  for (const [name, height, blockHash, txid] of CASES) {
    assert.strictEqual(await requestRPC('getblockhash', [height]), blockHash);
    const transaction = await requestRPC('getrawtransaction', [txid, 1]);
    assert.strictEqual(transaction.blockhash, blockHash);
    const output = transaction.vout.find(out => out.scriptPubKey.identityreservation);
    assert(output, 'reservation output required');
    const reservation = captureOutput(transaction, output, 'identityreservation');
    const digest = crypto.createHash('sha256').update(
      crypto.createHash('sha256').update(Buffer.from(reservation.payload.hex, 'hex')).digest()
    ).digest().reverse().toString('hex');
    let commitment;
    for (const input of transaction.vin) {
      if (!input.txid) continue;
      const previous = await requestRPC('getrawtransaction', [input.txid, 1]);
      const previousOutput = previous.vout[input.vout];
      if (previousOutput.scriptPubKey.commitmenthash?.hash === digest) {
        commitment = captureOutput(previous, previousOutput, 'commitmenthash');
        break;
      }
    }
    assert(commitment, 'matching commitment input required');
    assert(commitment.height < height, 'commitment must be mined before registration');
    const identityOutput = transaction.vout.find(out => out.scriptPubKey.identityprimary);
    const identity = captureOutput(transaction, identityOutput, 'identityprimary');
    const decoded = await requestRPC('decodescript', [identity.scriptHex]);
    assert.deepStrictEqual(decoded.identityprimary, identity.json);
    registrations.push({name, parentContext: identity.json.parent === 'i3UXS5QPRQGNRDDqVnyWTnmFCTHDbzmsYk' ? null : identity.json.parent, commitment, reservation, identity});
  }
  const fixture = {
    schemaVersion: 1,
    provenance: {
      generator: 'scripts/generate-identity-registration-fixtures.js',
      readOnlyRPCMethods: ['getinfo', 'getblockhash', 'getrawtransaction', 'getvdxfid', 'decodescript'],
      chain: info.name, chainID: info.chainid, daemonVersion: info.version, protocolVersion: info.protocolversion,
    },
    advancedCommitmentKey: await requestRPC('getvdxfid', ['vrsc::system.identity.advancedcommitmenthash']),
    registrations,
  };
  const output = path.resolve(__dirname, '../src/__tests__/fixtures/identity-registration/veruscoin-v1.json');
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(`Captured ${registrations.length} registrations in ${output}\n`);
}

module.exports = { requestRPC, scriptChunks, payload, captureOutput, CHAIN_ID };

if (require.main === module) {
  main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
