import { BN } from 'bn.js';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { CrossChainProof } from '../../pbaas/CrossChainProof';
import {
  ETypes,
  EvidenceData,
  MultiPartDescriptor,
} from '../../pbaas/EvidenceData';
import { NotaryEvidence, NotaryEvidenceType } from '../../pbaas/NotaryEvidence';
import { toBase58Check } from '../../utils/address';
import varint from '../../utils/varint';

const boundedFields = [
  {
    name: 'cross-chain proof count',
    bits: 31,
    prefix: Buffer.from([1, 0, 0, 0]),
    parse: (bytes: Buffer) => new CrossChainProof().fromBuffer(bytes),
  },
  {
    name: 'first evidence version',
    bits: 32,
    prefix: Buffer.alloc(0),
    parse: (bytes: Buffer) => new EvidenceData().fromBuffer(bytes),
  },
  {
    name: 'repeated evidence version',
    bits: 32,
    prefix: Buffer.from([1]),
    parse: (bytes: Buffer) => new EvidenceData().fromBuffer(bytes),
  },
  {
    name: 'evidence type',
    bits: 32,
    prefix: Buffer.from([1, 1]),
    parse: (bytes: Buffer) => new EvidenceData().fromBuffer(bytes),
  },
  {
    name: 'multipart index',
    bits: 32,
    prefix: Buffer.alloc(0),
    parse: (bytes: Buffer) => new MultiPartDescriptor().fromBuffer(bytes),
  },
  {
    name: 'multipart total length',
    bits: 63,
    prefix: Buffer.from([0]),
    parse: (bytes: Buffer) => new MultiPartDescriptor().fromBuffer(bytes),
  },
  {
    name: 'multipart start',
    bits: 63,
    prefix: Buffer.from([0, 0]),
    parse: (bytes: Buffer) => new MultiPartDescriptor().fromBuffer(bytes),
  },
];

describe('Evidence VARINT bounds', () => {
  test.each(boundedFields)(
    'rejects one past the daemon range for $name',
    ({ bits, prefix, parse }) => {
      const overflow = new BN(1).shln(bits);
      const encoded = varint.encode(
        overflow,
        Buffer.alloc(varint.encodingLength(overflow)),
        0
      ).buffer;
      const bytes = Buffer.concat([prefix, encoded]);

      expect(() => parse(bytes)).toThrow(
        new RangeError(`VARINT exceeds ${bits}-bit range`)
      );
    }
  );

  test.each(boundedFields)(
    'rejects a long $name without scanning the continuation sequence',
    ({ bits, prefix, parse }) => {
      const bytes = Buffer.concat([
        prefix,
        Buffer.alloc(50000, 0xff),
        Buffer.from([0]),
      ]);
      const readUInt8 = bytes.readUInt8;
      const maxReads = prefix.length + Math.ceil(bits / 7);
      let reads = 0;

      // A read budget proves early rejection without a timing-sensitive test.
      // It also prevents a regression from decoding the full oversized integer.
      const readSpy = jest
        .spyOn(bytes, 'readUInt8')
        .mockImplementation((offset) => {
          if (++reads > maxReads) {
            throw new Error('VARINT decoder exceeded its byte budget');
          }

          return readUInt8.call(bytes, offset);
        });

      try {
        expect(() => parse(bytes)).toThrow(
          new RangeError(`VARINT exceeds ${bits}-bit range`)
        );
        expect(reads).toBeGreaterThan(0);
        expect(reads).toBeLessThanOrEqual(maxReads);
      } finally {
        readSpy.mockRestore();
      }
    }
  );

  test('accepts the largest daemon multipart metadata values', () => {
    const descriptor = new MultiPartDescriptor({
      index: new BN(1).shln(32).subn(1),
      total_length: new BN(1).shln(63).subn(1),
      start: new BN(1).shln(63).subn(1),
    });
    const bytes = descriptor.toBuffer();
    const parsed = new MultiPartDescriptor();

    expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
    expect(parsed.index.eq(descriptor.index)).toBe(true);
    expect(parsed.total_length.eq(descriptor.total_length)).toBe(true);
    expect(parsed.start.eq(descriptor.start)).toBe(true);
  });

  test('bounds a malformed proof count reconstructed from valid multipart evidence', () => {
    const systemId = toBase58Check(Buffer.alloc(20, 0x42), I_ADDR_VERSION);
    const evidence = new NotaryEvidence({ systemId });

    // Keep the fixed notary header and proof version, then replace the proof
    // count with a 50 KB VARINT spanning nine individually valid fragments.
    const countOffset = NotaryEvidence.HEADER_BYTE_LENGTH + 4;
    const malformed = Buffer.concat([
      evidence.toBuffer().subarray(0, countOffset),
      Buffer.alloc(50000, 0xff),
      Buffer.from([0]),
    ]);
    const parts: NotaryEvidence[] = [];
    const capacity = 5724;

    for (let start = 0; start < malformed.length; start += capacity) {
      const chunk = new EvidenceData({
        version: new BN(1),
        type: new BN(ETypes.TYPE_MULTIPART_DATA),
        md: new MultiPartDescriptor({
          index: new BN(parts.length),
          total_length: new BN(malformed.length),
          start: new BN(start),
        }),
        vdxfd: undefined,
        data_vec: malformed.subarray(start, start + capacity),
      });

      parts.push(
        new NotaryEvidence({
          type: NotaryEvidenceType.MULTIPART_DATA,
          systemId,
          evidence: new CrossChainProof({ chainObjects: [chunk] }),
        })
      );
    }

    expect(parts).toHaveLength(9);
    expect(parts.every((part) => part.isValid())).toBe(true);

    const readUInt8 = Buffer.prototype.readUInt8;
    let reconstructedReads = 0;

    // Reassembly creates a new buffer. Guard that buffer's byte reads while
    // allowing the three single-byte fixed-header fields before the VARINT.
    const maxReads = 3 + Math.ceil(31 / 7);
    const readSpy = jest
      .spyOn(Buffer.prototype, 'readUInt8')
      .mockImplementation(function (this: Buffer, offset: number) {
        if (
          this.length === malformed.length &&
          ++reconstructedReads > maxReads
        ) {
          throw new Error('Reassembled VARINT exceeded its byte budget');
        }

        return readUInt8.call(this, offset);
      });

    try {
      expect(() => NotaryEvidence.reassemble(parts)).toThrow(
        new RangeError('VARINT exceeds 31-bit range')
      );
      expect(reconstructedReads).toBeGreaterThan(3);
      expect(reconstructedReads).toBeLessThanOrEqual(maxReads);
    } finally {
      readSpy.mockRestore();
    }
  });
});
