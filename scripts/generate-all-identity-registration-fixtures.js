#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

// Child generators inherit environment-only RPC credentials and use read-only RPCs.
// The mined fixture runs first because data/proof checks depend on its output IDs.
for (const generator of [
  'generate-identity-registration-fixtures.js',
  'generate-identity-registration-name-fixtures.js',
  'generate-identity-registration-script-fixtures.js',
  'generate-identity-registration-identity-fixtures.js',
  'generate-identity-registration-data-fixtures.js',
]) {
  const result = spawnSync(process.execPath, [path.join(__dirname, generator)], {stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
