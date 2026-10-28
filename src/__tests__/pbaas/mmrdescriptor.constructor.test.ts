import { BN } from 'bn.js';
import { DataDescriptor, EHashTypes } from '../../pbaas/DataDescriptor';
import { MMRDescriptor } from '../../pbaas/MMRDescriptor';

describe('MMRDescriptor producer construction', () => {
  // CMMRDescriptor header followed by two ordinary CDataDescriptors and the
  // CompactSize-prefixed descriptor vector. No JSON conversion is involved.
  const wire = Buffer.from(
    '010501' +
      '010020' +
      '11'.repeat(32) +
      '010002aabb' +
      '02' +
      '010003616263' +
      '010003646566',
    'hex'
  );

  function fields() {
    return {
      objectHashType: EHashTypes.HASH_SHA256,
      mmrHashType: EHashTypes.HASH_BLAKE2BMMR,
      mmrRoot: new DataDescriptor({ objectdata: Buffer.alloc(32, 0x11) }),
      mmrHashes: new DataDescriptor({ objectdata: Buffer.from('aabb', 'hex') }),
      dataDescriptors: [
        new DataDescriptor({ objectdata: Buffer.from('abc') }),
        new DataDescriptor({ objectdata: Buffer.from('def') }),
      ],
    };
  }

  test('serializes supplied descriptor fields with the default version', () => {
    const descriptor = new MMRDescriptor(fields());

    expect(descriptor.getByteLength()).toBe(wire.length);
    expect(descriptor.toBuffer()).toEqual(wire);

    const decoded = new MMRDescriptor();

    expect(decoded.fromBuffer(wire)).toBe(wire.length);
    expect(decoded.version.eqn(1)).toBe(true);
    expect(
      decoded.dataDescriptors.map((value) => value.objectdata.toString())
    ).toEqual(['abc', 'def']);
    expect(decoded.toBuffer()).toEqual(wire);
  });

  test('retains an explicitly supplied version', () => {
    // An explicit zero must remain invalid rather than use the default version.
    const descriptor = new MMRDescriptor({ ...fields(), version: new BN(0) });

    expect(descriptor.isValid()).toBe(false);
    expect(descriptor.toBuffer()).toEqual(
      Buffer.concat([Buffer.from([0]), wire.subarray(1)])
    );
  });
});
