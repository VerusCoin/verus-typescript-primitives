import { BN } from 'bn.js';
import { I_ADDR_VERSION } from '../../constants/vdxf';
import { toBase58Check } from '../../utils/address';
import { CrossChainProof } from '../../pbaas/CrossChainProof';
import { EvidenceData, ETypes } from '../../pbaas/EvidenceData';
import {
  NotaryEvidence,
  NotaryEvidenceState,
  NotaryEvidenceType,
} from '../../pbaas/NotaryEvidence';
import { UTXORef } from '../../pbaas/UTXORef';

const systemId = toBase58Check(
  Buffer.from('00112233445566778899aabbccddeeff00112233', 'hex'),
  I_ADDR_VERSION
);
const vdxfKey = toBase58Check(Buffer.alloc(20, 0x42), I_ADDR_VERSION);

function makeEvidence(
  payload = Buffer.from('deadbeef', 'hex')
): NotaryEvidence {
  return new NotaryEvidence({
    systemId,
    output: new UTXORef({ hash: Buffer.alloc(32, 0xaa), n: new BN(7) }),
    evidence: new CrossChainProof({
      chainObjects: [
        new EvidenceData({
          version: new BN(1),
          type: new BN(ETypes.TYPE_DATA),
          md: undefined,
          vdxfd: vdxfKey,
          data_vec: payload,
        }),
      ],
    }),
  });
}

// Source-derived CNotaryEvidence fixture (block.h): 59-byte fixed header,
// CCrossChainProof uint32 version/VARINT count/uint16 object tag, followed by
// CEvidenceData's repeated VARINT version, type, raw VDXF key, CompactSize data.
const canonicalHex =
  '010300112233445566778899aabbccddeeff00112233' +
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0700000002' +
  '01000000010a00010101' +
  '424242424242424242424242424242424242424204deadbeef';

describe('NotaryEvidence daemon serialization', () => {
  test('encodes the exact fixed header and duplicated evidence version', () => {
    const evidence = makeEvidence();

    expect(evidence.isValid()).toBe(true);
    expect(evidence.toBuffer().toString('hex')).toBe(canonicalHex);
    expect(evidence.getByteLength()).toBe(canonicalHex.length / 2);
    expect(
      evidence
        .toBuffer()
        .subarray(NotaryEvidence.HEADER_BYTE_LENGTH, 64)
        .toString('hex')
    ).toBe('0100000001');
  });

  test('defaults to a supporting unsigned upload and a complete null outpoint', () => {
    const evidence = new NotaryEvidence({ systemId });

    expect(evidence.type).toBe(NotaryEvidenceType.IMPORT_PROOF);
    expect(evidence.state).toBe(NotaryEvidenceState.SUPPORTING);
    expect(evidence.toBuffer().subarray(22, 58)).toEqual(Buffer.alloc(36));
    expect(evidence.getByteLength()).toBe(64);
  });

  test('keeps the cross-chain proof object count as VARINT at 128 objects', () => {
    const evidence = makeEvidence();

    // At 128, the daemon's VARINT differs from CompactSize encoding.
    evidence.evidence.chainObjects = Array(128).fill(
      evidence.evidence.chainObjects[0]
    );

    expect(evidence.toBuffer().subarray(59, 65).toString('hex')).toBe(
      '010000008000'
    );

    const parsed = new NotaryEvidence();
    const bytes = evidence.toBuffer();

    expect(parsed.fromBuffer(bytes, 0, bytes.length)).toBe(bytes.length);
    expect(parsed.evidence.chainObjects).toHaveLength(128);
  });

  test.each([0, 5])(
    'supports stream offsets %i and an explicit object boundary',
    (offset) => {
      const bytes = Buffer.from(canonicalHex, 'hex');
      const source = Buffer.concat([
        Buffer.alloc(offset, 0xbb),
        bytes,
        Buffer.from([0xcc]),
      ]);
      const parsed = new NotaryEvidence();

      expect(parsed.fromBuffer(source, offset, bytes.length)).toBe(
        offset + bytes.length
      );
      expect(parsed.toBuffer()).toEqual(bytes);

      // Explicit boundaries must neither consume trailing bytes nor omit data.
      expect(() =>
        new NotaryEvidence().fromBuffer(source, offset, bytes.length + 1)
      ).toThrow(/trailing/);
      expect(() =>
        new NotaryEvidence().fromBuffer(source, offset, bytes.length - 1)
      ).toThrow();
      expect(new NotaryEvidence().fromBuffer(source, offset)).toBe(
        offset + bytes.length
      );
    }
  );

  test.each([0, 1, 21, 57, 58, 59, 63, 64, 66, 68, 88, 93])(
    'rejects a truncated payload at %i bytes',
    (length) => {
      expect(() =>
        new NotaryEvidence().fromBuffer(
          Buffer.from(canonicalHex, 'hex').subarray(0, length)
        )
      ).toThrow();
    }
  );

  test('rejects noncanonical repeated versions and unsupported chain objects', () => {
    const bytes = Buffer.from(canonicalHex, 'hex');

    // Legacy decoding overwrites the first version with the repeated version.
    // Reject a mismatch rather than silently changing the serialized bytes.
    bytes[66] = 2;

    expect(() => new NotaryEvidence().fromBuffer(bytes)).toThrow(
      /Noncanonical/
    );

    bytes[66] = 1;

    // NOTARYSIGNATURE is outside this codec's supported subset.
    bytes[64] = 9;

    expect(() => new NotaryEvidence().fromBuffer(bytes)).toThrow(
      /chain object/
    );
  });

  test.each([
    (item: NotaryEvidence) => {
      item.version = 2;
    },
    (item: NotaryEvidence) => {
      item.type = 0 as NotaryEvidenceType;
    },
    (item: NotaryEvidence) => {
      item.state = 0 as NotaryEvidenceState;
    },
    (item: NotaryEvidence) => {
      item.systemId = toBase58Check(Buffer.alloc(20), 60);
    },
    (item: NotaryEvidence) => {
      item.output.hash = Buffer.alloc(0);
    },
    (item: NotaryEvidence) => {
      item.output.n = new BN(-1);
    },
    (item: NotaryEvidence) => {
      item.evidence.version = new BN(2);
    },
  ])('rejects invalid serialization fields', (mutate) => {
    const item = makeEvidence();

    mutate(item);

    expect(item.isValid()).toBe(false);
    expect(() => item.toBuffer()).toThrow();
  });
});

describe('NotaryEvidence multipart framing', () => {
  test.each([1, 64, 128, 5724, 100000])(
    'splits the entire serialized object into %i-byte chunks',
    (capacity) => {
      const evidence = makeEvidence(
        Buffer.alloc(capacity < 1000 ? 257 : 12000, 0xab)
      );
      const serialized = evidence.toBuffer();
      const parts = evidence.breakApart(capacity);

      expect(parts).toHaveLength(Math.ceil(serialized.length / capacity));

      parts.forEach((part, index) => {
        expect(part.type).toBe(NotaryEvidenceType.MULTIPART_DATA);
        expect(part.systemId).toBe(systemId);
        expect(part.output.toBuffer()).toEqual(evidence.output.toBuffer());
        expect(part.state).toBe(evidence.state);

        // Offsets cover the full serialized object, including its header.
        const item = part.evidence.chainObjects[0];

        expect(item.type.toNumber()).toBe(ETypes.TYPE_MULTIPART_DATA);
        expect(item.md.index.toNumber()).toBe(index);
        expect(item.md.start.toNumber()).toBe(index * capacity);
        expect(item.md.total_length.toNumber()).toBe(serialized.length);
        expect(item.data_vec).toEqual(
          serialized.subarray(index * capacity, (index + 1) * capacity)
        );
      });

      expect(NotaryEvidence.reassemble(parts).toBuffer()).toEqual(serialized);
    }
  );

  test('matches exact chunk boundaries with no empty final chunk', () => {
    // DATA overhead = 59 + 7 + 3 + 20 + 3 = 92 bytes for a >=253 byte payload.
    const evidence = makeEvidence(Buffer.alloc(5724 * 2 - 92));

    expect(evidence.getByteLength()).toBe(5724 * 2);
    expect(
      evidence
        .breakApart(5724)
        .map((part) => part.evidence.chainObjects[0].data_vec.length)
    ).toEqual([5724, 5724]);
  });

  test.each([0, -1, 1.5, Infinity, NaN])(
    'rejects an unsafe capacity %s',
    (capacity) => {
      expect(() => makeEvidence().breakApart(capacity)).toThrow(
        /positive safe integer/
      );
    }
  );

  test.each([
    (parts: NotaryEvidence[]) => {
      parts.pop();
    },
    (parts: NotaryEvidence[]) => {
      parts.reverse();
    },
    (parts: NotaryEvidence[]) => {
      parts[1].evidence.chainObjects[0].md.index = new BN(0);
    },
    (parts: NotaryEvidence[]) => {
      parts[1].evidence.chainObjects[0].md.start.iaddn(1);
    },
    (parts: NotaryEvidence[]) => {
      parts[1].evidence.chainObjects[0].md.total_length.iaddn(1);
    },
    (parts: NotaryEvidence[]) => {
      parts[1].systemId = vdxfKey;
    },
    (parts: NotaryEvidence[]) => {
      parts[1].state = NotaryEvidenceState.CONFIRMED;
    },
    (parts: NotaryEvidence[]) => {
      parts[1].output.n.iaddn(1);
    },
    (parts: NotaryEvidence[]) => {
      parts[1].evidence.chainObjects[0].data_vec = Buffer.alloc(0);
    },
    (parts: NotaryEvidence[]) => {
      // Alter the reconstructed system ID while retaining the fragment headers.
      parts[0].evidence.chainObjects[0].data_vec[2] ^= 1;
    },
  ])('rejects corrupt, incomplete, reordered, and mixed groups', (mutate) => {
    const parts = makeEvidence(Buffer.alloc(12000)).breakApart(5724);

    mutate(parts);

    expect(() => NotaryEvidence.reassemble(parts)).toThrow();
  });

  test('rejects an empty group and unsplit objects', () => {
    expect(() => NotaryEvidence.reassemble([])).toThrow(/empty/);
    expect(() => NotaryEvidence.reassemble([makeEvidence()])).toThrow(
      /ordering/
    );
  });
});
