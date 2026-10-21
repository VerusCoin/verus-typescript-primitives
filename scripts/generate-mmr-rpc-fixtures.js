#!/usr/bin/env node
'use strict';

// Read-only, synthetic RPC reference capture. Expected roots and serialization
// commitments come from the running daemon, never from a JavaScript MMR.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { createHash } = require('crypto');
const { execFileSync } = require('child_process');
let rpc; // Loaded only for live capture; pure input helpers are also used by tests.
let p; // The generator checks RPC expectations against the freshly built distribution.
const bech32 = require('bech32');

const modes = ['sha256', 'sha256D', 'blake2b'];
const modeIds = { sha256: 5, sha256D: 4, blake2b: 1 };
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const fixturePath = path.resolve(
  __dirname,
  '../src/__tests__/fixtures/mmr/daemon-rpc.json'
);
const native =
  process.env.VERUS_NATIVE_CRYPTO || '/tmp/local-upload-native-crypto';
const recipient = require('../src/__tests__/fixtures/mmr/public-recipient.json');

// Fixture construction supports both CompactSize transitions exercised by RPC.
function compactSize(value) {
  if (value < 253) return Buffer.from([value]);
  const bytes = Buffer.alloc(value <= 0xffff ? 3 : 5);
  bytes[0] = value <= 0xffff ? 253 : 254;
  if (value <= 0xffff) bytes.writeUInt16LE(value, 1);
  else bytes.writeUInt32LE(value, 1);
  return bytes;
}

function createRequest(objectMode, mmrMode, count, kind = 'binary') {
  const mmrdata = [];
  const mmrsalt = [];
  for (let index = 0; index < count; index++) {
    const leafIndex = kind === 'repeated' ? 0 : index;
    const bytes = Buffer.from(
      Array.from(
        { length: 1 + (leafIndex % 80) },
        (_, byte) => (leafIndex * 71 + byte * 19 + 128) & 255
      )
    );
    mmrdata.push(
      kind === 'mixed' && index % 3 === 1
        ? { datahash: sha256(Buffer.from('mmr audit hash-only ' + index)) }
        : { serializedhex: bytes.toString('hex') }
    );
    mmrsalt.push(sha256(Buffer.from('mmr audit salt ' + leafIndex)));
  }
  return {
    createmmr: true,
    hashtype: objectMode,
    mmrhashtype: mmrMode,
    mmrdata,
    mmrsalt,
  };
}

function localDescriptor(request, primitives = p) {
  const p = primitives;
  const hashes = request.mmrdata.map((item, index) =>
    item.datahash
      ? request.hashtype === 'sha256'
        ? Buffer.from(item.datahash, 'hex')
        : Buffer.from(item.datahash, 'hex').reverse()
      : p.hashData(
          Buffer.concat([
            Buffer.from(item.serializedhex, 'hex'),
            Buffer.from(request.mmrsalt[index], 'hex'),
          ]),
          modeIds[request.hashtype]
        )
  );
  const mmrHashType =
    modeIds[hashes.length === 1 ? request.hashtype : request.mmrhashtype];
  return new p.MMRDescriptor({
    objectHashType: modeIds[request.hashtype],
    mmrHashType,
    mmrRoot: new p.DataDescriptor({
      objectdata: p.getMMRRoot(hashes, mmrHashType),
    }),
    mmrHashes: new p.DataDescriptor({
      objectdata: new p.BufferDataVdxfObject(
        Buffer.concat([compactSize(hashes.length), ...hashes]).toString('hex'),
        p.VectorUint256Key.vdxfid
      ).toBuffer(),
    }),
    dataDescriptors: request.mmrdata.map((item, index) =>
      item.datahash
        ? new p.DataDescriptor()
        : new p.DataDescriptor({
            objectdata: Buffer.from(item.serializedhex, 'hex'),
            salt: Buffer.from(request.mmrsalt[index], 'hex'),
          })
    ),
  });
}

const taggedMMR = (descriptor, primitives = p) =>
  new primitives.VdxfUniValue({
    values: [{ [primitives.MMRDescriptorKey.vdxfid]: descriptor }],
  }).toBuffer();
const taggedDescriptor = (descriptor) =>
  new p.VDXFDataDescriptor(descriptor, p.DataDescriptorKey.vdxfid).toBuffer();
const nativeDecrypt = (descriptor) =>
  Buffer.from(
    execFileSync(native, ['decrypt', recipient.ivk, descriptor.epk, '-'], {
      input: Buffer.from(descriptor.objectdata, 'hex'),
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    }).trim(),
    'hex'
  );
const nativeEncrypt = (plaintext) => {
  const address = bech32.bech32.decode(recipient.address, 1023);
  const addressHex = Buffer.from(
    bech32.bech32.fromWords(address.words)
  ).toString('hex');
  const result = JSON.parse(
    execFileSync(native, ['encrypt', addressHex, '-'], {
      input: plaintext,
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    })
  );
  return {
    version: 1,
    flags: 5,
    objectdata: result.ciphertext,
    epk: result.epk,
  };
};

// Shared by the focused boundary captures and the complete regeneration run.
function configureCapture(primitives, requestRPC) {
  p = primitives;
  rpc = requestRPC;
  return {
    primitives: p,
    rpc,
    nativeEncrypt,
    nativeDecrypt,
    taggedDescriptor,
    recipient,
  };
}

async function captureCase(objectMode, mmrMode, count, kind) {
  const request = createRequest(objectMode, mmrMode, count, kind);
  const result = await rpc('signdata', [request]);
  const descriptor = result.mmrdescriptor;
  // The outer SHA256 commitment independently covers the daemon's actual
  // VectorEncodeVDXFUni/CMMRDescriptor serialization, including all lengths.
  const serialized = await rpc('signdata', [
    {
      createmmr: true,
      mmrdata: [{ vdxfdata: { [p.MMRDescriptorKey.vdxfid]: descriptor } }],
      mmrsalt: ['00'.repeat(32)],
    },
  ]);
  const local = localDescriptor(request);
  assert.strictEqual(
    local.mmrRoot.objectdata.toString('hex'),
    descriptor.mmrroot.objectdata
  );
  assert.strictEqual(
    local.mmrHashes.objectdata.toString('hex'),
    descriptor.mmrhashes.objectdata
  );
  const canonicalBytes = taggedMMR(local);
  const serializationCommitment = serialized.mmrdescriptor.mmrroot.objectdata;
  assert.strictEqual(
    sha256(Buffer.concat([canonicalBytes, Buffer.alloc(32)])),
    serializationCommitment
  );
  const decoded =
    serialized.mmrdescriptor.datadescriptors[0].objectdata[
      p.MMRDescriptorKey.vdxfid
    ];
  return {
    name: `${kind}/${objectMode}/${mmrMode}/${count}`,
    kind,
    objectMode,
    mmrMode,
    count,
    objectHashType: descriptor.objecthashtype,
    mmrHashType: descriptor.mmrhashtype,
    rootHex: descriptor.mmrroot.objectdata,
    hashVectorSha256: sha256(
      Buffer.from(descriptor.mmrhashes.objectdata, 'hex')
    ),
    serializationCommitment,
    taggedByteLength: canonicalBytes.length,
    daemonDecodedObjectHashType: decoded.objecthashtype,
    daemonDecodedMMRHashType: decoded.mmrhashtype,
  };
}

async function captureEncryption(objectMode, mmrMode) {
  const request = {
    ...createRequest(objectMode, mmrMode, 3),
    encrypttoaddress: recipient.address,
  };
  const result = await rpc('signdata', [request]);
  const plain = result.mmrdescriptor;
  const encrypted = result.mmrdescriptor_encrypted;
  const records = [];
  for (const [name, plaintext, ciphertext] of [
    ['root', plain.mmrroot, encrypted.mmrroot],
    ['hashes', plain.mmrhashes, encrypted.mmrhashes],
    ...plain.datadescriptors.map((item, index) => [
      'leaf' + index,
      item,
      encrypted.datadescriptors[index],
    ]),
  ]) {
    const taggedPlaintext = taggedDescriptor(
      p.DataDescriptor.fromDaemonJson(plaintext)
    );
    assert.deepStrictEqual(nativeDecrypt(ciphertext), taggedPlaintext);
    const daemonDecrypted = await rpc('decryptdata', [
      { datadescriptor: ciphertext, ivk: recipient.ivk },
    ]);
    const localEncrypted = nativeEncrypt(taggedPlaintext);
    const localDaemonDecrypted = await rpc('decryptdata', [
      { datadescriptor: localEncrypted, ivk: recipient.ivk },
    ]);
    assert.deepStrictEqual(daemonDecrypted, localDaemonDecrypted);
    // Root/leaf fields are raw hex. Hash vectors are returned as decoded VDXF
    // JSON; equality above covers both daemon- and locally-encrypted inputs.
    if (name !== 'hashes')
      assert.deepStrictEqual(daemonDecrypted, plaintext.objectdata);
    records.push({
      name,
      plaintext,
      ciphertext,
      taggedPlaintextHex: taggedPlaintext.toString('hex'),
      daemonDecrypted,
      localEncrypted,
      localDaemonDecrypted,
    });
  }
  // Also recover the canonical MMR bytes from the daemon's encrypted wrapper.
  // This distinguishes a wire mismatch from its known enum-decoding defect.
  const wrapped = await rpc('signdata', [
    {
      createmmr: true,
      encrypttoaddress: recipient.address,
      mmrdata: [{ vdxfdata: { [p.MMRDescriptorKey.vdxfid]: plain } }],
      mmrsalt: ['00'.repeat(32)],
    },
  ]);
  const exactMMRBytes = taggedMMR(p.MMRDescriptor.fromDaemonJson(plain));
  const expectedWrapped = taggedDescriptor(
    new p.DataDescriptor({ objectdata: exactMMRBytes, salt: Buffer.alloc(32) })
  );
  const daemonWrappedPlaintext = nativeDecrypt(
    wrapped.mmrdescriptor_encrypted.datadescriptors[0]
  );
  assert.deepStrictEqual(daemonWrappedPlaintext, expectedWrapped);
  const wrappedDaemonDecrypted = await rpc('decryptdata', [
    {
      datadescriptor: wrapped.mmrdescriptor_encrypted.datadescriptors[0],
      ivk: recipient.ivk,
    },
  ]);
  const corrupted = { ...records[2].localEncrypted };
  const corruptedBytes = Buffer.from(corrupted.objectdata, 'hex');
  corruptedBytes[corruptedBytes.length - 1] ^= 1;
  corrupted.objectdata = corruptedBytes.toString('hex');
  await assert.rejects(
    rpc('decryptdata', [{ datadescriptor: corrupted, ivk: recipient.ivk }])
  );
  await assert.rejects(
    rpc('decryptdata', [
      { datadescriptor: records[2].localEncrypted, ivk: '01'.repeat(32) },
    ])
  );
  return {
    name: `${objectMode}/${mmrMode}`,
    request,
    records,
    canonicalMMRHex: exactMMRBytes.toString('hex'),
    daemonWrappedPlaintextHex: daemonWrappedPlaintext.toString('hex'),
    wrappedCiphertext: wrapped.mmrdescriptor_encrypted.datadescriptors[0],
    wrappedDaemonDecrypted,
    authenticatedRejection: {
      corruptedCiphertext: true,
      wrongViewingKey: true,
    },
  };
}

async function captureMetadata() {
  const records = [];
  for (const label of [
    '  abc  def  ',
    '\t abc\n',
    'é'.repeat(40),
    '🚀'.repeat(20),
  ]) {
    const descriptor = {
      version: 1,
      flags: 0,
      objectdata: '010203',
      label,
      mimetype: label,
    };
    const request = {
      createmmr: true,
      mmrdata: [{ vdxfdata: { [p.DataDescriptorKey.vdxfid]: descriptor } }],
      mmrsalt: ['00'.repeat(32)],
    };
    const result = await rpc('signdata', [request]);
    records.push({
      input: descriptor,
      daemonOutput:
        result.mmrdescriptor.datadescriptors[0].objectdata[
          p.DataDescriptorKey.vdxfid
        ],
      serializationCommitment: result.mmrdescriptor.mmrroot.objectdata,
    });
  }
  return records;
}

async function captureDescriptorJson(primitives = p, requestRPC = rpc) {
  const p = primitives;
  const rpc = requestRPC;
  const cases = [
    ['empty-data', p.DataDescriptorKey.vdxfid, {}],
    ['zero-data', p.DataDescriptorKey.vdxfid, { version: 0, flags: 0 }],
    [
      'empty-optional-data',
      p.DataDescriptorKey.vdxfid,
      { version: 1, epk: '', ivk: '', ssk: '', salt: '' },
    ],
    [
      'maximum-data-fields',
      p.DataDescriptorKey.vdxfid,
      { version: 0xffffffff, flags: 0xffffffff },
    ],
    [
      'empty-text-data',
      p.DataDescriptorKey.vdxfid,
      { version: 1, mimetype: 'text/plain', objectdata: { message: '' } },
    ],
    [
      'unicode-data',
      p.DataDescriptorKey.vdxfid,
      {
        version: 1,
        label: 'é'.repeat(32),
        mimetype: 'text/plain',
        objectdata: { message: 'café ☕' },
      },
    ],
    [
      'invalid-text-data',
      p.DataDescriptorKey.vdxfid,
      { version: 1, mimetype: 'text/plain', objectdata: 'fffe' },
    ],
    ['empty-mmr', p.MMRDescriptorKey.vdxfid, {}],
    [
      'zero-mmr',
      p.MMRDescriptorKey.vdxfid,
      { version: 0, objecthashtype: 0, mmrhashtype: 0 },
    ],
    [
      'unknown-mmr-tags',
      p.MMRDescriptorKey.vdxfid,
      { version: 1, objecthashtype: 0x7fffffff, mmrhashtype: 0x7ffffffe },
    ],
    ['numeric-byte', p.DataByteKey.vdxfid, 128],
    [
      'asymmetric-uint256',
      p.DataUint256Key.vdxfid,
      Buffer.from(Array.from({ length: 32 }, (_, index) => index + 1)).toString(
        'hex'
      ),
    ],
  ];
  cases.push([
    'text-url-reference',
    p.DataDescriptorKey.vdxfid,
    {
      version: 1,
      mimetype: 'text/plain',
      objectdata: {
        [p.CrossChainDataRefKey.vdxfid]: {
          type: 2,
          version: 1,
          flags: 1,
          datahash: '00'.repeat(32),
          url: 'https://verus.io',
        },
      },
    },
  ]);
  const records = [];
  for (const [name, key, input] of cases) {
    const vdxfdata = { [key]: input };
    const result = await rpc('signdata', [
      {
        createmmr: true,
        mmrdata: [{ vdxfdata }],
        mmrsalt: ['00'.repeat(32)],
      },
    ]);
    records.push({
      name,
      vdxfdata,
      serializationCommitment: result.mmrdescriptor.mmrroot.objectdata,
      daemonOutput: result.mmrdescriptor.datadescriptors[0].objectdata,
    });
  }
  return records;
}

async function captureRejectedRequests() {
  const records = [];
  const cases = [
    ['bare-string-mmr-leaf', '616263'],
    ['base64-mmr-leaf', { serializedbase64: 'YQ==' }],
    ['base64-vdxf-leaf', { vdxfdata: { serializedbase64: 'YQ==' } }],
  ];
  for (const [name, item] of cases) {
    const request = {
      createmmr: true,
      mmrdata: [item],
      mmrsalt: ['00'.repeat(32)],
    };
    try {
      await rpc('signdata', [request]);
    } catch (error) {
      assert.match(error.message, /"code":-8/);
      records.push({ name, request, code: -8, message: error.message });
      continue;
    }
    throw new Error(`Daemon unexpectedly accepted ${name}`);
  }
  return records;
}

async function main() {
  const context = configureCapture(
    require('../dist'),
    require('./generate-identity-registration-fixtures').requestRPC
  );
  const daemon = path.resolve(
    process.env.VERUS_DAEMON_SOURCE || path.join(__dirname, '../../VerusCoin')
  );
  const sourceFiles = [
    'src/mmr.h',
    'src/mmr.cpp',
    'src/hash.h',
    'src/pbaas/vdxf.h',
    'src/pbaas/vdxf.cpp',
    'src/wallet/rpcwallet.cpp',
    'src/key_io.cpp',
    'src/core_write.cpp',
    'src/zcash/NoteEncryption.cpp',
  ];
  const info = await rpc('getinfo');
  assert(info.testnet && info.chainid === 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq');
  const counts = [
    ...new Set([
      ...Array.from({ length: 17 }, (_, i) => i + 1),
      ...Array.from({ length: 12 }, (_, i) => 2 ** (i + 5)).flatMap((n) => [
        n - 1,
        n,
        n + 1,
      ]),
      252,
      253,
      254,
      16511,
      16512,
    ]),
  ].sort((a, b) => a - b);
  const fixture = {
    schemaVersion: 1,
    provenance: {
      generator: 'scripts/generate-mmr-rpc-fixtures.js',
      date: new Date().toISOString(),
      chainId: info.chainid,
      daemonVersion: info.VRSCversion,
      version: info.version,
      height: info.blocks,
      rpcMethods: ['getinfo', 'signdata', 'decryptdata'],
      note: "Synthetic unsigned inputs. Expected roots and serialization commitments are captured from the daemon. Native crypto uses the daemon's librustzcash/libsodium.",
      sourceRevision: execFileSync('git', ['-C', daemon, 'rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      relevantWorkingTree: execFileSync(
        'git',
        ['-C', daemon, 'status', '--short', '--', ...sourceFiles],
        { encoding: 'utf8' }
      ).trim(),
      sourceHashes: Object.fromEntries(
        sourceFiles.map((file) => [
          file,
          sha256(fs.readFileSync(path.join(daemon, file))),
        ])
      ),
      nativeAdapterSha256: sha256(
        fs.readFileSync(path.join(__dirname, 'mmr-native-crypto.c'))
      ),
      nativeExecutableSha256: sha256(fs.readFileSync(native)),
      captureHelperHashes: Object.fromEntries(
        [
          'mmr-descriptor-boundaries.js',
          'mmr-request-boundaries.js',
          'mmr-encryption-boundaries.js',
        ].map((file) => [
          'scripts/fixtures/' + file,
          sha256(fs.readFileSync(path.join(__dirname, 'fixtures', file))),
        ])
      ),
      sourceNote:
        'Local source provenance is recorded separately from the running daemon version; its build revision is not exposed by RPC.',
    },
    cases: [],
    encryption: [],
  };

  // Preserve completed sections if a later RPC or transport check fails. Only
  // the fully completed capture replaces the checked-in reference fixture.
  const checkpointPath = path.join(os.tmpdir(), 'verus-mmr-rpc-capture.json');
  const checkpoint = () =>
    fs.writeFileSync(checkpointPath, JSON.stringify(fixture, null, 2) + '\n');

  fixture.descriptorBoundaries =
    await require('./fixtures/mmr-descriptor-boundaries').captureDescriptorBoundaries(
      p,
      rpc
    );
  checkpoint();
  fixture.requestBoundaries =
    await require('./fixtures/mmr-request-boundaries').captureRequestBoundaries(
      p,
      rpc
    );
  checkpoint();
  fixture.encryptionBoundaries =
    await require('./fixtures/mmr-encryption-boundaries').captureEncryptionBoundaries(
      {
        ...context,
        checkpoint: (partial) =>
          fs.writeFileSync(
            path.join(os.tmpdir(), 'mmr-encryption-boundaries.partial.json'),
            JSON.stringify(partial, null, 2) + '\n'
          ),
      }
    );
  checkpoint();

  for (const objectMode of modes)
    for (const mmrMode of modes) {
      for (const count of counts) {
        fixture.cases.push(
          await captureCase(objectMode, mmrMode, count, 'binary')
        );
        if (count === 65537) {
          process.stdout.write(
            `Captured ${objectMode}/${mmrMode} through ${count} leaves.\n`
          );
        }
      }
      for (const count of [3, 7, 17, 253, 257])
        fixture.cases.push(
          await captureCase(objectMode, mmrMode, count, 'mixed')
        );
      fixture.cases.push(await captureCase(objectMode, mmrMode, 7, 'repeated'));
      fixture.encryption.push(await captureEncryption(objectMode, mmrMode));
      checkpoint();
      process.stdout.write(
        `Verified ${objectMode}/${mmrMode}: ${
          counts.length + 6
        } trees and bidirectional encrypted descriptors.\n`
      );
    }
  fixture.metadataCases = await captureMetadata();
  fixture.descriptorJsonCases = await captureDescriptorJson();
  fixture.rejectedRequests = await captureRejectedRequests();
  fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2) + '\n');
  process.stdout.write(
    `Captured ${fixture.cases.length} daemon trees, ` +
      `${fixture.descriptorBoundaries.length} descriptor boundaries and ` +
      `${fixture.requestBoundaries.cases.length} request boundaries, ` +
      'with native encryption checks.\n'
  );
}

module.exports = {
  createRequest,
  localDescriptor,
  taggedMMR,
  captureRejectedRequests,
  captureDescriptorJson,
  configureCapture,
  captureCase,
  main,
};
if (require.main === module)
  main().catch((error) => {
    console.error(error.stack);
    process.exitCode = 1;
  });
