"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_IDENTITY_NAME_BYTES = void 0;
exports.assertNameBytes = assertNameBytes;
exports.assertIdentityID = assertIdentityID;
exports.identityIDFromJSON = identityIDFromJSON;
exports.uint256FromHex = uint256FromHex;
exports.assertUint256 = assertUint256;
exports.payloadFromHex = payloadFromHex;
exports.boundedReader = boundedReader;
exports.readName = readName;
exports.checkPayloadEnd = checkPayloadEnd;
const IdentityID_1 = require("./IdentityID");
const vdxf_1 = require("../constants/vdxf");
const pbaas_1 = require("../constants/pbaas");
const address_1 = require("../utils/address");
const bufferutils_1 = require("../utils/bufferutils");
exports.MAX_IDENTITY_NAME_BYTES = pbaas_1.KOMODO_ASSETCHAIN_MAXLEN - 1;
function assertNameBytes(name) {
    if (typeof name !== 'string')
        throw new Error('Reservation name must be a string');
    const bytes = Buffer.from(name, 'utf8');
    if (!bytes.length || bytes.length > exports.MAX_IDENTITY_NAME_BYTES || bytes.toString('utf8') !== name) {
        throw new Error('Reservation name must be valid UTF-8 and contain 1–64 bytes');
    }
    return bytes;
}
function assertIdentityID(id, field, allowNull = true) {
    if (!id || id.version !== vdxf_1.I_ADDR_VERSION || id.varlength ||
        !Buffer.isBuffer(id.hash) || id.hash.length !== 20 ||
        (!allowNull && id.hash.equals(Buffer.alloc(20)))) {
        throw new Error(`${field} must be ${allowNull ? 'a' : 'a non-null'} identity ID`);
    }
}
function identityIDFromJSON(address, field, allowNull = true) {
    const id = new IdentityID_1.IdentityID(allowNull && address === '' ? Buffer.alloc(20) : (0, address_1.decodeDestination)(address, vdxf_1.I_ADDR_VERSION));
    assertIdentityID(id, field, allowNull);
    return id;
}
/** uint256 display hex is the reverse of the raw bytes used in serialization. */
function uint256FromHex(hex, field) {
    if (typeof hex !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hex)) {
        throw new Error(`${field} must contain exactly 64 hexadecimal characters`);
    }
    return Buffer.from(hex, 'hex').reverse();
}
function assertUint256(value, field, allowNull = false) {
    if (!Buffer.isBuffer(value) || value.length !== 32 ||
        (!allowNull && value.equals(Buffer.alloc(32)))) {
        throw new Error(`${field} must be ${allowNull ? 'a' : 'a nonzero'} 32-byte value`);
    }
}
function payloadFromHex(hex) {
    if (typeof hex !== 'string' || !hex.length || !/^(?:[0-9a-fA-F]{2})+$/.test(hex)) {
        throw new Error('Payload must be nonempty, even-length hexadecimal data');
    }
    return Buffer.from(hex, 'hex');
}
function boundedReader(buffer, offset, length) {
    if (!Buffer.isBuffer(buffer) || !Number.isSafeInteger(offset) || offset < 0 || offset > buffer.length ||
        (length != null && (!Number.isSafeInteger(length) || length < 0 || length > buffer.length - offset))) {
        throw new Error('Invalid payload bounds');
    }
    return new bufferutils_1.default.BufferReader(length == null ? buffer : buffer.subarray(0, offset + length), offset);
}
function readName(reader) {
    const length = reader.readCompactSize();
    if (!length || length > exports.MAX_IDENTITY_NAME_BYTES)
        throw new Error('Invalid reservation name length');
    const bytes = reader.readSlice(length);
    const name = bytes.toString('utf8');
    if (!Buffer.from(name, 'utf8').equals(bytes))
        throw new Error('Invalid UTF-8 reservation name');
    return name;
}
function checkPayloadEnd(end, offset, length) {
    if (length != null && end !== offset + length)
        throw new Error('Trailing reservation or commitment data');
}
