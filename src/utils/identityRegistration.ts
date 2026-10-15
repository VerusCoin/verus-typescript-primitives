import { BN } from 'bn.js';
import { KOMODO_ASSETCHAIN_MAXLEN } from '../constants/pbaas';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../constants/vdxf';
import { Identity, VerusCLIVerusIDJson } from '../pbaas/Identity';
import { IdentityID } from '../pbaas/IdentityID';
import { KeyID } from '../pbaas/KeyID';
import { PartialIdentity } from '../pbaas/PartialIdentity';
import { decodeDestination, nameAndParentAddrToIAddr, toIAddress } from './address';
import { toLowerCaseCLocale } from './tolower';

const bs58check = require('bs58check');

// CIdentity::IsValid: serialized identity plus ID_SCRIPT_ELEMENT_OVERHEAD (128)
// must fit MAX_SCRIPT_ELEMENT_SIZE_PBAAS (6000). Historical rules are not supported.
export const IDENTITY_REGISTRATION_MAX_BYTES = 6000 - 128;

// TrimSpaces(..., true) in vdxf.cpp recognizes these as space-like characters.
const NAME_SPACES = new Set(Array.from(' \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200c\u200d\u202f\u205f\u3000'));

/**
 * Validate a leaf for new registrations, without changing its approved bytes.
 * This intentionally rejects overlong names instead of applying the daemon's
 * truncating lookup behavior. It also rejects all C0/DEL controls, including NUL
 * (which can cause C-string name hashing to disagree with the reserved bytes).
 * Historical reservation decoding should use structural validation instead.
 */
export function validateIdentityRegistrationName(name: string): void {
  if (typeof name !== 'string') throw new Error('Identity registration name must be a string');
  const bytes = Buffer.from(name, 'utf8');
  if (bytes.length === 0 || bytes.length >= KOMODO_ASSETCHAIN_MAXLEN) {
    throw new Error('Identity registration name must contain 1 to 64 UTF-8 bytes');
  }
  if (bytes.toString('utf8') !== name) {
    throw new Error('Identity registration name contains invalid UTF-8 (unpaired surrogate)');
  }
  if (/[.@\\/:*?"<>|\u0000-\u001f\u007f]/.test(name)) {
    throw new Error('Identity registration name contains invalid characters or separators');
  }
  const characters = Array.from(name);
  let previousSpace = false;
  for (let i = 0; i < characters.length; i++) {
    const space = NAME_SPACES.has(characters[i]);
    if (space && (i === 0 || i === characters.length - 1 || previousSpace)) {
      throw new Error('Identity registration name has leading, trailing, or repeated spaces');
    }
    previousSpace = space;
  }

  // Consensus rejects *any* valid Base58Check payload longer than 20 bytes,
  // even an address version or payload length this library does not recognize.
  let decoded: Buffer | undefined;
  try { decoded = bs58check.decode(name); } catch (_) { /* An ordinary name is not Base58Check. */ }
  if (decoded && decoded.length > 20) {
    throw new Error('Identity registration name cannot be a Base58Check address');
  }
}

export interface IdentityRegistrationNameRequest {
  /** A leaf or a fully qualified name; a final @ is optional. */
  name: string;
  /** Explicit global root, such as VRSC or VRSCTEST. There is no network default. */
  rootSystemName: string;
  /** Registration chain i-address, supplied from the caller's chain context. */
  systemID: string;
  /** Optional selected namespace i-address. Must agree with every supplied name. */
  parent?: string;
  /** Namespace name, required for a leaf plus a non-root parent i-address. */
  parentName?: string;
}

export interface ResolvedIdentityRegistrationName {
  name: string;
  nameBytes: Buffer;
  parent: string;
  fullName: string;
  identityID: string;
  systemID: string;
  rootSystemName: string;
}

function validateIdentityAddress(address: string, field: string): void {
  let bytes: Buffer;
  try { bytes = decodeDestination(address, I_ADDR_VERSION); } catch (_) {
    throw new Error(`${field} must be a valid identity i-address`);
  }
  if (bytes.equals(Buffer.alloc(20))) throw new Error(`${field} cannot be the null identity`);
}

function parseName(name: string): { labels: string[]; absolute: boolean } {
  if (typeof name !== 'string') throw new Error('Identity registration name must be a string');
  const withoutAt = name.endsWith('@') ? name.slice(0, -1) : name;
  if (withoutAt.includes('@')) throw new Error('Only a final @ is supported in an identity registration name');
  const absolute = withoutAt.endsWith('.');
  const labels = (absolute ? withoutAt.slice(0, -1) : withoutAt).split('.');
  for (const label of labels) validateIdentityRegistrationName(label);
  return { labels, absolute };
}

function qualify(labels: string[], absolute: boolean, root: string): string[] {
  if (toLowerCaseCLocale(labels[labels.length - 1]) === toLowerCaseCLocale(root)) return labels;
  if (absolute) throw new Error('Absolute identity name must belong to the selected root system');
  return [...labels, root];
}

/**
 * Resolve names without RPC lookups. Parent derivation is performed once, and
 * explicit parent/name disagreement is rejected. Resolution does not establish
 * that the namespace is a registered currency, permits IDs, or issues on systemID.
 * Those chain-state checks belong to the registration client.
 */
export function resolveIdentityRegistrationName(request: IdentityRegistrationNameRequest): ResolvedIdentityRegistrationName {
  validateIdentityRegistrationName(request.rootSystemName);
  validateIdentityAddress(request.systemID, 'Registration system');
  if (request.parent !== undefined) validateIdentityAddress(request.parent, 'Parent');

  const rootID = toIAddress(request.rootSystemName + '.', '');
  const parsed = parseName(request.name);
  const name = parsed.labels[0];
  let parentLabels: string[] | undefined;

  if (parsed.labels.length > 1) {
    parentLabels = qualify(parsed.labels, parsed.absolute, request.rootSystemName).slice(1);
  } else if (parsed.absolute) {
    throw new Error('A registration requires a parent namespace; an absolute leaf has no parent');
  }

  if (request.parentName !== undefined) {
    const parsedParent = parseName(request.parentName);
    const selectedLabels = qualify(parsedParent.labels, parsedParent.absolute, request.rootSystemName);
    if (parentLabels && toIAddress(parentLabels.join('.') + '.', '') !== toIAddress(selectedLabels.join('.') + '.', '')) {
      throw new Error('Fully qualified name does not match the selected parent name');
    }
    if (!parentLabels) parentLabels = selectedLabels;
  }

  if (!parentLabels) {
    if (request.parent !== undefined && request.parent !== rootID) {
      throw new Error('parentName is required for a leaf with a non-root parent');
    }
    parentLabels = [request.rootSystemName];
  }
  const parent = toIAddress(parentLabels.join('.') + '.', '');
  if (request.parent !== undefined && request.parent !== parent) {
    throw new Error('Fully qualified name does not match the selected parent i-address');
  }

  return {
    name,
    nameBytes: Buffer.from(name, 'utf8'),
    parent,
    fullName: [name, ...parentLabels].join('.') + '@',
    identityID: nameAndParentAddrToIAddr(name, parent),
    systemID: request.systemID,
    rootSystemName: request.rootSystemName,
  };
}

function validateIdentityField(value: IdentityID, field: string): void {
  if (!value || value.version !== I_ADDR_VERSION || value.varlength !== false ||
      !Buffer.isBuffer(value.hash) || value.hash.length !== 20 || value.hash.equals(Buffer.alloc(20))) {
    throw new Error(`${field} must be a nonnull 20-byte identity destination`);
  }
}

/**
 * Validate an ordinary current-version identity against the approved reservation.
 * Only KeyID (public-key-hash) primary authorities are currently supported by the
 * Identity/Principal serializers; compressed public-key principals are unsupported.
 * Authorities may be self or external, but existence/revocation, namespace policy,
 * name availability, funding, and signatures require separate chain-state checks.
 * No fields are defaulted or mutated by this function.
 */
export function validateIdentityForRegistration(identity: Identity, expected: ResolvedIdentityRegistrationName): void {
  if (!(identity instanceof Identity) || identity instanceof PartialIdentity) {
    throw new Error('Identity registration requires a full Identity');
  }
  const resolved = resolveIdentityRegistrationName({
    name: expected.fullName,
    rootSystemName: expected.rootSystemName,
    parent: expected.parent,
    systemID: expected.systemID,
  });
  if (expected.name !== resolved.name || !Buffer.isBuffer(expected.nameBytes) ||
      !expected.nameBytes.equals(resolved.nameBytes) || expected.identityID !== resolved.identityID) {
    throw new Error('Resolved registration name fields are inconsistent');
  }
  if (identity.name !== expected.name) throw new Error('Identity name must exactly match reserved name bytes');
  validateIdentityField(identity.parent, 'Identity parent');
  validateIdentityField(identity.systemId, 'Identity system');
  if (identity.parent.toAddress() !== expected.parent) throw new Error('Identity parent does not match reservation');
  if (identity.systemId.toAddress() !== expected.systemID) throw new Error('Identity system does not match registration system');
  if (!BN.isBN(identity.version) || !identity.version.eq(Identity.VERSION_CURRENT)) {
    throw new Error('Identity registration requires the current identity version');
  }
  if (!BN.isBN(identity.flags) || !identity.flags.isZero()) {
    throw new Error('Ordinary identity registration requires zero flags');
  }
  if (!BN.isBN(identity.unlockAfter) || !identity.unlockAfter.isZero()) {
    throw new Error('Ordinary identity registration requires an explicit zero timelock');
  }
  const keys = identity.primaryAddresses;
  if (!Array.isArray(keys) || keys.length < 1 || keys.length > 25) {
    throw new Error('Identity registration requires 1 to 25 primary keys');
  }
  const primaryIDs = new Set<string>();
  for (const key of keys) {
    if (!(key instanceof KeyID) || key.version !== R_ADDR_VERSION || key.varlength !== false ||
        !Buffer.isBuffer(key.hash) || key.hash.length !== 20 || key.hash.equals(Buffer.alloc(20))) {
      throw new Error('Identity registration supports nonnull KeyID primary keys only; public-key principals are unsupported');
    }
    const id = key.hash.toString('hex');
    if (primaryIDs.has(id)) throw new Error('Identity registration primary keys must be unique');
    primaryIDs.add(id);
  }
  if (!BN.isBN(identity.minSigs) || identity.minSigs.ltn(1) || identity.minSigs.gtn(13) || identity.minSigs.gtn(keys.length)) {
    throw new Error('Identity signature threshold must be 1 to 13 and no greater than its primary key count');
  }
  validateIdentityField(identity.revocationAuthority, 'Revocation authority');
  validateIdentityField(identity.recoveryAuthority, 'Recovery authority');

  if (!(identity.contentMap instanceof Map)) throw new Error('Identity content map must be a Map');
  for (const [key, value] of identity.contentMap) {
    decodeDestination(key, I_ADDR_VERSION);
    if (!Buffer.isBuffer(value) || value.length !== 32) throw new Error('Identity content map values must contain 32 bytes');
  }
  // CIdentity::SerializationOp marks identities invalid when a multimap key is null.
  for (const [key] of identity.contentMultiMap.kvContent.entries()) {
    if (decodeDestination(key.toIAddress(), I_ADDR_VERSION).equals(Buffer.alloc(20))) {
      throw new Error('Identity content multimap keys cannot be null');
    }
  }
  if (identity.privateAddresses !== undefined) {
    if (!Array.isArray(identity.privateAddresses)) throw new Error('Identity private addresses must be an array');
    for (const address of identity.privateAddresses) {
      if (!address || !Buffer.isBuffer(address.d) || address.d.length !== 11 ||
          !Buffer.isBuffer(address.pkD) || address.pkD.length !== 32) {
        throw new Error('Identity private address requires an 11-byte diversifier and 32-byte key');
      }
    }
  }
  if (identity.getByteLength() > IDENTITY_REGISTRATION_MAX_BYTES) {
    throw new Error('Identity exceeds the current PBaaS registration size limit');
  }
  // Invoke the existing optional-content serializers and ensure this is the full
  // canonical Identity encoding, including any subclassed content primitives.
  const serialized = identity.toBuffer();
  const decoded = new Identity();
  if (decoded.fromBuffer(serialized) !== serialized.length || !decoded.toBuffer().equals(serialized)) {
    throw new Error('Identity registration requires a canonical full identity encoding');
  }
}

/**
 * Parse an approved full daemon-shaped identity definition for registration.
 * All authority, version, flag, threshold and timelock fields must be explicit;
 * optional content may be omitted. Unlike the general historical JSON parser,
 * this checks original address versions before KeyID/IdentityID can coerce them.
 */
export function identityFromJSONForRegistration(json: VerusCLIVerusIDJson, expected: ResolvedIdentityRegistrationName): Identity {
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error('Identity registration JSON must be an object');
  }
  const supportedFields = new Set([
    'version', 'flags', 'minimumsignatures', 'timelock', 'name', 'parent', 'systemid',
    'primaryaddresses', 'revocationauthority', 'recoveryauthority', 'identityaddress',
    'contentmap', 'contentmultimap', 'privateaddress',
  ]);
  for (const field of Object.keys(json)) {
    if (!supportedFields.has(field)) throw new Error(`Unsupported identity registration JSON field: ${field}`);
  }
  for (const field of ['version', 'flags', 'minimumsignatures', 'timelock'] as const) {
    if (!Number.isSafeInteger(json[field])) {
      throw new Error(`Identity registration JSON requires an explicit integer ${field}`);
    }
  }
  validateIdentityRegistrationName(json.name);
  for (const field of ['parent', 'systemid', 'revocationauthority', 'recoveryauthority'] as const) {
    validateIdentityAddress(json[field], field);
  }
  if (!Array.isArray(json.primaryaddresses) || json.primaryaddresses.length === 0) {
    throw new Error('Identity registration JSON requires primaryaddresses');
  }
  for (const address of json.primaryaddresses) {
    try { decodeDestination(address, R_ADDR_VERSION); } catch (_) {
      throw new Error('Identity registration primaryaddresses must be R-addresses (public-key hashes)');
    }
  }
  if (json.identityaddress !== undefined) {
    validateIdentityAddress(json.identityaddress, 'identityaddress');
    if (json.identityaddress !== expected.identityID) throw new Error('Identity JSON identityaddress does not match reservation');
  }

  // Buffer.from(..., 'hex') truncates invalid/odd hex; validate original JSON
  // before handing it to the existing content parsers.
  if (json.contentmap !== undefined) {
    if (!json.contentmap || typeof json.contentmap !== 'object' || Array.isArray(json.contentmap)) {
      throw new Error('Identity registration contentmap must be an object');
    }
    const contentKeys = new Set<string>();
    for (const [key, value] of Object.entries(json.contentmap)) {
      if (!/^[0-9a-fA-F]{40}$/.test(key) || typeof value !== 'string' || !/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error('Identity registration contentmap requires 20-byte hex keys and 32-byte hex values');
      }
      if (contentKeys.has(key.toLowerCase())) throw new Error('Identity registration contentmap contains duplicate key bytes');
      contentKeys.add(key.toLowerCase());
    }
  }
  if (json.contentmultimap !== undefined) {
    if (!json.contentmultimap || typeof json.contentmultimap !== 'object' || Array.isArray(json.contentmultimap)) {
      throw new Error('Identity registration contentmultimap must be an object');
    }
    for (const [key, value] of Object.entries(json.contentmultimap)) {
      // Full identities use explicit key IDs, without implicit FQN network defaults.
      decodeDestination(key, I_ADDR_VERSION);
      for (const item of Array.isArray(value) ? value : [value]) {
        if (typeof item === 'string') {
          if (!/^(?:[0-9a-fA-F]{2})*$/.test(item)) {
            throw new Error('Identity registration contentmultimap byte values must be even-length hexadecimal');
          }
        } else if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new Error('Identity registration contentmultimap contains an invalid value');
        }
      }
    }
  }
  if (json.privateaddress !== undefined && typeof json.privateaddress !== 'string') {
    throw new Error('Identity registration privateaddress must be a string');
  }
  const identity = Identity.fromJson(json);
  validateIdentityForRegistration(identity, expected);
  return identity;
}
