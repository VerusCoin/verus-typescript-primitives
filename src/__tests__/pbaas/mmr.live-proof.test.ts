import * as crypto from "crypto";

import { MMRBranch } from "../../pbaas/MMR";

const blake2b = require("blake2b");

type HashPair = {
  displayHex: string;
  wireHex: string;
};

type FixtureBranch = {
  offset: number;
  byteLength: number;
  branchType: number;
  outerType?: number;
  index: number;
  size: number;
  indexEncoding: string;
  sizeEncoding: string;
  hashCountEncoding: string;
  hashes: string[];
  hashesDisplay: string[];
  wireHex: string;
  proofEntryOffset?: number;
  proofEntryByteLength?: number;
  proofEntryWireHex?: string;
};

type LiveHeaderProofFixture = {
  name: string;
  proveHeight: number;
  atHeight: number;
  proveBlockHash: HashPair;
  atBlockHash: HashPair;
  proofRoot: {
    height: number;
    stateRoot: HashPair;
    blockHash: HashPair;
    power: HashPair;
  };
  blockHeaderProofHex: string;
  blockHeaderProofSha256: string;
  version: number;
  byteLength: number;
  headerProof: {
    offset: number;
    byteLength: number;
    branchCount: number;
    branches: FixtureBranch[];
    proofWireHex: string;
  };
  mmrBridge: FixtureBranch;
  preHeader: {
    offset: number;
    byteLength: number;
    wireHex: string;
  };
};

const fixture = require("../fixtures/mmr/veruscoin-v1.json") as {
  live: { headerProofs: LiveHeaderProofFixture[] };
};

class DaemonWireReader {
  readonly buffer: Buffer;
  offset = 0;

  constructor(hex: string) {
    if (hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) {
      throw new Error("Expected even-length hexadecimal daemon data");
    }
    this.buffer = Buffer.from(hex, "hex");
  }

  remaining(): number {
    return this.buffer.length - this.offset;
  }

  read(length: number, label: string): Buffer {
    if (!Number.isInteger(length) || length < 0 || length > this.remaining()) {
      throw new Error(
        `${label}: cannot read ${length} bytes at offset ${this.offset}`
      );
    }
    const value = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readUInt8(label: string): number {
    return this.read(1, label)[0];
  }

  readInt32LE(label: string): number {
    return this.read(4, label).readInt32LE(0);
  }

  readUInt16LE(label: string): number {
    return this.read(2, label).readUInt16LE(0);
  }

  readUInt32LE(label: string): number {
    return this.read(4, label).readUInt32LE(0);
  }

  readVarInt(label: string): { value: number; hex: string } {
    const start = this.offset;
    let value = 0;
    let bytes = 0;

    while (true) {
      const next = this.readUInt8(label);
      value = value * 128 + (next & 0x7f);
      bytes++;
      if (!Number.isSafeInteger(value) || bytes > 10) {
        throw new Error(
          `${label}: VARINT is outside the supported uint64 range`
        );
      }
      if ((next & 0x80) === 0) break;
      value++;
    }

    return {
      value,
      hex: this.buffer.subarray(start, this.offset).toString("hex"),
    };
  }

  readCompactSize(label: string): { value: number; hex: string } {
    const start = this.offset;
    const first = this.readUInt8(label);
    let value: number;

    if (first < 253) value = first;
    else if (first === 253) value = this.readUInt16LE(label);
    else if (first === 254) value = this.readUInt32LE(label);
    else {
      const low = this.readUInt32LE(label);
      const high = this.readUInt32LE(label);
      value = low + high * 0x100000000;
      if (!Number.isSafeInteger(value)) {
        throw new Error(
          `${label}: CompactSize exceeds Number.MAX_SAFE_INTEGER`
        );
      }
    }

    return {
      value,
      hex: this.buffer.subarray(start, this.offset).toString("hex"),
    };
  }
}

type DecodedBranch = {
  offset: number;
  byteLength: number;
  branchType: number;
  index: number;
  size: number;
  indexEncoding: string;
  sizeEncoding: string;
  hashCountEncoding: string;
  hashes: Buffer[];
  wireHex: string;
};

type DecodedProofEntry = DecodedBranch & {
  outerType: number;
  proofEntryOffset: number;
  proofEntryByteLength: number;
  proofEntryWireHex: string;
};

const decodeBranch = (reader: DaemonWireReader): DecodedBranch => {
  const offset = reader.offset;
  const branchType = reader.readUInt8("MMR branch type");
  if (branchType !== 2 && branchType !== 3) {
    throw new Error(`Unsupported live MMR branch type ${branchType}`);
  }

  const index = reader.readVarInt("MMR branch index");
  const size = reader.readVarInt("MMR branch size");
  const hashCount = reader.readCompactSize("MMR branch hash count");
  const hashes: Buffer[] = [];
  for (let i = 0; i < hashCount.value; i++) {
    hashes.push(reader.read(32, `MMR branch hash ${i}`));
  }

  return {
    offset,
    byteLength: reader.offset - offset,
    branchType,
    index: index.value,
    size: size.value,
    indexEncoding: index.hex,
    sizeEncoding: size.hex,
    hashCountEncoding: hashCount.hex,
    hashes,
    wireHex: reader.buffer.subarray(offset, reader.offset).toString("hex"),
  };
};

const decodeMMRProof = (reader: DaemonWireReader) => {
  const offset = reader.offset;
  const branchCount = reader.readInt32LE("CMMRProof branch count");
  if (branchCount < 0 || branchCount > 1_000) {
    throw new Error(`Invalid CMMRProof branch count ${branchCount}`);
  }

  const branches: DecodedProofEntry[] = [];
  for (let i = 0; i < branchCount; i++) {
    const proofEntryOffset = reader.offset;
    const outerType = reader.readUInt8(`CMMRProof branch ${i} outer type`);
    const branch = decodeBranch(reader);
    if (outerType !== branch.branchType) {
      throw new Error(
        `CMMRProof branch ${i} has mismatched types ${outerType}/${branch.branchType}`
      );
    }
    branches.push({
      ...branch,
      outerType,
      proofEntryOffset,
      proofEntryByteLength: reader.offset - proofEntryOffset,
      proofEntryWireHex: reader.buffer
        .subarray(proofEntryOffset, reader.offset)
        .toString("hex"),
    });
  }

  return {
    offset,
    byteLength: reader.offset - offset,
    branchCount,
    branches,
    proofWireHex: reader.buffer.subarray(offset, reader.offset).toString("hex"),
  };
};

const decodeBlockHeaderProof = (hex: string) => {
  const reader = new DaemonWireReader(hex);
  const version = reader.readVarInt("CBlockHeaderProof version");
  const headerProof = decodeMMRProof(reader);
  const mmrBridge = decodeBranch(reader);
  const preHeaderOffset = reader.offset;
  const preHeader = reader.read(196, "CPBaaSPreHeader");
  if (reader.remaining() !== 0) {
    throw new Error(
      `CBlockHeaderProof has ${reader.remaining()} trailing bytes`
    );
  }

  return {
    version: version.value,
    versionEncoding: version.hex,
    byteLength: reader.buffer.length,
    headerProof,
    mmrBridge,
    preHeader: {
      offset: preHeaderOffset,
      byteLength: preHeader.length,
      wireHex: preHeader.toString("hex"),
      blockMMRRoot: preHeader.subarray(164, 196),
    },
  };
};

// Literal arithmetic port of the daemon's uint64_t proof-index routine. The
// live fixtures stay below Number.MAX_SAFE_INTEGER, and this avoids JavaScript
// bitwise operators (which coerce values to signed uint32).
const daemonProofIndex = (
  pos: number,
  mmvSize: number,
  extraHashes: number
): number => {
  let result = 0;
  let bitPosition = 0;
  const sizes: number[] = [];
  const peakIndexes: number[] = [];
  const merkleSizes: number[] = [];

  if (!(pos > 0 && pos < mmvSize)) return 0;

  while (mmvSize) {
    sizes.push(mmvSize);
    mmvSize = Math.floor(mmvSize / 2);
  }

  for (let height = 0; height < sizes.length; height++) {
    if (height === sizes.length - 1 || sizes[height] % 2 === 1) {
      peakIndexes.unshift(height);
    }
  }

  let layerNumber = 0;
  let layerSize = peakIndexes.length;
  do {
    const passThrough = layerSize % 2;
    layerSize = Math.floor(layerSize / 2) + passThrough;
    if (layerSize) merkleSizes.push(layerSize);
    layerNumber++;
  } while (layerNumber === 0 || layerSize > 1);

  bitPosition += extraHashes;
  let pathPosition = pos;
  for (let level = 0; level < sizes.length; level++) {
    if (pathPosition % 2 === 1) {
      result += 2 ** bitPosition++;
      pathPosition = Math.floor(pathPosition / 2);
      bitPosition += extraHashes;
    } else if (sizes[level] > pathPosition + 1) {
      bitPosition++;
      pathPosition = Math.floor(pathPosition / 2);
      bitPosition += extraHashes;
    } else {
      let peakPosition = 0;
      while (
        peakPosition < peakIndexes.length &&
        peakIndexes[peakPosition] !== level
      ) {
        peakPosition++;
      }
      if (peakPosition === peakIndexes.length) {
        throw new Error("MMR proof position does not resolve to a peak");
      }

      pathPosition = peakPosition;
      let peakLayer = -1;
      let peakLayerSize = peakIndexes.length;
      while (peakLayer === -1 || peakLayerSize > 1) {
        if (pathPosition < peakLayerSize - 1 || pathPosition % 2 === 1) {
          if (pathPosition % 2 === 1) result += 2 ** bitPosition;
          bitPosition++;
          bitPosition += extraHashes;
        }
        pathPosition = Math.floor(pathPosition / 2);
        peakLayer++;
        peakLayerSize = merkleSizes[peakLayer];
      }
      break;
    }
  }

  if (!Number.isSafeInteger(result)) {
    throw new Error("Fixture proof index exceeds Number.MAX_SAFE_INTEGER");
  }
  return result;
};

const VERUS_BLAKE2B_PERSONALIZATION = Buffer.from("VerusDefaultHash", "ascii");

const hashPair = (left: Buffer, right: Buffer): Buffer => {
  const output = Buffer.alloc(32);
  return blake2b(32, null, null, VERUS_BLAKE2B_PERSONALIZATION)
    .update(left)
    .update(right)
    .digest(output);
};

const checkDaemonBranch = (input: Buffer, branch: DecodedBranch): Buffer => {
  const extraHashes = branch.branchType === 3 ? 1 : 0;
  let proofIndex = daemonProofIndex(branch.index, branch.size, extraHashes);
  let hash = input;

  for (const proofHash of branch.hashes) {
    if (proofIndex % 2 === 1) {
      if (proofHash.equals(hash)) {
        throw new Error(
          "Non-canonical MMR proof has its current hash on the right"
        );
      }
      hash = hashPair(proofHash, hash);
    } else {
      hash = hashPair(hash, proofHash);
    }
    proofIndex = Math.floor(proofIndex / 2);
  }
  return hash;
};

const checkDaemonProof = (input: Buffer, branches: DecodedBranch[]): Buffer =>
  branches.reduce(checkDaemonBranch, input);

const reverseHex = (wire: Buffer): string =>
  Buffer.from(wire).reverse().toString("hex");

const expectHashPairByteOrder = (hash: HashPair): void => {
  expect(reverseHex(Buffer.from(hash.wireHex, "hex"))).toBe(hash.displayHex);
};

const branchMetadata = (
  branch: Pick<
    FixtureBranch,
    | "offset"
    | "byteLength"
    | "branchType"
    | "index"
    | "size"
    | "indexEncoding"
    | "sizeEncoding"
    | "hashCountEncoding"
    | "wireHex"
  > & { hashes: Array<Buffer | string> }
) => ({
  offset: branch.offset,
  byteLength: branch.byteLength,
  branchType: branch.branchType,
  index: branch.index,
  size: branch.size,
  indexEncoding: branch.indexEncoding,
  sizeEncoding: branch.sizeEncoding,
  hashCountEncoding: branch.hashCountEncoding,
  hashes: branch.hashes.map((hash) =>
    Buffer.isBuffer(hash) ? hash.toString("hex") : hash
  ),
  wireHex: branch.wireHex,
});

describe("daemon-derived CBlockHeaderProof fixtures", () => {
  test.each(fixture.live.headerProofs)(
    "$name independently decodes and proves its recorded chain state root",
    (proofFixture) => {
      const decoded = decodeBlockHeaderProof(proofFixture.blockHeaderProofHex);

      expect(decoded.version).toBe(proofFixture.version);
      expect(decoded.versionEncoding).toBe("00");
      expect(decoded.byteLength).toBe(proofFixture.byteLength);
      expect(
        crypto
          .createHash("sha256")
          .update(Buffer.from(proofFixture.blockHeaderProofHex, "hex"))
          .digest("hex")
      ).toBe(proofFixture.blockHeaderProofSha256);

      expect(decoded.headerProof.offset).toBe(proofFixture.headerProof.offset);
      expect(decoded.headerProof.byteLength).toBe(
        proofFixture.headerProof.byteLength
      );
      expect(decoded.headerProof.branchCount).toBe(2);
      expect(decoded.headerProof.proofWireHex).toBe(
        proofFixture.headerProof.proofWireHex
      );
      expect(decoded.headerProof.branches.map(branchMetadata)).toEqual(
        proofFixture.headerProof.branches.map(branchMetadata)
      );
      decoded.headerProof.branches.forEach((branch, index) => {
        const expected = proofFixture.headerProof.branches[index];
        expect(branch.outerType).toBe(expected.outerType);
        expect(branch.proofEntryOffset).toBe(expected.proofEntryOffset);
        expect(branch.proofEntryByteLength).toBe(expected.proofEntryByteLength);
        expect(branch.proofEntryWireHex).toBe(expected.proofEntryWireHex);
        expect(branch.hashes.map(reverseHex)).toEqual(expected.hashesDisplay);
      });

      expect(branchMetadata(decoded.mmrBridge)).toEqual(
        branchMetadata(proofFixture.mmrBridge)
      );
      expect(decoded.mmrBridge.hashes.map(reverseHex)).toEqual(
        proofFixture.mmrBridge.hashesDisplay
      );
      expect(decoded.preHeader).toMatchObject(proofFixture.preHeader);

      [
        proofFixture.proveBlockHash,
        proofFixture.atBlockHash,
        proofFixture.proofRoot.stateRoot,
        proofFixture.proofRoot.blockHash,
        proofFixture.proofRoot.power,
      ].forEach(expectHashPairByteOrder);

      const [blockHashBridge, powerBranch] = decoded.headerProof.branches;
      expect(blockHashBridge).toMatchObject({
        outerType: 2,
        branchType: 2,
        index: 1,
        size: 2,
      });
      expect(blockHashBridge.hashes).toHaveLength(1);
      // For the legacy height-1 header, CBlockIndex::BlockMMRRoot selects
      // hashMerkleRoot while CPBaaSPreHeader retains the solution descriptor's
      // hashBlockMMRRoot. Later Verus-v2 headers connect the fields exactly.
      if (proofFixture.proveHeight !== 1) {
        expect(blockHashBridge.hashes[0]).toEqual(
          decoded.preHeader.blockMMRRoot
        );
      }

      expect(powerBranch).toMatchObject({
        outerType: 3,
        branchType: 3,
        index: proofFixture.proveHeight,
        size: proofFixture.atHeight + 1,
      });
      expect(powerBranch.hashes.length % 2).toBe(1);
      expect(
        powerBranch.hashes[powerBranch.hashes.length - 1].toString("hex")
      ).toBe(proofFixture.proofRoot.power.wireHex);

      expect(decoded.mmrBridge).toMatchObject({
        branchType: 2,
        index: 0,
        size: 2,
      });
      expect(decoded.mmrBridge.hashes).toHaveLength(1);
      expect(decoded.mmrBridge.hashes[0].toString("hex")).toBe(
        proofFixture.proveBlockHash.wireHex
      );

      expect(proofFixture.proofRoot.height).toBe(proofFixture.atHeight);
      expect(proofFixture.proofRoot.blockHash).toEqual(
        proofFixture.atBlockHash
      );

      const calculatedRoot = checkDaemonProof(
        Buffer.from(proofFixture.proveBlockHash.wireHex, "hex"),
        decoded.headerProof.branches
      );
      expect(calculatedRoot.toString("hex")).toBe(
        proofFixture.proofRoot.stateRoot.wireHex
      );
      expect(reverseHex(calculatedRoot)).toBe(
        proofFixture.proofRoot.stateRoot.displayHex
      );
    }
  );
});

describe("MMRBranch power-node proof semantics", () => {
  test("safeCheck honors the type-3 extra power hash at the 128 index boundary", () => {
    const proofFixture = fixture.live.headerProofs.find(
      (entry) => entry.name === "index-128"
    );
    if (!proofFixture) throw new Error("Missing index-128 live proof fixture");

    const decoded = decodeBlockHeaderProof(proofFixture.blockHeaderProofHex);
    const [nodeBranch, powerBranch] = decoded.headerProof.branches;
    const blockHash = Buffer.from(proofFixture.proveBlockHash.wireHex, "hex");

    const libraryNodeBranch = new MMRBranch(
      nodeBranch.branchType,
      nodeBranch.index,
      nodeBranch.size,
      nodeBranch.hashes.map((hash) => Buffer.from(hash))
    );
    const libraryPowerBranch = new MMRBranch(
      powerBranch.branchType,
      powerBranch.index,
      powerBranch.size,
      powerBranch.hashes.map((hash) => Buffer.from(hash))
    );

    const daemonBridgeHash = checkDaemonBranch(blockHash, nodeBranch);
    const libraryBridgeHash = libraryNodeBranch.safeCheck(blockHash);
    expect(libraryBridgeHash).toEqual(daemonBridgeHash);

    const libraryRoot = libraryPowerBranch.safeCheck(libraryBridgeHash);
    expect(libraryRoot.toString("hex")).toBe(
      proofFixture.proofRoot.stateRoot.wireHex
    );
  });
});
