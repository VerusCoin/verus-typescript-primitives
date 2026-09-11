#!/usr/bin/env node

"use strict";

// Generates credential-free MMR wire fixtures from a local VRSCTEST daemon.
//
// Required environment variables:
//   VRSCTEST_RPC_URL
//   VRSCTEST_RPC_USER
//   VRSCTEST_RPC_PASSWORD
//
// All RPCs below are read-only and all chain-dependent requests are pinned to
// block heights/hashes. The output intentionally contains wire-order and
// display-order hashes because uint256 RPC strings reverse serialized bytes.

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");

const OUTPUT_PATH = path.resolve(
  __dirname,
  "../src/__tests__/fixtures/mmr/veruscoin-v1.json"
);

const CHAIN = Object.freeze({
  name: "VRSCTEST",
  id: "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq",
  identity: "VRSCTEST@",
  fixtureProofHeight: 1213414,
  fixtureProofBlockHash:
    "000000048a6a6d201b1c79dbefaa56de996a26015bf18b0639e90019c6e5fc44",
  fixtureStateRoot:
    "2140672fb4f49aca541d8fe80a6fcdfef97137b10dc1579edaa1538a4bce82c9",
  fixturePower:
    "000000000000009e59cdf5e7894558630000000000000000000b77d9f34e056f",
});

const SKIP_CHALLENGE_CASES = Object.freeze([
  { name: "size-127", proveHeight: 1, atHeight: 126 },
  { name: "size-128", proveHeight: 1, atHeight: 127 },
  { name: "size-129", proveHeight: 1, atHeight: 128 },
  { name: "index-127", proveHeight: 127, atHeight: 129 },
  { name: "index-128", proveHeight: 128, atHeight: 129 },
  { name: "index-252", proveHeight: 252, atHeight: 253 },
  { name: "index-253", proveHeight: 253, atHeight: 254 },
  { name: "size-16511", proveHeight: 1, atHeight: 16510 },
  { name: "size-16512", proveHeight: 1, atHeight: 16511 },
  { name: "index-16511", proveHeight: 16511, atHeight: 16512 },
  { name: "index-16512", proveHeight: 16512, atHeight: 16513 },
]);

const IDENTITY_CASES = Object.freeze([
  {
    name: "identity-v1-height-235",
    height: 235,
    blockHash:
      "00000005c299c485ea26bb314c6bc1ad5e0cb1f689e1ade463d33f73ccf0f1b2",
    txid: "f077b510957a4193a4790f19d4991bc9cb3dd37826691fe60c12e6a340a145b2",
    voutnum: 0,
    version: 1,
  },
  {
    name: "identity-v2-height-1186412",
    height: 1186412,
    blockHash:
      "00000000bc747b18d7dec99a1412a55a20dde4f4ae5fd2dd99e3281a30ae6654",
    txid: "a65d3ee483d77684f6b5602340e36704fd2c8158c83c1c989879ade12e07c9f1",
    voutnum: 0,
    version: 2,
  },
]);

const rpcUrl = process.env.VRSCTEST_RPC_URL;
const rpcUser = process.env.VRSCTEST_RPC_USER;
const rpcPassword = process.env.VRSCTEST_RPC_PASSWORD;

if (!rpcUrl || !rpcUser || !rpcPassword) {
  throw new Error(
    "Set VRSCTEST_RPC_URL, VRSCTEST_RPC_USER, and VRSCTEST_RPC_PASSWORD"
  );
}

let nextRpcId = 1;

function rpcRequest(payload) {
  const url = new URL(rpcUrl);
  const transport = url.protocol === "https:" ? https : http;
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const request = transport.request(
      url,
      {
        method: "POST",
        auth: `${rpcUser}:${rpcPassword}`,
        headers: {
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const responseBody = Buffer.concat(chunks).toString("utf8");
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(`RPC HTTP ${response.statusCode}: ${responseBody}`)
            );
            return;
          }

          try {
            resolve(JSON.parse(responseBody));
          } catch (error) {
            reject(new Error(`RPC returned invalid JSON: ${error.message}`));
          }
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(30000, () => {
      request.destroy(new Error("RPC request timed out after 30000ms"));
    });
    request.end(body);
  });
}

async function rpc(method, params) {
  const id = `mmr-fixture-${nextRpcId++}`;
  const response = await rpcRequest({ jsonrpc: "1.0", id, method, params });
  if (response.error) {
    throw new Error(`${method}: ${JSON.stringify(response.error)}`);
  }
  return response.result;
}

async function rpcBatch(calls) {
  const requests = calls.map((call) => ({
    jsonrpc: "1.0",
    id: `mmr-fixture-${nextRpcId++}`,
    method: call.method,
    params: call.params,
  }));
  const response = await rpcRequest(requests);
  if (!Array.isArray(response)) {
    throw new Error("Batch RPC response was not an array");
  }

  const byId = new Map(response.map((item) => [item.id, item]));
  return requests.map((request) => {
    const item = byId.get(request.id);
    if (!item) throw new Error(`Missing response for ${request.id}`);
    if (item.error) {
      throw new Error(`${request.method}: ${JSON.stringify(item.error)}`);
    }
    return item.result;
  });
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${actual}`);
  }
}

function assertHex(hex, label) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]*$/i.test(hex)
  ) {
    throw new Error(`${label} is not even-length hexadecimal data`);
  }
}

function reverseHex(hex) {
  assertHex(hex, "hash");
  return Buffer.from(hex, "hex").reverse().toString("hex");
}

function hashPair(displayHex) {
  return { displayHex, wireHex: reverseHex(displayHex) };
}

function sha256(hex) {
  return crypto
    .createHash("sha256")
    .update(Buffer.from(hex, "hex"))
    .digest("hex");
}

function numberFromBigInt(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`${label} exceeds JavaScript's safe integer range`);
  }
  return Number(value);
}

class WireReader {
  constructor(hex) {
    assertHex(hex, "wire value");
    this.buffer = Buffer.from(hex, "hex");
    this.offset = 0;
  }

  remaining() {
    return this.buffer.length - this.offset;
  }

  readBytes(length, label) {
    if (!Number.isInteger(length) || length < 0 || length > this.remaining()) {
      throw new Error(
        `${label}: need ${length} bytes at ${
          this.offset
        }, have ${this.remaining()}`
      );
    }
    const result = this.buffer.subarray(this.offset, this.offset + length);
    this.offset += length;
    return result;
  }

  readUInt8(label) {
    return this.readBytes(1, label)[0];
  }

  readInt32LE(label) {
    return this.readBytes(4, label).readInt32LE(0);
  }

  readUInt16LE(label) {
    return this.readBytes(2, label).readUInt16LE(0);
  }

  readUInt32LE(label) {
    return this.readBytes(4, label).readUInt32LE(0);
  }

  readBigUInt64LE(label) {
    return this.readBytes(8, label).readBigUInt64LE(0);
  }

  readVarInt(label) {
    const start = this.offset;
    let value = 0n;
    while (true) {
      const byte = this.readUInt8(label);
      value = (value << 7n) | BigInt(byte & 0x7f);
      if ((byte & 0x80) === 0) break;
      value += 1n;
    }
    return {
      value,
      hex: this.buffer.subarray(start, this.offset).toString("hex"),
    };
  }

  readCompactSize(label) {
    const start = this.offset;
    const first = this.readUInt8(label);
    let value;
    if (first < 253) value = BigInt(first);
    else if (first === 253) value = BigInt(this.readUInt16LE(label));
    else if (first === 254) value = BigInt(this.readUInt32LE(label));
    else value = this.readBigUInt64LE(label);
    return {
      value,
      hex: this.buffer.subarray(start, this.offset).toString("hex"),
    };
  }
}

function readByteVector(reader, label) {
  const count = reader.readCompactSize(`${label} length`);
  return reader
    .readBytes(numberFromBigInt(count.value, `${label} length`), label)
    .toString("hex");
}

function readHashVector(reader, label) {
  const count = reader.readCompactSize(`${label} count`);
  const length = numberFromBigInt(count.value, `${label} count`);
  const hashes = [];
  for (let i = 0; i < length; i++) {
    hashes.push(reader.readBytes(32, `${label}[${i}]`).toString("hex"));
  }
  return { countEncoding: count.hex, hashes };
}

function readRlpProof(reader, label) {
  const count = reader.readVarInt(`${label} count`);
  const length = numberFromBigInt(count.value, `${label} count`);
  const values = [];
  for (let i = 0; i < length; i++) {
    values.push(readByteVector(reader, `${label}[${i}]`));
  }
  return { countEncoding: count.hex, values };
}

function parseStandaloneBranch(reader) {
  const start = reader.offset;
  const branchType = reader.readUInt8("branch type");
  const branch = { branchType };

  if (branchType === 1) {
    const index = reader.readVarInt("BTC branch index");
    const hashVector = readHashVector(reader, "BTC branch hashes");
    Object.assign(branch, {
      index: numberFromBigInt(index.value, "BTC branch index"),
      indexEncoding: index.hex,
      hashes: hashVector.hashes,
      hashesDisplay: hashVector.hashes.map(reverseHex),
      hashCountEncoding: hashVector.countEncoding,
    });
  } else if (branchType === 2 || branchType === 3) {
    const index = reader.readVarInt("MMR branch index");
    const size = reader.readVarInt("MMR branch size");
    const hashVector = readHashVector(reader, "MMR branch hashes");
    Object.assign(branch, {
      index: numberFromBigInt(index.value, "MMR branch index"),
      size: numberFromBigInt(size.value, "MMR branch size"),
      indexEncoding: index.hex,
      sizeEncoding: size.hex,
      hashes: hashVector.hashes,
      hashesDisplay: hashVector.hashes.map(reverseHex),
      hashCountEncoding: hashVector.countEncoding,
    });
  } else if (branchType === 4) {
    const proofData = readRlpProof(reader, "ETH account proof");
    const address = reader.readBytes(20, "ETH address").toString("hex");
    const balance = reader.readBytes(32, "ETH balance").toString("hex");
    const codeHash = reader.readBytes(32, "ETH code hash").toString("hex");
    const nonce = reader.readVarInt("ETH nonce");
    const storageHash = reader
      .readBytes(32, "ETH storage hash")
      .toString("hex");
    const storageProofKey = reader
      .readBytes(32, "ETH storage proof key")
      .toString("hex");
    const storageProof = readRlpProof(reader, "ETH storage proof");
    Object.assign(branch, {
      proofData,
      address,
      balance,
      codeHash,
      nonce: numberFromBigInt(nonce.value, "ETH nonce"),
      nonceEncoding: nonce.hex,
      storageHash,
      storageProofKey,
      storageProof,
      hashes: [],
      hashesDisplay: [],
    });
  } else if (branchType === 5) {
    const data = readByteVector(reader, "multipart proof data");
    Object.assign(branch, { data, hashes: [], hashesDisplay: [] });
  } else {
    throw new Error(`Unknown daemon MMR branch type ${branchType}`);
  }

  branch.offset = start;
  branch.byteLength = reader.offset - start;
  branch.wireHex = reader.buffer.subarray(start, reader.offset).toString("hex");
  return branch;
}

function parseMMRProof(reader) {
  const start = reader.offset;
  const branchCount = reader.readInt32LE("CMMRProof branch count");
  if (branchCount < 0 || branchCount > 10000) {
    throw new Error(`Invalid CMMRProof branch count ${branchCount}`);
  }

  const branches = [];
  for (let i = 0; i < branchCount; i++) {
    const entryStart = reader.offset;
    const outerType = reader.readUInt8(`proof branch ${i} outer type`);
    const branch = parseStandaloneBranch(reader);
    if (outerType !== branch.branchType) {
      throw new Error(
        `CMMRProof branch ${i} type mismatch: ${outerType}/${branch.branchType}`
      );
    }
    branches.push({
      ...branch,
      outerType,
      proofEntryOffset: entryStart,
      proofEntryByteLength: reader.offset - entryStart,
      proofEntryWireHex: reader.buffer
        .subarray(entryStart, reader.offset)
        .toString("hex"),
    });
  }

  return {
    offset: start,
    byteLength: reader.offset - start,
    branchCount,
    branches,
    proofWireHex: reader.buffer.subarray(start, reader.offset).toString("hex"),
  };
}

function parseBlockHeaderProof(hex) {
  const reader = new WireReader(hex);
  const version = reader.readVarInt("CBlockHeaderProof version");
  const headerProof = parseMMRProof(reader);
  const mmrBridge = parseStandaloneBranch(reader);
  const preHeaderOffset = reader.offset;
  const preHeaderHex = reader
    .readBytes(reader.remaining(), "PBaaS preheader")
    .toString("hex");

  return {
    version: numberFromBigInt(version.value, "CBlockHeaderProof version"),
    versionEncoding: version.hex,
    byteLength: reader.buffer.length,
    headerProof,
    mmrBridge,
    preHeader: {
      offset: preHeaderOffset,
      byteLength: preHeaderHex.length / 2,
      wireHex: preHeaderHex,
    },
  };
}

function parseTransactionComponents(reader) {
  const start = reader.offset;
  const count = reader.readCompactSize("transaction component count");
  const componentCount = numberFromBigInt(
    count.value,
    "transaction component count"
  );
  const items = [];

  for (let index = 0; index < componentCount; index++) {
    const componentStart = reader.offset;
    const elType = reader.readUInt16LE(`component ${index} element type`);
    const elIdx = reader.readUInt16LE(`component ${index} element index`);
    const objectSize = reader.readCompactSize(`component ${index} object size`);
    const objectWireHex = reader
      .readBytes(
        numberFromBigInt(objectSize.value, `component ${index} object size`),
        `component ${index} object`
      )
      .toString("hex");
    const elProof = parseMMRProof(reader);

    items.push({
      offset: componentStart,
      byteLength: reader.offset - componentStart,
      elType,
      elIdx,
      object: {
        byteLength: objectWireHex.length / 2,
        lengthEncoding: objectSize.hex,
        wireHex: objectWireHex,
      },
      elProof,
      wireHex: reader.buffer
        .subarray(componentStart, reader.offset)
        .toString("hex"),
    });
  }

  return {
    offset: start,
    byteLength: reader.offset - start,
    count: componentCount,
    countEncoding: count.hex,
    items,
    wireHex: reader.buffer.subarray(start, reader.offset).toString("hex"),
  };
}

function parsePartialTransactionProof(hex) {
  const reader = new WireReader(hex);
  const version = reader.readUInt8("CPartialTransactionProof version");
  const type = reader.readUInt8("CPartialTransactionProof type");
  const txProof = parseMMRProof(reader);
  const components = parseTransactionComponents(reader);
  if (reader.remaining() !== 0) {
    throw new Error(
      `CPartialTransactionProof has ${reader.remaining()} trailing bytes`
    );
  }

  return {
    version,
    type,
    byteLength: reader.buffer.length,
    sha256: sha256(hex),
    wireHex: hex,
    txProof,
    components,
  };
}

function encodeVarInt(input) {
  let value = BigInt(input);
  if (value < 0n) throw new Error("VARINT cannot encode a negative value");
  const bytes = [];
  while (true) {
    bytes.push(Number(value & 0x7fn) | (bytes.length ? 0x80 : 0));
    if (value <= 0x7fn) break;
    value = (value >> 7n) - 1n;
  }
  return Buffer.from(bytes.reverse());
}

function encodeCompactSize(input) {
  const value = BigInt(input);
  if (value < 0n || value > 0xffffffffffffffffn) {
    throw new Error("CompactSize value is out of uint64 range");
  }
  if (value < 253n) return Buffer.from([Number(value)]);
  if (value <= 0xffffn) {
    const result = Buffer.alloc(3);
    result[0] = 253;
    result.writeUInt16LE(Number(value), 1);
    return result;
  }
  if (value <= 0xffffffffn) {
    const result = Buffer.alloc(5);
    result[0] = 254;
    result.writeUInt32LE(Number(value), 1);
    return result;
  }
  const result = Buffer.alloc(9);
  result[0] = 255;
  result.writeBigUInt64LE(value, 1);
  return result;
}

function encodeHashVector(hashes) {
  return Buffer.concat([
    encodeCompactSize(hashes.length),
    ...hashes.map((hash, index) => {
      assertHex(hash, `hash ${index}`);
      if (hash.length !== 64) throw new Error(`hash ${index} is not 32 bytes`);
      return Buffer.from(hash, "hex");
    }),
  ]);
}

function encodeByteVector(hex) {
  assertHex(hex, "byte vector");
  const data = Buffer.from(hex, "hex");
  return Buffer.concat([encodeCompactSize(data.length), data]);
}

function encodeRlpProof(values) {
  return Buffer.concat([
    encodeVarInt(values.length),
    ...values.map(encodeByteVector),
  ]);
}

function encodeStandaloneBranch(branch) {
  const type = Buffer.from([branch.branchType]);
  if (branch.branchType === 1) {
    return Buffer.concat([
      type,
      encodeVarInt(branch.index),
      encodeHashVector(branch.hashes),
    ]);
  }
  if (branch.branchType === 2 || branch.branchType === 3) {
    return Buffer.concat([
      type,
      encodeVarInt(branch.index),
      encodeVarInt(branch.size),
      encodeHashVector(branch.hashes),
    ]);
  }
  if (branch.branchType === 4) {
    return Buffer.concat([
      type,
      encodeRlpProof(branch.proofData),
      Buffer.from(branch.address, "hex"),
      Buffer.from(branch.balance, "hex"),
      Buffer.from(branch.codeHash, "hex"),
      encodeVarInt(branch.nonce),
      Buffer.from(branch.storageHash, "hex"),
      Buffer.from(branch.storageProofKey, "hex"),
      encodeRlpProof(branch.storageProof),
    ]);
  }
  if (branch.branchType === 5) {
    return Buffer.concat([type, encodeByteVector(branch.data)]);
  }
  throw new Error(`Cannot encode branch type ${branch.branchType}`);
}

function encodeMMRProof(branches) {
  const count = Buffer.alloc(4);
  count.writeInt32LE(branches.length);
  return Buffer.concat([
    count,
    ...branches.flatMap((branch) => [
      Buffer.from([branch.branchType]),
      encodeStandaloneBranch(branch),
    ]),
  ]);
}

function canonicalBranch(name, branch) {
  return {
    name,
    provenance: "source-derived-synthetic",
    ...branch,
    hex: encodeStandaloneBranch(branch).toString("hex"),
  };
}

function canonicalProof(name, branches) {
  return {
    name,
    provenance: "source-derived-synthetic",
    branches,
    hex: encodeMMRProof(branches).toString("hex"),
  };
}

function buildCanonicalFixtures() {
  const zero20 = "00".repeat(20);
  const zero32 = "00".repeat(32);
  const hashA = Array.from({ length: 32 }, (_, index) =>
    index.toString(16).padStart(2, "0")
  ).join("");
  const hashB = Array.from({ length: 32 }, (_, index) =>
    (255 - index).toString(16).padStart(2, "0")
  ).join("");

  const standaloneBranches = [
    canonicalBranch("btc-index-128-empty", {
      branchType: 1,
      index: 128,
      hashes: [],
    }),
    canonicalBranch("mmr-node-small-empty", {
      branchType: 2,
      index: 0,
      size: 1,
      hashes: [],
    }),
    canonicalBranch("mmr-node-varint-128-empty", {
      branchType: 2,
      index: 128,
      size: 128,
      hashes: [],
    }),
    canonicalBranch("mmr-power-varint-boundaries", {
      branchType: 3,
      index: 16512,
      size: 2113664,
      hashes: [hashA, hashB],
    }),
    canonicalBranch("eth-empty-fields", {
      branchType: 4,
      proofData: [],
      address: zero20,
      balance: zero32,
      codeHash: zero32,
      nonce: 0,
      storageHash: zero32,
      storageProofKey: zero32,
      storageProof: [],
      hashes: [],
    }),
    canonicalBranch("multipart-empty", {
      branchType: 5,
      data: "",
      hashes: [],
    }),
    canonicalBranch("multipart-compactsize-253-bytes", {
      branchType: 5,
      data: "a5".repeat(253),
      hashes: [],
    }),
  ];

  const byName = new Map(standaloneBranches.map((item) => [item.name, item]));
  const proofBranch = (name) => {
    const { hex, name: ignoredName, ...branch } = byName.get(name);
    return branch;
  };

  return {
    provenance: {
      kind: "source-derived-synthetic",
      liveRpcCaptured: false,
      daemonSourceFiles: [
        "../VerusCoin/src/mmr.h",
        "../VerusCoin/src/serialize.h",
      ],
      note: "These vectors are constructed from the daemon serialization definitions, including branch types 1, 4, and 5; they are not claimed to have been returned by an RPC.",
    },
    branchTypes: {
      invalid: 0,
      btc: 1,
      mmrBlakeNode: 2,
      mmrBlakePowerNode: 3,
      ethPatricia: 4,
      multipart: 5,
    },
    varints: [
      0n,
      1n,
      126n,
      127n,
      128n,
      129n,
      255n,
      256n,
      16383n,
      16384n,
      16511n,
      16512n,
      2113663n,
      2113664n,
      0x7fffffffn,
      0x80000000n,
      0xffffffffn,
    ].map((value) => ({
      value: value.toString(),
      hex: encodeVarInt(value).toString("hex"),
    })),
    compactSizes: [
      0n,
      1n,
      252n,
      253n,
      254n,
      255n,
      65535n,
      65536n,
      0xffffffffn,
      0x100000000n,
    ].map((value) => ({
      value: value.toString(),
      hex: encodeCompactSize(value).toString("hex"),
    })),
    proofCountPrefixes: [0, 1, 2, 127, 128, 252, 253, 256].map((value) => {
      const encoded = Buffer.alloc(4);
      encoded.writeInt32LE(value);
      return { value, hex: encoded.toString("hex") };
    }),
    standaloneBranches,
    fullProofs: [
      canonicalProof("empty-proof", []),
      canonicalProof("one-mmr-node-small", [
        proofBranch("mmr-node-small-empty"),
      ]),
      canonicalProof("one-mmr-node-varint-128", [
        proofBranch("mmr-node-varint-128-empty"),
      ]),
      canonicalProof("one-btc-branch", [proofBranch("btc-index-128-empty")]),
      canonicalProof("one-eth-branch", [proofBranch("eth-empty-fields")]),
      canonicalProof("one-multipart-branch", [proofBranch("multipart-empty")]),
      canonicalProof("mixed-node-and-power", [
        {
          branchType: 2,
          index: 1,
          size: 3,
          hashes: [hashA],
        },
        {
          branchType: 3,
          index: 128,
          size: 16512,
          hashes: [hashB],
        },
      ]),
    ],
  };
}

function makeSkipChallengeRequest(testCase, challengeRoot) {
  const sentinelHash =
    "0100000000000000000000000000000000000000000000000000000000000000";
  return {
    type: "vrsc::evidence.skipchallenge",
    entropyhash: sentinelHash,
    proveheight: testCase.proveHeight,
    atheight: testCase.atHeight,
    evidence: {
      version: 1,
      type: 1,
      systemid: CHAIN.id,
      output: { txid: sentinelHash, voutnum: 0 },
      state: 6,
      evidence: {
        version: 1,
        chainobjects: [
          {
            vdxftype: "vrsc::system.crosschain.proofroot",
            value: challengeRoot,
          },
        ],
      },
    },
  };
}

async function getBlocksByHeight(heights) {
  const uniqueHeights = [...new Set(heights)].sort((a, b) => a - b);
  const hashes = await rpcBatch(
    uniqueHeights.map((height) => ({
      method: "getblockhash",
      params: [height],
    }))
  );
  const blocks = await rpcBatch(
    hashes.map((hash) => ({ method: "getblock", params: [hash, 1] }))
  );
  return new Map(uniqueHeights.map((height, index) => [height, blocks[index]]));
}

async function buildLiveFixtures() {
  const info = await rpc("getinfo", []);
  assertEqual(info.name, CHAIN.name, "daemon chain name");
  assertEqual(info.chainid, CHAIN.id, "daemon chain id");
  if (info.longestchain < CHAIN.fixtureProofHeight) {
    throw new Error(
      `Daemon tip ${info.longestchain} is below fixture height ${CHAIN.fixtureProofHeight}`
    );
  }

  const heights = [
    CHAIN.fixtureProofHeight,
    ...SKIP_CHALLENGE_CASES.flatMap((item) => [
      item.proveHeight,
      item.atHeight,
    ]),
  ];
  const blocks = await getBlocksByHeight(heights);
  const anchorBlock = blocks.get(CHAIN.fixtureProofHeight);
  assertEqual(
    anchorBlock.hash,
    CHAIN.fixtureProofBlockHash,
    "fixture proof block hash"
  );
  assertEqual(
    anchorBlock.proofroot.stateroot,
    CHAIN.fixtureStateRoot,
    "fixture proof state root"
  );
  assertEqual(anchorBlock.proofroot.power, CHAIN.fixturePower, "fixture power");

  const challengeRoot = anchorBlock.proofroot;
  const skipResults = await rpc("getnotarizationproofs", [
    SKIP_CHALLENGE_CASES.map((item) =>
      makeSkipChallengeRequest(item, challengeRoot)
    ),
  ]);
  assertEqual(
    skipResults.length,
    SKIP_CHALLENGE_CASES.length,
    "skip-challenge result count"
  );

  const headerProofs = SKIP_CHALLENGE_CASES.map((testCase, index) => {
    const response = skipResults[index];
    if (response.error) {
      throw new Error(`${testCase.name}: ${response.error}`);
    }
    const chainObjects = response.result.evidence.evidence.chainobjects;
    const proofObject = chainObjects.find(
      (object) => object.value && typeof object.value.hex === "string"
    );
    if (!proofObject) {
      throw new Error(
        `${testCase.name}: missing serialized block header proof`
      );
    }

    const blockHeaderProofHex = proofObject.value.hex.toLowerCase();
    const decoded = parseBlockHeaderProof(blockHeaderProofHex);
    assertEqual(decoded.version, 0, `${testCase.name} header proof version`);
    assertEqual(
      decoded.headerProof.branchCount,
      2,
      `${testCase.name} header proof branch count`
    );
    assertEqual(
      decoded.headerProof.branches[0].branchType,
      2,
      `${testCase.name} block-hash bridge type`
    );
    assertEqual(
      decoded.headerProof.branches[1].branchType,
      3,
      `${testCase.name} power branch type`
    );
    assertEqual(
      decoded.mmrBridge.branchType,
      2,
      `${testCase.name} MMR bridge type`
    );

    const proveBlock = blocks.get(testCase.proveHeight);
    const atBlock = blocks.get(testCase.atHeight);
    return {
      name: testCase.name,
      provenance: "daemon-rpc-captured",
      proveHeight: testCase.proveHeight,
      atHeight: testCase.atHeight,
      proveBlockHash: hashPair(proveBlock.hash),
      atBlockHash: hashPair(atBlock.hash),
      proofRoot: {
        height: atBlock.proofroot.height,
        stateRoot: hashPair(atBlock.proofroot.stateroot),
        blockHash: hashPair(atBlock.proofroot.blockhash),
        power: hashPair(atBlock.proofroot.power),
      },
      blockHeaderProofHex,
      blockHeaderProofSha256: sha256(blockHeaderProofHex),
      ...decoded,
    };
  });

  const identityHistory = await rpc("getidentityhistory", [
    CHAIN.identity,
    0,
    CHAIN.fixtureProofHeight,
    true,
    CHAIN.fixtureProofHeight,
  ]);
  const identityEntries = new Map(
    identityHistory.history.map((entry) => [entry.height, entry])
  );

  const identityTransactionProofs = IDENTITY_CASES.map((testCase) => {
    const entry = identityEntries.get(testCase.height);
    if (!entry)
      throw new Error(`${testCase.name}: missing identity history entry`);
    assertEqual(
      entry.blockhash,
      testCase.blockHash,
      `${testCase.name} block hash`
    );
    assertEqual(entry.output.txid, testCase.txid, `${testCase.name} txid`);
    assertEqual(
      entry.output.voutnum,
      testCase.voutnum,
      `${testCase.name} vout`
    );
    const decoded = parsePartialTransactionProof(entry.proof.toLowerCase());
    assertEqual(decoded.version, testCase.version, `${testCase.name} version`);
    assertEqual(decoded.type, 2, `${testCase.name} proof type`);
    assertEqual(
      decoded.txProof.branchCount,
      3,
      `${testCase.name} tx proof branch count`
    );

    return {
      name: testCase.name,
      provenance: "daemon-rpc-captured",
      identity: CHAIN.identity,
      height: testCase.height,
      proofHeight: CHAIN.fixtureProofHeight,
      blockHash: hashPair(entry.blockhash),
      output: {
        txid: hashPair(entry.output.txid),
        voutnum: entry.output.voutnum,
      },
      proofRoot: {
        height: anchorBlock.proofroot.height,
        stateRoot: hashPair(anchorBlock.proofroot.stateroot),
        blockHash: hashPair(anchorBlock.proofroot.blockhash),
        power: hashPair(anchorBlock.proofroot.power),
      },
      ...decoded,
    };
  });

  return {
    provenance: {
      kind: "daemon-rpc-captured",
      readOnlyRpcMethods: [
        "getinfo",
        "getblockhash",
        "getblock",
        "getnotarizationproofs",
        "getidentityhistory",
      ],
      note: "The checked-in type-2/type-3 proofs and hashes in this section were returned by the pinned VRSCTEST daemon RPC calls.",
    },
    daemon: {
      name: info.name,
      chainId: info.chainid,
      version: info.VRSCversion,
      protocolVersion: info.protocolversion,
    },
    anchor: {
      height: CHAIN.fixtureProofHeight,
      blockHash: hashPair(CHAIN.fixtureProofBlockHash),
      stateRoot: hashPair(CHAIN.fixtureStateRoot),
      power: hashPair(CHAIN.fixturePower),
    },
    headerProofs,
    identityTransactionProofs,
  };
}

async function main() {
  const fixture = {
    schemaVersion: 1,
    source: {
      implementation: "VerusCoin",
      chain: CHAIN.name,
      generator: "scripts/generate-mmr-fixtures.js",
      notes: [
        "Hashes named wireHex are serialized uint256 bytes.",
        "Hashes named displayHex use the byte order returned by daemon RPCs.",
        "CMMRProof uses a fixed signed int32 little-endian branch count.",
        "Each CMMRProof entry repeats its one-byte branch type: outer dispatch tag, then inner branch tag.",
        "MMR index and size fields use Bitcoin Core VARINT; hash-vector lengths use CompactSize.",
      ],
    },
    canonical: buildCanonicalFixtures(),
    live: await buildLiveFixtures(),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(fixture, null, 2)}\n`);
  process.stdout.write(`Wrote ${OUTPUT_PATH}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
