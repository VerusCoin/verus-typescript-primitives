import { BN } from 'bn.js';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { fromBase58Check, toBase58Check } from '../utils/address';
import bufferutils from '../utils/bufferutils';
import { BigNumber } from '../utils/types/BigNumber';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { CrossChainProof } from './CrossChainProof';
import { ETypes, EvidenceData, MultiPartDescriptor } from './EvidenceData';
import { UTXORef } from './UTXORef';

export enum NotaryEvidenceType {
  NOTARY_EVIDENCE = 1,
  MULTIPART_DATA = 2,
  IMPORT_PROOF = 3,
}

export enum NotaryEvidenceState {
  CONFIRMING = 1,
  SUPPORTING = 2,
  REJECTING = 3,
  PROVINGFALSE = 4,
  PROVINGTRUE = 5,
  CONFIRMED = 6,
  REJECTED = 7,
}

export interface NotaryEvidenceData {
  version?: number;
  type?: NotaryEvidenceType;
  /** Chain identity address; serialized as its raw 20-byte ID. */
  systemId?: string;
  /** The transaction hash uses wire byte order, not RPC display order. */
  output?: UTXORef;
  state?: NotaryEvidenceState;
  evidence?: CrossChainProof;
}

/**
 * CNotaryEvidence with the EvidenceData subset of CCrossChainProof.
 *
 * Defaults describe an unsigned upload: import proof, supporting, same-tx output 0.
 * Supply a nonzero systemId before constructing an output. A default instance
 * can still serialize the empty evidence used by the daemon for size estimates.
 *
 * This container does not create or verify notary signatures.
 */
export class NotaryEvidence
  extends SerializableEntityBase
  implements SerializableEntity
{
  static readonly VERSION_CURRENT = 1;

  // version (1) + type (1) + system ID (20) + outpoint (36) + state (1).
  static readonly HEADER_BYTE_LENGTH = 59;

  version: number;
  type: NotaryEvidenceType;
  systemId: string;
  output: UTXORef;
  state: NotaryEvidenceState;
  evidence: CrossChainProof;

  constructor(data: NotaryEvidenceData = {}) {
    super();

    this.version = data.version ?? NotaryEvidence.VERSION_CURRENT;
    this.type = data.type ?? NotaryEvidenceType.IMPORT_PROOF;
    this.systemId =
      data.systemId ?? toBase58Check(Buffer.alloc(20), I_ADDR_VERSION);
    this.output =
      data.output ?? new UTXORef({ hash: Buffer.alloc(32), n: new BN(0) });
    this.state = data.state ?? NotaryEvidenceState.SUPPORTING;
    this.evidence = data.evidence ?? new CrossChainProof();
  }

  /** Validate the encodable fields; isValid additionally checks daemon validity. */
  private validate(): void {
    if (
      this.version !== 1 ||
      !Number.isInteger(this.type) ||
      this.type < 1 ||
      this.type > 3 ||
      !Number.isInteger(this.state) ||
      this.state < 1 ||
      this.state > 7
    ) {
      throw new Error('Unsupported notary evidence version, type, or state');
    }

    const system = fromBase58Check(this.systemId);

    if (system.version !== I_ADDR_VERSION || system.hash.length !== 20) {
      throw new Error('Notary evidence systemId must be an identity address');
    }

    if (
      !this.output ||
      !Buffer.isBuffer(this.output.hash) ||
      this.output.hash.length !== 32 ||
      !BN.isBN(this.output.n) ||
      this.output.n.isNeg() ||
      this.output.n.gt(new BN('ffffffff', 16))
    ) {
      throw new Error(
        'Notary evidence output must contain a 32-byte hash and uint32 index'
      );
    }

    if (
      !this.evidence ||
      !BN.isBN(this.evidence.version) ||
      !this.evidence.version.eqn(1)
    ) {
      throw new Error('Unsupported cross-chain proof version');
    }

    for (const item of this.evidence.chainObjects) {
      if (
        !(item instanceof EvidenceData) ||
        !item.isValid() ||
        !Buffer.isBuffer(item.data_vec)
      ) {
        throw new Error('Unsupported evidence data');
      }

      if (item.type.eqn(ETypes.TYPE_MULTIPART_DATA)) {
        const md = item.md;

        // Multipart metadata uses a uint32 index and nonnegative int64 lengths.
        if (
          !md ||
          !BN.isBN(md.index) ||
          md.index.isNeg() ||
          md.index.bitLength() > 32 ||
          !BN.isBN(md.total_length) ||
          md.total_length.isNeg() ||
          md.total_length.bitLength() > 63 ||
          !BN.isBN(md.start) ||
          md.start.isNeg() ||
          md.start.bitLength() > 63
        ) {
          throw new Error('Invalid multipart descriptor');
        }
      } else {
        const key = fromBase58Check(item.vdxfd);

        if (key.version !== I_ADDR_VERSION || key.hash.length !== 20) {
          throw new Error('Evidence data VDXF key must be an identity address');
        }
      }
    }
  }

  isValid(): boolean {
    try {
      this.validate();

      // Scratch evidence is serializable, but a zero system or null outpoint
      // index is not valid evidence according to CNotaryEvidence::IsValid.
      return (
        !fromBase58Check(this.systemId).hash.equals(Buffer.alloc(20)) &&
        this.output.n.lt(new BN('ffffffff', 16))
      );
    } catch (_) {
      return false;
    }
  }

  getByteLength(): number {
    this.validate();

    return NotaryEvidence.HEADER_BYTE_LENGTH + this.evidence.getByteLength();
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(
      Buffer.alloc(this.getByteLength())
    );

    // This fixed header precedes CCrossChainProof without a vector length.
    writer.writeUInt8(this.version);
    writer.writeUInt8(this.type);
    writer.writeSlice(fromBase58Check(this.systemId).hash);
    writer.writeSlice(this.output.toBuffer());
    writer.writeUInt8(this.state);

    writer.writeSlice(this.evidence.toBuffer());

    return writer.buffer;
  }

  /**
   * Parse one evidence object and return its absolute end offset.
   * An explicit length bounds all nested reads and rejects trailing bytes;
   * omitting it allows this object to be read from a larger serialized stream.
   */
  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    if (
      !Buffer.isBuffer(buffer) ||
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      offset > buffer.length ||
      (length != null &&
        (!Number.isSafeInteger(length) ||
          length < 0 ||
          length > buffer.length - offset))
    ) {
      throw new Error('Invalid notary evidence bounds');
    }

    // Keep offsets relative to the original buffer while bounding child parsers.
    const reader = new bufferutils.BufferReader(
      length == null ? buffer : buffer.subarray(0, offset + length),
      offset
    );

    const version = reader.readUInt8();
    const type = reader.readUInt8();
    const systemId = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);

    const output = new UTXORef();
    reader.offset = output.fromBuffer(reader.buffer, reader.offset);
    const state = reader.readUInt8();

    const evidence = new CrossChainProof();
    reader.offset = evidence.fromBuffer(reader.buffer, reader.offset);

    // Re-encoding catches noncanonical nested fields, including mismatched
    // copies of the version that CEvidenceData writes twice on the wire.
    const parsed = new NotaryEvidence({
      version,
      type,
      systemId,
      output,
      state,
      evidence,
    });

    if (
      (length != null && reader.offset !== offset + length) ||
      !parsed.toBuffer().equals(reader.buffer.subarray(offset, reader.offset))
    ) {
      throw new Error('Noncanonical or trailing notary evidence data');
    }

    // Do not retain partially parsed state when validation fails.
    this.version = version;
    this.type = type;
    this.systemId = systemId;
    this.output = output;
    this.state = state;
    this.evidence = evidence;

    return reader.offset;
  }

  /**
   * Split the complete serialized object exactly as CNotaryEvidence::BreakApart.
   * The caller chooses capacity from the enclosing script limit and decides
   * whether splitting is necessary. Even a single returned chunk is multipart.
   */
  breakApart(maxChunkSize: number): NotaryEvidence[] {
    if (!Number.isSafeInteger(maxChunkSize) || maxChunkSize <= 0) {
      throw new Error('Multipart chunk size must be a positive safe integer');
    }

    // Offsets refer to the entire original encoding, including its header.
    // Descriptor encryption and logical MMR construction have already happened.
    const bytes = this.toBuffer();
    const parts: NotaryEvidence[] = [];

    for (let start = 0; start < bytes.length; start += maxChunkSize) {
      const chunk = new EvidenceData({
        version: new BN(1),
        type: new BN(ETypes.TYPE_MULTIPART_DATA),
        md: new MultiPartDescriptor({
          index: new BN(parts.length),
          total_length: new BN(bytes.length),
          start: new BN(start),
        }),
        vdxfd: undefined,
        data_vec: Buffer.from(bytes.subarray(start, start + maxChunkSize)),
      });

      parts.push(
        new NotaryEvidence({
          type: NotaryEvidenceType.MULTIPART_DATA,
          systemId: this.systemId,
          output: new UTXORef({
            hash: Buffer.from(this.output.hash),
            n: this.output.n.clone(),
          }),
          state: this.state,
          evidence: new CrossChainProof({ chainObjects: [chunk] }),
        })
      );
    }

    return parts;
  }

  /** Reassemble one ordered group, rejecting missing, mixed, or corrupt parts. */
  static reassemble(parts: NotaryEvidence[]): NotaryEvidence {
    if (!parts.length) {
      throw new Error('Multipart evidence group is empty');
    }

    const first = parts[0];
    const chunks: Buffer[] = [];
    let total: BigNumber;
    let offset = 0;

    parts.forEach((part, index) => {
      part.validate();

      const item = part.evidence.chainObjects[0];

      // A part must belong to this group and begin exactly where the prior
      // part ended. This rejects mixed uploads, gaps, duplicates, and reordering.
      if (
        !part.isValid() ||
        part.type !== NotaryEvidenceType.MULTIPART_DATA ||
        part.evidence.chainObjects.length !== 1 ||
        !item.type.eqn(ETypes.TYPE_MULTIPART_DATA) ||
        part.systemId !== first.systemId ||
        part.state !== first.state ||
        !part.output.toBuffer().equals(first.output.toBuffer()) ||
        !item.md.index.eqn(index) ||
        !item.md.start.eq(new BN(offset)) ||
        !item.data_vec.length
      ) {
        throw new Error('Invalid multipart evidence ordering or header');
      }

      if (total == null) {
        total = item.md.total_length;
      }

      if (!item.md.total_length.eq(total)) {
        throw new Error('Inconsistent multipart total length');
      }

      offset += item.data_vec.length;

      if (new BN(offset).gt(total)) {
        throw new Error('Multipart evidence exceeds total length');
      }

      chunks.push(item.data_vec);
    });

    if (!total.eq(new BN(offset))) {
      throw new Error('Incomplete multipart evidence');
    }

    const bytes = Buffer.concat(chunks, offset);
    const result = new NotaryEvidence();
    result.fromBuffer(bytes, 0, bytes.length);

    // The reconstructed header must agree with the physical part headers.
    // Accept one complete evidence object, never another layer of fragments.
    if (
      !result.isValid() ||
      result.type === NotaryEvidenceType.MULTIPART_DATA ||
      result.systemId !== first.systemId ||
      result.state !== first.state ||
      !result.output.toBuffer().equals(first.output.toBuffer())
    ) {
      throw new Error('Multipart evidence does not match its wrapper');
    }

    return result;
  }
}
