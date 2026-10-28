#!/usr/bin/env node
'use strict';

// Synthetic VRSCTEST reference templates only. returntx=true, feeoffer=0;
// no funding or broadcast RPCs. Credentials use the existing VRSCTEST_RPC_* env.
// Extraction is independent of the TypeScript codecs under test.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  requestRPC,
  CHAIN_ID,
} = require('./generate-identity-registration-fixtures');

function pushes(buffer) {
  const result = [];

  for (let offset = 0; offset < buffer.length; ) {
    const opcode = buffer[offset++];
    let length;

    if (opcode > 0 && opcode < 76) {
      length = opcode;
    } else if (opcode === 76) {
      length = buffer[offset++];
    } else if (opcode === 77) {
      length = buffer.readUInt16LE(offset);
      offset += 2;
    } else if (opcode === 78) {
      length = buffer.readUInt32LE(offset);
      offset += 4;
    } else {
      result.push(opcode);
      continue;
    }

    assert(offset + length <= buffer.length);
    result.push(buffer.subarray(offset, offset + length));
    offset += length;
  }

  return result;
}

function evidenceBytes(scriptHex) {
  const chunks = pushes(Buffer.from(scriptHex, 'hex'));

  // Evidence follows OP_CHECKCRYPTOCONDITION (204) in the parameter push,
  // which is discarded by the trailing OP_DROP (117).
  assert(chunks.length === 4 && chunks[1] === 204 && chunks[3] === 117);
  const params = pushes(chunks[2]);
  assert(params.length === 3 && params[0].equals(Buffer.from([3, 3, 1, 1])));

  return params[2];
}

function multipartChunk(bytes) {
  // Header (59), proof version (4), one object VARINT (1), type uint16 (2).
  assert(bytes.subarray(59, 66).equals(Buffer.from('01000000010a00', 'hex')));
  let offset = 66;

  // Descriptor integers use the daemon's subtract-one base-128 VARINT,
  // not the CompactSize encoding used for the byte-vector length below.
  const varint = () => {
    let value = 0;

    for (;;) {
      const byte = bytes[offset++];
      value = value * 128 + (byte & 127);

      if (!(byte & 128)) {
        return value;
      }

      value++;
    }
  };

  // EvidenceData serializes its version twice before the multipart type.
  assert(varint() === 1 && varint() === 1 && varint() === 2);
  const index = varint();
  const total = varint();
  const start = varint();

  // Fixture chunks are small enough to need at most a uint16 CompactSize.
  let length = bytes[offset++];

  if (length === 253) {
    length = bytes.readUInt16LE(offset);
    offset += 2;
  }

  assert(offset + length === bytes.length);

  return { index, total, start, data: bytes.subarray(offset) };
}

async function main() {
  const info = await requestRPC('getinfo');
  assert(info.testnet && info.chainid === CHAIN_ID && info.name === 'VRSCTEST');

  const help = await requestRPC('help', ['updateidentity']);
  assert(help.includes('returntx'));

  const captures = [];

  async function capture(name, data, save = true) {
    const request = {
      name: 'VRSCTEST',
      contentmultimap: {
        'vrsc::data.type.bytearray': [{ data: { ...data, createmmr: true } }],
      },
    };
    const hex = await requestRPC('updateidentity', [request, true, false, 0]);
    const decoded = await requestRPC('decoderawtransaction', [hex]);
    const outputs = decoded.vout.filter(
      (output) => output.scriptPubKey.notaryevidence
    );
    assert(
      outputs.length > 0 && outputs.every((output) => output.valueSat === 0)
    );

    const parts = outputs.map((output) =>
      evidenceBytes(output.scriptPubKey.hex)
    );
    let original;

    if (parts[0][1] === 3) {
      assert(parts.length === 1);
      original = parts[0];
    } else {
      let start = 0;
      const chunks = parts.map((part, index) => {
        assert(part[1] === 2);
        const chunk = multipartChunk(part);
        assert(chunk.index === index && chunk.start === start);

        start += chunk.data.length;
        return chunk;
      });

      assert(chunks.every((chunk) => chunk.total === start));
      original = Buffer.concat(chunks.map((chunk) => chunk.data));
    }

    // Encryption is randomized: retain the exact returned ciphertext so the
    // tests compare serialization, without attempting to reproduce encryption.
    const result = {
      name,
      request,
      serializedEvidenceHex: original.toString('hex'),
      outputs: outputs.map((output) => ({
        value: output.valueSat,
        scriptHex: output.scriptPubKey.hex,
        header: {
          ...output.scriptPubKey.notaryevidence,
          evidence: undefined,
        },
      })),
    };

    if (save) captures.push(result);

    return result;
  }

  // Measure evidence overhead with a payload in the same CompactSize range
  // as the boundary cases; payload lengths then target exact condition sizes.
  const calibration = await capture(
    'calibration',
    { message: 'x'.repeat(5600) },
    false
  );
  const overhead = calibration.serializedEvidenceHex.length / 2 - 5600;

  await capture('single', { message: 'local upload primitive fixture' });
  await capture('three-leaf-mmr', {
    mmrdata: [{ message: 'one' }, { message: 'two' }, { message: 'three' }],
    mmrsalt: ['11'.repeat(32), '22'.repeat(32), '33'.repeat(32)],
  });

  // With these payload sizes the condition has 82 bytes besides the evidence.
  // The daemon splits at 6,000 bytes, while a multipart chunk holds 5,724 bytes.
  await capture('condition-5999', {
    message: 'x'.repeat(5999 - 82 - overhead),
  });
  await capture('condition-6000', {
    message: 'x'.repeat(6000 - 82 - overhead),
  });
  await capture('two-exact-chunks', {
    message: 'x'.repeat(2 * 5724 - overhead),
  });
  await capture('three-chunks', { message: 'x'.repeat(12000 - overhead) });

  assert(
    captures[2].serializedEvidenceHex.length / 2 === 5917 &&
      captures[2].outputs.length === 1
  );
  assert(
    captures[3].serializedEvidenceHex.length / 2 === 5918 &&
      captures[3].outputs.length === 2
  );
  assert(
    captures[4].serializedEvidenceHex.length / 2 === 11448 &&
      captures[4].outputs.length === 2
  );
  assert(
    captures[5].serializedEvidenceHex.length / 2 === 12000 &&
      captures[5].outputs.length === 3
  );

  const target = path.join(
    __dirname,
    '../src/__tests__/fixtures/local-upload/evidence.json'
  );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    JSON.stringify(
      {
        daemon: {
          version: info.VRSCversion,
          protocolversion: info.protocolversion,
          chainid: info.chainid,
          height: info.blocks,
        },
        calls: [
          'getinfo',
          'help updateidentity',
          'updateidentity(request, true, false, 0)',
          'decoderawtransaction',
        ],
        notes:
          'Randomized encryption retained exactly as returned; comparison uses those ciphertexts. No broadcast, funding, or native encryption interoperability test.',
        cases: captures,
      },
      null,
      2
    ) + '\n'
  );
  console.log(
    `Captured ${captures.length} daemon evidence fixtures in ${target}`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
