import { BN } from "bn.js";

import {
  DEST_ID,
  DEST_PKH,
  FLAG_DEST_AUX,
  FLAG_DEST_GATEWAY,
  TransferDestination,
  TransferDestinationJson,
} from "../../pbaas/TransferDestination";
import { fromBase58Check } from "../../utils/address";

const DESTINATION_ID = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";
const AUX_DESTINATION = "R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx";
const GATEWAY_ID = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV";
const GATEWAY_CODE = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
const GATEWAY_FEE = new BN("125000000", 10);

const makeGatewayDestination = (withAuxDestination = false) =>
  new TransferDestination({
    type: withAuxDestination
      ? DEST_ID.or(FLAG_DEST_GATEWAY).or(FLAG_DEST_AUX)
      : DEST_ID.or(FLAG_DEST_GATEWAY),
    destinationBytes: fromBase58Check(DESTINATION_ID).hash,
    gatewayID: GATEWAY_ID,
    gatewayCode: GATEWAY_CODE,
    fees: GATEWAY_FEE,
    auxDests: withAuxDestination
      ? [
          new TransferDestination({
            type: DEST_PKH,
            destinationBytes: fromBase58Check(AUX_DESTINATION).hash,
          }),
        ]
      : [],
  });

describe("TransferDestination gateway JSON", () => {
  test("reads the mandatory gateway ID from daemon-shaped JSON", () => {
    const parsed = TransferDestination.fromJson({
      type: DEST_ID.or(FLAG_DEST_GATEWAY).toNumber(),
      address: DESTINATION_ID,
      gateway: GATEWAY_ID,
      fees: "1.25",
    });

    expect(parsed.gatewayID).toBe(GATEWAY_ID);
    expect(parsed.fees.toString(10)).toBe(GATEWAY_FEE.toString(10));
    expect(parsed.isValid()).toBe(true);
    expect(() => parsed.toBuffer()).not.toThrow();
  });

  test("writes gateway code and fees to JSON", () => {
    expect(makeGatewayDestination().toJson()).toStrictEqual({
      type: DEST_ID.or(FLAG_DEST_GATEWAY).toNumber(),
      address: DESTINATION_ID,
      gateway: GATEWAY_ID,
      gatewaycode: GATEWAY_CODE,
      fees: "1.25",
    });
  });

  test("preserves a gateway destination and its auxiliary destination across a JSON round-trip", () => {
    const original = makeGatewayDestination(true);
    const reparsed = TransferDestination.fromJson(original.toJson());

    expect(reparsed.isValid()).toBe(true);
    expect(reparsed.toBuffer()).toEqual(original.toBuffer());
  });

  test.each([
    ["omitted", undefined],
    ["empty", []],
  ])(
    "normalizes an %s auxiliary destination array like the daemon",
    (_description, auxdests) => {
      const gatewayType = DEST_ID.or(FLAG_DEST_GATEWAY);
      const json: TransferDestinationJson = {
        type: gatewayType.or(FLAG_DEST_AUX).toNumber(),
        address: DESTINATION_ID,
        gateway: GATEWAY_ID,
        fees: "1.25",
      };

      if (auxdests !== undefined) json.auxdests = auxdests;

      const parsed = TransferDestination.fromJson(json);

      expect(parsed.type).toEqual(gatewayType);
      expect(parsed.hasAuxDests()).toBe(false);
      expect(parsed.auxDests).toStrictEqual([]);
      expect(parsed.isValid()).toBe(true);
    }
  );
});
