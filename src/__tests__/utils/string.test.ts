import { fromASM } from "../../utils/script";
import { isHexString } from "../../utils/string";

describe("isHexString", () => {
  test.each(["", "00", "0123456789abcdef", "ABCDEF", "aAbBcCdDeEfF"])(
    "accepts complete hex bytes %p",
    (value) => {
      expect(isHexString(value)).toBe(true);
    }
  );

  test.each([
    "0", "abc", "abcde", "gg", "abzz", "zzab", "abzzcd", "0x12",
    " ab", "ab ", "ab cd", "ab\tcd", "ab\ncd", "ab\r\n", "a\n",
    "ab\0cd", "１２",
  ])("rejects incomplete or non-hex input %p", (value) => {
    expect(isHexString(value)).toBe(false);
  });

  test.each([undefined, null, 12, true, {}, [], Buffer.from("ab", "hex")])(
    "rejects non-string input %p",
    (value) => {
      expect(isHexString(value as unknown as string)).toBe(false);
    }
  );
});

describe("fromASM hex validation", () => {
  test.each(["gg", "abzz", "abc", "0x12"])(
    "rejects malformed data push %p",
    (value) => {
      expect(() => fromASM(`OP_DUP ${value}`)).toThrow("Expected hex in fromASM");
    }
  );

  test("preserves complete mixed-case hex data", () => {
    expect(fromASM("OP_DUP aAbB").toString("hex")).toBe("7602aabb");
  });
});
