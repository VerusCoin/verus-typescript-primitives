import { SendCurrencyResponse } from "../../api/classes";

type Result = SendCurrencyResponse["result"];

// ../VerusCoin/src/rpc/pbaasrpc.cpp: sendcurrency emits an operation ID, or
// outputtotals/feeamount with exactly one hex field when returntxtemplate=true.
const operation: Result = "opid-example";
const transparentTemplate: Result = {
  outputtotals: { i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV: 1 },
  feeamount: 0.0001,
  hextx: "04000080",
};
const shieldedTemplate: Result = {
  outputtotals: {},
  feeamount: 0.0001,
  hextxwithoutz: "04000080",
};

describe("SendCurrency response types", () => {
  test.each([operation, transparentTemplate, shieldedTemplate])(
    "accepts the daemon response variant %# without transforming it",
    (result) => {
      expect(new SendCurrencyResponse(result).toJson()).toEqual(result);
    }
  );

  test("requires exactly one transaction hex field in templates", () => {
    // These assignments are checked by ts-jest, including unused directives.
    // @ts-expect-error A template must contain one of the daemon's hex fields.
    const missingHex: Result = { outputtotals: {}, feeamount: 0.0001 };
    // @ts-expect-error The daemon emits hextx or hextxwithoutz, never both.
    const bothHex: Result = { outputtotals: {}, feeamount: 0.0001, hextx: "00", hextxwithoutz: "00" };

    expect(missingHex).not.toHaveProperty("hextx");
    expect(bothHex).toHaveProperty("hextxwithoutz");
  });
});
