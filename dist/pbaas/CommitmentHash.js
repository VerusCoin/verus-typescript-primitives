"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommitmentHash = void 0;
const bn_js_1 = require("bn.js");
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const address_1 = require("../utils/address");
const vdxf_1 = require("../constants/vdxf");
const TokenOutput_1 = require("./TokenOutput");
const CurrencyValueMap_1 = require("./CurrencyValueMap");
const CurrencyIdentityRegistration_1 = require("../currency/CurrencyIdentityRegistration");
const identityRegistrationSerialization_1 = require("./identityRegistrationSerialization");
const ADVANCED_KEY = (0, address_1.decodeDestination)((0, address_1.getDataKey)('vrsc::system.identity.advancedcommitmenthash').id, vdxf_1.I_ADDR_VERSION);
const MIN_INT64 = new bn_js_1.BN('-9223372036854775808');
const MAX_INT64 = new bn_js_1.BN('9223372036854775807');
/** Decode daemon output amounts, whose wire range exceeds ParseFixedPoint's input limit. */
function commitmentCurrencyAmountToAtomic(value) {
    // Retain the existing safe-number checks; numeric JSON must not silently lose satoshis.
    if (typeof value !== 'string')
        return (0, CurrencyIdentityRegistration_1.currencyAmountToAtomic)(value);
    const match = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(value);
    if (!match)
        throw new Error('Invalid commitment currency amount');
    const [, sign, integer, fraction = '', exponentString = '0'] = match;
    const exponent = Number(exponentString);
    if (!Number.isSafeInteger(exponent))
        throw new Error('Invalid commitment currency amount');
    let digits = integer + fraction;
    let zeroes = 8 + exponent - fraction.length;
    while (zeroes < 0 && digits.endsWith('0')) {
        digits = digits.slice(0, -1);
        zeroes++;
    }
    digits = digits.replace(/^0+/, '') || '0';
    if (zeroes < 0 || digits.length + zeroes > 19)
        throw new Error('Invalid commitment currency amount');
    const amount = new bn_js_1.BN(digits + '0'.repeat(zeroes));
    if (sign === '-')
        amount.ineg();
    if (amount.lt(MIN_INT64) || amount.gt(MAX_INT64)) {
        throw new Error('Commitment currency amount must fit a signed 64-bit integer');
    }
    return amount;
}
/** CCommitmentHash. Hash buffers are raw uint256 bytes, not display-order hex. */
class CommitmentHash extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data = {}) {
        var _a;
        super();
        if (data.hash != null && !Buffer.isBuffer(data.hash))
            throw new Error('Commitment hash must be a Buffer of raw uint256 bytes');
        this.hash = Buffer.from(data.hash || Buffer.alloc(32));
        this.tokenOutput = data.tokenOutput;
        // Mirrors CCommitmentHash(nullHash, validTokenOutput).
        if (((_a = this.tokenOutput) === null || _a === void 0 ? void 0 : _a.isValid()) && this.hash.length === 32 && this.hash.equals(Buffer.alloc(32))) {
            ADVANCED_KEY.copy(this.hash);
        }
    }
    static getAdvancedCommitmentHashKey() {
        return Buffer.from(ADVANCED_KEY);
    }
    isAdvanced() {
        return Buffer.isBuffer(this.hash) && this.hash.length === 32 && this.hash.subarray(0, 20).equals(ADVANCED_KEY);
    }
    validate() {
        var _a;
        (0, identityRegistrationSerialization_1.assertUint256)(this.hash, 'Commitment hash');
        if (this.isAdvanced()) {
            if (!((_a = this.tokenOutput) === null || _a === void 0 ? void 0 : _a.isValid()) || !this.tokenOutput.reserveValues.isValid()) {
                throw new Error('Advanced commitment requires a valid token output');
            }
            for (const [currency, amount] of this.tokenOutput.reserveValues.valueMap) {
                (0, address_1.decodeDestination)(currency, vdxf_1.I_ADDR_VERSION);
                if (!bn_js_1.BN.isBN(amount) || amount.lt(MIN_INT64) || amount.gt(MAX_INT64)) {
                    throw new Error('Commitment currency amount must fit a signed 64-bit integer');
                }
                if (this.tokenOutput.reserveValues.valueMap.size === 1 && amount.isNeg()) {
                    throw new Error('Single-currency commitment amount cannot use a negative VARINT');
                }
            }
        }
        else if (this.tokenOutput != null) {
            throw new Error('Token output requires the advanced commitment hash marker');
        }
    }
    isValid() {
        try {
            this.validate();
            return true;
        }
        catch (_) {
            return false;
        }
    }
    toBuffer() {
        this.validate();
        return this.isAdvanced() ? Buffer.concat([this.hash, this.tokenOutput.toBuffer()]) : Buffer.from(this.hash);
    }
    getByteLength() {
        this.validate();
        return 32 + (this.isAdvanced() ? this.tokenOutput.getByteLength() : 0);
    }
    /** Stream parser; supplying length requires exactly one complete payload. */
    fromBuffer(buffer, offset = 0, length) {
        const reader = (0, identityRegistrationSerialization_1.boundedReader)(buffer, offset, length);
        const parsed = new CommitmentHash({ hash: Buffer.from(reader.readSlice(32)) });
        if (parsed.isAdvanced()) {
            parsed.tokenOutput = new TokenOutput_1.TokenOutput();
            reader.offset = parsed.tokenOutput.fromBuffer(reader.buffer, reader.offset);
        }
        parsed.validate();
        // The token map must not lose duplicate keys or noncanonical encodings.
        if (!parsed.toBuffer().equals(reader.buffer.subarray(offset, reader.offset))) {
            throw new Error('Noncanonical commitment payload');
        }
        (0, identityRegistrationSerialization_1.checkPayloadEnd)(reader.offset, offset, length);
        this.hash = parsed.hash;
        this.tokenOutput = parsed.tokenOutput;
        return reader.offset;
    }
    static fromHex(hex) {
        const bytes = (0, identityRegistrationSerialization_1.payloadFromHex)(hex);
        const result = new CommitmentHash();
        result.fromBuffer(bytes, 0, bytes.length);
        return result;
    }
    toJSON() {
        this.validate();
        return {
            version: this.isAdvanced() ? this.tokenOutput.version.toNumber() : 1,
            currencyvalues: this.isAdvanced() ? this.tokenOutput.reserveValues.toJson() : {},
            hash: Buffer.from(this.hash).reverse().toString('hex')
        };
    }
    static fromJSON(json) {
        const data = typeof json === 'string' ? { hash: json } : json;
        const result = new CommitmentHash({ hash: (0, identityRegistrationSerialization_1.uint256FromHex)(data.hash, 'Commitment hash') });
        if (result.isAdvanced()) {
            if (data.version !== 1 || data.currencyvalues == null ||
                typeof data.currencyvalues !== 'object' || Array.isArray(data.currencyvalues)) {
                throw new Error('Advanced commitment JSON requires version and currencyvalues');
            }
            result.tokenOutput = new TokenOutput_1.TokenOutput({
                version: new bn_js_1.BN(data.version),
                values: new CurrencyValueMap_1.CurrencyValueMap({ valueMap: new Map(Object.keys(data.currencyvalues).map(currency => [currency, commitmentCurrencyAmountToAtomic(data.currencyvalues[currency])])) })
            });
        }
        else if ((data.version != null && data.version !== 1) ||
            (data.currencyvalues != null && (typeof data.currencyvalues !== 'object' ||
                Array.isArray(data.currencyvalues) || Object.keys(data.currencyvalues).length !== 0))) {
            throw new Error('Ordinary commitment may only contain empty version-1 token metadata');
        }
        result.validate();
        return result;
    }
}
exports.CommitmentHash = CommitmentHash;
CommitmentHash.DEFAULT_OUTPUT_AMOUNT = 0;
