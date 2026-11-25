"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationReader = exports.STORAGE_BINDING_BYTE_LENGTH = exports.ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH = exports.COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH = void 0;
const serialization_1 = require("../../../utils/serialization");
const vdxf_1 = require("../../../constants/vdxf");
const CompactAddressObject_1 = require("../CompactAddressObject");
const varuint_1 = require("../../../utils/varuint");
// Authorization v1 uses the first compact-address format, even if its default changes.
const COMPACT_IDENTITY_ADDRESS_VERSION = CompactAddressObject_1.CompactIAddressObject.FIRST_VERSION.toNumber();
const COMPACT_IDENTITY_ADDRESS_TYPE = CompactAddressObject_1.CompactIAddressObject.TYPE_I_ADDRESS.toNumber();
exports.COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH = varuint_1.default.encodingLength(COMPACT_IDENTITY_ADDRESS_VERSION) +
    varuint_1.default.encodingLength(COMPACT_IDENTITY_ADDRESS_TYPE) +
    vdxf_1.HASH160_BYTE_LENGTH;
exports.ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH = 1 + exports.COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH;
exports.STORAGE_BINDING_BYTE_LENGTH = 3 * exports.COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH;
/** Bounded reader shared by the authorization codecs. */
class AuthorizationReader extends serialization_1.BoundedBufferReader {
    address() {
        // The protocol permits only the fixed-size I-address form, not variable-length FQNs.
        const identityAddress = new CompactAddressObject_1.CompactIAddressObject();
        identityAddress.fromBuffer(this.readSlice(exports.COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH));
        CompactAddressObject_1.CompactIAddressObject.validateCompactIdentityAddress(identityAddress);
        return identityAddress.address;
    }
}
exports.AuthorizationReader = AuthorizationReader;
