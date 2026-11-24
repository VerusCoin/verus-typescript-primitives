import { hashData } from "../utils/hash";
import {
  DEFAULT_VERUS_CHAINID,
  TESTNET_VERUS_CHAINID,
} from "../constants/pbaas";
import { isHexString } from "../utils/string";
import { HASH256_BYTE_LENGTH, I_ADDR_VERSION } from "../constants/vdxf";
import { decodeDestination } from "../utils/address";

export interface AppAuthorizationIdentity {
  systemID: string;
  identityID: string;
}

/** A credential without a delegate system uses its configured network root. */
export function resolveDelegateSystemID(
  delegateSystemID?: string,
  rootSystemID?: string
): string {
  if (delegateSystemID !== undefined) {
    decodeDestination(delegateSystemID, I_ADDR_VERSION);
    return delegateSystemID;
  }
  if (
    rootSystemID !== DEFAULT_VERUS_CHAINID &&
    rootSystemID !== TESTNET_VERUS_CHAINID
  ) {
    throw new Error("An explicit VRSC or VRSCTEST root system is required");
  }
  return rootSystemID;
}

export function resolveDelegatorSystemID(
  delegatorSystemID?: string,
  delegateSystemID?: string,
  rootSystemID?: string
): string {
  if (delegatorSystemID === undefined) {
    return resolveDelegateSystemID(delegateSystemID, rootSystemID);
  }
  decodeDestination(delegatorSystemID, I_ADDR_VERSION);
  return delegatorSystemID;
}

/**
 * Bind an envelope hash to the selected user, request signer and app scope.
 * Signature metadata is not part of the raw envelope hash, so callers must
 * supply identities obtained from the verified request and selected user.
 * Omit delegatorSystemID when the delegator is resolved on the delegate's system.
 */
export function deriveAppAuthorizationGrantID(
  user: AppAuthorizationIdentity,
  delegate: AppAuthorizationIdentity,
  appID: string,
  originalRequestHash: string,
  delegatorSystemID = delegate.systemID
): string {
  if (
    !isHexString(originalRequestHash) ||
    originalRequestHash.length !== HASH256_BYTE_LENGTH * 2
  ) {
    throw new Error("Expected a 32-byte request hash");
  }

  // Each identity contributes its resolved system ID followed by its identity ID.
  return hashData(
    Buffer.concat([
      Buffer.from("VerusAppAuthorizationGrant/v1\0", "utf8"),
      decodeDestination(user.systemID, I_ADDR_VERSION),
      decodeDestination(user.identityID, I_ADDR_VERSION),
      decodeDestination(delegate.systemID, I_ADDR_VERSION),
      decodeDestination(delegate.identityID, I_ADDR_VERSION),
      decodeDestination(delegatorSystemID, I_ADDR_VERSION),
      decodeDestination(appID, I_ADDR_VERSION),
      Buffer.from(originalRequestHash, "hex"),
    ])
  ).toString("hex");
}
