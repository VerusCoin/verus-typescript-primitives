import { BN } from 'bn.js';
import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { SerializableEntity } from '../utils/types/SerializableEntity';
import { BigNumber } from '../utils/types/BigNumber';
import { decodeDestination, getDataKey } from '../utils/address';
import { I_ADDR_VERSION } from '../constants/vdxf';
import { TokenOutput } from './TokenOutput';
import { CurrencyValueMap } from './CurrencyValueMap';
import { currencyAmountToAtomic } from '../currency/CurrencyIdentityRegistration';
import {
  assertUint256, boundedReader, checkPayloadEnd, payloadFromHex, uint256FromHex
} from './identityRegistrationSerialization';

export type CommitmentHashJSON = {
  hash: string;
  version?: number;
  currencyvalues?: { [currency: string]: string | number };
};

const ADVANCED_KEY = decodeDestination(
  getDataKey('vrsc::system.identity.advancedcommitmenthash').id,
  I_ADDR_VERSION
);
const MIN_INT64 = new BN('-9223372036854775808');
const MAX_INT64 = new BN('9223372036854775807');

/** Decode daemon output amounts, whose wire range exceeds ParseFixedPoint's input limit. */
function commitmentCurrencyAmountToAtomic(value: string | number): BigNumber {
  // Retain the existing safe-number checks; numeric JSON must not silently lose satoshis.
  if (typeof value !== 'string') return currencyAmountToAtomic(value);
  const match = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(value);
  if (!match) throw new Error('Invalid commitment currency amount');
  const [, sign, integer, fraction = '', exponentString = '0'] = match;
  const exponent = Number(exponentString);
  if (!Number.isSafeInteger(exponent)) throw new Error('Invalid commitment currency amount');
  let digits = integer + fraction;
  let zeroes = 8 + exponent - fraction.length;
  while (zeroes < 0 && digits.endsWith('0')) {
    digits = digits.slice(0, -1);
    zeroes++;
  }
  digits = digits.replace(/^0+/, '') || '0';
  if (zeroes < 0 || digits.length + zeroes > 19) throw new Error('Invalid commitment currency amount');
  const amount = new BN(digits + '0'.repeat(zeroes));
  if (sign === '-') amount.ineg();
  if (amount.lt(MIN_INT64) || amount.gt(MAX_INT64)) {
    throw new Error('Commitment currency amount must fit a signed 64-bit integer');
  }
  return amount;
}

/** CCommitmentHash. Hash buffers are raw uint256 bytes, not display-order hex. */
export class CommitmentHash extends SerializableEntityBase implements SerializableEntity {
  static readonly DEFAULT_OUTPUT_AMOUNT = 0;
  hash: Buffer;
  tokenOutput?: TokenOutput;

  constructor(data: { hash?: Buffer; tokenOutput?: TokenOutput } = {}) {
    super();
    if (data.hash != null && !Buffer.isBuffer(data.hash)) throw new Error('Commitment hash must be a Buffer of raw uint256 bytes');
    this.hash = Buffer.from(data.hash || Buffer.alloc(32));
    this.tokenOutput = data.tokenOutput;
    // Mirrors CCommitmentHash(nullHash, validTokenOutput).
    if (this.tokenOutput?.isValid() && this.hash.length === 32 && this.hash.equals(Buffer.alloc(32))) {
      ADVANCED_KEY.copy(this.hash);
    }
  }

  static getAdvancedCommitmentHashKey(): Buffer {
    return Buffer.from(ADVANCED_KEY);
  }

  isAdvanced(): boolean {
    return Buffer.isBuffer(this.hash) && this.hash.length === 32 && this.hash.subarray(0, 20).equals(ADVANCED_KEY);
  }

  private validate(): void {
    assertUint256(this.hash, 'Commitment hash');
    if (this.isAdvanced()) {
      if (!this.tokenOutput?.isValid() || !this.tokenOutput.reserveValues.isValid()) {
        throw new Error('Advanced commitment requires a valid token output');
      }
      for (const [currency, amount] of this.tokenOutput.reserveValues.valueMap) {
        decodeDestination(currency, I_ADDR_VERSION);
        if (!BN.isBN(amount) || amount.lt(MIN_INT64) || amount.gt(MAX_INT64)) {
          throw new Error('Commitment currency amount must fit a signed 64-bit integer');
        }
        if (this.tokenOutput.reserveValues.valueMap.size === 1 && amount.isNeg()) {
          throw new Error('Single-currency commitment amount cannot use a negative VARINT');
        }
      }
    } else if (this.tokenOutput != null) {
      throw new Error('Token output requires the advanced commitment hash marker');
    }
  }

  isValid(): boolean {
    try { this.validate(); return true; } catch (_) { return false; }
  }

  toBuffer(): Buffer {
    this.validate();
    return this.isAdvanced() ? Buffer.concat([this.hash, this.tokenOutput.toBuffer()]) : Buffer.from(this.hash);
  }

  getByteLength(): number {
    this.validate();
    return 32 + (this.isAdvanced() ? this.tokenOutput.getByteLength() : 0);
  }

  /** Stream parser; supplying length requires exactly one complete payload. */
  fromBuffer(buffer: Buffer, offset = 0, length?: number): number {
    const reader = boundedReader(buffer, offset, length);
    const parsed = new CommitmentHash({ hash: Buffer.from(reader.readSlice(32)) });
    if (parsed.isAdvanced()) {
      parsed.tokenOutput = new TokenOutput();
      reader.offset = parsed.tokenOutput.fromBuffer(reader.buffer, reader.offset);
    }
    parsed.validate();
    // The token map must not lose duplicate keys or noncanonical encodings.
    if (!parsed.toBuffer().equals(reader.buffer.subarray(offset, reader.offset))) {
      throw new Error('Noncanonical commitment payload');
    }
    checkPayloadEnd(reader.offset, offset, length);
    this.hash = parsed.hash;
    this.tokenOutput = parsed.tokenOutput;
    return reader.offset;
  }

  static fromHex(hex: string): CommitmentHash {
    const bytes = payloadFromHex(hex);
    const result = new CommitmentHash();
    result.fromBuffer(bytes, 0, bytes.length);
    return result;
  }

  toJSON(): CommitmentHashJSON {
    this.validate();
    return {
      version: this.isAdvanced() ? this.tokenOutput.version.toNumber() : 1,
      currencyvalues: this.isAdvanced() ? this.tokenOutput.reserveValues.toJson() : {},
      hash: Buffer.from(this.hash).reverse().toString('hex')
    };
  }

  static fromJSON(json: CommitmentHashJSON | string): CommitmentHash {
    const data = typeof json === 'string' ? { hash: json } : json;
    const result = new CommitmentHash({ hash: uint256FromHex(data.hash, 'Commitment hash') });
    if (result.isAdvanced()) {
      if (data.version !== 1 || data.currencyvalues == null ||
          typeof data.currencyvalues !== 'object' || Array.isArray(data.currencyvalues)) {
        throw new Error('Advanced commitment JSON requires version and currencyvalues');
      }
      result.tokenOutput = new TokenOutput({
        version: new BN(data.version),
        values: new CurrencyValueMap({valueMap: new Map(Object.keys(data.currencyvalues).map(
          currency => [currency, commitmentCurrencyAmountToAtomic(data.currencyvalues[currency])]
        ))})
      });
    } else if ((data.version != null && data.version !== 1) ||
               (data.currencyvalues != null && (typeof data.currencyvalues !== 'object' ||
                Array.isArray(data.currencyvalues) || Object.keys(data.currencyvalues).length !== 0))) {
      throw new Error('Ordinary commitment may only contain empty version-1 token metadata');
    }
    result.validate();
    return result;
  }
}
