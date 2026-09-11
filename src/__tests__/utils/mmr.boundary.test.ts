import * as fs from "fs";
import * as path from "path";
import { Worker } from "worker_threads";
import * as ts from "typescript";

type ProofIndexVector = {
  pos: number;
  mmvSize: number;
  extraHashes: number;
  expected: string;
};

/*
 * Run the real TypeScript module in an expendable worker. The current
 * implementation can loop forever after a signed `>>` turns mmvSize into a
 * negative number, so calling it directly would wedge the entire Jest worker.
 */
const WORKER_SOURCE = String.raw`
  const Module = require('module');
  const path = require('path');
  const { parentPort, workerData } = require('worker_threads');

  try {
    const sourceModule = new Module(workerData.modulePath, module);
    sourceModule.filename = workerData.modulePath;
    sourceModule.paths = Module._nodeModulePaths(path.dirname(workerData.modulePath));
    sourceModule._compile(workerData.compiledSource, workerData.modulePath);
    const { GetMMRProofIndex } = sourceModule.exports;
    const result = GetMMRProofIndex(
      workerData.pos,
      workerData.mmvSize,
      workerData.extraHashes,
    );
    parentPort.postMessage({ result: result.toString(10) });
  } catch (error) {
    parentPort.postMessage({
      error: error && error.stack ? error.stack : String(error),
    });
  }
`;

const MMR_SOURCE_PATH = path.resolve(__dirname, "../../utils/mmr.ts");
const MMR_COMPILED_SOURCE = ts.transpileModule(
  fs.readFileSync(MMR_SOURCE_PATH, "utf8"),
  {
    fileName: MMR_SOURCE_PATH,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }
).outputText;
const WORKER_TIMEOUT_MS = 500;

const getProofIndexWithoutWedgingJest = (
  vector: Omit<ProofIndexVector, "expected">
): Promise<string> =>
  new Promise((resolve, reject) => {
    // Fail early with a useful error if a future test layout change makes the
    // worker point at something other than the source module under test.
    if (!fs.existsSync(MMR_SOURCE_PATH)) {
      reject(new Error(`MMR source module not found: ${MMR_SOURCE_PATH}`));
      return;
    }

    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: {
        modulePath: MMR_SOURCE_PATH,
        compiledSource: MMR_COMPILED_SOURCE,
        ...vector,
      },
    });
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      void worker.terminate().then(
        () => {
          reject(
            new Error(
              `GetMMRProofIndex(${vector.pos}, ${vector.mmvSize}, ${vector.extraHashes}) ` +
                `did not terminate within ${WORKER_TIMEOUT_MS}ms`
            )
          );
        },
        (error) => reject(error)
      );
    }, WORKER_TIMEOUT_MS);

    worker.once("message", (message: { result?: string; error?: string }) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void worker.terminate();

      if (message.error) reject(new Error(message.error));
      else if (message.result === undefined)
        reject(new Error("MMR worker returned no result"));
      else resolve(message.result);
    });

    worker.once("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    worker.once("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`MMR worker exited without a result (code ${code})`));
    });
  });

// Expected decimal values were captured from the unsigned uint64_t routine in
// VerusCoin/src/mmr.cpp (CMerkleBranchBase::GetMMRProofIndex). The 127/128
// cases also correspond to the live skip-challenge proof boundary fixtures.
const DAEMON_PROOF_INDEX_VECTORS: ReadonlyArray<ProofIndexVector> = [
  { pos: 1, mmvSize: 2, extraHashes: 0, expected: "1" },
  { pos: 1, mmvSize: 2, extraHashes: 1, expected: "2" },
  { pos: 127, mmvSize: 130, extraHashes: 1, expected: "10922" },
  { pos: 128, mmvSize: 130, extraHashes: 1, expected: "8" },
  { pos: 1, mmvSize: 0x7fffffff, extraHashes: 1, expected: "2" },
  { pos: 1, mmvSize: 0x80000000, extraHashes: 1, expected: "2" },
  {
    pos: 0x7fffffff,
    mmvSize: 0x80000000,
    extraHashes: 1,
    expected: "3074457345618258602",
  },
  { pos: 1, mmvSize: 0xffffffff, extraHashes: 1, expected: "2" },
  { pos: 0xfffffffe, mmvSize: 0xffffffff, extraHashes: 1, expected: "682" },
  {
    pos: 0xffffffff,
    mmvSize: 0x100000000,
    extraHashes: 0,
    expected: "4294967295",
  },
];

describe("GetMMRProofIndex daemon uint64 boundaries", () => {
  test.each(DAEMON_PROOF_INDEX_VECTORS)(
    "matches daemon for pos=$pos, mmvSize=$mmvSize, extraHashes=$extraHashes",
    async ({ expected, ...input }) => {
      await expect(getProofIndexWithoutWedgingJest(input)).resolves.toBe(
        expected
      );
    }
  );

  test("rejects non-finite input instead of looping indefinitely", async () => {
    await expect(
      getProofIndexWithoutWedgingJest({
        pos: 1,
        mmvSize: Number.POSITIVE_INFINITY,
        extraHashes: 0,
      })
    ).rejects.toThrow("non-negative safe integers");
  });
});
