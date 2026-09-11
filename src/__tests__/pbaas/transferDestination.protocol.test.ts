import {
  DEST_PKH,
  FLAG_MASK,
  FLAG_RESERVED1,
  FLAG_RESERVED2,
  TransferDestination,
} from "../../pbaas/TransferDestination";

const R_ADDRESS = "R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx";
const HASH_HEX = "002d3311c38bfd219092d2aef449804be8b3befe";
const I_ADDRESS = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";
const PUBLIC_KEY =
  "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798";

describe("TransferDestination daemon compatibility", () => {
  // VerusCoin src/pbaas/crosschainrpc.h: CTransferDestination flag mask and
  // SerializationOp: uint8 type, CompactSize destination, destination bytes.
  test.each([0x12, 0x22, 0x32])(
    "preserves reserved flags for type %i through wire and JSON",
    (type) => {
      const wire = Buffer.from(`${type.toString(16)}14${HASH_HEX}`, "hex");
      const parsed = new TransferDestination();

      expect(parsed.fromBuffer(wire)).toBe(wire.length);
      expect(parsed.typeNoFlags()).toEqual(DEST_PKH);
      expect(parsed.isValid()).toBe(true);
      expect(parsed.getAddressString()).toBe(R_ADDRESS);
      expect(parsed.toJson()).toEqual({ type, address: R_ADDRESS });
      expect(TransferDestination.fromJson(parsed.toJson()).toBuffer()).toEqual(wire);
      expect(parsed.toBuffer()).toEqual(wire);
    }
  );

  test("exports the daemon's complete flag mask", () => {
    expect(FLAG_RESERVED1.toNumber()).toBe(0x10);
    expect(FLAG_RESERVED2.toNumber()).toBe(0x20);
    expect(FLAG_MASK.toNumber()).toBe(0xf0);
  });

  test("preserves reserved flags together with gateway and auxiliary fields", () => {
    const json = {
      type: 0xf2,
      address: R_ADDRESS,
      gateway: I_ADDRESS,
      gatewaycode: I_ADDRESS,
      fees: "1",
      auxdests: [{ type: 2, address: R_ADDRESS }],
    };
    const destination = TransferDestination.fromJson(json);
    const wire = destination.toBuffer();
    const parsed = new TransferDestination();

    expect(destination.isValid()).toBe(true);
    expect(destination.typeNoFlags()).toEqual(DEST_PKH);
    expect(wire[0]).toBe(0xf2);
    expect(parsed.fromBuffer(wire)).toBe(wire.length);
    expect(parsed.isValid()).toBe(true);
    expect(parsed.toJson()).toEqual(json);
    expect(parsed.toBuffer()).toEqual(wire);
  });

  test.each([1, 0x11])(
    "keeps public-key JSON destinations unsupported for type %i",
    (type) => {
      expect(() =>
        TransferDestination.fromJson({ type, address: PUBLIC_KEY })
      ).toThrow("Unknown destination type");
    }
  );
});
