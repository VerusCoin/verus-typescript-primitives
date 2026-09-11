import { BN } from "bn.js";

import varint from "../../utils/varint";

// These are the bytes emitted by VerusCoin's VARINT serializer. Unlike
// CompactSize, it is a big-endian base-128 encoding whose continuation step
// subtracts one. MMR branch nIndex and nSize use this encoding in the daemon.
const DAEMON_VARINT_VECTORS: ReadonlyArray<readonly [string, string]> = [
  ["0", "00"],
  ["1", "01"],
  ["126", "7e"],
  ["127", "7f"],
  ["128", "8000"],
  ["129", "8001"],
  ["255", "807f"],
  ["256", "8100"],
  ["16383", "fe7f"],
  ["16384", "ff00"],
  ["16511", "ff7f"],
  ["16512", "808000"],
  ["2113663", "ffff7f"],
  ["2113664", "80808000"],
  ["2147483647", "86fefefe7f"],
  ["2147483648", "86fefeff00"],
  ["4294967295", "8efefefe7f"],
  ["4294967296", "8efefeff00"],
  ["9007199254740991", "8efefefefefefe7f"],
  ["9007199254740992", "8efefefefefeff00"],
  ["18446744073709551615", "80fefefefefefefefe7f"],
];

describe("Verus daemon VARINT compatibility", () => {
  test.each(DAEMON_VARINT_VECTORS)(
    "encodes and decodes daemon uint64 vector %s as %s",
    (decimal, expectedHex) => {
      const value = new BN(decimal, 10);
      const expected = Buffer.from(expectedHex, "hex");
      const destination = Buffer.alloc(expected.length + 4, 0xa5);

      const encoded = varint.encode(value, destination, 2);

      expect(encoded.buffer).toBe(destination);
      expect(encoded.bytes).toBe(expected.length);
      expect(varint.encodingLength(value)).toBe(expected.length);
      expect(destination.subarray(0, 2).equals(Buffer.from([0xa5, 0xa5]))).toBe(
        true
      );
      expect(destination.subarray(2, -2).toString("hex")).toBe(expectedHex);
      expect(destination.subarray(-2).equals(Buffer.from([0xa5, 0xa5]))).toBe(
        true
      );

      const decoded = varint.decode(destination, 2);
      expect(decoded.bytes).toBe(expected.length);
      expect(decoded.decoded.toString(10)).toBe(decimal);
    }
  );
});
