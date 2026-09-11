import { BN } from "bn.js";
import { SerializableEntityBase } from "../../index";
import { DEFAULT_VERUS_CHAINID } from "../../constants/pbaas";
import { CurrencyValueMap } from "../../pbaas/CurrencyValueMap";
import { DataDescriptor } from "../../pbaas/DataDescriptor";
import { MMRProof } from "../../pbaas/MMR";
import { PartialIdentity } from "../../pbaas/PartialIdentity";
import { Hash160 } from "../../vdxf/classes/Hash160";
import { GeneralTypeOrdinalVDXFObject } from "../../vdxf/classes/ordinals/OrdinalVDXFObject";
import { VDXFData } from "../../vdxf";

const CONSUMED = "Deserialization already attempted on this instance";
const ENTRY_POINTS = ["fromBuffer", "fromBufferOptionalType", "fromDataBuffer"] as const;

class DelegatingParser extends SerializableEntityBase {
  value = 0;

  fromBuffer(buffer: Buffer, offset = 0, adjustment = 0): number {
    return this.fromBufferOptionalType(buffer, offset, adjustment);
  }

  fromBufferOptionalType(buffer: Buffer, offset = 0, adjustment = 0): number {
    return this.fromDataBuffer(buffer, offset, adjustment);
  }

  fromDataBuffer(buffer: Buffer, offset = 0, adjustment = 0): number {
    this.value = buffer.readUInt8(offset) + adjustment;
    return offset + 1;
  }
}

describe("SerializableEntityBase", () => {
  test.each(ENTRY_POINTS)("%s shares one attempt with every parsing entry point", entry => {
    const parser = new DelegatingParser();

    expect(parser[entry](Buffer.from([0, 7, 0]), 1, 3)).toBe(2);
    expect(parser.value).toBe(10);

    for (const other of ENTRY_POINTS) {
      expect(() => parser[other](Buffer.from([99]))).toThrow(CONSUMED);
      expect(parser.value).toBe(10);
    }
  });

  test.each(ENTRY_POINTS)("a failed %s attempt consumes the instance", entry => {
    const parser = new DelegatingParser();

    expect(() => parser[entry](Buffer.alloc(0))).toThrow(/bounds/);
    for (const other of ENTRY_POINTS) {
      expect(() => parser[other](Buffer.from([7]))).toThrow(CONSUMED);
    }
    expect(parser.value).toBe(0);
  });

  test("consumption belongs to each instance", () => {
    const first = new DelegatingParser();
    const second = new DelegatingParser();

    first.fromBuffer(Buffer.from([1]));
    expect(second.fromBuffer(Buffer.from([2]))).toBe(1);
    expect([first.value, second.value]).toEqual([1, 2]);
  });

  test("a constructor can opt into repeated parsing, including after failure", () => {
    class RepeatableParser extends DelegatingParser {
      constructor() {
        super();
        this.allowRepeatedFromBuffer = true;
      }
    }

    const parser = new RepeatableParser();
    expect(() => parser.fromBuffer(Buffer.alloc(0))).toThrow(/bounds/);
    expect(parser.fromBuffer(Buffer.from([1]))).toBe(1);
    expect(parser.value).toBe(1);
    expect(parser.fromDataBuffer(Buffer.from([2]))).toBe(1);
    expect(parser.value).toBe(2);
  });

  test("guard state and wrappers stay out of object spreads and JSON", () => {
    const parser = new DelegatingParser();
    expect({ ...parser }).toEqual({ value: 0 });
    parser.fromBuffer(Buffer.from([7]));
    expect({ ...parser }).toEqual({ value: 7 });
    expect(JSON.stringify(parser)).toBe('{"value":7}');
  });
});

describe("single-use parser integration", () => {
  test("PartialIdentity and downstream overrides share one attempt with their superclasses", () => {
    class ExtendedIdentity extends PartialIdentity {
      parseCalls = 0;

      fromBuffer(buffer: Buffer, offset = 0, parseVdxfObjects = false): number {
        this.parseCalls++;
        return super.fromBuffer(buffer, offset, parseVdxfObjects);
      }
    }

    const wire = new PartialIdentity({ name: "first" }).toBuffer();
    const parser = new ExtendedIdentity();
    expect(parser.fromBuffer(Buffer.concat([Buffer.from([0xff]), wire]), 1, true)).toBe(wire.length + 1);
    expect(parser.toBuffer()).toEqual(wire);
    expect(parser.version.toNumber()).toBe(3);

    const replacement = new PartialIdentity({ name: "second", version: new BN(1) }).toBuffer();
    expect(() => parser.fromBuffer(replacement)).toThrow(CONSUMED);
    expect(parser.parseCalls).toBe(1);
    expect(parser.toBuffer()).toEqual(wire);
  });

  test("DataDescriptor rejects replacement before changing its flags or payload", () => {
    const wire = new DataDescriptor({ ssk: Buffer.alloc(32, 1), objectdata: Buffer.from("first") }).toBuffer();
    const parser = new DataDescriptor();
    expect(parser.fromBuffer(wire)).toBe(wire.length);

    const replacement = new DataDescriptor({ objectdata: Buffer.from("second") }).toBuffer();
    expect(() => parser.fromBuffer(replacement)).toThrow(CONSUMED);
    expect(parser.toBuffer()).toEqual(wire);
  });

  test("CurrencyValueMap preserves constructor configuration and rejects a second map", () => {
    const original = new CurrencyValueMap({
      multivalue: true,
      valueMap: new Map([[DEFAULT_VERUS_CHAINID, new BN(123)]])
    });
    const wire = original.toBuffer();
    const parser = new CurrencyValueMap({ multivalue: true });
    expect(parser.fromBuffer(wire)).toBe(wire.length);
    expect(parser.toBuffer()).toEqual(wire);

    expect(() => parser.fromBuffer(Buffer.from([0]))).toThrow(CONSUMED);
    expect(parser.toBuffer()).toEqual(wire);
  });

  test("Hash160 keeps its boolean argument and nonzero offset", () => {
    const parser = new Hash160();
    const hash = Buffer.alloc(20, 7);
    const wire = Buffer.concat([Buffer.from([0xff, hash.length]), hash]);

    expect(parser.fromBuffer(wire, true, 1)).toBe(wire.length);
    expect(parser.hash).toEqual(hash);
    expect(() => parser.fromBuffer(wire, true, 1)).toThrow(CONSUMED);
  });

  test("legacy VDXF framing and its payload reader share the guard", () => {
    const original = new VDXFData(Buffer.from("payload"), DEFAULT_VERUS_CHAINID);
    const wire = original.toBuffer();
    const parser = new VDXFData();

    expect(parser.fromBuffer(wire)).toBe(wire.length);
    expect(parser.toBuffer()).toEqual(wire);
    expect(() => parser.fromDataBuffer(Buffer.from([0]))).toThrow(CONSUMED);
    expect(parser.toBuffer()).toEqual(wire);
  });

  test("ordinal framing, optional type, and payload parsing share the guard", () => {
    const original = new GeneralTypeOrdinalVDXFObject();
    original.data = Buffer.from("payload");
    const wire = original.toBuffer();
    const parser = new GeneralTypeOrdinalVDXFObject();

    expect(parser.fromBuffer(wire)).toBe(wire.length);
    expect(parser.toBuffer()).toEqual(wire);
    expect(() => parser.fromBufferOptionalType(wire)).toThrow(CONSUMED);
    expect(() => parser.fromDataBuffer(Buffer.from("replacement"))).toThrow(CONSUMED);
    expect(parser.toBuffer()).toEqual(wire);
  });

  test("MMRProof is guarded even though it exposes only fromDataBuffer", () => {
    const parser = new MMRProof();
    const wire = Buffer.alloc(4);

    expect(parser.fromDataBuffer(wire)).toBe(wire.length);
    expect(parser.toBuffer()).toEqual(wire);
    expect(() => parser.fromDataBuffer(wire)).toThrow(CONSUMED);
  });
});
