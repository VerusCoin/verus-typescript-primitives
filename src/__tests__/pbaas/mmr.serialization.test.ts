import { createHash } from "crypto";

import { MMRBranch, MMRProof } from "../../pbaas/MMR";

type NumericFixtureValue = number | string;

interface FixtureVarInt {
  value: string;
  hex: string;
}

interface FixtureBranch {
  name?: string;
  branchType?: number;
  outerType?: number;
  innerType?: number;
  index?: NumericFixtureValue;
  size?: NumericFixtureValue;
  hashCount?: number;
  hashes?: string[];
  hex?: string;
}

interface FixtureProof {
  name: string;
  branches: FixtureBranch[];
  hex: string;
}

interface LiveMMRProof {
  offset: number;
  byteLength: number;
  proofWireHex: string;
  branches: FixtureBranch[];
}

interface LiveProofContainer {
  name: string;
  blockHeaderProofHex?: string;
  wireHex?: string;
  byteLength?: number;
  sha256?: string;
  headerProof?: LiveMMRProof;
  txProof?: LiveMMRProof;
  components?: {
    offset: number;
    byteLength: number;
    count: number;
    countEncoding: string;
    wireHex: string;
    items: Array<{
      offset: number;
      byteLength: number;
      wireHex: string;
      elProof: LiveMMRProof;
    }>;
  };
}

interface MMRFixtureFile {
  canonical: {
    varints: FixtureVarInt[];
    compactSizes: FixtureVarInt[];
    proofCountPrefixes: Array<{ value: number; hex: string }>;
    standaloneBranches: FixtureBranch[];
    fullProofs: FixtureProof[];
  };
  live: {
    headerProofs: LiveProofContainer[];
    identityTransactionProofs: LiveProofContainer[];
  };
}

// This file is generated from the serialization rules in VerusCoin and from
// proofs returned by the pinned VRSCTEST daemon. Keeping it as raw hex makes
// these tests independent of the TypeScript encoder that they exercise.
const fixtures = require("../fixtures/mmr/veruscoin-v1.json") as MMRFixtureFile;

const asNumber = (value: NumericFixtureValue | undefined): number =>
  Number(value == null ? 0 : value);

const branchType = (branch: FixtureBranch): number =>
  branch.branchType == null ? (branch.innerType as number) : branch.branchType;

const hashes = (branch: FixtureBranch): string[] => branch.hashes || [];

const toMMRBranch = (branch: FixtureBranch): MMRBranch =>
  new MMRBranch(
    branchType(branch),
    asNumber(branch.index),
    asNumber(branch.size),
    hashes(branch).map((hash) => Buffer.from(hash, "hex"))
  );

const toMMRProof = (branches: FixtureBranch[]): MMRProof => {
  const proof = new MMRProof();
  // MMRProof currently has no constructor initialization. Set the empty case
  // explicitly so the framing regression can be tested independently.
  proof.proofSequence = [];
  branches.forEach((branch) => proof.setProof(toMMRBranch(branch)));
  return proof;
};

const expectBranch = (actual: MMRBranch, expected: FixtureBranch): void => {
  expect(actual.branchType).toBe(branchType(expected));
  expect(actual.nIndex).toBe(asNumber(expected.index));
  expect(actual.nSize).toBe(asNumber(expected.size));
  expect((actual.branch || []).map((hash) => hash.toString("hex"))).toEqual(
    hashes(expected)
  );
};

const supportedStandaloneBranches =
  fixtures.canonical.standaloneBranches.filter(
    (branch) => branchType(branch) === 2 || branchType(branch) === 3
  );

const supportedFullProofs = fixtures.canonical.fullProofs.filter((proof) =>
  proof.branches.every((branch) => {
    const type = branchType(branch);
    return type === 2 || type === 3;
  })
);

const practicalHashCounts = fixtures.canonical.compactSizes.filter(
  ({ value }) => Number(value) <= 253
);

describe("Verus daemon MMR branch wire compatibility", () => {
  test.each(fixtures.canonical.varints)(
    "serializes daemon VARINT for MMR index and size $value ($hex)",
    ({ value, hex }) => {
      const numericValue = Number(value);
      const branch = new MMRBranch(2, numericValue, numericValue, []);
      const expected = Buffer.from(`02${hex}${hex}00`, "hex");
      const actual = branch.toBuffer();

      expect({
        byteLength: branch.dataByteLength(),
        hex: actual.toString("hex"),
      }).toEqual({
        byteLength: expected.length,
        hex: expected.toString("hex"),
      });
    }
  );

  test.each(fixtures.canonical.varints)(
    "deserializes daemon VARINT for MMR index and size $value ($hex)",
    ({ value, hex }) => {
      const expected = Buffer.from(`02${hex}${hex}00`, "hex");

      const decoded = new MMRBranch();
      expect(decoded.fromBuffer(expected)).toBe(expected.length);
      expectBranch(decoded, {
        branchType: 2,
        index: value,
        size: value,
        hashes: [],
        hex: expected.toString("hex"),
      });
    }
  );

  test.each(supportedStandaloneBranches)(
    "serializes canonical standalone branch $name",
    (fixture) => {
      const expected = Buffer.from(fixture.hex!, "hex");
      const branch = toMMRBranch(fixture);
      const actual = branch.toBuffer();

      expect({
        byteLength: branch.dataByteLength(),
        hex: actual.toString("hex"),
      }).toEqual({
        byteLength: expected.length,
        hex: expected.toString("hex"),
      });
    }
  );

  test.each(supportedStandaloneBranches)(
    "deserializes canonical standalone branch $name",
    (fixture) => {
      const expected = Buffer.from(fixture.hex!, "hex");

      const decoded = new MMRBranch();
      expect(decoded.fromBuffer(expected)).toBe(expected.length);
      expectBranch(decoded, fixture);
    }
  );

  test.each(practicalHashCounts)(
    "keeps hash-vector length $value as CompactSize $hex",
    ({ value, hex }) => {
      const count = Number(value);
      const hash = Buffer.alloc(32, 0x5a);
      const branch = new MMRBranch(2, 0, 1, Array(count).fill(hash));
      const serialized = branch.toBuffer();
      const prefix = `020001${hex}`;

      // uint8 branch type, one-byte VARINT index, one-byte VARINT size, then
      // CompactSize hash count. Only nIndex/nSize use daemon VARINT encoding.
      expect(serialized.subarray(0, prefix.length / 2).toString("hex")).toBe(
        prefix
      );
      expect(serialized.length).toBe(prefix.length / 2 + count * 32);
    }
  );

  test("honors a non-zero input offset and returns the absolute end offset", () => {
    const prefix = Buffer.from("a1b2c3", "hex");
    const branchBytes = Buffer.from("02000100", "hex");
    const suffix = Buffer.from("d4e5f6", "hex");
    const input = Buffer.concat([prefix, branchBytes, suffix]);
    const before = Buffer.from(input);
    const decoded = new MMRBranch();

    const endOffset = decoded.fromBuffer(input, prefix.length);

    expect(endOffset).toBe(prefix.length + branchBytes.length);
    expectBranch(decoded, {
      branchType: 2,
      index: 0,
      size: 1,
      hashes: [],
      hex: branchBytes.toString("hex"),
    });
    expect(input).toEqual(before);
    expect(input.subarray(endOffset)).toEqual(suffix);
  });

  test("honors offsets when a daemon VARINT crosses the 127/128 boundary", () => {
    const prefix = Buffer.from("a1b2c3", "hex");
    const branchBytes = Buffer.from("028000800000", "hex");
    const suffix = Buffer.from("d4e5f6", "hex");
    const input = Buffer.concat([prefix, branchBytes, suffix]);
    const decoded = new MMRBranch();

    const endOffset = decoded.fromBuffer(input, prefix.length);

    expect(endOffset).toBe(prefix.length + branchBytes.length);
    expectBranch(decoded, {
      branchType: 2,
      index: 128,
      size: 128,
      hashes: [],
      hex: branchBytes.toString("hex"),
    });
    expect(input.subarray(endOffset)).toEqual(suffix);
  });

  test("rejects a non-canonical CompactSize hash-vector length", () => {
    // The hash count zero is encoded using the 0xfd form. VerusCoin's
    // ReadCompactSize rejects this instead of silently accepting it.
    const nonCanonical = Buffer.from("020001fd0000", "hex");
    expect(() => new MMRBranch().fromBuffer(nonCanonical)).toThrow();
  });

  test.each([
    ["index", "028efefeff000100"],
    ["size", "02018efefeff0000"],
  ])("rejects a VARINT %s outside the daemon uint32 field", (_field, hex) => {
    // 8e fe fe ff 00 is VARINT(2^32), one above CMMRBranch's uint32 range.
    expect(() => new MMRBranch().fromBuffer(Buffer.from(hex, "hex"))).toThrow();
  });

  test("rejects a truncated daemon VARINT", () => {
    expect(() =>
      new MMRBranch().fromBuffer(Buffer.from("0280", "hex"))
    ).toThrow();
  });

  test.each([31, 33])(
    "does not serialize a %i-byte value as a daemon uint256 hash",
    (length) => {
      const branch = new MMRBranch(2, 0, 1, [Buffer.alloc(length)]);
      expect(() => branch.toBuffer()).toThrow();
    }
  );

  test.each([
    ["index", 0x100000000, 1],
    ["size", 0, 0x100000000],
  ])(
    "does not serialize an MMR %s outside the daemon uint32 field",
    (_field, index, size) => {
      expect(() => new MMRBranch(2, index, size, []).toBuffer()).toThrow();
    }
  );
});

describe("Verus daemon CMMRProof wire compatibility", () => {
  test("initializes an empty proof as a serializable value", () => {
    const proof = new MMRProof();
    expect(() => proof.toBuffer()).not.toThrow();
    expect(proof.toBuffer().toString("hex")).toBe("00000000");
  });

  test.each(supportedFullProofs)(
    "serializes canonical full proof $name",
    (fixture) => {
      const expected = Buffer.from(fixture.hex, "hex");
      const proof = toMMRProof(fixture.branches);

      expect(proof.dataByteLength()).toBe(expected.length);
      expect(proof.toBuffer()).toEqual(expected);
    }
  );

  test.each(fixtures.canonical.fullProofs)(
    "consumes and dispatches every canonical daemon branch in $name",
    (fixture) => {
      const bytes = Buffer.from(fixture.hex, "hex");
      const proof = new MMRProof();

      expect(proof.fromDataBuffer(bytes)).toBe(bytes.length);
      expect(proof.proofSequence.map((branch) => branch.branchType)).toEqual(
        fixture.branches.map((branch) => branchType(branch))
      );
    }
  );

  test.each(supportedFullProofs)(
    "deserializes canonical full proof $name",
    (fixture) => {
      const bytes = Buffer.from(fixture.hex, "hex");
      const proof = new MMRProof();

      expect(proof.fromDataBuffer(bytes)).toBe(bytes.length);
      expect(proof.proofSequence).toHaveLength(fixture.branches.length);
      proof.proofSequence.forEach((branch, index) =>
        expectBranch(branch, fixture.branches[index])
      );
    }
  );

  test.each(fixtures.canonical.proofCountPrefixes)(
    "writes proof count $value as fixed little-endian int32 $hex",
    ({ value, hex }) => {
      const proof = toMMRProof(
        Array.from({ length: value }, () => ({
          branchType: 2,
          index: 0,
          size: 1,
          hashes: [],
          hex: "02000100",
        }))
      );

      expect(proof.toBuffer().subarray(0, 4).toString("hex")).toBe(hex);
    }
  );

  test("writes both the dispatch tag and the branch's own type tag", () => {
    const proof = toMMRProof([
      {
        branchType: 2,
        index: 0,
        size: 1,
        hashes: [],
        hex: "02000100",
      },
    ]);
    const serialized = proof.toBuffer();

    // CMMRProof writes the outer type to select a concrete class. That class
    // then serializes CMerkleBranchBase and writes the same type again.
    expect(serialized.subarray(4, 6).toString("hex")).toBe("0202");
  });

  test("honors a non-zero proof offset without consuming a following object", () => {
    const proofBytes = Buffer.from("010000000202000100", "hex");
    const prefix = Buffer.from("a1b2c3", "hex");
    const suffix = Buffer.from("d4e5f6", "hex");
    const input = Buffer.concat([prefix, proofBytes, suffix]);
    const before = Buffer.from(input);
    const proof = new MMRProof();

    const endOffset = proof.fromDataBuffer(input, prefix.length);

    expect(endOffset).toBe(prefix.length + proofBytes.length);
    expect(proof.proofSequence).toHaveLength(1);
    expectBranch(proof.proofSequence[0], {
      branchType: 2,
      index: 0,
      size: 1,
      hashes: [],
      hex: "02000100",
    });
    expect(input).toEqual(before);
    expect(input.subarray(endOffset)).toEqual(suffix);
  });

  test("rejects a negative fixed proof count", () => {
    expect(() =>
      new MMRProof().fromDataBuffer(Buffer.from("ffffffff", "hex"))
    ).toThrow();
  });

  test("rejects an unknown outer branch dispatch tag", () => {
    expect(() =>
      new MMRProof().fromDataBuffer(Buffer.from("0100000006", "hex"))
    ).toThrow();
  });

  test("does not accept mismatched outer and inner branch tags", () => {
    const proof = new MMRProof();
    let threw = false;

    try {
      // Outer MMR-node tag followed by an inner power-node tag.
      proof.fromDataBuffer(Buffer.from("010000000203000100", "hex"));
    } catch (_error) {
      threw = true;
    }

    expect(threw || proof.proofSequence.length === 0).toBe(true);
  });

  test("rejects a truncated branch hash", () => {
    const truncated = Buffer.from(
      `010000000202000101${"00".repeat(31)}`,
      "hex"
    );
    expect(() => new MMRProof().fromDataBuffer(truncated)).toThrow();
  });
});

const liveProofs: Array<{
  name: string;
  containerHex: string;
  proof: LiveMMRProof;
}> = [
  ...fixtures.live.headerProofs
    .filter((entry) => entry.headerProof != null)
    .map((entry) => ({
      name: `header ${entry.name}`,
      containerHex: entry.blockHeaderProofHex!,
      proof: entry.headerProof!,
    })),
  ...fixtures.live.identityTransactionProofs
    .filter((entry) => entry.txProof != null)
    .map((entry) => ({
      name: `identity transaction ${entry.name}`,
      containerHex: entry.wireHex!,
      proof: entry.txProof!,
    })),
  ...fixtures.live.identityTransactionProofs.flatMap((entry) =>
    (entry.components?.items || []).map((component, index) => ({
      name: `identity transaction ${entry.name} component ${index} elProof`,
      containerHex: entry.wireHex!,
      proof: component.elProof,
    }))
  ),
];

describe("proofs captured from VRSCTEST", () => {
  test.each(fixtures.live.identityTransactionProofs)(
    "identity wrapper $name has self-consistent bytes and nested offsets",
    (fixture) => {
      if (
        fixture.wireHex == null ||
        fixture.byteLength == null ||
        fixture.sha256 == null ||
        fixture.components == null
      ) {
        throw new Error(`Incomplete identity proof fixture ${fixture.name}`);
      }

      const wrapper = Buffer.from(fixture.wireHex, "hex");
      const components = fixture.components;
      expect(wrapper.length).toBe(fixture.byteLength);
      expect(createHash("sha256").update(wrapper).digest("hex")).toBe(
        fixture.sha256
      );
      expect(
        wrapper
          .subarray(
            components.offset,
            components.offset + components.byteLength
          )
          .toString("hex")
      ).toBe(components.wireHex);
      expect(components.count).toBe(components.items.length);
      expect({
        count: components.count,
        countEncoding: components.countEncoding,
      }).toEqual({ count: 2, countEncoding: "02" });
      expect(
        wrapper
          .subarray(
            components.offset,
            components.offset + components.countEncoding.length / 2
          )
          .toString("hex")
      ).toBe(components.countEncoding);

      let nextOffset = components.offset + components.countEncoding.length / 2;
      components.items.forEach((component) => {
        expect(component.offset).toBe(nextOffset);
        expect(
          wrapper
            .subarray(component.offset, component.offset + component.byteLength)
            .toString("hex")
        ).toBe(component.wireHex);
        expect(
          wrapper
            .subarray(
              component.elProof.offset,
              component.elProof.offset + component.elProof.byteLength
            )
            .toString("hex")
        ).toBe(component.elProof.proofWireHex);
        expect(component.elProof.offset + component.elProof.byteLength).toBe(
          component.offset + component.byteLength
        );
        nextOffset += component.byteLength;
      });

      expect(nextOffset).toBe(components.offset + components.byteLength);
      expect(nextOffset).toBe(wrapper.length);
    }
  );

  test.each(liveProofs)(
    "parses $name byte-for-byte at its enclosing-object offset",
    ({ containerHex, proof: fixture }) => {
      const container = Buffer.from(containerHex, "hex");
      const before = Buffer.from(container);
      const expectedProofBytes = Buffer.from(fixture.proofWireHex, "hex");
      const proof = new MMRProof();

      expect(expectedProofBytes.length).toBe(fixture.byteLength);
      expect(
        container.subarray(fixture.offset, fixture.offset + fixture.byteLength)
      ).toEqual(expectedProofBytes);
      expect(proof.fromDataBuffer(container, fixture.offset)).toBe(
        fixture.offset + fixture.byteLength
      );
      expect(proof.proofSequence).toHaveLength(fixture.branches.length);
      proof.proofSequence.forEach((branch, index) =>
        expectBranch(branch, fixture.branches[index])
      );
      expect(container).toEqual(before);
    }
  );
});
