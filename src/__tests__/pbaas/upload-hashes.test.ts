import { DataDescriptor, EHashTypes } from '../../pbaas/DataDescriptor';
import { getMMRRoot } from '../../pbaas/MMR';
import { MMRDescriptor } from '../../pbaas/MMRDescriptor';
import { SaltedData } from '../../pbaas/SaltedData';
import { VdxfUniValue } from '../../pbaas/VdxfUniValue';
import { hashData } from '../../utils/hash';

// Replay recorded signdata inputs against daemon-produced commitments.
// Fixed salts make the expected bytes reproducible without a running wallet.
const fixtures = require('../fixtures/local-upload/hashes.json');

describe('local upload commitments from live VRSCTEST signdata fixtures', () => {
  test.each(fixtures.cases)('$name', (fixture) => {
    const expected = MMRDescriptor.fromJson(fixture.result.mmrdescriptor);
    const expectedHashes = expected.mmrHashes.decodeHashVector();
    const objectHashType = expected.objectHashType;

    const hashes = fixture.request.mmrdata.map((item, index) => {
      if (item.datahash) {
        const supplied = Buffer.from(item.datahash, 'hex');

        expect(expected.dataDescriptors[index].objectdata).toHaveLength(0);
        expect(expected.dataDescriptors[index].salt).toBeUndefined();

        // SHA256 JSON uses digest order; the other modes use uint256 display order.
        return objectHashType === EHashTypes.HASH_SHA256
          ? supplied
          : supplied.reverse();
      }

      const data = VdxfUniValue.fromJson(item.vdxfdata || item).toBuffer();
      const salt = Buffer.from(fixture.request.mmrsalt[index], 'hex');

      expect(data).toEqual(expected.dataDescriptors[index].objectdata);
      expect(salt).toEqual(expected.dataDescriptors[index].salt);

      return new SaltedData(data, salt).getHash((bytes) =>
        hashData(bytes, objectHashType)
      );
    });

    expect(hashes).toEqual(expectedHashes);
    expect(getMMRRoot(hashes, expected.mmrHashType)).toEqual(
      expected.mmrRoot.objectdata
    );

    // The single-item daemon labels the root with the object hash algorithm.
    if (hashes.length === 1) {
      expect(expected.mmrHashType).toBe(objectHashType);
      expect(expected.mmrRoot.objectdata).toEqual(hashes[0]);
    }
  });

  test('defaults to SHA256 objects and personalized Blake2b MMR parents', () => {
    const fixture = fixtures.cases.find(
      (item) => item.name === 'default-3-leaves'
    );
    const expected = MMRDescriptor.fromJson(fixture.result.mmrdescriptor);
    const hashes = expected.dataDescriptors.map((descriptor: DataDescriptor) =>
      hashData(Buffer.concat([descriptor.objectdata, descriptor.salt]))
    );

    expect(hashes).toEqual(expected.mmrHashes.decodeHashVector());
    expect(getMMRRoot(hashes)).toEqual(expected.mmrRoot.objectdata);

    expect(hashData(Buffer.from('abc'))).toEqual(
      Buffer.from(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
        'hex'
      )
    );
  });

  test.each([
    EHashTypes.HASH_INVALID,
    EHashTypes.HASH_KECCAK,
    EHashTypes.HASH_BLAKE2BMMR2,
    99,
    NaN,
  ])(
    'rejects unsupported hash mode %s even for empty/single-leaf MMRs',
    (hashType) => {
      expect(() => hashData(Buffer.from('data'), hashType)).toThrow(
        'Unsupported hash type'
      );
      expect(() => getMMRRoot([], hashType)).toThrow(
        'Unsupported MMR hash type'
      );
      expect(() => getMMRRoot([Buffer.alloc(32)], hashType)).toThrow(
        'Unsupported MMR hash type'
      );
    }
  );

  test.each([0, 31, 33])('rejects a %i-byte leaf', (length) => {
    expect(() => getMMRRoot([Buffer.alloc(length)])).toThrow(
      'must be exactly 32 bytes'
    );
  });

  test('rejects non-buffer data and leaf values', () => {
    expect(() => hashData('abc' as any)).toThrow('must be a Buffer');
    expect(() => getMMRRoot(null as any)).toThrow('must be an array');
    expect(() => getMMRRoot(['00'.repeat(32) as any])).toThrow(
      'must be exactly 32 bytes'
    );
    expect(() => getMMRRoot(new Array(1))).toThrow('must be exactly 32 bytes');
  });

  test.each([
    EHashTypes.HASH_SHA256,
    EHashTypes.HASH_SHA256D,
    EHashTypes.HASH_BLAKE2BMMR,
  ])(
    'empty/single roots preserve daemon behavior and do not alias inputs (%s)',
    (hashType) => {
      expect(getMMRRoot([], hashType)).toEqual(Buffer.alloc(32));

      const leaf = Buffer.alloc(32, 1);
      const original = Buffer.from(leaf);
      const root = getMMRRoot([leaf], hashType);

      expect(root).toEqual(leaf);

      // A single leaf is returned by value so callers can safely mutate the root.
      root[0] = 2;

      expect(leaf).toEqual(original);
    }
  );
});
