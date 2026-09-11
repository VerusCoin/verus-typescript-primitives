import {
  CrossChainDataRef,
  CrossChainDataRefJson,
} from "../../pbaas/CrossChainDataRef";
import { PBaaSEvidenceRef } from "../../pbaas/PBaaSEvidenceRef";

const DATA_HASH_WIRE_HEX =
  "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const DATA_HASH_JSON_HEX =
  "1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100";

// Canonical Verus daemon serialization of:
//   CCrossChainDataRef type 0
//   CPBaaSEvidenceRef version 1, flags 1 | 2 | 4
// followed by output, object/subobject, systemID, and the 32-byte dataHash.
const DAEMON_HASHED_EVIDENCE_REF = Buffer.from(
  [
    "00", // CCrossChainDataRef::TYPE_CROSSCHAIN_DATAREF
    "01", // CPBaaSEvidenceRef::version
    "07", // FLAG_ISEVIDENCE | FLAG_HAS_SYSTEM | FLAG_HAS_HASH
    "0016a39b1f74372fe316624e2e11c1bd1b48ee111411b5dccb8d47a6341623e4", // output hash
    "01000000", // output index
    "01", // objectNum
    "01", // subObject
    "a6ef9ea235635e328124ff3429db9f9e91b64e2d", // systemID
    DATA_HASH_WIRE_HEX,
  ].join(""),
  "hex"
);

function parseDaemonFixture(): {
  parsed: CrossChainDataRef;
  consumed: number;
  evidenceRef: PBaaSEvidenceRef;
} {
  const parsed = new CrossChainDataRef();
  const consumed = parsed.fromBuffer(DAEMON_HASHED_EVIDENCE_REF);

  return {
    parsed,
    consumed,
    evidenceRef: parsed.ref as PBaaSEvidenceRef,
  };
}

describe("PBaaSEvidenceRef FLAG_HAS_HASH daemon compatibility", () => {
  test("includes a constructor-supplied hash in JSON before binary serialization", () => {
    const { evidenceRef: source } = parseDaemonFixture();
    const evidence = new PBaaSEvidenceRef({
      flags: PBaaSEvidenceRef.FLAG_ISEVIDENCE,
      output: source.output,
      objectNum: source.objectNum,
      subObject: source.subObject,
      systemId: source.systemId,
      dataHash: Buffer.from(DATA_HASH_WIRE_HEX, "hex"),
    });

    const json = evidence.toJson();
    expect(json.flags).toBe(7);
    expect(json.datahash).toBe(DATA_HASH_JSON_HEX);
    expect(evidence.dataHash.toString("hex")).toBe(DATA_HASH_WIRE_HEX);
    const restored = PBaaSEvidenceRef.fromJson(JSON.parse(JSON.stringify(json)));
    expect(new CrossChainDataRef(restored).toBuffer()).toEqual(DAEMON_HASHED_EVIDENCE_REF);
    expect(evidence.toJson()).toEqual(json);
  });

  test.each([Buffer.alloc(0), Buffer.alloc(32)])(
    "omits a removed or null hash from JSON before binary serialization (%j)",
    dataHash => {
      const { evidenceRef } = parseDaemonFixture();
      evidenceRef.dataHash = dataHash;

      const json = evidenceRef.toJson();
      expect(json.flags).toBe(3);
      expect(json).not.toHaveProperty("datahash");
      expect(PBaaSEvidenceRef.fromJson(json).toBuffer()).toEqual(evidenceRef.toBuffer());
      expect(evidenceRef.toJson()).toEqual(json);
    },
  );

  test("rejects non-empty hashes that are not exactly 32 bytes", () => {
    expect(new PBaaSEvidenceRef().dataHash).toEqual(Buffer.alloc(0));
    expect(() =>
      new PBaaSEvidenceRef({ dataHash: Buffer.alloc(31) })
    ).toThrow("PBaaSEvidenceRef dataHash must be exactly 32 bytes");
  });

  test("consumes the complete 32-byte hash field", () => {
    const { consumed } = parseDaemonFixture();

    expect(consumed).toBe(DAEMON_HASHED_EVIDENCE_REF.length);
  });

  test("retains the hash bytes carried by the daemon", () => {
    const { evidenceRef } = parseDaemonFixture();

    expect(evidenceRef).toBeInstanceOf(PBaaSEvidenceRef);
    expect(evidenceRef.flags.toNumber()).toBe(7);
    expect(evidenceRef.dataHash).toEqual(Buffer.from(DATA_HASH_WIRE_HEX, "hex"));
  });

  test("emits the daemon JSON hash in uint256 display order", () => {
    const { parsed, evidenceRef } = parseDaemonFixture();
    const wireOrderHashBeforeJson = Buffer.from(evidenceRef.dataHash);
    const flagsBeforeJson = evidenceRef.flags.clone();
    const json = parsed.toJson() as CrossChainDataRefJson;

    expect(json.datahash).toBe(DATA_HASH_JSON_HEX);
    expect(evidenceRef.dataHash).toEqual(wireOrderHashBeforeJson);
    expect(evidenceRef.flags.eq(flagsBeforeJson)).toBe(true);
    expect(CrossChainDataRef.fromJson(json).toBuffer()).toEqual(
      DAEMON_HASHED_EVIDENCE_REF
    );
  });

  test("round-trips the canonical daemon bytes without stripping flag 4", () => {
    const { parsed } = parseDaemonFixture();

    expect(parsed.toBuffer()).toEqual(DAEMON_HASHED_EVIDENCE_REF);
  });
});
