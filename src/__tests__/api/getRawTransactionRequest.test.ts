import { GetRawTransactionRequest } from "../../api/classes/GetRawTransaction/GetRawTransactionRequest";

const chain = "VRSC";
const txid = "00".repeat(32);

describe("getrawtransaction request JSON", () => {
  test.each([undefined, 0, 1])("preserves verbosity %s through JSON text", (verbosity) => {
    const request = new GetRawTransactionRequest(chain, txid, verbosity);
    const json = JSON.parse(JSON.stringify(request.toJson()));
    const restored = GetRawTransactionRequest.fromJson(json);

    expect(restored.getParams()).toEqual(request.getParams());
    expect(restored.verbose).toBe(verbosity);
    expect(json.verbose).toBeUndefined();
    expect(json.verbosity).toBe(verbosity);
  });

  test.each([0, 1])("accepts legacy verbose %s", (verbose) => {
    const request = GetRawTransactionRequest.fromJson({ chain, txid, verbose });
    expect(request.getParams()).toEqual([txid, verbose]);
    expect(request.toJson().verbosity).toBe(verbose);
  });

  test.each([0, 1])("prefers canonical verbosity %s when both names exist", (verbosity) => {
    const request = GetRawTransactionRequest.fromJson({
      chain, txid, verbosity, verbose: 1 - verbosity,
    });
    expect(request.getParams()).toEqual([txid, verbosity]);
  });

  test("uses legacy verbose when canonical verbosity is null", () => {
    const request = GetRawTransactionRequest.fromJson({ chain, txid, verbosity: null, verbose: 1 });
    expect(request.getParams()).toEqual([txid, 1]);
  });
});
