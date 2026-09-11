import { HASH160_BYTE_LENGTH } from "../../constants/vdxf";
import bufferutils from "../../utils/bufferutils";
import { Challenge } from "../../vdxf/classes/Challenge";
import { Request } from "../../vdxf/classes/Request";
import { Response } from "../../vdxf/classes/Response";
import { ProvisioningChallenge } from "../../vdxf/classes/provisioning/ProvisioningChallenge";
import { ProvisioningRequest } from "../../vdxf/classes/provisioning/ProvisioningRequest";
import { ProvisioningResponse } from "../../vdxf/classes/provisioning/ProvisioningResponse";
import { ProvisioningResult } from "../../vdxf/classes/provisioning/ProvisioningResult";
import { LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL } from "../../vdxf";

const SYSTEM_ID = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV";
const IDENTITY_ID = "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU";
const REQUEST_DATA = {
  system_id: SYSTEM_ID,
  signing_id: IDENTITY_ID,
  challenge: { challenge_id: IDENTITY_ID, created_at: 1 },
};
const PROVISIONING_REQUEST_DATA = {
  signing_address: "RYQbUr9WtRRAnMjuddZGryrNEpFEV1h8ph",
  challenge: { ...REQUEST_DATA.challenge, name: "test", system_id: SYSTEM_ID },
};
const PREFIX = Buffer.from("aabbcc", "hex");
const SUFFIX = Buffer.from("ddeeff", "hex");

const CASES = [
  {
    name: "Challenge",
    create: () => new Challenge(REQUEST_DATA.challenge),
    parser: () => new Challenge(),
  },
  {
    name: "Request",
    create: () => new Request(REQUEST_DATA),
    parser: () => new Request(),
  },
  {
    name: "Response",
    create: () => new Response({
      system_id: SYSTEM_ID,
      signing_id: IDENTITY_ID,
      decision: { decision_id: IDENTITY_ID, created_at: 2, request: REQUEST_DATA },
    }),
    parser: () => new Response(),
  },
  {
    name: "ProvisioningChallenge",
    create: () => new ProvisioningChallenge(PROVISIONING_REQUEST_DATA.challenge),
    parser: () => new ProvisioningChallenge(),
  },
  {
    name: "ProvisioningRequest",
    create: () => new ProvisioningRequest(PROVISIONING_REQUEST_DATA),
    parser: () => new ProvisioningRequest(),
  },
  {
    name: "ProvisioningResponse",
    create: () => new ProvisioningResponse({
      system_id: SYSTEM_ID,
      signing_id: IDENTITY_ID,
      decision: {
        decision_id: IDENTITY_ID,
        created_at: 2,
        request: new ProvisioningRequest(PROVISIONING_REQUEST_DATA),
        result: new ProvisioningResult({ state: LOGIN_CONSENT_PROVISIONING_RESULT_STATE_PENDINGAPPROVAL.vdxfid }),
      },
    }),
    parser: () => new ProvisioningResponse(),
  },
];

describe.each(CASES)("$name declared body length", ({ create, parser }) => {
  test("round-trips its canonical body at a nonzero offset", () => {
    const wire = create().toBuffer();
    const parsed = parser();

    expect(parsed.fromBuffer(Buffer.concat([PREFIX, wire, SUFFIX]), PREFIX.length))
      .toBe(PREFIX.length + wire.length);
    expect(parsed.toBuffer()).toEqual(wire);
  });

  test("rejects a body declaring one byte while its remaining fields are outside that body", () => {
    const wire = create().toBuffer();
    const reader = new bufferutils.BufferReader(wire);
    reader.readSlice(HASH160_BYTE_LENGTH);
    reader.readVarInt();
    const lengthOffset = reader.offset;
    expect(reader.readCompactSize()).toBeGreaterThan(1);

    // Keep the full body available to expose parsers that ignore its boundary.
    const malformed = Buffer.concat([
      wire.subarray(0, lengthOffset),
      Buffer.from([1]),
      wire.subarray(reader.offset),
    ]);

    expect(() => parser().fromBuffer(Buffer.concat([PREFIX, malformed, SUFFIX]), PREFIX.length))
      .toThrow();
  });

  test.each([
    ["missing", false],
    ["unconsumed", true],
  ])("rejects a declared body with one %s byte", (_, appendByte) => {
    const body = create().toDataBuffer();
    const writer = new bufferutils.BufferWriter(Buffer.alloc(body.length + 10));
    writer.writeCompactSize(body.length + 1);
    writer.writeSlice(body);
    if (appendByte) writer.writeUInt8(0);

    expect(() => parser().fromDataBuffer(writer.buffer.subarray(0, writer.offset)))
      .toThrow();
  });
});
