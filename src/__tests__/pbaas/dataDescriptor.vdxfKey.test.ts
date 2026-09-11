import { DataDescriptor } from "../../pbaas/DataDescriptor";
import { DataDescriptorKey } from "../../vdxf/vdxfdatakeys";
import { BN } from "bn.js";

describe("DataDescriptor daemon wire compatibility", () => {
  test("consumes and preserves FLAG_VDXF_KEY_PRESENT", () => {
    // CDataDescriptor serializes these fields in this order:
    // VARINT(version), VARINT(flags), uint160 vdxfKey, vector objectData.
    // 0x80 is encoded as the daemon VARINT 0x80 0x00, and uint160 is a
    // fixed-width 20-byte value. The key below is DataDescriptorKey.
    const daemonBytes = Buffer.from(
      "018000" +
      "08a2ebb2c55f83a8e2a426a53320ed4d42124f4d" +
      "03aabbcc",
      "hex"
    );
    const descriptor = new DataDescriptor();

    const consumed = descriptor.fromBuffer(daemonBytes);

    expect({
      consumed,
      version: descriptor.version.toNumber(),
      flags: descriptor.flags.toNumber(),
      vdxfKey: descriptor.vdxfKey,
      objectdata: descriptor.objectdata.toString("hex"),
      valid: descriptor.isValid(),
      reserialized: descriptor.toBuffer().toString("hex"),
    }).toEqual({
      consumed: daemonBytes.length,
      version: 1,
      flags: 0x80,
      vdxfKey: DataDescriptorKey.vdxfid,
      objectdata: "aabbcc",
      valid: true,
      reserialized: daemonBytes.toString("hex"),
    });
  });

  test("derives the key flag and exposes the key through descriptor JSON", () => {
    const descriptor = DataDescriptor.fromJson({
      version: 1,
      flags: 0,
      vdxfkey: DataDescriptorKey.vdxfid,
      objectdata: { message: "keyed data" },
    });

    expect(descriptor.flags.toNumber()).toBe(0x80);
    expect(descriptor.isValid()).toBe(true);
    expect(descriptor.toJson().vdxfkey).toBe(DataDescriptorKey.vdxfid);
  });

  test("preserves canonical keyless bytes and does not emit a flag without a key", () => {
    const descriptor = new DataDescriptor({
      objectdata: Buffer.from("aabbcc", "hex"),
    });
    const canonicalKeylessBytes = "010003aabbcc";

    expect(descriptor.toBuffer().toString("hex")).toBe(canonicalKeylessBytes);

    descriptor.flags = DataDescriptor.FLAG_VDXF_KEY_PRESENT;
    expect(descriptor.toBuffer().toString("hex")).toBe(canonicalKeylessBytes);

    descriptor.salt = Buffer.from("ff", "hex");
    descriptor.fromBuffer(Buffer.from(canonicalKeylessBytes, "hex"));
    expect(descriptor.toBuffer().toString("hex")).toBe(canonicalKeylessBytes);

    descriptor.flags = new BN(0x100);
    expect(descriptor.isValid()).toBe(false);
  });
});
