import { GetBlockHashRequest, GetBlockHashResponse } from "../../api/classes";

describe("GetBlockHash", () => {
  it("prepares and serializes a request", () => {
    const request = new GetBlockHashRequest("VRSC", 12345);

    expect(request.prepare()).toEqual(["VRSC", "getblockhash", [12345]]);
    expect(request.toJson()).toEqual({
      chain: "VRSC",
      height: 12345,
    });
    expect(GetBlockHashRequest.fromJson(request.toJson())).toEqual(request);
  });

  it("serializes a response", () => {
    const hash = "00".repeat(32);

    expect(new GetBlockHashResponse(hash).toJson()).toBe(hash);
  });
});
