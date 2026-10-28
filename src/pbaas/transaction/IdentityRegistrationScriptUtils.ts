import { BN } from 'bn.js';
import { IdentityID } from '../IdentityID';
import { KeyID } from '../KeyID';
import { OptCCParams } from '../OptCCParams';
import { PubKey } from '../PubKey';
import { TxDestination } from '../TxDestination';
import { EVALS } from '../../utils/evals';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../../constants/vdxf';

/** Destination forms supported by version-3 identity registration conditions. */
export function validateRegistrationDestination(destination: TxDestination, identityOnly = false): void {
  if (destination == null || !BN.isBN(destination.type)) {
    throw new Error('registration script requires a valid destination');
  }

  const isIdentity = destination.type.eq(TxDestination.TYPE_ID) && destination.data instanceof IdentityID;
  const isKey = destination.type.eq(TxDestination.TYPE_PKH) && destination.data instanceof KeyID;
  const isPubKey = destination.type.eq(TxDestination.TYPE_PK) && destination.data instanceof PubKey;
  if (identityOnly && !isIdentity) {
    throw new Error('registration authorization and reservation destinations must be identities');
  }

  if (isIdentity || isKey) {
    const data = destination.data as IdentityID | KeyID;
    const hash = data.hash;
    if (data.version !== (isIdentity ? I_ADDR_VERSION : R_ADDR_VERSION) || data.varlength !== false ||
        !Buffer.isBuffer(hash) || hash.length !== 20 || hash.equals(Buffer.alloc(20))) {
      throw new Error('registration script requires a canonical nonzero 20-byte destination');
    }
  } else if (isPubKey) {
    const publicKey = destination.data as PubKey;
    if (!publicKey.compressed || publicKey.bytes.length !== 33 ||
        (publicKey.bytes[0] !== 2 && publicKey.bytes[0] !== 3)) {
      throw new Error('registration script requires a compressed public-key destination');
    }
  } else {
    throw new Error('unsupported registration script destination');
  }
}

export function registrationParams(evalCode: number, destinations: TxDestination[], vData: Buffer[]): OptCCParams {
  return new OptCCParams({
    version: new BN(3),
    evalCode: new BN(evalCode),
    m: new BN(destinations.length),
    n: new BN(destinations.length),
    destinations,
    vData
  });
}

/** Validate the single-object MakeMofNCCScript envelope, keeping master data separate. */
export function validateRegistrationParams(master: OptCCParams, params: OptCCParams, evalCodes: number[]): void {
  if (master == null || params == null) {
    throw new Error('registration script is missing its optional parameters');
  }
  for (const part of [master, params]) {
    if (![part.version, part.evalCode, part.m, part.n].every(BN.isBN) ||
        !part.version.eqn(3) || !part.n.eqn(part.destinations.length) || !part.m.eq(part.n)) {
      throw new Error('invalid registration script header or threshold');
    }
  }
  if (!master.evalCode.eqn(EVALS.EVAL_NONE) || !master.m.eqn(1) || master.vData.length !== 0 ||
      evalCodes.indexOf(params.evalCode.toNumber()) === -1 || params.vData.length !== 1) {
    throw new Error('invalid registration script eval, index, or payload count');
  }
  validateRegistrationDestination(master.destinations[0]);
  if (params.destinations.length < 1 || params.destinations.length > 2) {
    throw new Error('invalid registration script destination count');
  }
  params.destinations.forEach(destination => validateRegistrationDestination(destination));
  if (!master.destinations[0].toChunk().equals(params.destinations[0].toChunk())) {
    throw new Error('registration script index must match its first condition destination');
  }
}
