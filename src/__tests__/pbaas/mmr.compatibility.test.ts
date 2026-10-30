import { createHash } from 'crypto';
import {
  getMMRRoot,
  MerkleMountainRange,
  MerkleMountainView,
  MMRBranch,
  MMRNode,
  MMRProof,
} from '../../pbaas/MMR';
import { GetMMRProofIndex } from '../../utils/mmr';

// Captured from compiled, unmodified daemon methods; the generator never loads
// this library. All fixture hashes are raw uint256 bytes rather than RPC hex.
const fixture = require('../fixtures/mmr/daemon-core.json');
const cases = (kind: string): any[] =>
  fixture.cases.filter((item) => item.kind === kind);
const zeroHash = (): Buffer => Buffer.alloc(32);

function leaf(index: number): Buffer {
  const hash = Buffer.from(
    Array.from({ length: 32 }, (_, j) => (index * 37 + j * 17 + 11) & 255)
  );
  hash.writeUInt32LE(index, 28);
  return hash;
}

function makeRange(count: number): MerkleMountainRange {
  const range = new MerkleMountainRange();
  for (let index = 0; index < count; index++)
    range.add(new MMRNode(leaf(index)));
  return range;
}

function proofFor(view: MerkleMountainView, pos: number): MMRBranch {
  const proof = new MMRProof();
  expect(view.getProof(proof, pos)).toBe(true);
  return proof.proofSequence[0];
}

describe('compiled daemon core fixtures', () => {
  test.each(cases('root'))('root: hash=$algo size=$size', (vector) => {
    const leaves = Array.from({ length: vector.size }, (_, index) =>
      leaf(index)
    );
    expect(getMMRRoot(leaves, vector.algo).toString('hex')).toBe(vector.root);
  });

  test.each(cases('proof'))('proof: size=$size pos=$pos', (vector) => {
    const view = new MerkleMountainView(makeRange(vector.size));
    const branch = proofFor(view, vector.pos);
    expect(branch.branch.map((hash) => hash.toString('hex'))).toEqual(
      vector.hashes
    );
    expect(branch.safeCheck(leaf(vector.pos)).toString('hex')).toBe(
      vector.root
    );
    expect(view.getRoot().toString('hex')).toBe(vector.root);
  });

  test.each(cases('index'))(
    'index: size=$size pos=$pos extra=$extra',
    (vector) => {
      expect(
        GetMMRProofIndex(vector.pos, vector.size, vector.extra).toString()
      ).toBe(vector.index);
    }
  );

  test.each(cases('check'))(
    'SafeCheck: size=$size pos=$pos extra=$extra hashes=$hashes.length',
    (vector) => {
      const branch = new MMRBranch(
        vector.extra === 1 ? 3 : 2,
        vector.pos,
        vector.size,
        vector.hashes.map((hash) => Buffer.from(hash, 'hex'))
      );
      expect(branch.safeCheck(leaf(0)).toString('hex')).toBe(vector.checked);
    }
  );

  test.each(cases('equal'))('equal sibling at position $pos', (vector) => {
    const branch = new MMRBranch(2, vector.pos, 2, [leaf(0)]);
    expect(branch.safeCheck(leaf(0)).toString('hex')).toBe(vector.checked);
  });

  test('excluded daemon duplicate-peak defect: structural selection reaches the trusted root', () => {
    const vector = cases('duplicatePeak')[0];
    const range = makeRange(6);
    range.add(new MMRNode(Buffer.from(vector.leaf, 'hex')));
    const branch = proofFor(new MerkleMountainView(range), 6);

    expect(branch.branch.map((hash) => hash.toString('hex'))).toEqual(
      vector.correctedHashes
    );
    expect(branch.branch.map((hash) => hash.toString('hex'))).not.toEqual(
      vector.daemonHashes
    );
    expect(
      branch.safeCheck(Buffer.from(vector.leaf, 'hex')).toString('hex')
    ).toBe(vector.root);
  });
});

describe('MMR value semantics', () => {
  test('isolates caller input, returned nodes, roots, leaf hashes, peaks and proofs', () => {
    const input = leaf(0);
    const node = new MMRNode(input);
    input.fill(0xff);
    expect(node.hash).toEqual(leaf(0));

    const range = new MerkleMountainRange();
    range.add(node);
    node.hash.fill(0xff);
    for (let index = 1; index < 7; index++) range.add(new MMRNode(leaf(index)));
    const view = new MerkleMountainView(range);
    const root = view.getRoot();
    const expectedRoot = Buffer.from(root);
    const proof = proofFor(view, 6);
    const expectedProof = proof.toBuffer();

    root.fill(0xff);
    range.getNode(0, 0).hash.fill(0xff);
    range.getNode(1, 0).hash.fill(0xff);
    view.getHash(0).fill(0xff);
    view.getRootNode().hash.fill(0xff);
    view.getPeaks().forEach((peak) => peak.hash.fill(0xff));
    proof.branch.forEach((hash) => hash.fill(0xff));

    expect(view.getHash(0)).toEqual(leaf(0));
    expect(view.getRoot()).toEqual(expectedRoot);
    expect(new MerkleMountainView(range).getRoot()).toEqual(expectedRoot);
    expect(proofFor(view, 6).toBuffer()).toEqual(expectedProof);
  });

  test.each([false, true])(
    'retains subclass hashing when copying nodes (double=%s)',
    (double) => {
      class SHANode extends MMRNode {
        readonly double = double;

        createParentNode(right: MMRNode): SHANode {
          let hash = createHash('sha256')
            .update(this.hash)
            .update(right.hash)
            .digest();
          if (this.double) hash = createHash('sha256').update(hash).digest();
          return new SHANode(hash);
        }
      }

      const range = new MerkleMountainRange();
      for (let index = 0; index < 7; index++) {
        const input = leaf(index);
        const node = new SHANode(input);
        range.add(node);
        input.fill(0xff);
        node.hash.fill(0xff);
      }
      const vector = cases('root').find(
        (item) => item.size === 7 && item.algo === (double ? 4 : 5)
      );
      const view = new MerkleMountainView(range);
      const returned = range.getNode(0, 0);
      expect(returned).toBeInstanceOf(SHANode);
      returned.hash.fill(0xff);
      view.getRoot().fill(0xff);
      expect(view.getRoot().toString('hex')).toBe(vector.root);
      expect(new MerkleMountainView(range).getRoot().toString('hex')).toBe(
        vector.root
      );
      expect(range.supportsProofs()).toBe(false);
      const unsupported = new MMRProof();
      expect(() => view.getProof(unsupported, 0)).toThrow(
        /custom node classes/
      );
      expect(unsupported.proofSequence).toHaveLength(0);
    }
  );

  test('custom subclasses require a verified proof implementation, even with inherited hashing', () => {
    class CustomNode extends MMRNode {}
    const range = new MerkleMountainRange();
    range.add(new CustomNode(leaf(0)));
    const view = new MerkleMountainView(range);
    expect(view.getRoot()).toEqual(leaf(0));
    expect(range.supportsProofs()).toBe(false);
    expect(() => view.getProof(new MMRProof(), 0)).toThrow(
      /custom node classes/
    );
    expect(makeRange(1).supportsProofs()).toBe(true);
  });

  test('empty successful branches and failure sentinels return owned buffers', () => {
    const input = leaf(0);
    const result = new MMRBranch(2, 0, 1, []).safeCheck(input);
    expect(result).toEqual(input);
    result.fill(0xff);
    expect(input).toEqual(leaf(0));

    const failure = new MMRBranch(2, 1, 1, []);
    failure.safeCheck(input).fill(0xff);
    expect(failure.safeCheck(input)).toEqual(zeroHash());
  });
});

describe('MMR default nodes and supported numeric domain', () => {
  test('defaults to zero, rejects malformed hashes and returns a zero missing node', () => {
    expect(new MMRNode().hash).toEqual(zeroHash());
    for (const value of [
      null,
      '00',
      Buffer.alloc(0),
      Buffer.alloc(31),
      Buffer.alloc(33),
    ]) {
      expect(() => new MMRNode(value as Buffer)).toThrow(/exactly 32 bytes/);
    }
    const range = makeRange(3);
    for (const [height, index] of [
      [0, 3],
      [1, 1],
      [2, 0],
      [-1, 0],
      [0, -1],
    ]) {
      expect(range.getNode(height, index).hash).toEqual(zeroHash());
    }
  });

  test('returns no root node for empty ranges and nonempty zero roots', () => {
    expect(
      new MerkleMountainView(new MerkleMountainRange()).getRootNode()
    ).toBeNull();
    const range = new MerkleMountainRange();
    range.add(new MMRNode());
    const view = new MerkleMountainView(range);
    expect(view.getRoot()).toEqual(zeroHash());
    expect(view.getRootNode()).toBeNull();
    expect(cases('zeroRootNode')[0].isNull).toBe(true);
  });

  test('rejects appends at INT32_MAX before touching the layers', () => {
    const range = makeRange(3);
    const before = new MerkleMountainView(range).getRoot();
    const node = new MMRNode(leaf(3));
    const clone = jest.spyOn(node, 'clone');
    const size = jest.spyOn(range, 'size').mockReturnValue(0x7fffffff);
    expect(() => range.add(node)).toThrow(/signed 32-bit/);
    expect(clone).not.toHaveBeenCalled();
    size.mockRestore();
    expect(range.size()).toBe(3);
    expect(new MerkleMountainView(range).getRoot()).toEqual(before);
  });

  test('retains uint32 branch fields independently of the in-memory range cap', () => {
    const original = new MMRBranch(3, 0xfffffffe, 0xffffffff, []);
    const decoded = new MMRBranch();
    expect(decoded.fromBuffer(original.toBuffer())).toBe(
      original.dataByteLength()
    );
    expect(decoded.nIndex).toBe(0xfffffffe);
    expect(decoded.nSize).toBe(0xffffffff);
    expect(decoded.safeCheck(leaf(0))).toEqual(leaf(0));
  });

  test.each([
    [Number.MAX_SAFE_INTEGER + 1, 2, 0],
    [1, Number.MAX_SAFE_INTEGER + 1, 0],
    [1, 2, -1],
    [1, 2, 0.5],
    [1, 2, 0x80000000],
    [1, 2, 64],
    [3, 4, 32],
    [2 ** 51, 2 ** 52, 1],
  ])(
    'rejects unsupported proof-index input (%s, %s, %s)',
    (pos, size, extra) => {
      expect(() => GetMMRProofIndex(pos, size, extra)).toThrow(RangeError);
    }
  );

  test('allows a valid leftmost position without iterating its extra hash count', () => {
    expect(GetMMRProofIndex(0, 1, 0x7fffffff).isZero()).toBe(true);
  });
});
