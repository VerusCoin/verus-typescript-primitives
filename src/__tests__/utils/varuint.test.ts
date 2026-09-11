import bufferutils from "../../utils/bufferutils";
import varuint from "../../utils/varuint";

const { BufferReader } = bufferutils;

describe("CompactSize decoding", () => {
  test.each([
    { value: 0, hex: "00" },
    { value: 252, hex: "fc" },
    { value: 253, hex: "fdfd00" },
    { value: 65535, hex: "fdffff" },
    { value: 65536, hex: "fe00000100" },
    { value: 0x02000000, hex: "fe00000002" },
  ])("accepts canonical $value encoded as $hex", ({ value, hex }) => {
    const encoded = Buffer.from(hex, "hex");

    expect(varuint.decode(encoded, 0)).toEqual({
      decoded: value,
      bytes: encoded.length,
    });
  });

  test.each([
    "fd0000",
    "fdfc00",
    "fefd000000",
    "feffff0000",
    "ff0000010000000000",
    "ffffffffff00000000",
  ])("rejects noncanonical %s even with size checking disabled", (hex) => {
    const encoded = Buffer.from(hex, "hex");
    const error = new RangeError("Non-canonical CompactSize");

    expect(() => varuint.decode(encoded, 0)).toThrow(error);
    expect(() => varuint.decode(encoded, 0, false)).toThrow(error);
  });

  test.each([
    { value: 0x02000001, hex: "fe01000002" },
    { value: 0xffffffff, hex: "feffffffff" },
    { value: 0x100000000, hex: "ff0000000001000000" },
    { value: Number.MAX_SAFE_INTEGER, hex: "ffffffffffffff1f00" },
  ])(
    "limits $value by default but permits it as a scalar",
    ({ value, hex }) => {
      const encoded = Buffer.from(hex, "hex");

      expect(() => varuint.decode(encoded, 0)).toThrow(
        new RangeError("CompactSize exceeds maximum size")
      );
      expect(varuint.decode(encoded, 0, false)).toEqual({
        decoded: value,
        bytes: encoded.length,
      });
    }
  );

  test("rejects unsafe integers even with size checking disabled", () => {
    const encoded = Buffer.from("ff0000000000002000", "hex");

    expect(() => varuint.decode(encoded, 0)).toThrow(RangeError);
    expect(() => varuint.decode(encoded, 0, false)).toThrow(RangeError);
  });

  test.each(["", "fd", "fd00", "fe000000", "ff00000000000000"])(
    "rejects truncated encoding '%s'",
    (hex) => {
      expect(() => varuint.decode(Buffer.from(hex, "hex"), 0)).toThrow(
        expect.objectContaining({ name: "RangeError" })
      );
    }
  );
});

describe("BufferReader CompactSize boundaries", () => {
  test("advances from a nonzero offset and leaves the following field unread", () => {
    const source = Buffer.from("a5a5fdfd005a", "hex");
    const original = Buffer.from(source);
    const reader = new BufferReader(source, 2);

    expect(reader.readCompactSize()).toBe(253);
    expect(reader.offset).toBe(5);
    expect(source).toEqual(original);
    expect(reader.readUInt8()).toBe(0x5a);
  });

  test("forwards the scalar exception and advances by its encoded size", () => {
    const reader = new BufferReader(Buffer.from("a5fe010000025a", "hex"), 1);

    expect(reader.readCompactSize(false)).toBe(0x02000001);
    expect(reader.offset).toBe(6);
    expect(reader.readUInt8()).toBe(0x5a);
  });

  test.each(["fdfc00", "fe01000002", "ff0000000000002000", "ff00000000000000"])(
    "does not advance on rejected encoding %s",
    (hex) => {
      const reader = new BufferReader(Buffer.from("a5a5" + hex, "hex"), 2);

      expect(() => reader.readCompactSize()).toThrow(
        expect.objectContaining({ name: "RangeError" })
      );
      expect(reader.offset).toBe(2);
    }
  );

  test.each(["readVarSlice", "readVector", "readArray"] as const)(
    "%s rejects an oversized length before reading elements",
    (method) => {
      // Only the five-byte length is needed; no large payload or array is built.
      const reader = new BufferReader(Buffer.from("fe01000002", "hex"));
      const readSlice = jest
        .spyOn(reader, "readSlice")
        .mockImplementation(() => {
          throw new Error("Unexpected payload read");
        });
      const readElement =
        method === "readVector"
          ? jest.spyOn(reader, "readVarSlice").mockImplementation(() => {
              throw new Error("Unexpected vector element read");
            })
          : undefined;

      expect(() =>
        method === "readArray" ? reader.readArray(1) : reader[method]()
      ).toThrow(new RangeError("CompactSize exceeds maximum size"));
      expect(reader.offset).toBe(0);
      expect(readSlice).not.toHaveBeenCalled();
      if (readElement) expect(readElement).not.toHaveBeenCalled();
    }
  );
});
