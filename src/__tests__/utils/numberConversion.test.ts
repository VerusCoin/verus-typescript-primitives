import { decimalToBn } from "../../utils/numberConversion";

describe("decimalToBn", () => {
  test.each([
    ["1.2", "120000000"],
    [1e-8, "1"],
    ["1e-8", "1"],
    ["-1e-8", "-1"],
    ["0.00000001000000", "1"],
    ["0", "0"],
    ["0.000000000", "0"],
    ["9999999999.99999999", "999999999999999999"],
    ["-9999999999.99999999", "-999999999999999999"],
    ["0.999999999999999999e10", "999999999999999999"],
    ["0.000000000000000001e18", "100000000"],
  ])("converts %s exactly", (value, expected) => {
    expect(decimalToBn(value).toString(10)).toBe(expected);
  });

  test.each([
    "1.2.999", "0.000000009", 1e-9, "", "-",
    "10000000000", "-10000000000", "1e10", "-1e10", "1e-1000000",
  ])(
    "rejects invalid amount %j",
    (value) => {
      expect(() => decimalToBn(value)).toThrow("Invalid decimal value");
    }
  );

  test.each(["1e1000000", "-1e1000000", "0e1000000", "1e9007199254740991"])(
    "rejects %s before expanding the decimal string",
    (value) => {
      const repeat = jest.spyOn(String.prototype, "repeat").mockImplementation(() => {
        throw new Error("Unexpected decimal expansion");
      });
      try {
        expect(() => decimalToBn(value)).toThrow("Invalid decimal value");
        expect(repeat).not.toHaveBeenCalled();
      } finally {
        repeat.mockRestore();
      }
    }
  );
});
