import {
  GetIdentityHistoryRequest, GetIdentityHistoryResponse, GetCurrencyStateRequest,
  GetCurrencyStateResponse, GetTxOutRequest, GetTxOutResponse, RawCurrencyDefinition
} from "../../index";

const CHAIN = "VRSCTEST";
const TXID = "ab".repeat(32);

describe("registration RPC reads", () => {
  test("preserves history height/proof positions, explicit zeros and false", () => {
    expect(new GetIdentityHistoryRequest(CHAIN, "alice@").prepare()).toEqual([
      CHAIN,
      "getidentityhistory",
      ["alice@"],
    ]);
    const request = new GetIdentityHistoryRequest(
      CHAIN,
      "alice@",
      0,
      -1,
      false,
      100
    );
    expect(request.getParams()).toEqual(["alice@", 0, -1, false, 100]);
    expect(request.toJson()).toEqual(request.toJSON());
    expect(GetIdentityHistoryRequest.fromJson(request.toJson()).prepare()).toEqual(request.prepare());
    expect(
      GetIdentityHistoryRequest.fromJSON(request.toJSON()).prepare()
    ).toEqual(request.prepare());
    expect(
      new GetIdentityHistoryRequest(CHAIN, "alice@", undefined, 100).getParams()
    ).toEqual(["alice@", 0, 100]);
    expect(
      GetIdentityHistoryRequest.fromJSON({
        chain: CHAIN,
        nameOrAddress: "alice@",
        txproofheight: 100,
      }).getParams()
    ).toEqual(["alice@", 0, 0, false, 100]);
  });

  test("handles historical currency heights and inclusive ranges", () => {
    expect(new GetCurrencyStateRequest(CHAIN, CHAIN).prepare()).toEqual([
      CHAIN,
      "getcurrencystate",
      [CHAIN],
    ]);
    const request = new GetCurrencyStateRequest(
      CHAIN,
      "basket",
      "100,200,10",
      CHAIN
    );
    expect(request.getParams()).toEqual(["basket", "100,200,10", CHAIN]);
    expect(
      GetCurrencyStateRequest.fromJSON(request.toJSON()).prepare()
    ).toEqual(request.prepare());
    expect(new GetCurrencyStateRequest(CHAIN, "basket", 0).getParams()).toEqual(
      ["basket", ""]
    );
    expect(
      new GetCurrencyStateRequest(CHAIN, "basket", undefined, CHAIN).getParams()
    ).toEqual(["basket", "", CHAIN]);
  });

  test.each([1, 975796, Number.MAX_SAFE_INTEGER])("sends numeric currency height %s as a string without changing saved request data", height => {
    const request = new GetCurrencyStateRequest(CHAIN, "basket", height);
    expect(request.getParams()).toEqual(["basket", String(height)]);
    expect(request.toJSON().height).toBe(height);
    expect(GetCurrencyStateRequest.fromJSON(request.toJSON()).prepare()).toEqual(request.prepare());
    expect(request.height).toBe(height);
  });

  test.each([undefined, 0, -0, -1, -100])("preserves current-tip semantics for currency height %s", height => {
    const request = new GetCurrencyStateRequest(CHAIN, "basket", height, CHAIN);
    expect(request.getParams()).toEqual(["basket", "", CHAIN]);
    expect(new GetCurrencyStateRequest(CHAIN, "basket", height).getParams()).toEqual(
      height === undefined ? ["basket"] : ["basket", ""]
    );
    expect(GetCurrencyStateRequest.fromJSON(request.toJSON()).getParams()).toEqual(request.getParams());
  });

  test.each(["0", "", "975796", "100,200", "100,200,10"])("preserves explicit string height/range %s", height => {
    expect(new GetCurrencyStateRequest(CHAIN, "basket", height, CHAIN).getParams()).toEqual(["basket", height, CHAIN]);
  });

  test.each([NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects numeric currency height %s that cannot be encoded faithfully", height => {
    expect(() => new GetCurrencyStateRequest(CHAIN, "basket", height).prepare()).toThrow("safe integer");
  });

  test("uses a string tip selector when restoring an omitted currency height from JSON", () => {
    const request = GetCurrencyStateRequest.fromJSON({chain: CHAIN, currencynameorid: "basket", height: null, conversiondatacurrency: CHAIN});
    expect(request.getParams()).toEqual(["basket", "", CHAIN]);
  });

  test("preserves vout zero and opt-out of mempool filtering", () => {
    const request = new GetTxOutRequest(CHAIN, TXID, 0, false);
    expect(request.prepare()).toEqual([CHAIN, "gettxout", [TXID, 0, false]]);
    expect(GetTxOutRequest.fromJSON(request.toJSON()).prepare()).toEqual(
      request.prepare()
    );
    expect(new GetTxOutRequest(CHAIN, TXID, 0).getParams()).toEqual([TXID, 0]);
  });

  test("models history output references and hexadecimal proofs emitted by C++", () => {
    const result: GetIdentityHistoryResponse["result"] = {
      fullyqualifiedname: "alice.VRSCTEST@",
      status: "active",
      cansignfor: false,
      canspendfor: false,
      blockheight: 100,
      txid: TXID,
      vout: 0,
      history: [
        {
          identity: {
            name: "alice",
            parent: "parent",
            primaryaddresses: [],
            minimumsignatures: 1,
          },
          blockhash: "cd".repeat(32),
          height: 50,
          output: { txid: TXID, voutnum: 0 },
          proof: "000102",
        },
      ],
    };
    expect(new GetIdentityHistoryResponse(result).toJSON()).toEqual(result);
    const badProof: typeof result.history[number] = {
      ...result.history[0],
      // @ts-expect-error CPartialTransactionProof::ToUniValue returns hex, not an object.
      proof: { version: 1, type: 1 },
    };
    expect(badProof.proof).toEqual({ version: 1, type: 1 });
  });

  test("permits native state without reserve currencies or conversion columns", () => {
    const result: GetCurrencyStateResponse["result"] = [
      {
        height: 100,
        blocktime: 1700000000,
        currencystate: {
          flags: 0,
          version: 1,
          currencyid: "parent",
          launchcurrencies: [],
          initialsupply: 0,
          emitted: 0,
          supply: 0,
          primarycurrencyfees: 0,
          primarycurrencyconversionfees: 0,
          primarycurrencyout: 0,
          preconvertedout: 0,
        },
      },
    ];
    expect(new GetCurrencyStateResponse(result).toJSON()).toEqual(result);
  });

  test("represents spent output as null and unspent zero-value commitment as an object", () => {
    expect(new GetTxOutResponse(null).toJSON()).toBeNull();
    const result: GetTxOutResponse["result"] = {
      bestblock: TXID,
      confirmations: 1,
      value: 0,
      version: 4,
      coinbase: false,
      scriptPubKey: {
        asm: "commitment",
        hex: "00",
        type: "cryptocondition",
        commitmenthash: TXID,
      },
    };
    expect(new GetTxOutResponse(result).toJSON()).toEqual(result);
  });

  test("types converter IDs, block time and native-system destination as daemon JSON", () => {
    const fields: Partial<RawCurrencyDefinition> = {
      gatewayconverterid: "converter",
      gatewayconvertername: "basket",
      blocktime: 60,
      nativecurrencyid: {
        type: 10,
        address: { contract: "0x1234", tokenid: "0x01" },
      },
    };
    expect(fields.blocktime).toBe(60);
    // @ts-expect-error nativecurrencyid is a transfer destination, not an i-address string.
    const bad: Partial<RawCurrencyDefinition> = { nativecurrencyid: "parent" };
    expect(bad.nativecurrencyid).toBe("parent");
  });
});
