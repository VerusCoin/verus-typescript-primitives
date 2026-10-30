import { BN } from 'bn.js';
import { PBaaSEvidenceRef } from '../../pbaas/PBaaSEvidenceRef';
import { UTXORef } from '../../pbaas/UTXORef';

describe('UTXORef serialization', () => {
  test('preserves a nonzero output index when the transaction hash is omitted', () => {
    const reference = new UTXORef({ n: new BN(7) });
    const wire = reference.toBuffer();

    // The null uint256 identifies an output in the same transaction. Its
    // reserved bytes must precede the little-endian uint32 output index.
    expect(wire).toEqual(
      Buffer.concat([Buffer.alloc(32), Buffer.from('07000000', 'hex')])
    );

    const decoded = new UTXORef();

    expect(decoded.fromBuffer(wire)).toBe(36);
    expect(decoded.hash).toEqual(Buffer.alloc(32));
    expect(decoded.n.eqn(7)).toBe(true);
    expect(decoded.toBuffer()).toEqual(wire);
  });

  test('retains an explicitly supplied hash and output index', () => {
    const hash = Buffer.from(
      '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
      'hex'
    );
    const reference = new UTXORef({ hash, n: new BN(7) });

    expect(reference.toBuffer()).toEqual(
      Buffer.concat([hash, Buffer.from('07000000', 'hex')])
    );
  });

  test('round-trips a same-transaction evidence reference to output seven', () => {
    const reference = new PBaaSEvidenceRef({
      flags: PBaaSEvidenceRef.FLAG_ISEVIDENCE,
      output: new UTXORef({ n: new BN(7) }),
    });
    const wire = reference.toBuffer();
    const decoded = new PBaaSEvidenceRef();

    expect(decoded.fromBuffer(wire)).toBe(wire.length);
    expect(decoded.isValid()).toBe(true);
    expect(decoded.toJson().output).toEqual({
      txid: '00'.repeat(32),
      voutnum: 7,
    });
    expect(decoded.toBuffer()).toEqual(wire);
  });
});
