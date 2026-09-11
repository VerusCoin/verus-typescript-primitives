"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenOutput = exports.TOKEN_OUTPUT_VERSION_MULTIVALUE = exports.TOKEN_OUTPUT_VERSION_LASTVALID = exports.TOKEN_OUTPUT_VERSION_FIRSTVALID = exports.TOKEN_OUTPUT_VERSION_CURRENT = exports.TOKEN_OUTPUT_VERSION_INVALID = void 0;
const SerializableEntityBase_1 = require("../utils/types/SerializableEntityBase");
const CurrencyValueMap_1 = require("./CurrencyValueMap");
const varint_1 = require("../utils/varint");
const bufferutils_1 = require("../utils/bufferutils");
const bn_js_1 = require("bn.js");
const { BufferReader, BufferWriter } = bufferutils_1.default;
exports.TOKEN_OUTPUT_VERSION_INVALID = new bn_js_1.BN(0, 10);
exports.TOKEN_OUTPUT_VERSION_CURRENT = new bn_js_1.BN(1, 10);
exports.TOKEN_OUTPUT_VERSION_FIRSTVALID = new bn_js_1.BN(1, 10);
exports.TOKEN_OUTPUT_VERSION_LASTVALID = new bn_js_1.BN(1, 10);
exports.TOKEN_OUTPUT_VERSION_MULTIVALUE = new bn_js_1.BN('80000000', 16);
function getSerializationData(version, reserveValues) {
    const multivalue = reserveValues.valueMap.size !== 1;
    const multivalueFlag = version.and(exports.TOKEN_OUTPUT_VERSION_MULTIVALUE);
    const semanticVersion = version.xor(multivalueFlag);
    return {
        version: multivalue
            ? semanticVersion.or(exports.TOKEN_OUTPUT_VERSION_MULTIVALUE)
            : semanticVersion,
        reserveValues: new CurrencyValueMap_1.CurrencyValueMap({
            valueMap: reserveValues.valueMap,
            multivalue
        })
    };
}
class TokenOutput extends SerializableEntityBase_1.SerializableEntityBase {
    constructor(data) {
        super();
        if (data != null) {
            if (Object.prototype.hasOwnProperty.call(data, 'reserve_values')) {
                throw new Error("TokenOutput: snake_case property names are no longer supported. Use 'reserveValues' instead of 'reserve_values'.");
            }
        }
        this.version = exports.TOKEN_OUTPUT_VERSION_INVALID;
        this.reserveValues = new CurrencyValueMap_1.CurrencyValueMap();
        if (data != null) {
            if (data.values != null)
                this.reserveValues = data.values;
            if (data.version != null)
                this.version = data.version;
        }
    }
    /** @deprecated Use reserveValues instead */
    get reserve_values() { return this.reserveValues; }
    getByteLength() {
        const { version, reserveValues } = getSerializationData(this.version, this.reserveValues);
        return varint_1.default.encodingLength(version) + reserveValues.getByteLength();
    }
    toBuffer() {
        const { version, reserveValues } = getSerializationData(this.version, this.reserveValues);
        const serializedSize = varint_1.default.encodingLength(version) + reserveValues.getByteLength();
        const writer = new BufferWriter(Buffer.alloc(serializedSize));
        writer.writeVarInt(version);
        writer.writeSlice(reserveValues.toBuffer());
        return writer.buffer;
    }
    fromBuffer(buffer, offset = 0) {
        const reader = new BufferReader(buffer, offset);
        const wireVersion = reader.readVarInt();
        const multivalueFlag = wireVersion.and(exports.TOKEN_OUTPUT_VERSION_MULTIVALUE);
        const multivalue = !multivalueFlag.isZero();
        this.version = wireVersion.xor(multivalueFlag);
        this.reserveValues = new CurrencyValueMap_1.CurrencyValueMap({ multivalue });
        reader.offset = this.reserveValues.fromBuffer(reader.buffer, reader.offset);
        return reader.offset;
    }
    firstCurrency() {
        const iterator = this.reserveValues.valueMap.entries().next();
        return iterator.done ? null : iterator.value[0];
    }
    firstValue() {
        const iterator = this.reserveValues.valueMap.entries().next();
        return iterator.done ? null : iterator.value[1];
    }
    getVersion() {
        return this.version;
    }
    isValid() {
        return (this.version.gte(exports.TOKEN_OUTPUT_VERSION_FIRSTVALID) &&
            this.version.lte(exports.TOKEN_OUTPUT_VERSION_LASTVALID));
    }
}
exports.TokenOutput = TokenOutput;
