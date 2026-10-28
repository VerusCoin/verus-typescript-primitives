import createHash = require('create-hash');
import type { EHashTypes } from '../pbaas/DataDescriptor';
import {
  HASH_TYPE_BLAKE2B,
  HASH_TYPE_SHA256,
  HASH_TYPE_SHA256D,
} from '../constants/pbaas';

const blake2b = require('blake2b');

/**
 * Hash raw bytes using the supported CNativeHashWriter algorithms.
 * Returns the digest as serialized uint256 bytes, without RPC/display reversal.
 * For salted uploads, pass data || salt (not a serialized descriptor).
 */
export const hashData = (
  data: Buffer,
  hashType: EHashTypes = HASH_TYPE_SHA256.toNumber()
): Buffer => {
  if (!Buffer.isBuffer(data)) {
    throw new TypeError('Hash input must be a Buffer');
  }

  switch (hashType) {
    case HASH_TYPE_SHA256.toNumber():
      return createHash('sha256').update(data).digest();

    case HASH_TYPE_SHA256D.toNumber():
      return hash(data);

    case HASH_TYPE_BLAKE2B.toNumber(): {
      const output = Buffer.alloc(32);

      // CBlake2bWriter uses this 16-byte personalization. An unpersonalized
      // Blake2b-256 digest would produce a different upload commitment.
      return blake2b(32, null, null, Buffer.from('VerusDefaultHash'))
        .update(data)
        .digest(output);
    }

    default:
      throw new Error(`Unsupported hash type ${hashType}`);
  }
};

export const hash = (...params: Array<Buffer>): Buffer => {
  const _hash = createHash('sha256');

  params.forEach((value) => {
    _hash.update(value);
  });

  return createHash('sha256').update(_hash.digest()).digest();
};

export const hash160 = (data: Buffer): Buffer => {
  const sha256 = createHash('sha256');
  const ripemd160 = createHash('ripemd160');

  return ripemd160.update(sha256.update(data).digest()).digest();
};
