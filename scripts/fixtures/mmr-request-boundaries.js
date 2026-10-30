'use strict';

const assert = require('assert');

const zeroSalt = '00'.repeat(32);
const suppliedHash = Buffer.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
).toString('hex');

// This is a finite boundary matrix, not a fuzzer. Calls are unsigned and never
// read files. Ordinary default-salt cases retain the generated salt in output.
function requestBoundaryCases(primitives) {
  const cases = [];
  const add = (name, items, localPolicy = 'supported', options = {}) => {
    const { request = {}, sameOutcomeAs, reason, omitSalt = false } = options;
    const rpcRequest = {
      createmmr: true,
      mmrdata: items,
      mmrsalt: items.map(() => zeroSalt),
      ...request,
    };
    if (omitSalt) delete rpcRequest.mmrsalt;

    cases.push({
      name,
      request: rpcRequest,
      localPolicy,
      ...(sameOutcomeAs ? { sameOutcomeAs } : {}),
      ...(reason ? { reason } : {}),
    });
  };

  add('hex-valid', [{ serializedhex: '616263' }]);
  add('zero-items', []);
  add('zero-supplied-hash', [{ datahash: zeroSalt }]);
  add('hex-uppercase', [{ serializedhex: '00ABFF' }]);
  add('hex-empty', [{ serializedhex: '' }], 'rpc-validation');
  add('message-valid', [{ message: 'abc' }], 'supported', {
    sameOutcomeAs: 'hex-valid',
  });
  add('message-unicode', [{ message: 'café ☕' }]);
  add('message-empty', [{ message: '' }], 'rpc-validation');
  add(
    'vdxf-raw-hex',
    [{ vdxfdata: { serializedhex: '616263' } }],
    'supported',
    {
      sameOutcomeAs: 'hex-valid',
    }
  );
  add('vdxf-message', [{ vdxfdata: { message: 'abc' } }], 'supported', {
    sameOutcomeAs: 'hex-valid',
  });
  add('vdxf-tagged-string', [
    { vdxfdata: { [primitives.DataStringKey.vdxfid]: 'tagged text' } },
  ]);
  add('vdxf-empty', [{ vdxfdata: {} }], 'reject');
  add('vdxf-empty-message', [{ vdxfdata: { message: '' } }], 'rpc-validation');
  add(
    'vdxf-empty-hex',
    [{ vdxfdata: { serializedhex: '' } }],
    'rpc-validation'
  );
  add('vdxf-bare-nonhex', [{ vdxfdata: 'not hexadecimal' }], 'reject');
  add('bare-string', ['616263'], 'reject');
  add('bare-empty-string', [''], 'reject');
  add('item-null', [null], 'reject');
  add('item-array', [[]], 'reject');
  add('item-number', [7], 'reject');
  add('item-empty-object', [{}], 'reject');
  add('item-unknown-key', [{ unsupported: '616263' }], 'reject');
  for (const key of [
    'serializedhex',
    'serializedbase64',
    'message',
    'vdxfdata',
    'datahash',
  ]) {
    add('null-' + key, [{ [key]: null }], 'reject');
  }
  add('null-mmrdata', [], 'reject', { request: { mmrdata: null } });
  add('object-mmrdata', [], 'reject', {
    request: { mmrdata: { message: 'abc' }, mmrsalt: zeroSalt },
    sameOutcomeAs: 'hex-valid',
  });
  add('item-metadata', [{ message: 'abc', label: 'example' }], 'reject', {
    sameOutcomeAs: 'hex-valid',
    reason: 'The lossless request envelope cannot retain per-item metadata.',
  });

  const badHex = {
    odd: 'abc',
    nonhex: 'gg',
    prefix: '0x61',
    'leading-space': ' 61',
    'trailing-space': '61 ',
    'embedded-space': '61 62',
    'trailing-junk': '61zz',
  };
  for (const [name, value] of Object.entries(badHex)) {
    add('hex-' + name, [{ serializedhex: value }], 'reject');
    add('vdxf-hex-' + name, [{ vdxfdata: { serializedhex: value } }], 'reject');
  }

  const base64 = {
    valid: 'YQ==',
    empty: '',
    'missing-padding': 'YQ',
    'short-padding': 'YQ=',
    'extra-padding': 'YQ===',
    'nonzero-padding-bits': 'YR==',
    whitespace: 'YQ==\n',
    prefix: '?YQ==',
    'trailing-junk': 'YQ==ignored',
    nonalphabet: '!!!!',
  };
  for (const [name, value] of Object.entries(base64)) {
    add('base64-' + name, [{ serializedbase64: value }], 'reject');
    add(
      'vdxf-base64-' + name,
      [{ vdxfdata: { serializedbase64: value } }],
      'reject'
    );
  }

  // Fixed GetDataMessage precedence must not depend on JSON insertion order.
  // Empty filename is intentional: even the standalone control cannot read.
  const priority = [
    ['datahash', suppliedHash],
    ['vdxfdata', { message: 'vdxf priority' }],
    ['serializedhex', Buffer.from('hex priority').toString('hex')],
    ['serializedbase64', Buffer.from('base64 priority').toString('base64')],
    ['message', 'message priority'],
    ['filename', ''],
  ];
  for (const [key, value] of priority) {
    add(
      'precedence-control-' + key,
      [{ [key]: value }],
      key === 'serializedbase64'
        ? 'reject'
        : key === 'filename'
        ? 'rpc-validation'
        : 'supported'
    );
  }
  for (let first = 0; first < priority.length; first++) {
    for (let second = first + 1; second < priority.length; second++) {
      const pair = [priority[first], priority[second]];
      for (const order of ['forward', 'reverse']) {
        const entries = order === 'forward' ? pair : [...pair].reverse();
        add(
          `precedence-${pair[0][0]}-${pair[1][0]}-${order}`,
          [Object.fromEntries(entries)],
          'reject',
          { sameOutcomeAs: 'precedence-control-' + pair[0][0] }
        );
      }
    }
  }

  add('datahash-width-32', [{ datahash: '11'.repeat(32) }]);
  add('salt-width-32', [{ message: 'abc' }], 'supported', {
    request: { mmrsalt: ['11'.repeat(32)] },
  });
  add('salt-count-short', [{ message: 'abc' }], 'rpc-validation', {
    request: { mmrsalt: [] },
  });
  add('salt-count-long', [{ message: 'abc' }], 'rpc-validation', {
    request: { mmrsalt: [zeroSalt, zeroSalt] },
  });

  for (const hashtype of ['sha256', 'sha256D', 'blake2b']) {
    const name = 'hash-only-' + hashtype;
    add(name, [{ datahash: suppliedHash }], 'supported', {
      request: { hashtype },
    });
    add(name + '-changed-salt', [{ datahash: suppliedHash }], 'supported', {
      request: { hashtype, mmrsalt: ['11'.repeat(32)] },
      sameOutcomeAs: name,
    });
    add(
      'mixed-hash-only-' + hashtype,
      [
        { serializedhex: '616263' },
        { datahash: suppliedHash },
        { message: 'café ☕' },
      ],
      'supported',
      { request: { hashtype } }
    );
  }

  for (const mode of ['omitted', 'null']) {
    const options =
      mode === 'omitted' ? { omitSalt: true } : { request: { mmrsalt: null } };
    add(
      `default-salt/${mode}/message`,
      [{ message: 'abc' }],
      'supported',
      options
    );
    add(
      `default-salt/${mode}/datahash`,
      [{ datahash: suppliedHash }],
      'supported',
      {
        ...options,
        sameOutcomeAs: 'hash-only-sha256',
      }
    );
  }

  for (const [name, priormmr] of [
    ['empty', []],
    ['hashes', [suppliedHash]],
    ['descriptor', [{ idxhash: suppliedHash, utxoref: {} }]],
    ['malformed', ['not a hash']],
  ]) {
    add('prior-mmr-' + name, [{ message: 'abc' }], 'reject', {
      request: { priormmr },
      sameOutcomeAs: 'hex-valid',
      reason: 'The daemon parses priormmr but never combines it into the root.',
    });
  }

  for (const hashtype of ['unsupported', 'SHA256', '']) {
    add(
      'object-hash-' + (hashtype || 'empty'),
      [{ message: 'abc' }],
      'rpc-validation',
      { request: { hashtype } }
    );
  }
  for (const mmrhashtype of ['unsupported', 'SHA256', '']) {
    for (const count of [1, 2]) {
      add(
        `mmr-hash-${mmrhashtype}-${count}`,
        Array.from({ length: count }, () => ({ message: 'abc' })),
        mmrhashtype ? 'reject' : 'rpc-validation',
        { request: { mmrhashtype } }
      );
    }
  }

  return cases;
}

function cliRequest(request) {
  return Object.fromEntries(
    ['mmrdata', 'mmrsalt', 'mmrhashtype', 'priormmr']
      .filter((key) => Object.prototype.hasOwnProperty.call(request, key))
      .map((key) => [key, request[key]])
  );
}

async function captureRequestBoundaries(primitives, rpc, options = {}) {
  const records = [];
  for (const item of requestBoundaryCases(primitives)) {
    if (options.onRequest) await options.onRequest(item);

    let daemon;
    try {
      const result = await rpc('signdata', [item.request]);
      assert(result.mmrdescriptor, 'Expected unsigned MMR descriptor');
      daemon = { status: 'success', mmrdescriptor: result.mmrdescriptor };
    } catch (error) {
      // Only input-validation errors belong in this fixture. An outage or a
      // rejected supported request must abort capture before replacing it.
      const match = /^signdata: (\{.*\})$/s.exec(error.message);
      if (!match) {
        throw new Error(`Request boundary ${item.name}: ${error.message}`);
      }
      const rpcError = JSON.parse(match[1]);
      assert(
        [-3, -8].includes(rpcError.code),
        `Request boundary ${item.name}: Unexpected RPC error ${error.message}`
      );
      assert.notStrictEqual(
        item.localPolicy,
        'supported',
        `Supported request ${item.name} received an RPC rejection: ${error.message}`
      );
      daemon = { status: 'error', ...rpcError };
    }

    const record = { ...item, daemon };
    records.push(record);
    if (options.onRecord) await options.onRecord(record);
  }

  return {
    cases: records,
    scopeNotes: [
      'Synthetic unsigned signdata calls and no file reads. Most cases supply deterministic salts; ordinary omitted/null salt cases retain the generated salt for independent commitment checks, while hash-only defaults retain no leaf salt.',
      'supported means lossless request conversion and independent root comparison; rpc-validation means the envelope is encodable but the daemon validates payload presence, counts, or object hash names.',
      'reject is the deliberate lossless CLI restriction, even when the daemon accepts and transforms an input.',
      'Unknown binary tags, replacement decoding, nested binary consumption and preserved local prior-MMR storage have no RPC wire representation; their regression tests remain local.',
      'Object hashtype is a surrounding signdata field, not a PartialMMRData field. Singleton daemon trees overwrite the requested MMR hash name with the object hash name.',
    ],
  };
}

module.exports = { captureRequestBoundaries, requestBoundaryCases, cliRequest };
