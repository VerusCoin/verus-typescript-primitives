import { BN } from 'bn.js';
/**
 * Return the daemon's uint64 direction index, or uint64(-1) for a missing leaf.
 * Inputs must be exact JavaScript integers. Right directions beyond bit 63 are
 * rejected because the corresponding C++ shift is undefined.
 */
export declare const GetMMRProofIndex: (pos: number, mmvSize: number, extraHashes: number) => InstanceType<typeof BN>;
