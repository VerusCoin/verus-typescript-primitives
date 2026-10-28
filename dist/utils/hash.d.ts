import type { EHashTypes } from '../pbaas/DataDescriptor';
/**
 * Hash raw bytes using the supported CNativeHashWriter algorithms.
 * Returns the digest as serialized uint256 bytes, without RPC/display reversal.
 * For salted uploads, pass data || salt (not a serialized descriptor).
 */
export declare const hashData: (data: Buffer, hashType?: EHashTypes) => Buffer;
export declare const hash: (...params: Array<Buffer>) => Buffer;
export declare const hash160: (data: Buffer) => Buffer;
