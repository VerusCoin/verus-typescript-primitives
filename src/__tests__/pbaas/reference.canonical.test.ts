import { BN } from 'bn.js';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { IdentityMultimapRef } from '../../pbaas/IdentityMultimapRef';
import { PBaaSEvidenceRef } from '../../pbaas/PBaaSEvidenceRef';
import { URLRef } from '../../pbaas/URLRef';
import { UTXORef } from '../../pbaas/UTXORef';
import { toBase58Check } from '../../utils/address';

const identity = toBase58Check(Buffer.alloc(20, 0x11), I_ADDR_VERSION);
const key = toBase58Check(Buffer.alloc(20, 0x22), I_ADDR_VERSION);
const zeroIds = [
  toBase58Check(Buffer.alloc(20), I_ADDR_VERSION),
  'R9HC5WtHbpoa51NCUAz86XLCmGTbkf45NT',
];
const wireHash = Buffer.from(
  Array.from({ length: 32 }, (_, index) => index + 1)
);

describe('canonical reference optional fields', () => {
  test.each(zeroIds)(
    'omits a zero system ID and hash in evidence references: %s',
    (systemId) => {
      const reference = new PBaaSEvidenceRef({
        flags: new BN(7),
        output: new UTXORef({ hash: Buffer.alloc(32, 0x12), n: new BN(2) }),
        objectNum: new BN(3),
        subObject: new BN(4),
        systemId,
        dataHash: Buffer.alloc(32),
      });
      const json = reference.toJson();

      expect(json.flags).toBe(1);
      expect(json).not.toHaveProperty('systemid');
      expect(json).not.toHaveProperty('datahash');
      // CPBaaSEvidenceRef writes no optional bytes for null uint160/uint256.
      expect(reference.toBuffer().toString('hex')).toBe(
        '0101' + '12'.repeat(32) + '020000000304'
      );
      expect(PBaaSEvidenceRef.fromJson(json).toBuffer()).toEqual(
        reference.toBuffer()
      );
    }
  );

  test.each(zeroIds)(
    'omits zero optional identity reference values: %s',
    (systemid) => {
      const reference = IdentityMultimapRef.fromJson({
        version: 1,
        flags: 7,
        identityid: identity,
        vdxfkey: key,
        startheight: 0,
        endheight: 0,
        systemid,
        datahash: '00'.repeat(32),
      });
      const json = reference.toJson();

      expect(json.flags).toBe(1);
      expect(json).not.toHaveProperty('systemid');
      expect(json).not.toHaveProperty('datahash');
      expect(reference.toBuffer().toString('hex')).toBe(
        '0101' + '11'.repeat(20) + '22'.repeat(20) + '0000'
      );
      expect(IdentityMultimapRef.fromJson(json).toBuffer()).toEqual(
        reference.toBuffer()
      );
    }
  );

  test('derives identity reference presence flags before direct JSON output', () => {
    const reference = new IdentityMultimapRef({
      idID: identity,
      key,
      dataHash: wireHash,
      systemId: identity,
    });

    expect(reference.toJson()).toMatchObject({
      flags: 6,
      datahash: Buffer.from(wireHash).reverse().toString('hex'),
      systemid: identity,
    });
  });

  test.each(['0', 'aa'.repeat(31), 'aa'.repeat(33), 'aa'.repeat(32) + 'zz'])(
    'rejects incomplete or wrong-width identity hashes: %s',
    (datahash) => {
      expect(() =>
        IdentityMultimapRef.fromJson({
          version: 1,
          flags: 0,
          identityid: identity,
          vdxfkey: key,
          startheight: 0,
          endheight: 0,
          datahash,
        })
      ).toThrow('exactly 32 bytes');
    }
  );

  test('validates an identity hash again after direct mutation', () => {
    const reference = new IdentityMultimapRef({ idID: identity, key });
    reference.dataHash = Buffer.alloc(31);

    expect(() => reference.toBuffer()).toThrow('exactly 32 bytes');
    expect(() => reference.toJson()).toThrow('exactly 32 bytes');
  });
});

describe('URL reference uint256 representation', () => {
  const url = 'https://verus.io';
  const urlBytes = Buffer.from(url);

  test('reverses display-order JSON hashes at the binary boundary', () => {
    const expected = Buffer.concat([
      Buffer.from([2, 1]),
      wireHash,
      Buffer.from([urlBytes.length]),
      urlBytes,
    ]);
    const reference = URLRef.fromJson({
      version: '2',
      flags: '1',
      url,
      datahash: Buffer.from(wireHash).reverse().toString('hex'),
    });

    expect(reference.toBuffer()).toEqual(expected);
    const decoded = new URLRef();
    expect(decoded.fromBuffer(expected)).toBe(expected.length);
    expect(decoded.toJson()).toEqual(reference.toJson());
    expect(decoded.dataHash).toEqual(wireHash);
  });

  test('writes an explicitly present null hash as all 32 bytes', () => {
    const reference = new URLRef({ flags: new BN(1), url });
    const expected = Buffer.concat([
      Buffer.from([2, 1]),
      Buffer.alloc(32),
      Buffer.from([urlBytes.length]),
      urlBytes,
    ]);

    expect(reference.toBuffer()).toEqual(expected);
    expect(reference.toJson().datahash).toBe('00'.repeat(32));
  });

  test.each([0, 1, 31, 33])('rejects a %i-byte native URL hash', (length) => {
    expect(() => new URLRef({ dataHash: Buffer.alloc(length) })).toThrow(
      'exactly 32 bytes'
    );
  });

  test.each(['abc', 'gg'.repeat(32), '00'.repeat(31), '00'.repeat(33)])(
    'rejects malformed URL hash JSON: %s',
    (datahash) => {
      expect(() => URLRef.fromJson({ version: '2', url, datahash })).toThrow(
        'exactly 32 bytes'
      );
    }
  );

  test('clears nonserialized flags and hash when reading version 1', () => {
    const reference = new URLRef({ flags: new BN(1), dataHash: wireHash, url });
    const bytes = Buffer.concat([Buffer.from([1, urlBytes.length]), urlBytes]);

    expect(reference.fromBuffer(bytes)).toBe(bytes.length);
    expect(reference.flags.isZero()).toBe(true);
    expect(reference.dataHash).toEqual(Buffer.alloc(32));
    expect(reference.toBuffer()).toEqual(bytes);
  });
});
