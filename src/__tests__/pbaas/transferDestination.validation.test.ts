import {
  DEST_ETH,
  DEST_ID,
  DEST_PKH,
  DEST_QUANTUM,
  DEST_SH,
  TransferDestination,
} from "../../pbaas/TransferDestination";

const R_ADDRESS = "R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx";
const I_ADDRESS = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";
const BTC_ADDRESS = "1BoatSLRHtKNngkdXEeobR76b53LETtpyT";
const SCRIPT_ADDRESS = "bCkCqkEzmo5drcUghsDczAFNAt4MsxsemK";
const QUANTUM_ADDRESS = "QLcvFpCDbvZymuiM3YE1tmu8BG6thQPgKG";
const NON_CANONICAL_R_ADDRESS = "1R9J8E2no2HVjQmzX6Ntes2ShSGcn2jjV6z";
const ETH_ADDRESS = "0x1f9090aae28b8a3dceadf281b0f12828e676c326";

describe("TransferDestination input validation", () => {
  describe("Base58 destination families", () => {
    test.each([
      ["an R-address declared as DEST_ID", DEST_ID.toNumber(), R_ADDRESS],
      ["an i-address declared as DEST_PKH", DEST_PKH.toNumber(), I_ADDRESS],
      ["an R-address declared as DEST_SH", DEST_SH.toNumber(), R_ADDRESS],
      [
        "an R-address declared as DEST_QUANTUM",
        DEST_QUANTUM.toNumber(),
        R_ADDRESS,
      ],
      [
        "an address from an unsupported Base58 family",
        DEST_PKH.toNumber(),
        BTC_ADDRESS,
      ],
      [
        "a non-canonical two-byte encoding of the R version",
        DEST_PKH.toNumber(),
        NON_CANONICAL_R_ADDRESS,
      ],
    ])("rejects %s", (_description, type, address) => {
      expect(() => TransferDestination.fromJson({ type, address })).toThrow();
    });

    test.each([
      [DEST_PKH.toNumber(), R_ADDRESS],
      [DEST_ID.toNumber(), I_ADDRESS],
    ])("preserves a matching type/address pair", (type, address) => {
      expect(
        TransferDestination.fromJson({ type, address }).getAddressString()
      ).toBe(address);
    });

    test.each([
      ["DEST_SH", DEST_SH.toNumber(), SCRIPT_ADDRESS],
      ["DEST_QUANTUM", DEST_QUANTUM.toNumber(), QUANTUM_ADDRESS],
    ])("accepts a matching %s address", (_description, type, address) => {
      expect(TransferDestination.fromJson({ type, address }).isValid()).toBe(
        true
      );
    });

    test.each([
      ["DEST_PKH", DEST_PKH],
      ["DEST_SH", DEST_SH],
      ["DEST_ID", DEST_ID],
      ["DEST_QUANTUM", DEST_QUANTUM],
    ])("reports an empty %s destination as invalid", (_description, type) => {
      expect(
        new TransferDestination({
          type,
          destinationBytes: Buffer.alloc(0),
        }).isValid()
      ).toBe(false);
    });
  });

  describe("Ethereum destinations", () => {
    test.each([
      ["entirely non-hex", `0x${"g".repeat(40)}`],
      ["partially non-hex", `0x${"1".repeat(39)}z`],
    ])(
      "rejects a 40-character address body that is %s",
      (_description, address) => {
        expect(() =>
          TransferDestination.fromJson({
            type: DEST_ETH.toNumber(),
            address,
          })
        ).toThrow();
      }
    );

    test("accepts a canonical 20-byte hexadecimal address", () => {
      expect(
        TransferDestination.fromJson({
          type: DEST_ETH.toNumber(),
          address: ETH_ADDRESS,
        }).getAddressString()
      ).toBe(ETH_ADDRESS);
    });

    test.each([0, 19, 21])(
      "reports a %i-byte ETH destination as invalid",
      (length) => {
        const destination = new TransferDestination({
          type: DEST_ETH,
          destinationBytes: Buffer.alloc(length),
        });

        expect(destination.isValid()).toBe(false);
      }
    );

    test("reports the malformed zero-length wire encoding as invalid", () => {
      const destination = new TransferDestination();

      destination.fromBuffer(Buffer.from("0900", "hex"));

      expect(destination.isValid()).toBe(false);
    });
  });
});
