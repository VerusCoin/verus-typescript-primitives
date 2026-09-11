import * as path from "path";
import * as ts from "typescript";

test("the published entry point passes strict TypeScript declaration checks", () => {
  const root = path.resolve(__dirname, "../../..");
  const { types } = require(path.join(root, "package.json"));
  const program = ts.createProgram([path.join(root, types)], {
    strict: true,
    skipLibCheck: false,
    noEmit: true,
    target: ts.ScriptTarget.ES2015,
    module: ts.ModuleKind.CommonJS,
    types: ["node"],
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);

  expect(ts.formatDiagnostics(diagnostics, {
    getCurrentDirectory: () => root,
    getCanonicalFileName: file => file,
    getNewLine: () => "\n",
  })).toBe("");
}, 15000);
