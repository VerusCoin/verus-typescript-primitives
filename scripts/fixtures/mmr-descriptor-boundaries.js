'use strict';

// Capture daemon behavior before comparing it with the library. Inputs include
// intentionally lossy JSON and malformed wire values; expected output is always
// obtained from RPC. The small wire encoders below do not use library codecs.
const assert = require('assert');
const bs58check = require('bs58check');

function compactSize(value) {
  if (value < 253) return Buffer.from([value]);
  const bytes = Buffer.alloc(value <= 0xffff ? 3 : 5);
  bytes[0] = bytes.length === 3 ? 253 : 254;
  if (bytes.length === 3) bytes.writeUInt16LE(value, 1);
  else bytes.writeUInt32LE(value, 1);
  return bytes;
}

function varInt(value) {
  const bytes = [];
  let remaining = BigInt(value);
  do {
    bytes.push(Number(remaining & 127n) | (bytes.length ? 128 : 0));
    if (remaining <= 127n) break;
    remaining = (remaining >> 7n) - 1n;
  } while (true);
  return Buffer.from(bytes.reverse());
}

const vector = (bytes) => Buffer.concat([compactSize(bytes.length), bytes]);
const text = (value) => vector(Buffer.from(value, 'utf8'));
const tagged = (key, payload, version = 1) =>
  Buffer.concat([
    bs58check.decode(key).subarray(1),
    varInt(version),
    vector(payload),
  ]);

function descriptorBoundaryCases(p) {
  const cases = [];
  const descriptorKey = p.DataDescriptorKey.vdxfid;
  const mmrKey = p.MMRDescriptorKey.vdxfid;
  const add = (name, category, key, input, expectations = {}) =>
    cases.push({
      name,
      category,
      inputKind: 'json',
      vdxfdata: { [key]: input },
      ...expectations,
    });
  const dd = (name, category, input, expectations) =>
    add(name, category, descriptorKey, input, expectations);
  const mmr = (name, category, input, expectations) =>
    add(name, category, mmrKey, input, expectations);
  const binary = (name, category, key, payload, expectations = {}) =>
    cases.push({
      name,
      category,
      inputKind: 'binary',
      serializedHex: tagged(key, payload).toString('hex'),
      payloadHex: payload.toString('hex'),
      descriptorType: key === descriptorKey ? 'data' : 'mmr',
      ...expectations,
    });

  // Exercise every combination, both with and without the encrypted-data bit.
  // Distinct bytes make an accidental exchange of optional fields observable.
  const optional = ['salt', 'epk', 'ivk', 'ssk'];
  for (let encrypted = 0; encrypted < 2; encrypted++) {
    for (let mask = 0; mask < 16; mask++) {
      const input = { version: 1, flags: encrypted, objectdata: '010203' };
      optional.forEach((field, index) => {
        if (mask & (1 << index))
          input[field] = (11 + index).toString(16).padStart(2, '0').repeat(32);
      });
      dd(`optional-flags/${encrypted}/${mask}`, 'optional-flags', input);
    }
    dd(`all-metadata-and-keys/${encrypted}`, 'optional-metadata', {
      version: 1,
      flags: encrypted,
      label: 'all fields',
      mimetype: 'text/plain',
      objectdata: { message: 'readable payload' },
      salt: '01'.repeat(32),
      epk: '02'.repeat(32),
      ivk: '03'.repeat(32),
      ssk: '04'.repeat(32),
    });
  }
  for (const field of optional) {
    for (const length of [0, 1, 31, 32, 33]) {
      dd(
        `key-length/${field}/${length}`,
        'key-length',
        {
          version: 1,
          objectdata: '010203',
          [field]: 'a5'.repeat(length),
        },
        field !== 'salt' && length !== 0 && length !== 32
          ? { inputError: '32 bytes' }
          : {}
      );
    }
    for (const [name, value] of [
      ['odd', 'abc'],
      ['nonhex', 'zz'],
      ['partial', 'aabbzz'],
    ]) {
      dd(
        `key-encoding/${field}/${name}`,
        'key-encoding',
        {
          version: 1,
          [field]: value,
        },
        { inputError: 'hexadecimal' }
      );
    }
  }

  for (const [name, value] of [
    ['missing', {}],
    ['null', null],
  ]) {
    dd(`defaults/data/${name}`, 'defaults', value);
    mmr(`defaults/mmr/${name}`, 'defaults', value);
  }
  dd('defaults/data/null-fields', 'defaults', {
    version: null,
    flags: null,
    objectdata: null,
    label: null,
    mimetype: null,
    salt: null,
    epk: null,
    ivk: null,
    ssk: null,
    vdxfkey: null,
  });
  dd('defaults/data/empty-fields', 'defaults', {
    version: 1,
    flags: 0,
    objectdata: '',
    label: '',
    mimetype: '',
    salt: '',
    epk: '',
    ivk: '',
    ssk: '',
    vdxfkey: '',
  });
  dd('defaults/data/empty-array', 'defaults', {
    version: 1,
    objectdata: [],
  });
  dd('defaults/data/empty-object', 'defaults', {
    version: 1,
    objectdata: {},
  });
  mmr('defaults/mmr/null-fields', 'defaults', {
    version: null,
    objecthashtype: null,
    mmrhashtype: null,
    mmrroot: null,
    mmrhashes: null,
    datadescriptors: null,
  });
  mmr('defaults/mmr/empty-nested', 'defaults', {
    version: 1,
    objecthashtype: 5,
    mmrhashtype: 1,
    mmrroot: {},
    mmrhashes: {},
    datadescriptors: [null, {}, { version: 1 }],
  });
  dd(
    'json-loss/vdxfkey',
    'json-loss',
    {
      version: 1,
      vdxfkey: descriptorKey,
      objectdata: '010203',
    },
    { inputError: 'drops vdxfkey' }
  );
  dd('json-loss/zero-vdxfkey', 'json-loss', {
    version: 1,
    vdxfkey: 'R9HC5WtHbpoa51NCUAz86XLCmGTbkf45NT',
  });
  for (const [name, value] of [
    ['nonhex', 'hello'],
    ['odd-hex', 'abc'],
    ['partial-hex', 'aabbzz'],
  ]) {
    dd(
      `json-loss/objectdata/${name}`,
      'json-loss',
      {
        version: 1,
        objectdata: value,
      },
      { inputError: 'Nonhex objectdata' }
    );
  }

  // JSON integers are narrowed by C++; the lossless API rejects out-of-domain
  // values before BN conversion or flag normalization can erase the evidence.
  for (const field of ['version', 'flags']) {
    for (const value of [
      0, 1, 127, 128, 16511, 16512, 0xffffffff, 0x100000000, -1, 1.5,
    ]) {
      dd(
        `integer/data/${field}/${value}`,
        'integer-widths',
        {
          version: 1,
          [field]: value,
        },
        value < 0 || !Number.isInteger(value) || value > 0xffffffff
          ? { inputError: '32-bit' }
          : {}
      );
    }
  }
  for (const field of ['version', 'objecthashtype', 'mmrhashtype']) {
    const max = field === 'version' ? 0xffffffff : 0x7fffffff;
    for (const value of [0, 1, 127, 128, 16511, 16512, max, max + 1, -1, 1.5]) {
      mmr(
        `integer/mmr/${field}/${value}`,
        'integer-widths',
        {
          version: 1,
          objecthashtype: 5,
          mmrhashtype: 1,
          [field]: value,
        },
        value < 0 || !Number.isInteger(value) || value > max
          ? { inputError: field === 'version' ? '32-bit' : '31-bit' }
          : {
              daemonEnumReset:
                field !== 'version' &&
                value !== (field === 'objecthashtype' ? 5 : 1),
            }
      );
    }
  }

  for (const [field, limit] of [
    ['label', 64],
    ['mimetype', 128],
  ]) {
    for (const length of [limit - 1, limit, limit + 1]) {
      for (const kind of ['ascii', 'multibyte', 'emoji']) {
        const unit = kind === 'ascii' ? 'a' : kind === 'multibyte' ? 'é' : '🚀';
        const unitBytes = Buffer.byteLength(unit);
        const value =
          unit.repeat(Math.floor(length / unitBytes)) +
          'a'.repeat(length % unitBytes);
        dd(
          `metadata/${field}/${kind}/${length}`,
          'metadata-lengths',
          {
            version: 1,
            [field]: value,
            objectdata: '010203',
          },
          length > limit ? { inputError: 'too long' } : {}
        );
      }
    }
    // These overflows truncate in the middle of a UTF-8 sequence in the daemon.
    dd(
      `metadata/${field}/split-codepoint`,
      'metadata-lengths',
      {
        version: 1,
        [field]: 'a'.repeat(limit - 1) + 'é',
        objectdata: '010203',
      },
      { inputError: 'too long' }
    );
    for (const [name, value] of [
      ['leading', ' leading'],
      ['trailing', 'trailing '],
      ['double-space', 'a  b'],
      ['known-bug', '  abc  def  '],
      ['tab', 'a\tb'],
      ['newline', 'a\nb'],
      ['nul', 'a\0b'],
      ['unicode-space-pair', 'a\u2000\u2001b'],
      ['unicode-leading', '\u00a0a'],
      ['unicode-trailing', 'a\u3000'],
      ['single-unicode-space', 'a\u2000b'],
      ['single-ascii-space', 'a b'],
    ]) {
      dd(
        `metadata/${field}/${name}`,
        'metadata-normalization',
        {
          version: 1,
          [field]: value,
          objectdata: '010203',
        },
        name.startsWith('single-') ? {} : { inputError: 'normalization' }
      );
    }
    for (const [name, value] of [
      ['high-surrogate', '\ud800'],
      ['low-surrogate', '\udfff'],
    ]) {
      dd(
        `metadata/${field}/${name}`,
        'metadata-unicode',
        { version: 1, [field]: value },
        { inputError: 'surrogate' }
      );
    }

    // Enumerate TrimSpaces' complete finite character set so that the lossless
    // validator cannot accidentally admit one of the daemon's Unicode spaces.
    const spaces = [
      0x20, 0xa0, 0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005,
      0x2006, 0x2007, 0x2008, 0x2009, 0x200a, 0x200c, 0x200d, 0x202f, 0x205f,
      0x3000,
    ];
    for (const codePoint of spaces) {
      const character = String.fromCodePoint(codePoint);
      for (const [position, value] of [
        ['leading', character + 'a'],
        ['trailing', 'a' + character],
        ['single', 'a' + character + 'b'],
        ['doubled', 'a' + character + character + 'b'],
      ]) {
        dd(
          `normalization/${field}/${codePoint.toString(16)}/${position}`,
          'normalization-alphabet',
          { version: 1, [field]: value, objectdata: '010203' },
          position === 'single' ? {} : { inputError: 'normalization' }
        );
      }
    }
    for (const codePoint of [0, 8, 9, 10, 11, 12, 13, 27]) {
      dd(
        `normalization/${field}/control-${codePoint.toString(16)}`,
        'normalization-alphabet',
        {
          version: 1,
          [field]: 'a' + String.fromCodePoint(codePoint) + 'b',
          objectdata: '010203',
        },
        { inputError: 'normalization' }
      );
    }
  }

  const url = 'https://verus.io';
  const urlRef = {
    type: 2,
    version: 1,
    flags: 1,
    datahash: '00'.repeat(32),
    url,
  };
  for (const [name, objectdata] of [
    ['null', null],
    ['empty-hex', ''],
    ['empty-message', { message: '' }],
    ['ascii', { message: 'abc' }],
    ['unicode', { message: 'café ☕' }],
    ['embedded-nul', { message: 'a\0b' }],
    ['invalid-utf8', 'fffe'],
    ['overlong-utf8', 'c0af'],
    ['truncated-utf8', 'e282'],
    ['tagged-string', { [p.DataStringKey.vdxfid]: 'hello' }],
    ['url-v1', { [p.CrossChainDataRefKey.vdxfid]: urlRef }],
  ]) {
    dd(`text/${name}`, 'text-fallback', {
      version: 1,
      mimetype: 'text/plain',
      objectdata,
    });
  }
  for (const [name, reference] of [
    [
      'evidence',
      {
        type: 0,
        version: 1,
        flags: 1,
        output: { txid: '12'.repeat(32), voutnum: 2 },
        objectnum: 3,
        subobject: 4,
        systemid: '',
      },
    ],
    [
      'identity',
      {
        type: 1,
        version: 1,
        flags: 0,
        identityid: 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq',
        vdxfkey: descriptorKey,
        startheight: 127,
        endheight: 128,
      },
    ],
  ]) {
    for (let mask = 0; mask < 4; mask++) {
      const optionalFields = {};
      if (mask & 1) {
        optionalFields.datahash = Buffer.from(
          Array.from({ length: 32 }, (_, index) => index + 1)
        ).toString('hex');
      }
      if (mask & 2) {
        optionalFields.systemid = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
      }
      dd(`text/reference/${name}/${mask}`, 'text-references', {
        version: 1,
        mimetype: 'text/plain',
        objectdata: {
          [p.CrossChainDataRefKey.vdxfid]: { ...reference, ...optionalFields },
        },
      });
    }
    dd(
      `text/reference/${name}/zero-data-hash`,
      'text-references',
      {
        version: 1,
        mimetype: 'text/plain',
        objectdata: {
          [p.CrossChainDataRefKey.vdxfid]: {
            ...reference,
            datahash: '00'.repeat(32),
          },
        },
      },
      name === 'identity' ? { inputError: 'zero data hash' } : {}
    );
    dd(
      `text/reference/${name}/zero-system-id`,
      'text-references',
      {
        version: 1,
        mimetype: 'text/plain',
        objectdata: {
          [p.CrossChainDataRefKey.vdxfid]: {
            ...reference,
            systemid: 'R9HC5WtHbpoa51NCUAz86XLCmGTbkf45NT',
          },
        },
      },
      { inputError: 'null system ID' }
    );
  }
  for (const mime of ['application/octet-stream', 'Text/plain', 'text/plain']) {
    dd(`payload/mime/${mime}`, 'text-fallback', {
      version: 1,
      mimetype: mime,
      objectdata: '616263',
    });
  }
  dd(
    'json-loss/tagged-byte-vector',
    'json-loss',
    {
      version: 1,
      objectdata: { [p.DataByteVectorKey.vdxfid]: '010203' },
    },
    { decodedError: 'byte-vector wrapper' }
  );
  dd(
    'json-loss/text-tagged-byte-vector',
    'json-loss',
    {
      version: 1,
      mimetype: 'text/plain',
      objectdata: { [p.DataByteVectorKey.vdxfid]: '010203' },
    },
    { decodedError: 'byte-vector wrapper' }
  );
  for (const [name, reference] of [
    ['v2-no-hash', { ...urlRef, version: 2, flags: 0 }],
    ['v2-hash', { ...urlRef, version: 2, datahash: '12'.repeat(32) }],
    ['v1-nonzero-hash', { ...urlRef, datahash: '12'.repeat(32) }],
  ]) {
    dd(
      `json-loss/url/${name}`,
      'json-loss',
      {
        version: 1,
        mimetype: 'text/plain',
        objectdata: { [p.CrossChainDataRefKey.vdxfid]: reference },
      },
      { inputError: 'URL reference' }
    );
  }

  // Native values unavailable through the JSON constructor are submitted as
  // tagged serializedhex. The daemon commits the exact input and independently
  // decides whether to decode it or return the complete raw hex fallback.
  binary(
    'binary/native-default-data',
    'binary-defaults',
    descriptorKey,
    Buffer.from('010000', 'hex')
  );
  binary(
    'binary/native-default-mmr',
    'binary-defaults',
    mmrKey,
    Buffer.from('01050101000001000000', 'hex')
  );
  for (const hasHash of [false, true]) {
    const reference = tagged(
      p.CrossChainDataRefKey.vdxfid,
      Buffer.concat([
        Buffer.from([2, 2, hasHash ? 1 : 0]),
        ...(hasHash ? [Buffer.alloc(32, 0x12)] : []),
        text(url),
      ])
    );
    binary(
      `binary/url-v2/${hasHash ? 'hash' : 'no-hash'}`,
      'binary-json-loss',
      descriptorKey,
      Buffer.concat([
        Buffer.from([1, 64]),
        vector(reference),
        text('text/plain'),
      ]),
      { decodedError: 'URL reference' }
    );
  }
  for (const [field, bit, limit] of [
    ['label', 32, 64],
    ['mimetype', 64, 128],
  ]) {
    for (const [name, bytes] of [
      ['at-limit', Buffer.alloc(limit, 97)],
      ['over-limit', Buffer.alloc(limit + 1, 97)],
      ['invalid-utf8', Buffer.from('ff', 'hex')],
      ['overlong-utf8', Buffer.from('c0af', 'hex')],
      ['surrogate-utf8', Buffer.from('eda080', 'hex')],
      ['truncated-utf8', Buffer.from('e282', 'hex')],
    ]) {
      binary(
        `binary/metadata/${field}/${name}`,
        'binary-metadata',
        descriptorKey,
        Buffer.concat([Buffer.from([1, bit, 0]), vector(bytes)]),
        name === 'at-limit'
          ? {}
          : {
              binaryError:
                name === 'over-limit'
                  ? 'too long|maximum|limit'
                  : 'invalid UTF-8',
            }
      );
    }
  }
  for (const field of ['epk', 'ivk', 'ssk']) {
    for (const length of [1, 31, 33]) {
      const bit = { epk: 4, ivk: 8, ssk: 16 }[field];
      binary(
        `binary/key/${field}/${length}`,
        'binary-key-vectors',
        descriptorKey,
        Buffer.concat([
          Buffer.from([1, bit, 0]),
          vector(Buffer.alloc(length, 0xa5)),
        ]),
        { decodedError: '32 bytes' }
      );
    }
  }
  binary(
    'binary/vdxfkey',
    'binary-json-loss',
    descriptorKey,
    Buffer.concat([
      Buffer.from([1, 0x80, 0]),
      bs58check.decode(descriptorKey).subarray(1),
      Buffer.from([0]),
    ]),
    { decodedError: 'drops vdxfkey' }
  );
  binary(
    'binary/all-fields',
    'binary-json-loss',
    descriptorKey,
    Buffer.concat([
      varInt(1),
      varInt(255),
      bs58check.decode(descriptorKey).subarray(1),
      text('readable payload'),
      text('all fields'),
      text('text/plain'),
      ...[1, 2, 3, 4].map((byte) => vector(Buffer.alloc(32, byte))),
    ]),
    { decodedError: 'drops vdxfkey' }
  );
  // Version and flags VARINTs are bounded before optional vectors are read.
  for (const field of ['version', 'flags']) {
    const payload = Buffer.concat([
      ...(field === 'flags' ? [Buffer.from([1])] : []),
      varInt(0x100000000),
      Buffer.from([0, 0]),
    ]);
    binary(
      `binary/overflow/${field}`,
      'binary-integers',
      descriptorKey,
      payload,
      { binaryError: '32-bit' }
    );
  }
  for (const field of ['objecthashtype', 'mmrhashtype']) {
    binary(
      `binary/overflow/${field}`,
      'binary-integers',
      mmrKey,
      Buffer.concat([
        Buffer.from(field === 'objecthashtype' ? [1] : [1, 5]),
        varInt(0x80000000),
        Buffer.alloc(8),
      ]),
      { binaryError: '31-bit' }
    );
  }
  const invalidString = tagged(
    p.DataStringKey.vdxfid,
    vector(Buffer.from([255]))
  );
  binary(
    'binary/text/tagged-invalid-string',
    'binary-text',
    descriptorKey,
    Buffer.concat([
      Buffer.from([1, 64]),
      vector(invalidString),
      text('text/plain'),
    ]),
    { decodedError: 'Unicode|round-trip|string|surrogate' }
  );

  return cases;
}

async function captureDescriptorBoundaries(primitives, rpc) {
  const records = [];
  for (const item of descriptorBoundaryCases(primitives)) {
    const expectedError =
      item.category === 'metadata-unicode' ? -32700 : undefined;
    const leaf =
      item.inputKind === 'json'
        ? { vdxfdata: item.vdxfdata }
        : { serializedhex: item.serializedHex };
    const request = {
      createmmr: true,
      mmrdata: [leaf],
      mmrsalt: ['00'.repeat(32)],
    };
    try {
      const result = await rpc('signdata', [request]);
      if (expectedError !== undefined) {
        throw new Error(
          'Daemon unexpectedly accepted an unpaired UTF-16 surrogate'
        );
      }
      assert(result.mmrdescriptor?.datadescriptors?.length === 1);
      records.push({
        ...item,
        serializationCommitment: result.mmrdescriptor.mmrroot.objectdata,
        daemonOutput: result.mmrdescriptor.datadescriptors[0].objectdata,
      });
    } catch (error) {
      const match = error.message.match(/signdata: (\{.*\})$/);
      if (!match) throw new Error(`${item.name}: ${error.message}`);
      const daemonError = JSON.parse(match[1]);
      if (daemonError.code !== expectedError) {
        throw new Error(`${item.name}: Unexpected RPC error ${error.message}`);
      }
      records.push({ ...item, daemonError });
    }
  }
  return records;
}

module.exports = { descriptorBoundaryCases, captureDescriptorBoundaries };
