import { DataDescriptor, VDXFDataDescriptor } from "../../pbaas/DataDescriptor";
import { DataDescriptorKey } from "../../vdxf/vdxfdatakeys";
import { BufferDataVdxfObject } from "../../vdxf";
import { BN } from "bn.js";

const makeDescriptor = (label: string): DataDescriptor => new DataDescriptor({
  objectdata: Buffer.from("document contents", "utf8"),
  label,
  mimeType: "text/plain",
});

describe("VDXFDataDescriptor conversion from an extracted body", () => {
  test.each([0, 249, 250])("converts a descriptor with %i object bytes without changing its wrapper", size => {
    const descriptor = new DataDescriptor({ objectdata: Buffer.alloc(size, 0x31) });
    // Descriptor bodies of 252 and 253 bytes straddle the CompactSize boundary.
    expect(descriptor.getByteLength()).toBe(size + 3);
    const wire = new VDXFDataDescriptor(descriptor, DataDescriptorKey.vdxfid).toBuffer();
    const prefix = Buffer.from("abcd", "hex");
    const suffix = Buffer.from("deadbeef", "hex");
    const framed = Buffer.concat([prefix, wire, suffix]);
    const generic = new BufferDataVdxfObject();
    expect(generic.fromBuffer(framed, prefix.length)).toBe(prefix.length + wire.length);
    const bodyBeforeConversion = generic.data;

    const converted = VDXFDataDescriptor.fromDataVdxfObject(generic);

    expect(converted.vdxfkey).toBe(generic.vdxfkey);
    expect(converted.version.eq(generic.version)).toBe(true);
    expect(converted.dataDescriptor.toBuffer()).toEqual(descriptor.toBuffer());
    expect(converted.toBuffer()).toEqual(wire);
    expect(generic.data).toBe(bodyBeforeConversion);
    expect(generic.toBuffer()).toEqual(wire);
  });

  test("preserves the supplied wrapper version and honors the body encoding", () => {
    const descriptor = makeDescriptor("encoded descriptor");
    const generic = new BufferDataVdxfObject(
      descriptor.toBuffer().toString("base64"),
      DataDescriptorKey.vdxfid,
      "base64",
    );
    generic.version = new BN(128);

    const converted = VDXFDataDescriptor.fromDataVdxfObject(generic);

    expect(converted.version.toNumber()).toBe(128);
    expect(converted.vdxfkey).toBe(generic.vdxfkey);
    expect(converted.dataDescriptor.toBuffer()).toEqual(descriptor.toBuffer());
    expect(converted.toBuffer()).toEqual(generic.toBuffer());
  });
});

describe("VDXFDataDescriptor nested parsing offsets", () => {
  test("the child descriptor round-trips on its own", () => {
    const original = makeDescriptor("first document");
    const serialized = original.toBuffer();
    const decoded = new DataDescriptor();

    expect(original.isValid()).toBe(true);
    expect(decoded.fromBuffer(serialized)).toBe(serialized.length);
    expect(decoded.toBuffer()).toEqual(serialized);
  });

  test.each([
    { description: "at offset zero", prefix: Buffer.alloc(0) },
    { description: "after a prefix", prefix: Buffer.from("prefix", "utf8") },
  ])("decodes a wrapped descriptor $description and leaves the following object readable", ({ prefix }) => {
    const original = makeDescriptor("first document");
    const following = makeDescriptor("second document");
    const serialized = new VDXFDataDescriptor(original, DataDescriptorKey.vdxfid).toBuffer();
    const followingBytes = new VDXFDataDescriptor(following, DataDescriptorKey.vdxfid).toBuffer();
    const buffer = Buffer.concat([prefix, serialized, followingBytes]);
    const decoded = new VDXFDataDescriptor();

    // The wrapper owns the parent cursor; the extracted descriptor starts at zero.
    const nextOffset = decoded.fromBuffer(buffer, prefix.length);

    expect(nextOffset).toBe(prefix.length + serialized.length);
    expect(decoded.vdxfkey).toBe(DataDescriptorKey.vdxfid);
    expect(decoded.dataDescriptor.toBuffer()).toEqual(original.toBuffer());

    const decodedFollowing = new VDXFDataDescriptor();
    expect(decodedFollowing.fromBuffer(buffer, nextOffset)).toBe(buffer.length);
    expect(decodedFollowing.dataDescriptor.toBuffer()).toEqual(following.toBuffer());
  });
});
