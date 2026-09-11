import { runInNewContext } from 'vm';
import { MerkleMountainRange, MerkleMountainView, MMRNode, MMRProof } from '../../pbaas/MMR';

function makeRange(count: number): MerkleMountainRange {
  const range = new MerkleMountainRange();
  for (let i = 0; i < count; i++) range.add(new MMRNode(Buffer.alloc(32, i + 1)));
  return range;
}

// A restored signed-shift bug must fail instead of hanging Jest. Classes are
// already loaded; a VM timeout is an Error, not the expected RangeError.
function bounded(operation: string, context: object): unknown {
  return runInNewContext(operation, context, { timeout: 100 });
}

// Never inspect uninitialized bytes if the unsafe-allocation bug returns.
function initializedAllocations<T>(operation: () => T): T {
  const allocation = jest.spyOn(Buffer, 'allocUnsafe').mockImplementation(size => Buffer.alloc(size, 0x5a));
  try {
    return operation();
  } finally {
    allocation.mockRestore();
  }
}

describe('MerkleMountainView size validation', () => {
  test.each([-1, -0.5, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects size %s before construction or changing an existing view', size => {
      const range = makeRange(3);
      const view = new MerkleMountainView(range);
      const root = Buffer.from(view.getRoot());

      expect(() => bounded('new MerkleMountainView(range, size)', { MerkleMountainView, range, size }))
        .toThrow(RangeError);
      expect(() => bounded('view.resize(size)', { view, size })).toThrow(RangeError);
      expect(view.size()).toBe(3);
      expect(view.getRoot()).toEqual(root);
    },
  );

  test('keeps default/zero construction and oversized requests clamped to the range', () => {
    const range = makeRange(3);
    for (const size of [undefined, 0, 4, Number.MAX_SAFE_INTEGER]) {
      const view = bounded('new MerkleMountainView(range, size)', { MerkleMountainView, range, size }) as MerkleMountainView;
      expect(view.size()).toBe(3);
      expect(view.resize(Number.MAX_SAFE_INTEGER)).toBe(3);
    }
  });

  test('rejects effective sizes beyond signed-shift support while allowing smaller views', () => {
    const range = makeRange(3);
    jest.spyOn(range, 'size').mockReturnValue(0x80000000);
    const view = new MerkleMountainView(range, 3);
    const root = Buffer.from(view.getRoot());

    expect(() => bounded('new MerkleMountainView(range)', { MerkleMountainView, range })).toThrow(RangeError);
    expect(() => bounded('view.resize(0x80000000)', { view })).toThrow(RangeError);
    expect(view.size()).toBe(3);
    expect(view.getRoot()).toEqual(root);
  });

  test('includes every peak at the maximum supported effective size without allocating leaves', () => {
    const range = new MerkleMountainRange();
    jest.spyOn(range, 'size').mockReturnValue(0x7fffffff);
    const node = new MMRNode(Buffer.alloc(32, 1));
    const getNode = jest.spyOn(range, 'getNode').mockReturnValue(node);
    const view = new MerkleMountainView(range);

    // 2^31 - 1 has a peak at every height, including its last leaf.
    expect(view.getPeaks()).toHaveLength(31);
    expect(getNode).toHaveBeenCalledWith(0, 0x7ffffffe);
  });
});

describe('MerkleMountainView roots and leaf access', () => {
  test('returns a deterministic zero root and no root node for an empty range', () => {
    const view = new MerkleMountainView(new MerkleMountainRange());
    expect(initializedAllocations(() => view.getRoot())).toEqual(Buffer.alloc(32));
    expect(initializedAllocations(() => view.getRootNode())).toBeNull();
  });

  test('retrieves first and last leaves through the layer accessor', () => {
    const view = new MerkleMountainView(makeRange(3));
    expect(view.getHash(0)).toEqual(Buffer.alloc(32, 1));
    expect(view.getHash(2)).toEqual(Buffer.alloc(32, 3));
  });

  test.each([-1, -0.5, 0.5, NaN, Infinity, -Infinity, 2, Number.MAX_SAFE_INTEGER + 1])(
    'returns a zero hash and leaves proofs unchanged for invalid view index %s', index => {
      const view = new MerkleMountainView(makeRange(3), 2);
      const proof = new MMRProof();
      expect(view.getProof(proof, 0)).toBe(true);
      const before = proof.toBuffer();

      expect(initializedAllocations(() => view.getHash(index))).toEqual(Buffer.alloc(32));
      expect(view.getProof(proof, index)).toBe(false);
      expect(proof.toBuffer()).toEqual(before);
    },
  );

  test('returns empty-view sentinels for leaf and proof requests', () => {
    const view = new MerkleMountainView(new MerkleMountainRange());
    const proof = new MMRProof();
    expect(initializedAllocations(() => view.getHash(0))).toEqual(Buffer.alloc(32));
    expect(view.getProof(proof, 0)).toBe(false);
    expect(proof.proofSequence).toHaveLength(0);
  });

  test('recomputes roots and proofs after shrinking, emptying, and expanding a view', () => {
    const range = makeRange(5);
    const view = new MerkleMountainView(range);
    view.getRoot();

    for (const size of [3, 0, 1, 5]) {
      expect(view.resize(size)).toBe(size);
      const expectedRoot = size === 0 ? Buffer.alloc(32) : new MerkleMountainView(makeRange(size)).getRoot();
      expect(initializedAllocations(() => view.getRoot())).toEqual(expectedRoot);
      if (size === 0) {
        expect(view.getRootNode()).toBeNull();
      } else {
        expect(view.getRootNode().hash).toEqual(expectedRoot);
        for (let i = 0; i < size; i++) {
          const proof = new MMRProof();
          expect(view.getProof(proof, i)).toBe(true);
          expect(proof.proofSequence[0].safeCheck(Buffer.alloc(32, i + 1))).toEqual(expectedRoot);
        }
      }
    }
  });
});

describe('MerkleMountainRange unsupported serialization', () => {
  test.each([0, 2])('explicitly rejects serialization APIs with %i leaves', count => {
    const range = makeRange(count);
    const root = initializedAllocations(() => new MerkleMountainView(range).getRoot());

    expect(() => range.getbyteLength()).toThrow(/not implemented/);
    expect(() => range.toBuffer()).toThrow(/not implemented/);
    expect(() => range.fromBuffer(Buffer.from('00', 'hex'))).toThrow(/not implemented/);
    expect(range.size()).toBe(count);
    expect(initializedAllocations(() => new MerkleMountainView(range).getRoot())).toEqual(root);
  });
});
