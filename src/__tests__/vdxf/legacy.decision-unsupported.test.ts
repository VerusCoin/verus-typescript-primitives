import { HASH160_BYTE_LENGTH } from "../../constants/vdxf";
import bufferutils from "../../utils/bufferutils";
import { IDENTITY_VIEW } from "../../vdxf";
import { Attestation } from "../../vdxf/classes/Challenge";
import { Decision } from "../../vdxf/classes/Decision";
import { Response } from "../../vdxf/classes/Response";
import { ProvisioningDecision } from "../../vdxf/classes/provisioning/ProvisioningDecision";

const SYSTEM_ID = "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV";
const IDENTITY_ID = "iB5PRXMHLYcNtM8dfLB6KwfJrHU2mKDYuU";
const DECISION = {
  decision_id: IDENTITY_ID,
  created_at: 2,
  request: {
    system_id: SYSTEM_ID,
    signing_id: IDENTITY_ID,
    challenge: { challenge_id: IDENTITY_ID, created_at: 1 },
  },
};
const attestation = () => new Attestation("attestation", IDENTITY_VIEW.vdxfid);

describe("legacy decision attestations", () => {
  test("rejects nonempty attestations supplied to constructors", () => {
    const decision = { ...DECISION, attestations: [attestation()] };

    expect(() => new Decision(decision)).toThrow("Decision attestations currently unsupported");
    expect(() => new Response({
      system_id: SYSTEM_ID,
      signing_id: IDENTITY_ID,
      decision,
    })).toThrow("Decision attestations currently unsupported");
  });

  test("rejects attestations added after construction before serialization or signing", () => {
    const response = new Response({
      system_id: SYSTEM_ID,
      signing_id: IDENTITY_ID,
      decision: { ...DECISION, attestations: [] },
    });
    response.decision.attestations.push(attestation());

    const operations = [
      () => response.decision.dataByteLength(),
      () => response.decision.toDataBuffer(),
      () => response.decision.toBuffer(),
      () => response.toBuffer(),
      () => response.toJson(),
      () => response.getDecisionHash(100, 1),
      () => response.getDecisionHash(100, 2),
    ];
    for (const operation of operations) {
      expect(operation).toThrow("Decision attestations currently unsupported");
    }
  });

  test("rejects a complete wire attestation instead of accepting and later discarding it", () => {
    const decision = new Decision(DECISION);
    const body = decision.toDataBuffer();
    // The attestation vector follows decision ID, timestamp, salt, and skipped.
    const bodyReader = new bufferutils.BufferReader(body);
    bodyReader.readVarSlice();
    bodyReader.readUInt64();
    bodyReader.readVarSlice();
    bodyReader.readUInt8();
    const countOffset = bodyReader.offset;
    expect(body[countOffset]).toBe(0);
    const unsupportedBody = Buffer.concat([
      body.subarray(0, countOffset),
      Buffer.from([1]),
      attestation().toBuffer(),
      body.subarray(countOffset + 1),
    ]);

    const wire = decision.toBuffer();
    const reader = new bufferutils.BufferReader(wire);
    reader.readSlice(HASH160_BYTE_LENGTH);
    reader.readVarInt();
    const writer = new bufferutils.BufferWriter(Buffer.alloc(unsupportedBody.length + 10));
    writer.writeVarSlice(unsupportedBody);
    const unsupportedWire = Buffer.concat([
      wire.subarray(0, reader.offset),
      writer.buffer.subarray(0, writer.offset),
    ]);

    expect(() => new Decision().fromBuffer(unsupportedWire))
      .toThrow("Decision attestations currently unsupported");
  });

  test("rejects inherited unsupported attestations in provisioning JSON", () => {
    const decision = new ProvisioningDecision();
    decision.attestations = [attestation()];

    expect(() => decision.toJson()).toThrow("Decision attestations currently unsupported");
  });

  test("preserves the wire format and hash for empty or omitted attestations", () => {
    const omitted = new Decision(DECISION);
    const empty = new Decision({ ...DECISION, attestations: [] });
    const wire = omitted.toBuffer();
    expect(empty.toBuffer()).toEqual(wire);
    expect(empty.toSha256()).toEqual(omitted.toSha256());

    const parsed = new Decision();
    expect(parsed.fromBuffer(wire)).toBe(wire.length);
    expect(parsed.attestations).toEqual([]);
    expect(parsed.toBuffer()).toEqual(wire);
  });
});
