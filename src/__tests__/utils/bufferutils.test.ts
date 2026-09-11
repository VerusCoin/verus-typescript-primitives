import { BN } from "bn.js";

import bufferutils from "../../utils/bufferutils";

const { BufferReader, BufferWriter } = bufferutils;

type SignedInt64Vector = {
  decimal: string;
  littleEndianHex: string;
};

// Golden vectors for the raw little-endian int64 serialization used by the
// Verus daemon. Negative values are represented in 64-bit two's complement.
const SIGNED_INT64_VECTORS: ReadonlyArray<SignedInt64Vector> = [
  {
    decimal: "-9223372036854775808",
    littleEndianHex: "0000000000000080",
  },
  { decimal: "-2", littleEndianHex: "feffffffffffffff" },
  { decimal: "-1", littleEndianHex: "ffffffffffffffff" },
  { decimal: "0", littleEndianHex: "0000000000000000" },
  { decimal: "1", littleEndianHex: "0100000000000000" },
  {
    decimal: "9223372036854775807",
    littleEndianHex: "ffffffffffffff7f",
  },
];

describe("Verus daemon signed int64 compatibility", () => {
  test.each(SIGNED_INT64_VECTORS)(
    "writes $decimal as $littleEndianHex",
    ({ decimal, littleEndianHex }) => {
      const destination = Buffer.alloc(12, 0xa5);
      const writer = new BufferWriter(destination, 2);

      writer.writeInt64(new BN(decimal, 10));

      expect(writer.offset).toBe(10);
      expect(destination.subarray(0, 2).toString("hex")).toBe("a5a5");
      expect(destination.subarray(2, 10).toString("hex")).toBe(
        littleEndianHex
      );
      expect(destination.subarray(10).toString("hex")).toBe("a5a5");
    }
  );

  test.each(SIGNED_INT64_VECTORS)(
    "reads $littleEndianHex as $decimal",
    ({ decimal, littleEndianHex }) => {
      const source = Buffer.concat([
        Buffer.from("a5a5", "hex"),
        Buffer.from(littleEndianHex, "hex"),
        Buffer.from("a5a5", "hex"),
      ]);
      const reader = new BufferReader(source, 2);

      const decoded = reader.readInt64();

      expect(reader.offset).toBe(10);
      expect(decoded.toString(10)).toBe(decimal);
    }
  );

  test.each(["-9223372036854775809", "9223372036854775808"])(
    "rejects out-of-range signed int64 value %s",
    (decimal) => {
      const writer = new BufferWriter(Buffer.alloc(8));

      expect(() => writer.writeInt64(new BN(decimal, 10))).toThrow(RangeError);
    }
  );
});
