'use strict';

// RPC owns the expected serialization and plaintext. The native adapter uses
// the daemon's crypto libraries; this module adds no SDK encryption behavior.
const assert = require('assert');
const { createHash } = require('crypto');

const modes = ['sha256', 'sha256D', 'blake2b'];
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const jsonCommitment = (value) => sha256(Buffer.from(JSON.stringify(value)));

function createEncryptionBoundaryRequest(spec) {
  // Resolve lazily so the main generator can import this module as well.
  const { createRequest } = require('../generate-mmr-rpc-fixtures');
  const request = createRequest(
    spec.objectMode || 'sha256',
    spec.mmrMode || 'blake2b',
    spec.count || 1,
    spec.kind || 'binary'
  );

  if (spec.length !== undefined) {
    const payload = Buffer.from(
      Array.from(
        { length: spec.length },
        (_, index) => (index * 19 + 128) & 255
      )
    );
    request.mmrdata = [
      spec.length === 0
        ? { datahash: sha256(payload) }
        : { serializedhex: payload.toString('hex') },
    ];
  }

  if (spec.label !== undefined) request.mmrdata[0].label = spec.label;
  if (spec.mimetype !== undefined) request.mmrdata[0].mimetype = spec.mimetype;
  return request;
}

function localEncryptionBoundaryDescriptor(spec, primitives) {
  const { localDescriptor } = require('../generate-mmr-rpc-fixtures');
  const request = createEncryptionBoundaryRequest(spec);
  const descriptor = localDescriptor(request, primitives);

  // The common MMR helper intentionally models only the payload and salt.
  request.mmrdata.forEach((item, index) => {
    descriptor.dataDescriptors[index].label = item.label;
    descriptor.dataDescriptors[index].mimeType = item.mimetype;
  });
  return descriptor;
}

function encryptionBoundarySpecs() {
  return {
    payloads: [
      ...[
        0, 1, 216, 217, 218, 252, 253, 254, 65497, 65498, 65499, 65535, 65536,
      ].map((length) => ({ name: `payload/${length}`, length })),
      {
        name: 'payload/multibyte-metadata',
        length: 1,
        label: 'é'.repeat(32),
        mimetype: 'type/' + 'é'.repeat(61) + 'x',
      },
    ],
    trees: [1, 3, 252, 253, 254].map((count) => ({
      name: `mixed-tree/${count}`,
      count,
      kind: 'mixed',
    })),
  };
}

async function captureEncryptionBoundaries({
  primitives: p,
  rpc,
  nativeEncrypt,
  nativeDecrypt,
  taggedDescriptor,
  recipient,
  checkpoint = () => {},
}) {
  const fixture = {
    payloadCases: [],
    treeCases: [],
    fullWrappers: [],
    rejections: [],
  };
  const rejectionInputs = {};
  const taggedMMR = (descriptor) =>
    new p.VdxfUniValue({
      values: [{ [p.MMRDescriptorKey.vdxfid]: descriptor }],
    }).toBuffer();

  async function captureTree(spec) {
    const request = createEncryptionBoundaryRequest(spec);
    const result = await rpc('signdata', [
      { ...request, encrypttoaddress: recipient.address },
    ]);
    const plain = result.mmrdescriptor;
    const encrypted = result.mmrdescriptor_encrypted;
    const local = localEncryptionBoundaryDescriptor(spec, p);
    const canonicalMMR = taggedMMR(local);
    const commitment = await rpc('signdata', [
      {
        createmmr: true,
        mmrdata: [{ vdxfdata: { [p.MMRDescriptorKey.vdxfid]: plain } }],
        mmrsalt: ['00'.repeat(32)],
      },
    ]);
    const serializationCommitment = commitment.mmrdescriptor.mmrroot.objectdata;
    assert.strictEqual(
      sha256(Buffer.concat([canonicalMMR, Buffer.alloc(32)])),
      serializationCommitment,
      `${spec.name}: daemon MMR serialization commitment`
    );

    const records = [];
    const components = [
      ['root', plain.mmrroot, encrypted.mmrroot],
      ['hashes', plain.mmrhashes, encrypted.mmrhashes],
      ...plain.datadescriptors.map((item, index) => [
        `leaf${index}`,
        item,
        encrypted.datadescriptors[index],
      ]),
    ];

    for (let index = 0; index < components.length; index++) {
      const [name, plaintext, ciphertext] = components[index];
      const canonical = taggedDescriptor(
        p.DataDescriptor.fromDaemonJson(plaintext)
      );
      const decrypted = nativeDecrypt(ciphertext);
      assert.deepStrictEqual(
        decrypted,
        canonical,
        `${spec.name}/${name}: authenticated daemon plaintext`
      );
      const record = {
        name,
        taggedByteLength: canonical.length,
        taggedSha256: sha256(canonical),
        nativePlaintextSha256: sha256(decrypted),
        ciphertextByteLength: ciphertext.objectdata.length / 2,
        ciphertextSha256: sha256(Buffer.from(ciphertext.objectdata, 'hex')),
      };

      // Verify every daemon ciphertext. Round-trip representative leaves near
      // count boundaries, including an empty hash-only descriptor, through RPC.
      if (
        components.length <= 5 ||
        [0, 1, 2, 3, 253, 254, 255, components.length - 1].includes(index)
      ) {
        const daemonDecrypted = await rpc('decryptdata', [
          { datadescriptor: ciphertext, ivk: recipient.ivk },
        ]);
        const localEncrypted = nativeEncrypt(canonical);
        const localDaemonDecrypted = await rpc('decryptdata', [
          { datadescriptor: localEncrypted, ivk: recipient.ivk },
        ]);
        assert.deepStrictEqual(localDaemonDecrypted, daemonDecrypted);
        record.roundTrip = {
          daemonDecryptedSha256: jsonCommitment(daemonDecrypted),
          localDaemonDecryptedSha256: jsonCommitment(localDaemonDecrypted),
          localCiphertextByteLength: localEncrypted.objectdata.length / 2,
        };
      }

      if (spec.name === 'payload/1') rejectionInputs[name] = ciphertext;
      records.push(record);
    }

    return {
      spec,
      rootHex: plain.mmrroot.objectdata,
      hashVectorSha256: sha256(Buffer.from(plain.mmrhashes.objectdata, 'hex')),
      serializationCommitment,
      records,
    };
  }

  const specs = encryptionBoundarySpecs();
  for (const spec of specs.payloads) {
    fixture.payloadCases.push(await captureTree(spec));
    await checkpoint(fixture);
  }
  for (const spec of specs.trees) {
    fixture.treeCases.push(await captureTree(spec));
    await checkpoint(fixture);
  }

  for (const objectMode of modes) {
    for (const mmrMode of modes) {
      const spec = {
        name: `full-wrapper/${objectMode}/${mmrMode}`,
        count: 3,
        kind: 'mixed',
        objectMode,
        mmrMode,
      };
      const request = createEncryptionBoundaryRequest(spec);
      const result = await rpc('signdata', [request]);
      const plain = result.mmrdescriptor;
      const wrapped = await rpc('signdata', [
        {
          createmmr: true,
          encrypttoaddress: recipient.address,
          mmrdata: [{ vdxfdata: { [p.MMRDescriptorKey.vdxfid]: plain } }],
          mmrsalt: ['00'.repeat(32)],
        },
      ]);
      const ciphertext = wrapped.mmrdescriptor_encrypted.datadescriptors[0];
      const canonicalMMR = taggedMMR(
        localEncryptionBoundaryDescriptor(spec, p)
      );
      const canonical = taggedDescriptor(
        new p.DataDescriptor({
          objectdata: canonicalMMR,
          salt: Buffer.alloc(32),
        })
      );
      const decrypted = nativeDecrypt(ciphertext);
      assert.deepStrictEqual(decrypted, canonical);
      const daemonDecrypted = await rpc('decryptdata', [
        { datadescriptor: ciphertext, ivk: recipient.ivk },
      ]);
      const localEncrypted = nativeEncrypt(canonical);
      const localDaemonDecrypted = await rpc('decryptdata', [
        { datadescriptor: localEncrypted, ivk: recipient.ivk },
      ]);
      assert.deepStrictEqual(localDaemonDecrypted, daemonDecrypted);
      fixture.fullWrappers.push({
        spec,
        serializationCommitment: wrapped.mmrdescriptor.mmrroot.objectdata,
        taggedByteLength: canonical.length,
        taggedSha256: sha256(canonical),
        nativePlaintextSha256: sha256(decrypted),
        ciphertextByteLength: ciphertext.objectdata.length / 2,
        localCiphertextByteLength: localEncrypted.objectdata.length / 2,
        daemonDecrypted,
        localDaemonDecrypted,
      });
      await checkpoint(fixture);
      rejectionInputs['full-wrapper'] = ciphertext;
    }
  }

  async function captureRejection(name, method, request) {
    try {
      await rpc(method, [request]);
    } catch (error) {
      const match = error.message.match(/"code":(-?\d+)/);
      assert(match, `Expected an RPC rejection for ${name}: ${error.message}`);
      const code = Number(match[1]);
      assert.strictEqual(
        code,
        method === 'signdata' ? -8 : -5,
        `${name}: unexpected daemon error`
      );
      return {
        name,
        method,
        request,
        code,
        message: error.message,
      };
    }
    throw new Error(`Daemon unexpectedly accepted ${name}`);
  }

  // signdata cannot create a raw empty leaf. A hash-only leaf above supplies
  // the independently produced empty descriptor used by encryption tests.
  fixture.rejections.push(
    await captureRejection('empty-raw-leaf', 'signdata', {
      createmmr: true,
      encrypttoaddress: recipient.address,
      mmrdata: [{ serializedhex: '' }],
      mmrsalt: ['00'.repeat(32)],
    })
  );
  await checkpoint(fixture);

  for (const [component, original] of Object.entries(rejectionInputs)) {
    const alteredTag = Buffer.from(original.objectdata, 'hex');
    alteredTag[alteredTag.length - 1] ^= 1;
    const variants = [
      ['wrong-viewing-key', original, '01'.repeat(32)],
      [
        'authentication-tag',
        { ...original, objectdata: alteredTag.toString('hex') },
      ],
      ['empty-ciphertext', { ...original, objectdata: '' }],
      [
        'shorter-than-tag',
        { ...original, objectdata: original.objectdata.slice(0, 30) },
      ],
      [
        'tag-only',
        { ...original, objectdata: original.objectdata.slice(0, 32) },
      ],
      [
        'truncated-ciphertext',
        { ...original, objectdata: original.objectdata.slice(0, -2) },
      ],
    ];
    for (const [name, datadescriptor, ivk = recipient.ivk] of variants) {
      fixture.rejections.push(
        await captureRejection(`${component}/${name}`, 'decryptdata', {
          datadescriptor,
          ivk,
        })
      );
      await checkpoint(fixture);
    }
  }

  return fixture;
}

module.exports = {
  captureEncryptionBoundaries,
  createEncryptionBoundaryRequest,
  encryptionBoundarySpecs,
  localEncryptionBoundaryDescriptor,
};
