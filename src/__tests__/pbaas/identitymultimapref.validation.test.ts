import { BN } from 'bn.js';
import { IdentityMultimapRef } from '../../pbaas/IdentityMultimapRef';
import { CrossChainDataRef } from '../../pbaas/CrossChainDataRef';
import { toBase58Check } from '../../utils/address';
import { I_ADDR_VERSION } from '../../constants/vdxf';

const identityHash = '11'.repeat(20);
const keyHash = '22'.repeat(20);
const dataHash = '33'.repeat(32);
const systemHash = '44'.repeat(20);

describe('IdentityMultimapRef flag validation', () => {
  test.each([0, 1, 2, 3, 4, 5, 6, 7])(
    'accepts and preserves supported flag combination %i',
    (flags) => {
      // Field order and optional flags from ../VerusCoin/src/primitives/block.h,
      // CIdentityMultimapRef::SerializationOp and IsValid. These are constructed
      // wire fixtures, independent of the TypeScript serializer.
      const wire = Buffer.from(
        `01${flags.toString(16).padStart(2, '0')}${identityHash}${keyHash}0000` +
          ((flags & 2) !== 0 ? dataHash : '') +
          ((flags & 4) !== 0 ? systemHash : ''),
        'hex',
      );
      const ref = new IdentityMultimapRef();

      expect(ref.fromBuffer(wire)).toBe(wire.length);
      expect(ref.flags.eqn(flags)).toBe(true);
      expect(ref.isValid()).toBe(true);
      expect(new CrossChainDataRef(ref).isValid()).toBe(true);
      expect(ref.hasDataHash()).toBe((flags & 2) !== 0);
      expect(ref.hasSystemID()).toBe((flags & 4) !== 0);
      const json = JSON.parse(JSON.stringify(ref.toJson()));
      const restored = IdentityMultimapRef.fromJson(json);
      expect(restored.toJson()).toEqual(json);
      expect(restored.toBuffer()).toEqual(wire);
      expect(ref.toBuffer()).toEqual(wire);
    },
  );

  test('rejects JSON that requires a data hash but omits it', () => {
    expect(() => IdentityMultimapRef.fromJson({
      version: 1,
      flags: IdentityMultimapRef.FLAG_HAS_DATAHASH.toNumber(),
      vdxfkey: toBase58Check(Buffer.from(keyHash, 'hex'), I_ADDR_VERSION),
      identityid: toBase58Check(Buffer.from(identityHash, 'hex'), I_ADDR_VERSION),
      startheight: 0,
      endheight: 0,
    })).toThrow();
  });

  test.each([
    '8',
    '9',
    '14',
    '15',
    '2147483648',
    '2147483654',
    '4294967302',
    '18446744073709551622',
    '-1',
    '-6',
  ])('rejects unsupported flags %s without normalizing them', (flags) => {
    const ref = new IdentityMultimapRef({
      version: new BN(1),
      flags: new BN(flags),
      idID: toBase58Check(Buffer.from(identityHash, 'hex'), I_ADDR_VERSION),
      key: toBase58Check(Buffer.from(keyHash, 'hex'), I_ADDR_VERSION),
      dataHash: Buffer.from(dataHash, 'hex'),
      systemId: toBase58Check(Buffer.from(systemHash, 'hex'), I_ADDR_VERSION),
    });

    // Validate before serialization, which recomputes and normalizes flags.
    expect(ref.isValid()).toBe(false);
    expect(new CrossChainDataRef(ref).isValid()).toBe(false);
    expect(ref.flags.toString()).toBe(flags);
  });
});
