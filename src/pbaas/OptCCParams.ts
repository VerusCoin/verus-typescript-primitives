import * as bscript from '../utils/script';
import { EVALS } from '../utils/evals';
import varuint from '../utils/varuint';
import { TxDestination } from './TxDestination';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BigNumber } from '../utils/types/BigNumber';
import { BN } from 'bn.js';
import bufferutils from '../utils/bufferutils';

export type VData = Array<Buffer>;

export class OptCCParams implements SerializableEntity {
  version: BigNumber;
  evalCode: BigNumber;
  m: BigNumber;
  n: BigNumber;
  destinations: Array<TxDestination>;
  vData: VData;

  constructor(data?: {
    version?: BigNumber;
    evalCode?: BigNumber;
    m?: BigNumber;
    n?: BigNumber;
    destinations?: Array<TxDestination>;
    vData?: VData;
  }) {
    if (data != null) {
      const d = data as any;
      if (Object.prototype.hasOwnProperty.call(d, 'eval_code')) {
        throw new Error("OptCCParams: snake_case property names are no longer supported. Use 'evalCode' instead of 'eval_code'.");
      }
      if (Object.prototype.hasOwnProperty.call(d, 'vdata')) {
        throw new Error("OptCCParams: Use 'vData' instead of 'vdata'.");
      }
    }
    if (data?.version) this.version = data.version;
    if (data?.evalCode) this.evalCode = data.evalCode;
    if (data?.m) this.m = data.m;
    if (data?.n) this.n = data.n;
    if (data?.destinations) this.destinations = data.destinations;
    else this.destinations = [];
    if (data?.vData) this.vData = data.vData;
    else this.vData = [];
  }

  /** @deprecated Use evalCode instead */
  get eval_code(): BigNumber { return this.evalCode; }

  /** @deprecated Use vData instead */
  get vdata(): VData { return this.vData; }

  getParamObject(): null | Buffer {
    switch (this.evalCode.toNumber()) {
      case EVALS.EVAL_NONE:
        {
          return null
        }
      case EVALS.EVAL_STAKEGUARD:
      case EVALS.EVAL_CURRENCY_DEFINITION:
      case EVALS.EVAL_NOTARY_EVIDENCE:
      case EVALS.EVAL_EARNEDNOTARIZATION:
      case EVALS.EVAL_ACCEPTEDNOTARIZATION:
      case EVALS.EVAL_FINALIZE_NOTARIZATION:
      case EVALS.EVAL_CURRENCYSTATE:
      case EVALS.EVAL_RESERVE_TRANSFER:
      case EVALS.EVAL_RESERVE_OUTPUT:
      case EVALS.EVAL_RESERVE_DEPOSIT:
      case EVALS.EVAL_CROSSCHAIN_EXPORT:
      case EVALS.EVAL_CROSSCHAIN_IMPORT:
      case EVALS.EVAL_IDENTITY_PRIMARY:
      case EVALS.EVAL_IDENTITY_COMMITMENT:
      case EVALS.EVAL_IDENTITY_RESERVATION:
      case EVALS.EVAL_FINALIZE_EXPORT:
      case EVALS.EVAL_FEE_POOL:
      case EVALS.EVAL_NOTARY_SIGNATURE:
        {
          if (this.vData.length) {
            return this.vData[0]
          } else {
            return null
          }
        }
      default:
        {
          return null
        }
    }
  }

  isValid(): boolean {
    var validEval = false
    switch (this.evalCode.toNumber()) {
      case EVALS.EVAL_NONE:
        {
          validEval = true
          break
        }
      case EVALS.EVAL_STAKEGUARD:
      case EVALS.EVAL_CURRENCY_DEFINITION:
      case EVALS.EVAL_NOTARY_EVIDENCE:
      case EVALS.EVAL_EARNEDNOTARIZATION:
      case EVALS.EVAL_ACCEPTEDNOTARIZATION:
      case EVALS.EVAL_FINALIZE_NOTARIZATION:
      case EVALS.EVAL_CURRENCYSTATE:
      case EVALS.EVAL_RESERVE_TRANSFER:
      case EVALS.EVAL_RESERVE_OUTPUT:
      case EVALS.EVAL_RESERVE_DEPOSIT:
      case EVALS.EVAL_CROSSCHAIN_EXPORT:
      case EVALS.EVAL_CROSSCHAIN_IMPORT:
      case EVALS.EVAL_IDENTITY_PRIMARY:
      case EVALS.EVAL_IDENTITY_COMMITMENT:
      case EVALS.EVAL_IDENTITY_RESERVATION:
      case EVALS.EVAL_FINALIZE_EXPORT:
      case EVALS.EVAL_FEE_POOL:
      case EVALS.EVAL_NOTARY_SIGNATURE:
        {
          validEval = this.vData && this.vData.length > 0
        }
    }

    return (
      validEval &&
      this.version.gt(new BN(0)) &&
      this.version.lt(new BN(4)) &&
      (
        (this.version.lt(new BN(3)) && this.evalCode.lt(new BN(2))) ||
        (this.evalCode.lte(new BN(26)) && this.m.lte(this.n))
      )
    )
  }

  static fromChunk(chunk: Buffer): OptCCParams {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(varuint.encodingLength(chunk.length)), 0);
    writer.writeCompactSize(chunk.length);

    const params = new OptCCParams()

    params.fromBuffer(Buffer.concat([writer.buffer, chunk]))

    return params
  }

  toChunk(): Buffer {
    return this.internalToBuffer(true);
  }

  fromBuffer(buffer: Buffer, offset = 0): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    const scriptInVector = reader.readVarSlice();
    const chunks = bscript.decompile(scriptInVector);
    const firstChunk = chunks[0];

    if (!Buffer.isBuffer(firstChunk)) {
      throw new Error('invalid first chunk date type');
    }

    if (firstChunk.length !== 4) {
      throw new Error('invalid optional parameters header');
    }

    const chunkReader = new bufferutils.BufferReader(firstChunk, 0);

    this.version = new BN(chunkReader.readUInt8());
    this.evalCode = new BN(chunkReader.readUInt8());
    this.m = new BN(chunkReader.readUInt8());
    this.n = new BN(chunkReader.readUInt8());

    // now, we should have n keys followed by data objects for later versions, otherwise all keys and one data object
    if (this.version.lte(new BN(0)) ||
        this.version.gt(new BN(3)) ||
        this.evalCode.lt(new BN(0)) ||
        this.evalCode.gt(new BN(0x1a)) || // this is the last valid eval code as of version 3
        (this.version.lt(new BN(3)) && this.n.lt(new BN(1))) ||
        this.n.gt(new BN(4)) ||
        (this.version.lt(new BN(3)) && this.n.gte(new BN(chunks.length))) ||
        this.n.gt(new BN(chunks.length))) {
      // invalid header values
      throw new Error('invalid header values');
    }

    // now, we have chunks left that are either destinations or data vectors
    const limit = this.n.eq(new BN(chunks.length)) ? this.n : this.n.add(new BN(1));
    this.destinations = [];
    let loop: number;

    for (loop = 1; this.version && loop < limit.toNumber(); loop++) {
      const currChunk = chunks[loop]
      if (Buffer.isBuffer(currChunk)) {
        const oneDest = TxDestination.fromChunk(currChunk);

        this.destinations.push(oneDest);
      }
    }

    for (; this.version && loop < chunks.length; loop++) {
      const currChunk = chunks[loop];

      if (Buffer.isBuffer(currChunk)) this.vData.push(currChunk);
    }

    return offset;
  }

  internalGetByteLength(asChunk: boolean): number {
    const chunks = [Buffer.alloc(4)];
    chunks[0][0] = this.version.toNumber();
    chunks[0][1] = this.evalCode.toNumber();
    chunks[0][2] = this.m.toNumber();
    chunks[0][3] = this.n.toNumber();

    this.destinations.forEach(x => {
      chunks.push(x.toChunk());
    })

    this.vData.forEach(x => {
      chunks.push(x);
    })

    const buf = bscript.compile(chunks);

    return asChunk ? buf.length : (varuint.encodingLength(buf.length) + buf.length);
  }

  getByteLength(): number {
    return this.internalGetByteLength(false);
  }

  private internalToBuffer(asChunk: boolean): Buffer {
    const chunks = [Buffer.alloc(4)];
    chunks[0][0] = this.version.toNumber();
    chunks[0][1] = this.evalCode.toNumber();
    chunks[0][2] = this.m.toNumber();
    chunks[0][3] = this.n.toNumber();

    this.destinations.forEach(x => {
      chunks.push(x.toChunk());
    });

    this.vData.forEach(x => {
      chunks.push(x);
    });

    const scriptStore = bscript.compile(chunks);
    const buf = bscript.compile(chunks);
    const len = asChunk ? buf.length : varuint.encodingLength(buf.length) + buf.length;

    const buffer = Buffer.alloc(len);
    const writer = new bufferutils.BufferWriter(buffer);

    if (asChunk) {
      writer.writeSlice(scriptStore)
    } else {
      writer.writeVarSlice(scriptStore)
    }

    return writer.buffer;
  }

  toBuffer(): Buffer {
    return this.internalToBuffer(false);
  }
}
