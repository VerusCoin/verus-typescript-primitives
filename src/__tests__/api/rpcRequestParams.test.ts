import {
  FundRawTransactionRequest,
  GetIdentityContentRequest,
  GetIdentityRequest,
  SendCurrencyRequest,
  SignRawTransactionRequest,
  UpdateIdentityRequest,
} from "../../api/classes";
import { VerusCLIVerusIDJsonWithData } from "../../vdxf/classes";

const CHAIN = "VRSCTEST";
const HEX = "0400008085202f89000000000000ac9a12000000000000000000000000";
const ADDRESS = "RXKs5Gz8kRqpA52M25AW5FzP3aCNq46yMh";
const VDXF_KEY = "i3mbggp3NBR77C5JeFQJTpAxmgMidayLLE";

describe("positional RPC request parameters", () => {
  test("trims trailing omitted parameters", () => {
    const outputs = [
      {
        currency: CHAIN,
        amount: 0.0001,
        address: ADDRESS,
      },
    ];
    const identity = { name: "alice" } as VerusCLIVerusIDJsonWithData;

    expect(new GetIdentityRequest(CHAIN, "VRSCTEST@").getParams()).toEqual([
      "VRSCTEST@",
    ]);
    expect(
      new GetIdentityContentRequest(CHAIN, "VRSCTEST@").getParams()
    ).toEqual(["VRSCTEST@"]);
    expect(new SignRawTransactionRequest(CHAIN, HEX).getParams()).toEqual([
      HEX,
    ]);
    expect(new FundRawTransactionRequest(CHAIN, HEX).getParams()).toEqual([
      HEX,
    ]);
    expect(new UpdateIdentityRequest(CHAIN, identity).getParams()).toEqual([
      identity,
    ]);
    expect(new SendCurrencyRequest(CHAIN, "*", outputs).getParams()).toEqual([
      "*",
      outputs,
    ]);
  });

  test("preserves getidentity parameter positions", () => {
    const request = new GetIdentityRequest(
      CHAIN,
      "VRSCTEST@",
      undefined,
      true,
      1219222
    );

    expect(request.getParams()).toEqual(["VRSCTEST@", null, true, 1219222]);
  });

  test("keeps null slots before a getidentity proof height", () => {
    const request = new GetIdentityRequest(
      CHAIN,
      "VRSCTEST@",
      undefined,
      undefined,
      1219222
    );

    expect(request.getParams()).toEqual(["VRSCTEST@", null, null, 1219222]);
  });

  test("preserves the vdxfkey position for getidentitycontent", () => {
    const request = new GetIdentityContentRequest(
      CHAIN,
      "VRSCTEST@",
      undefined,
      undefined,
      undefined,
      undefined,
      VDXF_KEY
    );

    expect(request.getParams()).toEqual([
      "VRSCTEST@",
      null,
      null,
      null,
      null,
      VDXF_KEY,
    ]);
  });

  test("includes private keys in the daemon's signrawtransaction position", () => {
    const prevtxs = [
      {
        txid: "00".repeat(32),
        vout: 0,
        scriptPubKey: "51",
        redeemScript: "51",
        amount: 1,
      },
    ];
    const request = new SignRawTransactionRequest(
      CHAIN,
      HEX,
      prevtxs,
      "SINGLE",
      "76b809bb",
      ["private-key"]
    );

    expect(request.getParams()).toEqual([
      HEX,
      prevtxs,
      ["private-key"],
      "SINGLE",
      "76b809bb",
    ]);
    expect(SignRawTransactionRequest.fromJson(request.toJson())).toEqual(
      request
    );
  });

  test("keeps null slots before a signrawtransaction sighash type", () => {
    const request = new SignRawTransactionRequest(
      CHAIN,
      HEX,
      undefined,
      "NONE"
    );

    expect(request.getParams()).toEqual([HEX, null, null, "NONE"]);
  });

  test("keeps a branch ID in its signrawtransaction position", () => {
    const request = new SignRawTransactionRequest(
      CHAIN,
      HEX,
      undefined,
      undefined,
      "76b809bb"
    );

    expect(request.getParams()).toEqual([HEX, null, null, null, "76b809bb"]);
  });

  test("keeps an empty private key list distinct from an omitted list", () => {
    const request = new SignRawTransactionRequest(
      CHAIN,
      HEX,
      undefined,
      undefined,
      undefined,
      []
    );

    expect(request.getParams()).toEqual([HEX, null, []]);
  });

  test("uses a valid fee placeholder before updateidentity sourceoffunds", () => {
    const identity = { name: "alice" } as VerusCLIVerusIDJsonWithData;
    const request = new UpdateIdentityRequest(
      CHAIN,
      identity,
      true,
      undefined,
      undefined,
      "*"
    );

    expect(request.getParams()).toEqual([identity, true, null, 0, "*"]);
  });

  test("preserves sourceoffunds when all earlier options are omitted", () => {
    const identity = { name: "alice" } as VerusCLIVerusIDJsonWithData;
    const request = new UpdateIdentityRequest(
      CHAIN,
      identity,
      undefined,
      undefined,
      undefined,
      "*"
    );

    expect(request.getParams()).toEqual([identity, null, null, 0, "*"]);
  });

  test("preserves updateidentity token and fee positions", () => {
    const identity = { name: "alice" } as VerusCLIVerusIDJsonWithData;

    expect(
      new UpdateIdentityRequest(CHAIN, identity, undefined, true).getParams()
    ).toEqual([identity, null, true]);
    expect(
      new UpdateIdentityRequest(
        CHAIN,
        identity,
        undefined,
        undefined,
        0.0001
      ).getParams()
    ).toEqual([identity, null, null, 0.0001]);
  });

  test("rejects fundrawtransaction options without their prerequisites", () => {
    const utxos = [{ txid: "00".repeat(32), voutnum: 0 }];

    expect(() => {
      new FundRawTransactionRequest(CHAIN, HEX, utxos).getParams();
    }).toThrow("changeaddr is required");
    expect(() => {
      new FundRawTransactionRequest(CHAIN, HEX, undefined, ADDRESS).getParams();
    }).toThrow("utxos are required");
    expect(() => {
      new FundRawTransactionRequest(
        CHAIN,
        HEX,
        undefined,
        undefined,
        0.0001
      ).getParams();
    }).toThrow("utxos are required");
  });

  test("keeps all valid fundrawtransaction parameters in order", () => {
    const utxos = [{ txid: "00".repeat(32), voutnum: 0 }];
    const request = new FundRawTransactionRequest(
      CHAIN,
      HEX,
      utxos,
      ADDRESS,
      0.0001
    );

    expect(request.getParams()).toEqual([HEX, utxos, ADDRESS, 0.0001]);
    expect(
      new FundRawTransactionRequest(CHAIN, HEX, utxos, ADDRESS).getParams()
    ).toEqual([HEX, utxos, ADDRESS]);
  });

  test.each([true, false])(
    "uses a valid fee placeholder when returntxtemplate is %s",
    (returntxtemplate) => {
      const outputs = [
        {
          currency: CHAIN,
          amount: 0.0001,
          address: ADDRESS,
        },
      ];
      const request = new SendCurrencyRequest(
        CHAIN,
        "*",
        outputs,
        undefined,
        undefined,
        returntxtemplate
      );

      expect(request.getParams()).toEqual([
        "*",
        outputs,
        null,
        0,
        returntxtemplate,
      ]);
    }
  );

  test("preserves the feeamount position when minconf is omitted", () => {
    const outputs = [
      {
        currency: CHAIN,
        amount: 0.0001,
        address: ADDRESS,
      },
    ];
    const request = new SendCurrencyRequest(
      CHAIN,
      "*",
      outputs,
      undefined,
      0.0002
    );

    expect(request.getParams()).toEqual(["*", outputs, null, 0.0002]);
  });
});
