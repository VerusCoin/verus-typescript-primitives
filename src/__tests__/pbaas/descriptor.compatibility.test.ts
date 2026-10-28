import { BN } from 'bn.js';
import { DataDescriptor, VDXFDataDescriptor } from '../../pbaas/DataDescriptor';
import { MMRDescriptor } from '../../pbaas/MMRDescriptor';
import { CrossChainDataRef } from '../../pbaas/CrossChainDataRef';
import { URLRef } from '../../pbaas/URLRef';
import { VdxfUniValue } from '../../pbaas/VdxfUniValue';
import {
  CrossChainDataRefKey,
  DataDescriptorKey,
  DataStringKey,
} from '../../vdxf/vdxfdatakeys';
import varint from '../../utils/varint';
import { BufferDataVdxfObject } from '../../vdxf';

const encodedInteger = (value: number) =>
  varint.encode(new BN(value), undefined, 0).buffer;

describe('native and daemon descriptor defaults', () => {
  test.each([DataStringKey.vdxfid, DataDescriptorKey.vdxfid])(
    'bounds embedded wrapper versions and retains unrecognized bytes: %s',
    (key) => {
      const valid = new BufferDataVdxfObject('010000', key).toBuffer();
      const oversizedVersion = Buffer.concat([
        valid.subarray(0, 20),
        Buffer.alloc(1024, 0x80),
        Buffer.from([0]),
        valid.subarray(21),
      ]);
      const value = new DataDescriptor({ objectdata: oversizedVersion });

      // The uint32 wrapper read fails and the generic VDXF reader preserves the
      // complete raw object. It must not accept and normalize the huge version.
      expect(value.toDaemonJson().objectdata).toBe(
        oversizedVersion.toString('hex')
      );
      expect(
        DataDescriptor.fromDaemonJson(value.toDaemonJson()).objectdata
      ).toEqual(oversizedVersion);
    }
  );

  // Literal vectors from CDataDescriptor/CMMRDescriptor constructors and their
  // SerializationOp implementations, independent of these TypeScript writers.
  test.each([
    [() => new DataDescriptor(), '010000'],
    [() => DataDescriptor.fromJson({}), '000000'],
    [() => DataDescriptor.fromDaemonJson({}), '000000'],
    [() => new MMRDescriptor(), '01050101000001000000'],
    [() => MMRDescriptor.fromJson({}), '00000000000000000000'],
    [() => MMRDescriptor.fromDaemonJson({}), '00000000000000000000'],
  ])('serializes constructor defaults to the required bytes', (create, hex) => {
    const descriptor = create();
    expect(descriptor.toBuffer().toString('hex')).toBe(hex);
    expect(descriptor.getByteLength()).toBe(hex.length / 2);
    const restored =
      descriptor instanceof MMRDescriptor
        ? new MMRDescriptor()
        : new DataDescriptor();
    expect(restored.fromBuffer(Buffer.from(hex, 'hex'))).toBe(hex.length / 2);
    expect(restored.toBuffer()).toEqual(descriptor.toBuffer());
  });

  test('preserves explicit zero and treats daemon null like missing fields', () => {
    expect(
      DataDescriptor.fromDaemonJson({ version: 0 }).version.toNumber()
    ).toBe(0);
    expect(DataDescriptor.fromDaemonJson(null).version.toNumber()).toBe(0);
    expect(
      MMRDescriptor.fromDaemonJson({ version: null, mmrroot: null }).toBuffer()
    ).toEqual(MMRDescriptor.fromDaemonJson({}).toBuffer());
    expect(
      new MMRDescriptor({ objectHashType: 0, mmrHashType: 0 }).toJson()
    ).toMatchObject({ objecthashtype: 0, mmrhashtype: 0 });
  });

  test.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    'hasData checks hash bytes=%s and descriptors=%s',
    (hashes, descriptors) => {
      const value = new MMRDescriptor({
        mmrHashes: new DataDescriptor({
          objectdata: Buffer.alloc(hashes ? 1 : 0),
        }),
        dataDescriptors: descriptors ? [new DataDescriptor()] : [],
      });
      expect(value.hasData()).toBe(hashes && descriptors);
    }
  );

  test('validity only checks version, not hash algorithm support', () => {
    const value = new MMRDescriptor({ objectHashType: 100, mmrHashType: 101 });
    expect(value.isValid()).toBe(true);
    value.version = new BN(0);
    expect(value.isValid()).toBe(false);
  });
});

describe('descriptor field widths and presence flags', () => {
  test('empty optional vectors have the same bytes as absent fields', () => {
    const value = new DataDescriptor({
      flags: new BN(255),
      salt: Buffer.alloc(0),
      epk: Buffer.alloc(0),
      ivk: Buffer.alloc(0),
      ssk: Buffer.alloc(0),
    });
    expect(value.toBuffer().toString('hex')).toBe('010100');
    expect(value.toDaemonJson()).toEqual({
      version: 1,
      flags: 1,
      objectdata: null,
    });
  });

  test('a zero uint160 key is absent regardless of its address prefix', () => {
    const zeroKey = 'R9HC5WtHbpoa51NCUAz86XLCmGTbkf45NT';
    const native = new DataDescriptor({ vdxfKey: zeroKey });
    const json = DataDescriptor.fromJson({ version: 1, vdxfkey: zeroKey });
    const daemon = DataDescriptor.fromDaemonJson({
      version: 1,
      vdxfkey: zeroKey,
    });

    for (const descriptor of [native, json, daemon]) {
      expect(descriptor.toBuffer().toString('hex')).toBe('010000');
      expect(descriptor.toJson()).not.toHaveProperty('vdxfkey');
      expect(descriptor.toDaemonJson()).toEqual({
        version: 1,
        flags: 0,
        objectdata: null,
      });
    }

    const edited = new DataDescriptor({ vdxfKey: DataDescriptorKey.vdxfid });
    edited.vdxfKey = zeroKey;
    expect(edited.toBuffer()).toEqual(native.toBuffer());
  });

  test('serializes nonempty optional vectors in daemon order', () => {
    const value = new DataDescriptor({
      flags: new BN(1),
      salt: Buffer.from('aa', 'hex'),
      epk: Buffer.from('bb', 'hex'),
      ivk: Buffer.from('cc', 'hex'),
      ssk: Buffer.from('dd', 'hex'),
    });
    expect(value.toBuffer().toString('hex')).toBe('011f0001aa01bb01cc01dd');
    expect(value.getByteLength()).toBe(value.toBuffer().length);
  });

  test.each([0, 127, 128, 16511, 16512, 0xffffffff])(
    'preserves uint32 version %i',
    (version) => {
      const value = new DataDescriptor({ version: new BN(version) });
      const wire = Buffer.concat([
        encodedInteger(version),
        Buffer.from('0000', 'hex'),
      ]);
      expect(value.toBuffer()).toEqual(wire);
      const restored = new DataDescriptor();
      restored.fromBuffer(wire);
      expect(restored.version.toNumber()).toBe(version);
    }
  );

  test('accepts uint32 flags before deriving presence bits', () => {
    const wire = Buffer.concat([
      encodedInteger(1),
      encodedInteger(0xffffffff),
      Buffer.alloc(20),
      Buffer.alloc(7),
    ]);
    const parsed = new DataDescriptor();
    parsed.fromBuffer(wire);
    expect(parsed.flags.toNumber()).toBe(0xffffffff);
    expect(parsed.isValid()).toBe(false);
    expect(
      new DataDescriptor({ flags: new BN(0xffffffff) }).flags.toNumber()
    ).toBe(1);
  });

  test.each([-1, 1.5, 0x100000000, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid original uint32 numeric input %s',
    (value) => {
      for (const field of ['version', 'flags']) {
        expect(() => DataDescriptor.fromJson({ [field]: value })).toThrow(
          /32-bit/
        );
        expect(() => DataDescriptor.fromDaemonJson({ [field]: value })).toThrow(
          /32-bit/
        );
        expect(() => new DataDescriptor({ [field]: value } as any)).toThrow(
          /32-bit/
        );
        const mutated = new DataDescriptor();
        (mutated as any)[field] = value;
        expect(() => mutated.toBuffer()).toThrow(/32-bit/);
      }
    }
  );

  test.each(['version', 'flags'])(
    'bounds binary %s before reading later fields',
    (field) => {
      const overflow = encodedInteger(0x100000000);
      const wire =
        field === 'version'
          ? overflow
          : Buffer.concat([Buffer.from([1]), overflow]);
      expect(() => new DataDescriptor().fromBuffer(wire)).toThrow(/32-bit/);
    }
  );

  test('preserves representable unknown MMR hash tags', () => {
    const value = new MMRDescriptor({
      version: new BN(0xffffffff),
      objectHashType: 0x7fffffff,
      mmrHashType: 123,
    });
    const parsed = new MMRDescriptor();
    const wire = value.toBuffer();
    expect(parsed.fromBuffer(wire)).toBe(wire.length);
    expect(parsed.objectHashType).toBe(0x7fffffff);
    expect(parsed.mmrHashType).toBe(123);
    expect(parsed.toBuffer()).toEqual(wire);
  });

  test.each([-1, 1.5, 0x80000000])(
    'rejects unsupported MMR enum number %s',
    (value) => {
      expect(() => new MMRDescriptor({ objectHashType: value })).toThrow(
        /31-bit/
      );
      expect(() =>
        MMRDescriptor.fromDaemonJson({ mmrhashtype: value })
      ).toThrow(/31-bit/);
      expect(() => MMRDescriptor.fromJson({ objecthashtype: value })).toThrow(
        /31-bit/
      );
      const descriptor = new MMRDescriptor();
      descriptor.mmrHashType = value;
      expect(() => descriptor.toBuffer()).toThrow(/31-bit/);
    }
  );

  test('rejects oversized and truncated MMR wire integers', () => {
    expect(() =>
      new MMRDescriptor().fromBuffer(
        Buffer.concat([Buffer.from([1]), encodedInteger(0x80000000)])
      )
    ).toThrow(/31-bit/);
    expect(() =>
      new DataDescriptor().fromBuffer(Buffer.from('80', 'hex'))
    ).toThrow();
    expect(() =>
      new MMRDescriptor().fromBuffer(Buffer.from('010580', 'hex'))
    ).toThrow();
  });
});

describe('descriptor text and canonical daemon JSON', () => {
  test.each(['c0af', 'eda080', 'ff', 'e282'])(
    'rejects malformed UTF-8 %s in binary metadata',
    (hex) => {
      const bytes = Buffer.from(hex, 'hex');
      for (const flags of [0x20, 0x40]) {
        expect(() =>
          new DataDescriptor().fromBuffer(
            Buffer.concat([Buffer.from([1, flags, 0, bytes.length]), bytes])
          )
        ).toThrow(/invalid UTF-8/);
      }
    }
  );

  test.each(['\ud800', '\udfff', 'a\ud800b'])(
    'rejects unpaired surrogates before encoding',
    (text) => {
      const value = new DataDescriptor({ label: text });
      expect(value.label).toBe(text);
      expect(value.isValid()).toBe(false);
      expect(() => value.toBuffer()).toThrow(/surrogates/);
      expect(() => value.toDaemonJson()).toThrow(/surrogates/);
      expect(() => DataDescriptor.fromDaemonJson({ label: text })).toThrow(
        /surrogates/
      );
    }
  );

  test.each([
    '  abc  def  ',
    ' leading',
    'trailing ',
    'two  spaces',
    'a\tb',
    'a\nb',
    'a\0b',
    'a\u2000\u2001b',
  ])('rejects metadata changed by daemon normalization: %j', (label) => {
    const value = new DataDescriptor({ label });
    expect(value.label).toBe(label);
    expect(() => value.toJson()).toThrow(/normalization/);
    expect(() => DataDescriptor.fromJson({ label })).toThrow(/normalization/);
    expect(() => value.toDaemonJson()).toThrow(/normalization/);
    expect(() => DataDescriptor.fromDaemonJson({ label })).toThrow(
      /normalization/
    );
  });

  test.each(['é'.repeat(32), 'plain label', 'a\u2000b', '🔑'])(
    'preserves supported metadata %j',
    (label) => {
      const value = DataDescriptor.fromDaemonJson({ version: 1, label });
      expect(value.toDaemonJson().label).toBe(label);
      expect(
        DataDescriptor.fromDaemonJson(value.toDaemonJson()).toBuffer()
      ).toEqual(value.toBuffer());
    }
  );

  test.each(['a'.repeat(65), 'é'.repeat(33)])(
    'rejects oversize daemon metadata without truncating it',
    (label) => {
      const value = new DataDescriptor({ label });
      expect(value.label).toBe(label);
      expect(() => value.toDaemonJson()).toThrow(/too long/);
      expect(() => DataDescriptor.fromDaemonJson({ label })).toThrow(
        /too long/
      );
    }
  );

  test.each(['epk', 'ivk', 'ssk'] as const)(
    'restricts %s length only at the daemon JSON boundary',
    (field) => {
      const binary = new DataDescriptor({ [field]: Buffer.from([1]) });
      expect(() => binary.toBuffer()).not.toThrow();
      expect(() => binary.toJson()).toThrow(/32 bytes/);
      expect(() => DataDescriptor.fromJson({ [field]: '01' })).toThrow(
        /32 bytes/
      );
      expect(() => binary.toDaemonJson()).toThrow(/32 bytes/);
      expect(() => DataDescriptor.fromDaemonJson({ [field]: '01' })).toThrow(
        /32 bytes/
      );
      const accepted = DataDescriptor.fromDaemonJson({
        version: 1,
        [field]: '01'.repeat(32),
      });
      expect(accepted.toDaemonJson()[field]).toBe('01'.repeat(32));
      expect(
        DataDescriptor.fromDaemonJson({ [field]: '' }).toDaemonJson()
      ).not.toHaveProperty(field);
    }
  );

  test('rejects vdxfkey loss in both daemon JSON directions', () => {
    const value = new DataDescriptor({ vdxfKey: DataDescriptorKey.vdxfid });
    const json = { version: 1, vdxfkey: DataDescriptorKey.vdxfid };
    expect(() => value.toJson()).toThrow(/drops vdxfkey/);
    expect(() => value.toDaemonJson()).toThrow(/drops vdxfkey/);
    expect(() => DataDescriptor.fromJson(json)).toThrow(/drops vdxfkey/);
    expect(() => DataDescriptor.fromDaemonJson(json)).toThrow(/drops vdxfkey/);

    const restored = new DataDescriptor();
    restored.fromBuffer(value.toBuffer());
    expect(restored.vdxfKey).toBe(value.vdxfKey);
    expect(restored.toBuffer()).toEqual(value.toBuffer());
  });

  test('requires explicit text input instead of a discarded nonhex string', () => {
    expect(() =>
      DataDescriptor.fromDaemonJson({ objectdata: 'hello' })
    ).toThrow(/message/);
    expect(
      DataDescriptor.fromDaemonJson({
        objectdata: { message: 'hello' },
      }).objectdata.toString()
    ).toBe('hello');
    expect(
      DataDescriptor.fromDaemonJson({
        objectdata: '616263',
      }).objectdata.toString()
    ).toBe('abc');
  });

  test.each([
    [Buffer.alloc(0), undefined, null],
    [Buffer.alloc(0), 'text/plain', { message: '' }],
    [Buffer.from('héllo'), 'text/plain', { message: 'héllo' }],
    [Buffer.from('fffe', 'hex'), 'text/plain', 'fffe'],
  ])(
    'converts payload %j with MIME %s without data loss',
    (objectdata, mimeType, expected) => {
      const value = new DataDescriptor({ objectdata, mimeType });
      const json = value.toDaemonJson();
      expect(json.objectdata).toEqual(expected);
      expect(DataDescriptor.fromDaemonJson(json).toBuffer()).toEqual(
        value.toBuffer()
      );
    }
  );

  test('uses structured tagged fallback when text payload bytes are not UTF-8', () => {
    const objectdata = VdxfUniValue.fromJson({
      [DataStringKey.vdxfid]: 'hello',
    }).toBuffer();
    const value = new DataDescriptor({ objectdata, mimeType: 'text/plain' });
    expect(value.toDaemonJson().objectdata).toEqual({
      [DataStringKey.vdxfid]: 'hello',
    });
    expect(
      DataDescriptor.fromDaemonJson(value.toDaemonJson()).toBuffer()
    ).toEqual(value.toBuffer());
  });

  test('rejects lossy tagged text in JSON and preserves its native bytes', () => {
    const malformedText = new BufferDataVdxfObject(
      '01ff',
      DataStringKey.vdxfid
    ).toBuffer();
    const value = new DataDescriptor({
      objectdata: malformedText,
      mimeType: 'text/plain',
    });
    expect(() => value.toJson()).toThrow();
    expect(() => value.toDaemonJson()).toThrow();

    const restored = new DataDescriptor();
    restored.fromBuffer(value.toBuffer());
    expect(restored.objectdata).toEqual(malformedText);
    expect(restored.toBuffer()).toEqual(value.toBuffer());
  });

  test('length-delimited descriptor wrappers consume only their complete payload', () => {
    const wrapper = new VDXFDataDescriptor(
      new DataDescriptor(),
      DataDescriptorKey.vdxfid
    ).toBuffer();
    const framed = Buffer.concat([
      Buffer.from('aabb', 'hex'),
      wrapper,
      Buffer.from('cc', 'hex'),
    ]);
    expect(new VDXFDataDescriptor().fromBuffer(framed, 2)).toBe(
      2 + wrapper.length
    );

    const withTrailingPayload = new BufferDataVdxfObject(
      '010000ff',
      DataDescriptorKey.vdxfid
    );
    expect(() =>
      VDXFDataDescriptor.fromDataVdxfObject(withTrailingPayload)
    ).toThrow(/Trailing bytes/);
    expect(() =>
      new VDXFDataDescriptor().fromBuffer(withTrailingPayload.toBuffer())
    ).toThrow(/Trailing bytes/);
  });

  test('keeps cross-chain references structured under text MIME', () => {
    const reference = new CrossChainDataRef(
      new URLRef({ version: new BN(1), url: 'https://verus.io' })
    );
    const objectdata = new VdxfUniValue({
      values: [{ [CrossChainDataRefKey.vdxfid]: reference }],
    }).toBuffer();
    const value = new DataDescriptor({ objectdata, mimeType: 'text/plain' });
    expect(value.toDaemonJson().objectdata).toEqual({
      [CrossChainDataRefKey.vdxfid]: {
        version: 1,
        flags: 1,
        datahash: '00'.repeat(32),
        type: 2,
        url: 'https://verus.io',
      },
    });
    expect(
      DataDescriptor.fromDaemonJson(value.toDaemonJson()).toBuffer()
    ).toEqual(value.toBuffer());
  });
});
