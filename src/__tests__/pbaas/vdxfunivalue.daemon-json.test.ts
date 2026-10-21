import { BN } from 'bn.js';
import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { MMRDescriptor } from '../../pbaas/MMRDescriptor';
import { CrossChainDataRef } from '../../pbaas/CrossChainDataRef';
import { URLRef } from '../../pbaas/URLRef';
import { FqnVdxfUniValue, VdxfUniValue } from '../../pbaas/VdxfUniValue';
import { fromBase58Check } from '../../utils/address';
import {
  DataByteKey,
  CrossChainDataRefKey,
  DataByteVectorKey,
  DataDescriptorKey,
  DataStringKey,
  DataUint256Key,
  MMRDescriptorKey,
} from '../../vdxf/vdxfdatakeys';

describe('Lossless VDXF daemon JSON conversion', () => {
  test.each([VdxfUniValue, FqnVdxfUniValue])(
    'uses one JSON contract for %p',
    (type) => {
      const input = { [DataByteKey.vdxfid]: 255 };
      const ordinary = type.fromJson(input);
      const explicit = type.fromDaemonJson(input);
      expect(explicit.toBuffer()).toEqual(ordinary.toBuffer());
      expect(ordinary.toJson()).toEqual(input);
      expect(ordinary.toDaemonJson()).toEqual(input);
      expect(() => type.fromJson('plain text')).toThrow('hex');
      expect(() => type.fromDaemonJson('plain text')).toThrow('hex');
    }
  );

  test('emits canonical daemon JSON for a version-1 URL reference', () => {
    const json = {
      [CrossChainDataRefKey.vdxfid]: {
        version: 1,
        flags: 1,
        datahash: '00'.repeat(32),
        type: 2,
        url: 'https://verus.io',
      },
    };
    const parsed = VdxfUniValue.fromDaemonJson(json);

    expect(parsed.toDaemonJson()).toEqual(json);
    const decoded = new VdxfUniValue();
    decoded.fromBuffer(parsed.toBuffer());
    expect(decoded.toDaemonJson()).toEqual(json);
    expect(
      VdxfUniValue.fromDaemonJson(decoded.toDaemonJson()).toBuffer()
    ).toEqual(parsed.toBuffer());
  });

  test.each([1.5, 0, undefined])(
    'rejects unsupported URL reference version %j before narrowing',
    (version) => {
      expect(() =>
        VdxfUniValue.fromDaemonJson({
          [CrossChainDataRefKey.vdxfid]: {
            type: 2,
            version,
            url: 'https://verus.io',
          },
        })
      ).toThrow('only version 1');
    }
  );

  test.each([false, true])(
    'rejects lossy version-2 URL reference JSON (hashed=%s)',
    (hashed) => {
      const reference = new CrossChainDataRef(
        new URLRef({
          version: new BN(2),
          url: 'https://verus.io',
          flags: new BN(hashed ? 1 : 0),
          dataHash: hashed ? Buffer.alloc(32, 0x11) : undefined,
        })
      );
      const local = new VdxfUniValue({
        values: [{ [CrossChainDataRefKey.vdxfid]: reference }],
      });
      const bytes = local.toBuffer();

      expect(() => local.toDaemonJson()).toThrow('only version 1');
      expect(() => VdxfUniValue.fromDaemonJson(local.toJson())).toThrow(
        'only version 1'
      );
      expect(() => local.toJson()).toThrow('only version 1');
      const decoded = new VdxfUniValue();
      decoded.fromBuffer(bytes);
      expect(decoded.toBuffer()).toEqual(bytes);

      for (const mimeType of [undefined, 'text/plain']) {
        const descriptor = new DataDescriptor({ objectdata: bytes, mimeType });
        expect(() => descriptor.toDaemonJson()).toThrow('only version 1');
        expect(() =>
          DataDescriptor.fromDaemonJson(descriptor.toJson())
        ).toThrow('only version 1');
        expect(() => descriptor.toJson()).toThrow('only version 1');
      }
    }
  );

  test('uses daemon zero defaults for nested descriptor containers', () => {
    const data = VdxfUniValue.fromDaemonJson({
      [DataDescriptorKey.vdxfid]: {},
    });
    const mmr = VdxfUniValue.fromDaemonJson({ [MMRDescriptorKey.vdxfid]: {} });

    // key_io.cpp wraps each descriptor with its version and CompactSize length.
    expect(data.toBuffer()).toEqual(
      Buffer.concat([
        fromBase58Check(DataDescriptorKey.vdxfid).hash,
        Buffer.from('0003000000', 'hex'),
      ])
    );
    expect(mmr.toBuffer()).toEqual(
      Buffer.concat([
        fromBase58Check(MMRDescriptorKey.vdxfid).hash,
        Buffer.from('000a00000000000000000000', 'hex'),
      ])
    );
    expect(
      (data.values[0][DataDescriptorKey.vdxfid] as DataDescriptor).version.eqn(
        0
      )
    ).toBe(true);

    const nested = mmr.values[0][MMRDescriptorKey.vdxfid] as MMRDescriptor;
    expect(nested.version.eqn(0)).toBe(true);
    expect(nested.mmrRoot.version.eqn(0)).toBe(true);
    expect(nested.mmrHashes.version.eqn(0)).toBe(true);
  });

  test('round-trips distinct nested descriptor data without changing committed bytes', () => {
    const input = {
      [MMRDescriptorKey.vdxfid]: {
        version: 1,
        objecthashtype: 5,
        mmrhashtype: 1,
        mmrroot: { version: 1, objectdata: '11'.repeat(32) },
        mmrhashes: { version: 1, objectdata: '22'.repeat(32) },
        datadescriptors: [
          { version: 1, mimetype: 'text/plain', objectdata: { message: 'é' } },
          { version: 1, objectdata: { [DataStringKey.vdxfid]: 'nested text' } },
          { version: 1, mimetype: 'text/plain', objectdata: { message: '' } },
        ],
      },
    };
    const parsed = VdxfUniValue.fromDaemonJson(input);
    const decoded = new VdxfUniValue();
    decoded.fromBuffer(parsed.toBuffer());
    const restored = VdxfUniValue.fromDaemonJson(decoded.toDaemonJson());

    expect(restored.toBuffer()).toEqual(parsed.toBuffer());
  });

  test('rejects vdxfkey loss recursively in both directions', () => {
    const nested = {
      version: 1,
      vdxfkey: DataStringKey.vdxfid,
      objectdata: '61',
    };
    const invalid = {
      [MMRDescriptorKey.vdxfid]: { version: 1, datadescriptors: [nested] },
    };

    expect(() => VdxfUniValue.fromDaemonJson(invalid)).toThrow('vdxfkey');

    expect(() => VdxfUniValue.fromJson(invalid)).toThrow('vdxfkey');

    const native = new DataDescriptor({
      vdxfKey: DataStringKey.vdxfid,
      objectdata: Buffer.from('61', 'hex'),
    });
    const internal = new VdxfUniValue({
      values: [{
        [MMRDescriptorKey.vdxfid]: new MMRDescriptor({ dataDescriptors: [native] }),
      }],
    });
    expect(internal.toBuffer().length).toBeGreaterThan(0);
    expect(() => internal.toJson()).toThrow('vdxfkey');

    const outer = new DataDescriptor({
      objectdata: new VdxfUniValue({
        values: [{ [DataDescriptorKey.vdxfid]: native }],
      }).toBuffer(),
    });
    expect(() => outer.toDaemonJson()).toThrow('vdxfkey');
  });

  test.each([{ message: '' }, { serializedhex: '' }])(
    'preserves explicit empty encoding %j',
    (json) => {
      for (const parsed of [
        VdxfUniValue.fromDaemonJson(json),
        VdxfUniValue.fromJson(json),
        FqnVdxfUniValue.fromJson(json),
      ]) {
        expect(parsed.toBuffer()).toEqual(Buffer.alloc(0));
      }
    }
  );

  test('rejects the daemon base64 decoding defect through every JSON entry point', () => {
    for (const value of ['', 'YQ==']) {
      for (const type of [VdxfUniValue, FqnVdxfUniValue]) {
        expect(() => type.fromJson({ serializedbase64: value })).toThrow(
          'use serializedhex'
        );
      }
      expect(() =>
        VdxfUniValue.fromDaemonJson({ serializedbase64: value })
      ).toThrow('use serializedhex');
    }
  });

  test.each(['0', '0x00', '00zz', ' 00'])(
    'rejects malformed explicit or bare hex %j',
    (value) => {
      expect(() => VdxfUniValue.fromDaemonJson(value)).toThrow('hex');
      expect(() =>
        VdxfUniValue.fromDaemonJson({ serializedhex: value })
      ).toThrow('hex');
      expect(() =>
        VdxfUniValue.fromDaemonJson({ [DataByteVectorKey.vdxfid]: value })
      ).toThrow('hex');
    }
  );

  test.each(['YQ', 'YQ=', 'YR==', 'YQ==\n', 'YQ==junk'])(
    'rejects noncanonical base64 %j',
    (value) => {
      expect(() =>
        VdxfUniValue.fromDaemonJson({ serializedbase64: value })
      ).toThrow('base64');
      expect(() => VdxfUniValue.fromJson({ serializedbase64: value })).toThrow(
        'base64'
      );
      expect(() =>
        FqnVdxfUniValue.fromJson({ serializedbase64: value })
      ).toThrow('base64');
    }
  );

  test.each(['\ud800', '\udfff', 'prefix\ud800suffix'])(
    'rejects unpaired Unicode surrogates %j',
    (value) => {
      expect(() => VdxfUniValue.fromDaemonJson({ message: value })).toThrow(
        'surrogate'
      );
      expect(() =>
        VdxfUniValue.fromDaemonJson({ [DataStringKey.vdxfid]: value })
      ).toThrow('surrogate');

      const native = new VdxfUniValue({
        values: [{ [DataStringKey.vdxfid]: value }],
      });
      expect(() => native.toDaemonJson()).toThrow('surrogate');
    }
  );

  test('does not select one of multiple explicit raw encodings', () => {
    expect(() =>
      VdxfUniValue.fromDaemonJson({ message: 'a', serializedhex: '62' })
    ).toThrow('exactly one');
    expect(() =>
      VdxfUniValue.fromDaemonJson({ message: 'a', label: 'ignored' })
    ).toThrow('exactly one');
  });

  test('rejects daemon output that would drop a tagged byte-vector wrapper', () => {
    const parsed = VdxfUniValue.fromDaemonJson({
      [DataByteVectorKey.vdxfid]: '00ff',
    });
    const bytes = parsed.toBuffer();

    expect(() => parsed.toDaemonJson()).toThrow(
      'drops the byte-vector wrapper'
    );
    expect(() => parsed.toJson()).toThrow('drops the byte-vector wrapper');
    const decoded = new VdxfUniValue();
    decoded.fromBuffer(bytes);
    expect(decoded.toBuffer()).toEqual(bytes);

    for (const mimeType of [undefined, 'text/plain']) {
      const descriptor = new DataDescriptor({ objectdata: bytes, mimeType });
      expect(() => descriptor.toDaemonJson()).toThrow(
        'drops the byte-vector wrapper'
      );
      expect(() => descriptor.toJson()).toThrow('drops the byte-vector wrapper');
      const restored = new DataDescriptor();
      restored.fromBuffer(descriptor.toBuffer());
      expect(restored.toBuffer()).toEqual(descriptor.toBuffer());
    }
  });

  test('uses the daemon numeric representation for a fixed byte', () => {
    const parsed = VdxfUniValue.fromDaemonJson({ [DataByteKey.vdxfid]: 255 });

    expect(parsed.toBuffer()).toEqual(Buffer.from([255]));
    expect(parsed.toDaemonJson()).toEqual({ [DataByteKey.vdxfid]: 255 });
    expect(() =>
      VdxfUniValue.fromDaemonJson({ [DataByteKey.vdxfid]: 'ff' })
    ).toThrow('number');
    for (const value of [-1, 256, 0.5]) {
      expect(() =>
        VdxfUniValue.fromDaemonJson({ [DataByteKey.vdxfid]: value })
      ).toThrow();
    }
  });

  test('distinguishes uint256 display strings from their raw fixed-width wire bytes', () => {
    const display =
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
    const wire =
      '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';
    const parsed = VdxfUniValue.fromDaemonJson({
      [DataUint256Key.vdxfid]: display,
    });

    expect(parsed.toBuffer().toString('hex')).toBe(wire);
    expect(parsed.toDaemonJson()).toEqual({ [DataUint256Key.vdxfid]: display });
    expect(parsed.toBuffer().toString('hex')).toBe(wire);
    expect(() =>
      VdxfUniValue.fromDaemonJson({ [DataUint256Key.vdxfid]: display + 'zz' })
    ).toThrow('hex');
    expect(() =>
      VdxfUniValue.fromDaemonJson({ [DataUint256Key.vdxfid]: '00' })
    ).toThrow('32 bytes');
  });

  test('preserves explicit zero nested versions rather than native defaults', () => {
    const native = new VdxfUniValue({
      values: [
        {
          [DataDescriptorKey.vdxfid]: new DataDescriptor({
            version: new BN(0),
          }),
        },
      ],
    });
    const decoded = VdxfUniValue.fromDaemonJson(native.toDaemonJson());

    expect(decoded.toBuffer()).toEqual(native.toBuffer());
  });
});
