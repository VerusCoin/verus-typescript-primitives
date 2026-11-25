import { BoundedBufferReader } from "../../../utils/serialization";
import { HASH160_BYTE_LENGTH } from "../../../constants/vdxf";
import { CompactIAddressObject } from "../CompactAddressObject";
import varuint from "../../../utils/varuint";

// Authorization v1 uses the first compact-address format, even if its default changes.
const COMPACT_IDENTITY_ADDRESS_VERSION =
  CompactIAddressObject.FIRST_VERSION.toNumber();
const COMPACT_IDENTITY_ADDRESS_TYPE =
  CompactIAddressObject.TYPE_I_ADDRESS.toNumber();

export const COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH =
  varuint.encodingLength(COMPACT_IDENTITY_ADDRESS_VERSION) +
  varuint.encodingLength(COMPACT_IDENTITY_ADDRESS_TYPE) +
  HASH160_BYTE_LENGTH;
export const ROLE_TAGGED_IDENTITY_ADDRESS_BYTE_LENGTH =
  1 + COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH;
export const STORAGE_BINDING_BYTE_LENGTH =
  3 * COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH;

/** Bounded reader shared by the authorization codecs. */
export class AuthorizationReader extends BoundedBufferReader {
  address(): string {
    // The protocol permits only the fixed-size I-address form, not variable-length FQNs.
    const identityAddress = new CompactIAddressObject();
    identityAddress.fromBuffer(
      this.readSlice(COMPACT_IDENTITY_ADDRESS_BYTE_LENGTH)
    );
    CompactIAddressObject.validateCompactIdentityAddress(identityAddress);

    return identityAddress.address;
  }
}
