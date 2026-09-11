import { BN } from "bn.js";

import {
  DEST_ID,
  FLAG_DEST_GATEWAY,
  TransferDestination,
} from "../../pbaas/TransferDestination";
import { fromBase58Check } from "../../utils/address";
import { BigNumber } from "../../utils/types/BigNumber";

const DESTINATION_ID = "iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm";
const GATEWAY_ID = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV";
const NEGATIVE_ONE_INT64_HEX = "ffffffffffffffff";

const makeGatewayDestination = (fees: BigNumber): TransferDestination =>
  new TransferDestination({
    type: new BN(DEST_ID.toString(10), 10).or(FLAG_DEST_GATEWAY),
    destinationBytes: fromBase58Check(DESTINATION_ID).hash,
    gatewayID: GATEWAY_ID,
    fees,
  });

describe("TransferDestination signed gateway fees", () => {
  test("serializes a negative gateway fee as a signed int64", () => {
    const destination = makeGatewayDestination(new BN(-1, 10));

    expect(destination.toBuffer().subarray(-8).toString("hex")).toBe(
      NEGATIVE_ONE_INT64_HEX
    );
  });

  test("deserializes a canonical negative signed int64 gateway fee", () => {
    const encoded = makeGatewayDestination(new BN(0, 10)).toBuffer();
    Buffer.from(NEGATIVE_ONE_INT64_HEX, "hex").copy(encoded, encoded.length - 8);
    const destination = new TransferDestination();

    const bytesRead = destination.fromBuffer(encoded);

    expect(bytesRead).toBe(encoded.length);
    expect(destination.fees.toString(10)).toBe("-1");
  });
});
