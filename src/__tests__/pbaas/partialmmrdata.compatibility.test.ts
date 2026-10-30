import { BN } from 'bn.js';
import {
  DATA_TYPE_BASE64,
  DATA_TYPE_DATAHASH,
  DATA_TYPE_HEX,
  DATA_TYPE_MESSAGE,
  DATA_TYPE_MMRDATA,
  DATA_TYPE_RAWSTRINGDATA,
  DATA_TYPE_VDXFDATA,
} from '../../constants/pbaas';
import { PartialMMRData } from '../../pbaas/PartialMMRData';
import { PartialSignData } from '../../pbaas/PartialSignData';
import { VdxfUniValue } from '../../pbaas/VdxfUniValue';
import { DataStringKey } from '../../vdxf/vdxfdatakeys';

function request(message: string, optionalFields = false): PartialMMRData {
  return new PartialMMRData({
    data: [{ type: DATA_TYPE_MESSAGE, data: Buffer.from(message) }],
    salt: optionalFields ? [Buffer.alloc(32, 0x11)] : undefined,
    priormmr: optionalFields ? [Buffer.alloc(32, 0x22)] : undefined,
  });
}

describe('Partial MMR request replacement decoding', () => {
  test('reuses an instance without accumulating entries or optional fields', () => {
    const reused = new PartialMMRData();

    for (const input of [
      request('first', true),
      request('second'),
      request('third', true),
    ]) {
      const bytes = input.toBuffer();
      const fresh = new PartialMMRData();
      fresh.fromBuffer(bytes);

      expect(reused.fromBuffer(bytes)).toBe(bytes.length);
      expect(reused.toJson()).toEqual(fresh.toJson());
      expect(reused.toBuffer()).toEqual(bytes);
    }
  });

  test('failed parsing preserves the previous request and permits retry', () => {
    const reused = request('keep this request', true);
    const original = reused.toBuffer();
    const replacement = request('replacement', true).toBuffer();

    // Every prefix must fail without changing any committed state.
    for (let length = 0; length < replacement.length; length++) {
      expect(() =>
        reused.fromBuffer(replacement.subarray(0, length))
      ).toThrow();
      expect(reused.toBuffer()).toEqual(original);
    }

    expect(reused.fromBuffer(replacement)).toBe(replacement.length);
    expect(reused.toBuffer()).toEqual(replacement);
  });

  test('returns the outer stream offset without consuming a following object', () => {
    const bytes = request('offset').toBuffer();
    const stream = Buffer.concat([
      Buffer.from([0xaa, 0xbb]),
      bytes,
      Buffer.from([0xcc]),
    ]);
    const parsed = new PartialMMRData();

    expect(parsed.fromBuffer(stream, 2)).toBe(2 + bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
  });

  test('preserves trailing raw data inside a nested VDXF stream', () => {
    // VDXF is a stream: a trailing raw segment is data, not outer padding.
    const tagged = VdxfUniValue.fromJson({ [DataStringKey.vdxfid]: 'message' });
    const payload = Buffer.concat([tagged.toBuffer(), Buffer.from([0xaa])]);
    const bytes = Buffer.concat([
      Buffer.from([0, 1, DATA_TYPE_VDXFDATA.toNumber(), payload.length]),
      payload,
      Buffer.from([1]),
    ]);
    const parsed = new PartialMMRData();

    expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(() => parsed.toCLIJson()).toThrow();
  });

  test('rejects a nested decoder that leaves bytes unread, without replacing state', () => {
    const nested = new PartialMMRData({
      data: [
        {
          type: DATA_TYPE_VDXFDATA,
          data: VdxfUniValue.fromJson({ message: 'nested' }),
        },
      ],
    });
    const bytes = nested.toBuffer();
    const parsed = request('retained');
    const original = parsed.toBuffer();
    const decoder = jest
      .spyOn(VdxfUniValue.prototype, 'fromBuffer')
      .mockReturnValue(0);

    try {
      expect(() => parsed.fromBuffer(bytes)).toThrow('payload length mismatch');
      expect(parsed.toBuffer()).toEqual(original);
    } finally {
      decoder.mockRestore();
    }
  });

  test('rejects a nested string that cannot preserve its original UTF-8 bytes', () => {
    const tagged = VdxfUniValue.fromJson({ [DataStringKey.vdxfid]: 'a' });
    const payload = tagged.toBuffer();
    payload[payload.length - 1] = 0xff;
    const bytes = Buffer.concat([
      Buffer.from([0, 1, DATA_TYPE_VDXFDATA.toNumber(), payload.length]),
      payload,
      Buffer.from([1]),
    ]);
    const parsed = request('retained');
    const original = parsed.toBuffer();

    expect(() => parsed.fromBuffer(bytes)).toThrow('change the payload bytes');
    expect(parsed.toBuffer()).toEqual(original);
  });
});

describe('Partial MMR daemon CLI boundary', () => {
  test('round-trips supported explicit data keys and salts', () => {
    const json = {
      mmrdata: [
        { serializedhex: '616263' },
        { serializedhex: '00ff' },
        { message: 'Unicode: é' },
        { filename: 'fixture.bin' },
        { datahash: '11'.repeat(32) },
      ],
      mmrsalt: Array(5).fill('22'.repeat(32)),
      mmrhashtype: 'sha256D',
    };
    const parsed = PartialMMRData.fromCLIJson(json);

    expect(parsed.toCLIJson()).toEqual(json);
    expect(parsed.data[0].type.eq(DATA_TYPE_HEX)).toBe(true);
    expect(parsed.data[0].data).toEqual(Buffer.from('abc'));
  });

  test('rejects bare strings in both directions while retaining typed local storage', () => {
    expect(() =>
      PartialMMRData.fromCLIJson({ mmrdata: ['616263'] } as any)
    ).toThrow('serializedhex');

    const local = new PartialMMRData({
      data: [{ type: DATA_TYPE_RAWSTRINGDATA, data: Buffer.from('abc') }],
    });
    const stored = PartialMMRData.fromJson(local.toJson());

    expect(stored.toBuffer()).toEqual(local.toBuffer());
    expect(() => stored.toCLIJson()).toThrow('RAWSTRING');
  });

  test('does not silently omit unknown item tags', () => {
    const local = request('valid item');
    local.data.push({ type: new BN(999), data: Buffer.from('retain me') });
    const original = local.toBuffer();

    expect(() => local.toCLIJson()).toThrow(
      'Unsupported partial MMR item tag: 999'
    );
    expect(local.toBuffer()).toEqual(original);
  });

  test.each([
    { message: 'first', serializedhex: '616263' },
    { serializedhex: '616263', message: 'second' },
    { vdxfdata: { message: 'third' }, serializedbase64: 'YQ==' },
    { message: 'metadata cannot be retained', label: 'label' },
    { unsupported: 'data' },
    {},
  ])('rejects ambiguous or unrepresentable item %j', (item) => {
    expect(() =>
      PartialMMRData.fromCLIJson({ mmrdata: [item] } as any)
    ).toThrow('exactly one');
  });

  test.each([0, 1, 31, 33])(
    'rejects %i-byte supplied hashes and salts at both RPC boundaries',
    (length) => {
      const value = Buffer.alloc(length, 0x11);

      expect(() =>
        PartialMMRData.fromCLIJson({
          mmrdata: [{ datahash: value.toString('hex') }],
        })
      ).toThrow('exactly 32 bytes');
      expect(() =>
        PartialMMRData.fromCLIJson({
          mmrdata: [{ message: 'salted' }],
          mmrsalt: [value.toString('hex')],
        })
      ).toThrow('exactly 32 bytes');

      const directHash = new PartialMMRData({
        data: [{ type: DATA_TYPE_DATAHASH, data: value }],
      });
      const directSalt = new PartialMMRData({
        data: [{ type: DATA_TYPE_MESSAGE, data: Buffer.from('salted') }],
        salt: [value],
      });
      expect(() => directHash.toCLIJson()).toThrow('exactly 32 bytes');
      expect(() => directSalt.toCLIJson()).toThrow('exactly 32 bytes');
    }
  );

  test.each(['0', 'abc', '0x00', '00zz', ' 00', '00 '])(
    'rejects malformed hex %j',
    (value) => {
      for (const key of ['serializedhex', 'datahash']) {
        expect(() =>
          PartialMMRData.fromCLIJson({ mmrdata: [{ [key]: value }] } as any)
        ).toThrow('hexadecimal');
      }
      expect(() =>
        PartialMMRData.fromCLIJson({
          mmrdata: [{ message: 'salted' }],
          mmrsalt: [value],
        })
      ).toThrow('hexadecimal');
      expect(() =>
        PartialMMRData.fromJson({
          data: [{ type: DATA_TYPE_HEX.toString(), data: value }],
        })
      ).toThrow('hexadecimal');
      expect(() => PartialMMRData.fromJson({ priormmr: [value] })).toThrow(
        'hexadecimal'
      );
    }
  );

  test.each([
    '',
    'YQ==',
    'YQ',
    'YQ=',
    'YQ===',
    'YR==',
    'YQ==\n',
    '?YQ==',
    'YQ==ignored',
  ])(
    'rejects unsupported base64 requests regardless of encoding: %j',
    (value) => {
      expect(() =>
        PartialMMRData.fromCLIJson({
          mmrdata: [{ serializedbase64: value }],
        } as any)
      ).toThrow('use serializedhex');
    }
  );

  test('rejects prior-MMR execution while retaining its local representation', () => {
    const local = request('stored prior data', true);
    const restored = PartialMMRData.fromJson(local.toJson());

    expect(restored.toBuffer()).toEqual(local.toBuffer());
    expect(() => local.toCLIJson()).toThrow('Prior-MMR combination');
    for (const priormmr of [['11'.repeat(32)], [], undefined]) {
      // Untyped input must reject unsupported fields rather than discard them.
      const json = {
        mmrdata: [{ message: 'append' }],
        priormmr,
      } as any;
      expect(() => PartialMMRData.fromCLIJson(json)).toThrow(
        'Prior-MMR combination'
      );
      expect(() => PartialSignData.fromCLIJson(json)).toThrow(
        'Prior-MMR combination'
      );
    }
  });

  test('rejects invalid text instead of replacing its bytes', () => {
    const invalid = new PartialMMRData({
      data: [{ type: DATA_TYPE_MESSAGE, data: Buffer.from([0xff]) }],
    });

    expect(() => invalid.toCLIJson()).toThrow('UTF-8');
    expect(() =>
      PartialMMRData.fromCLIJson({ mmrdata: [{ message: '\ud800' }] })
    ).toThrow('surrogate');
  });

  test('preserves base64 request-envelope storage without RPC conversion', () => {
    const local = new PartialMMRData({
      data: [{ type: DATA_TYPE_BASE64, data: Buffer.from('a') }],
    });
    expect(PartialMMRData.fromJson(local.toJson()).toBuffer()).toEqual(
      local.toBuffer()
    );
    expect(() => local.toCLIJson()).toThrow('use serializedhex');
  });

  test('applies request checks through PartialSignData', () => {
    expect(() =>
      PartialSignData.fromCLIJson({ mmrdata: ['616263'] } as any)
    ).toThrow('serializedhex');
    expect(() =>
      PartialSignData.fromCLIJson({ mmrdata: [{ serializedhex: '00zz' }] })
    ).toThrow('hexadecimal');

    const local = new PartialSignData({
      dataType: DATA_TYPE_MMRDATA,
      data: new PartialMMRData({
        data: [{ type: new BN(999), data: Buffer.from('abc') }],
      }),
    });
    expect(() => local.toCLIJson()).toThrow('Unsupported partial MMR item tag');
  });

  test('routes nested VDXF through the lossless daemon conversion', () => {
    expect(() =>
      PartialMMRData.fromCLIJson({
        mmrdata: [{ vdxfdata: { serializedbase64: 'YQ==junk' } }],
      })
    ).toThrow();

    const parsed = PartialMMRData.fromCLIJson({
      mmrdata: [{ vdxfdata: { [DataStringKey.vdxfid]: 'nested text' } }],
    });
    const restored = PartialMMRData.fromCLIJson(parsed.toCLIJson());

    expect(restored.toBuffer()).toEqual(parsed.toBuffer());
  });
});
