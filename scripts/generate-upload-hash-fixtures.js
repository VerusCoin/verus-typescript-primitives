#!/usr/bin/env node
'use strict';

// Capture deterministic unsigned signdata results; no wallet keys, encryption,
// transaction creation, or broadcasts. Set VRSCTEST_RPC_URL, VRSCTEST_RPC_USER,
// and VRSCTEST_RPC_PASSWORD, as for the other fixture generators.
const fs = require('fs');
const path = require('path');
const {
  requestRPC,
  CHAIN_ID,
} = require('./generate-identity-registration-fixtures');

const items = [
  { message: 'local upload one' },
  { serializedhex: '000102ff' },
  { message: 'Unicode: café ☕' },
  { serializedhex: '000102feff' },
  { vdxfdata: { iK7a5JNJnbeuYWVHCDRpJosj3irGJ5Qa8c: 'VDXF upload' } },
  ...Array.from({ length: 8 }, (_, index) => ({
    message: `leaf ${index + 6}`,
  })),
];

function input(count, objectHash, mmrHash) {
  return {
    createmmr: true,
    mmrdata: items.slice(0, count),
    // Fixed per-leaf salts make independent daemon captures reproducible.
    mmrsalt: Array.from({ length: count }, (_, index) =>
      Buffer.from(
        Array.from({ length: 32 }, (_, byte) => (index * 37 + byte) & 255)
      ).toString('hex')
    ),
    ...(objectHash ? { hashtype: objectHash } : {}),
    ...(mmrHash ? { mmrhashtype: mmrHash } : {}),
  };
}

async function main() {
  const info = await requestRPC('getinfo', []);

  if (info.chainid !== CHAIN_ID || info.name !== 'VRSCTEST') {
    throw new Error('Upload hash fixtures require the VRSCTEST daemon');
  }

  await requestRPC('help', ['signdata']);

  // Irregular leaf counts exercise partially filled MMR layers and peak folding.
  const cases = [1, 2, 3, 5, 7, 13].map((count) => ({
    name: `default-${count}-leaves`,
    request: input(count),
  }));

  // Object hashing and MMR node hashing can be selected independently.
  for (const objectHash of ['sha256', 'sha256D', 'blake2b']) {
    for (const mmrHash of ['sha256', 'sha256D', 'blake2b']) {
      cases.push({
        name: `${objectHash}-objects-${mmrHash}-mmr`,
        request: input(3, objectHash, mmrHash),
      });
    }

    // An asymmetric digest exposes byte-order differences in hash-only inputs.
    const request = input(3, objectHash);
    request.mmrdata[1] = {
      datahash: Buffer.from(
        Array.from({ length: 32 }, (_, index) => index + 1)
      ).toString('hex'),
    };
    cases.push({ name: `${objectHash}-with-hash-only-leaf`, request });
  }

  for (const fixture of cases) {
    try {
      fixture.result = await requestRPC('signdata', [fixture.request]);
    } catch (error) {
      throw new Error(`${fixture.name}: ${error.message}`);
    }
  }

  const fixture = {
    schemaVersion: 1,
    provenance: {
      kind: 'daemon-rpc-captured',
      generator: 'scripts/generate-upload-hash-fixtures.js',
      rpcMethods: ['getinfo', 'help', 'signdata'],
      chain: info.name,
      chainId: info.chainid,
      daemonVersion: info.VRSCversion,
      version: info.version,
      protocolVersion: info.protocolversion,
      height: info.blocks,
      notes: [
        'Requests are unsigned, unencrypted synthetic uploads with fixed salts.',
        'Descriptor objectdata, salts, and decoded hash-vector entries contain wire-order bytes.',
        'Hash-only RPC input is digest order for SHA256 and reversed display order for other modes.',
      ],
    },
    cases,
  };

  const output = path.resolve(
    __dirname,
    '../src/__tests__/fixtures/local-upload/hashes.json'
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(
    `Captured ${cases.length} upload hash fixtures in ${output}\n`
  );
}

module.exports = { main };

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
