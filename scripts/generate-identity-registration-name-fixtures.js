#!/usr/bin/env node
'use strict';

// Independent, read-only name oracle. In particular, do not import dist/src:
// getvdxfid's explicit trailing '.@' selects identity hashing rather than VDXF
// key hashing and prevents the daemon's current root from changing the input.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {requestRPC, CHAIN_ID} = require('./generate-identity-registration-fixtures');

const VALID_NAMES = [
  ['ascii-mixed', 'Alice'], ['ascii-lower', 'alice'], ['ascii-upper', 'ALICE'],
  ['one-byte', 'x'], ['digits', '0123456789'], ['punctuation', "ID-_=+[]{}();,!#$%&'`~^"],
  ['ordinary-space', 'Alice Smith'], ['nonbreaking-space', 'Alice\u00a0Smith'],
  ['thin-space', 'Alice\u2009Smith'], ['ideographic-space', 'Alice\u3000Smith'],
  ['latin-composed', 'é'], ['latin-decomposed', 'e\u0301'], ['latin-uppercase', 'É'],
  ['german-sharp-s', 'ß'], ['german-capital-sharp-s', 'ẞ'],
  ['turkish-dotted-capital-i', 'İ'], ['turkish-dotless-i', 'ı'],
  ['greek', 'Δοκιμή'], ['cyrillic', 'Привет'], ['japanese', '東京'],
  ['arabic', 'هوية'], ['emoji', '🐕AnimalFarm4🐕'], ['emoji-variation-selector', '⚡️spark'],
  ['ascii-64-bytes', 'a'.repeat(64)], ['two-byte-64-bytes', 'é'.repeat(32)],
  ['four-byte-64-bytes', '😀'.repeat(16)], ['mixed-64-bytes', 'a'.repeat(60) + '😀'],
  ['subidentity', 'Alice', ['Example']],
  ['nested-subidentity', 'Alice', ['Tokens', 'Example']],
  ['deep-subidentity', 'Leaf', ['Four', 'Three', 'Two', 'One']],
  ['unicode-parent-uppercase', 'ALIce', ['Éxample']],
  ['unicode-parent-lowercase', 'ALIce', ['éxample']],
  ['parent-spaces', 'Child Identity', ['Token Collection', 'Example Namespace']],
  ['parent-64-bytes', 'Leaf', ['P'.repeat(64)]],
  ['unicode-parent-64-bytes', 'Leaf', ['😀'.repeat(16)]],
];

const REJECTED_NAMES = [
  ['empty', '', 'empty leaf'],
  ['ascii-65-bytes', 'a'.repeat(65), 'lookup truncates to 64 bytes; creation must reject'],
  ['two-byte-66-bytes', 'é'.repeat(33), 'lookup truncates to 64 bytes; creation must reject'],
  ['four-byte-68-bytes', '😀'.repeat(17), 'lookup truncates to 64 bytes; creation must reject'],
  ['truncated-multibyte', 'a'.repeat(63) + 'é', 'byte truncation splits a UTF-8 character'],
  ['leading-space', ' Alice', 'leading space'], ['trailing-space', 'Alice ', 'trailing space'],
  ['repeated-space', 'Alice  Smith', 'repeated space'],
  ['leading-nonbreaking-space', '\u00a0Alice', 'leading Unicode space'],
  ['trailing-zero-width-joiner', 'Alice\u200d', 'trailing Unicode space'],
  ['adjacent-unicode-spaces', 'Alice \u00a0Smith', 'adjacent Unicode spaces'],
  ['backslash', 'Alice\\Suffix', 'forbidden character'], ['slash', 'Alice/Suffix', 'forbidden character'],
  ['colon', 'Alice:Suffix', 'forbidden character'], ['asterisk', 'Alice*Suffix', 'forbidden character'],
  ['question-mark', 'Alice?Suffix', 'forbidden character'], ['quote', 'Alice"Suffix', 'forbidden character'],
  ['less-than', 'Alice<Suffix', 'forbidden character'], ['greater-than', 'Alice>Suffix', 'forbidden character'],
  ['pipe', 'Alice|Suffix', 'forbidden character'],
  ['nul', 'Alice\u0000Suffix', 'creation rejects C-string hashing ambiguity'],
  ['tab', 'Alice\tSuffix', 'creation rejects all C0 controls; getvdxfid may fall back to a VDXF key'],
  ['newline', 'Alice\nSuffix', 'creation rejects all C0 controls'],
  ['escape', 'Alice\u001bSuffix', 'creation rejects all C0 controls'],
  ['del', 'Alice\u007fSuffix', 'creation policy rejects DEL even if daemon lookup accepts'],
  ['double-dot', 'Alice..Example', 'empty namespace component'],
  ['leading-dot', '.Alice', 'empty leaf'], ['internal-at', 'Alice@Other', 'unsupported chain suffix'],
  ['identity-address-leaf', CHAIN_ID, 'creation rejects Base58Check address names'],
];

async function main() {
  const info = await requestRPC('getinfo');
  assert(info.testnet && info.chainid === CHAIN_ID && info.name === 'VRSCTEST', 'VRSCTEST required');
  const roots = {};
  for (const root of ['VRSCTEST', 'VRSC']) {
    roots[root] = await requestRPC('getvdxfid', [`${root}.@`]);
    assert(roots[root].qualifiedname.parentid && !roots[root].indexid, 'identity root response required');
  }
  assert.strictEqual(roots.VRSCTEST.vdxfid, CHAIN_ID);

  const names = [];
  for (const rootSystemName of Object.keys(roots)) {
    for (const [label, name, parentParts = []] of VALID_NAMES) {
      const parentName = [...parentParts, rootSystemName].join('.');
      const fullName = `${name}.${parentName}@`;
      const RPCInput = `${name}.${parentName}.@`;
      const result = await requestRPC('getvdxfid', [RPCInput]);
      assert(result.qualifiedname.parentid && !result.indexid, `${label}: identity response required`);
      assert.strictEqual(result.qualifiedname.name, name, `${label}: approved name bytes changed`);
      const parentResult = await requestRPC('getvdxfid', [`${parentName}.@`]);
      assert.strictEqual(result.qualifiedname.parentid, parentResult.vdxfid, `${label}: independently derived parent`);
      const systemID = roots[rootSystemName].vdxfid;
      const relativeName = [name, ...parentParts].join('.');
      const requests = [
        {name: relativeName, rootSystemName, systemID},
        {name: relativeName + '@', rootSystemName, systemID},
        {name: fullName, rootSystemName, systemID},
        {name: RPCInput, rootSystemName, systemID},
        {name: RPCInput.slice(0, -1), rootSystemName, systemID},
        {name, rootSystemName, systemID, parent: parentResult.vdxfid, parentName: parentName + '.@'},
        {name, rootSystemName, systemID, parent: parentResult.vdxfid, parentName: parentParts.length ? parentParts.join('.') : rootSystemName},
        // The selected registration system is independent of the namespace. This
        // exercises pure resolution only; it makes no claim about chain eligibility.
        {name: fullName, rootSystemName, systemID: CHAIN_ID, parent: parentResult.vdxfid},
      ];
      names.push({label: `${rootSystemName}/${label}`, RPCInput, result, parentResult, fullName, nameUTF8: Buffer.from(name).toString('hex'), requests});
    }
  }

  const rejectedNames = [];
  for (const [label, name, reason] of REJECTED_NAMES) {
    const RPCInput = `${name}.VRSCTEST.@`;
    let response;
    try {
      response = {result: await requestRPC('getvdxfid', [RPCInput])};
    } catch (error) {
      const prefix = 'getvdxfid: ';
      assert(error.message.startsWith(prefix), 'RPC transport errors are not fixture data');
      const RPCError = JSON.parse(error.message.slice(prefix.length));
      assert.strictEqual(RPCError.code, -8, 'unexpected daemon failure');
      response = {error: RPCError};
    }
    const outcome = response.error ? 'error' : response.result.indexid ? 'VDXF-key' : 'identity';
    rejectedNames.push({label, name, reason, RPCInput, outcome, ...response});
  }

  const fixture = {
    schemaVersion: 1,
    provenance: {
      generator: 'scripts/generate-identity-registration-name-fixtures.js',
      readOnlyRPCMethods: ['getinfo', 'getvdxfid'],
      chain: info.name, chainID: info.chainid, daemonVersion: info.version, protocolVersion: info.protocolversion,
      note: 'Absolute identity names end in .@. getvdxfid can fall back to VDXF key derivation for invalid identity names; indexid/namespace results are not identity registration acceptance. VRSC vectors are explicit global names calculated by the VRSCTEST daemon, not mainnet RPC results.',
    },
    roots, names, rejectedNames,
  };
  const output = path.resolve(__dirname, '../src/__tests__/fixtures/identity-registration/names-v1.json');
  fs.mkdirSync(path.dirname(output), {recursive: true});
  fs.writeFileSync(output, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(`Captured ${names.length} identity names (${names.reduce((sum, one) => sum + one.requests.length, 0)} resolver inputs) and ${rejectedNames.length} rejected creation names in ${output}\n`);
}

main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
