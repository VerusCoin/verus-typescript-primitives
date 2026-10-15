import { AdvancedNameReservation } from '../../../pbaas/AdvancedNameReservation';
import { CommitmentHash } from '../../../pbaas/CommitmentHash';
import { IdentityID } from '../../../pbaas/IdentityID';
import { KeyID } from '../../../pbaas/KeyID';
import { TxDestination } from '../../../pbaas/TxDestination';
import { IdentityCommitmentScript } from '../../../pbaas/transaction/IdentityCommitmentScript';
import { IdentityReservationScript } from '../../../pbaas/transaction/IdentityReservationScript';
import { I_ADDR_VERSION, R_ADDR_VERSION } from '../../../constants/vdxf';

const cases = [
  {
    name: 'commitment',
    parser: () => new IdentityCommitmentScript(),
    bytes: () => IdentityCommitmentScript.fromCommitment(
      new CommitmentHash({ hash: Buffer.alloc(32, 1) }),
      new TxDestination(new KeyID(Buffer.alloc(20, 2)))
    ).toBuffer(),
  },
  {
    name: 'reservation',
    parser: () => new IdentityReservationScript(),
    bytes: () => IdentityReservationScript.fromReservation(new AdvancedNameReservation({
      name: 'alice', parent: new IdentityID(Buffer.alloc(20, 3)), salt: Buffer.alloc(32, 4),
    })).toBuffer(),
  },
];

describe.each(cases)('$name script buffer bounds', ({ parser, bytes }) => {
  test('rejects negative offsets even when Buffer.slice would return the complete script', () => {
    const buffer = bytes();
    expect(() => parser().fromBuffer(buffer, -buffer.length, buffer.length * 2)).toThrow('bounds');
  });

  test.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid offset %s', offset => {
    const buffer = Buffer.concat([bytes(), Buffer.alloc(4)]);
    expect(() => parser().fromBuffer(buffer, offset, bytes().length)).toThrow('bounds');
  });

  test.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rejects invalid length %s', length => {
    expect(() => parser().fromBuffer(bytes(), 0, length)).toThrow('bounds');
  });

  test('rejects ranges beyond the supplied buffer', () => {
    const buffer = bytes();
    expect(() => parser().fromBuffer(buffer, buffer.length + 1)).toThrow('bounds');
    expect(() => parser().fromBuffer(buffer, 1, buffer.length)).toThrow('bounds');
    expect(() => parser().fromBuffer(buffer, 0, buffer.length + 1)).toThrow('bounds');
  });

  test('honors a valid bounded script embedded between prefix and suffix bytes', () => {
    const buffer = bytes();
    const framed = Buffer.concat([Buffer.from('aabbcc', 'hex'), buffer, Buffer.from('dd', 'hex')]);
    const snapshot = Buffer.from(framed);
    const parsed = parser();
    expect(parsed.fromBuffer(framed, 3, buffer.length)).toBe(3 + buffer.length);
    expect(parsed.toBuffer()).toEqual(buffer);
    expect(framed).toEqual(snapshot);
  });
});

describe('registration destination encoding', () => {
  test.each([
    ['key with identity address version', () => {
      const destination = new KeyID(Buffer.alloc(20, 1));
      destination.version = I_ADDR_VERSION;
      return destination;
    }],
    ['identity with key address version', () => {
      const destination = new IdentityID(Buffer.alloc(20, 1));
      destination.version = R_ADDR_VERSION;
      return destination;
    }],
    ['variable-length key', () => {
      const destination = new KeyID(Buffer.alloc(20, 1));
      destination.varlength = true;
      return destination;
    }],
    ['variable-length identity', () => {
      const destination = new IdentityID(Buffer.alloc(20, 1));
      destination.varlength = true;
      return destination;
    }],
  ] as const)('rejects a %s', (_name, destination) => {
    expect(() => IdentityCommitmentScript.fromCommitment(
      new CommitmentHash({ hash: Buffer.alloc(32, 2) }),
      new TxDestination(destination())
    )).toThrow('canonical');
  });

  test('rejects forged issuer address versions as well as forged controller versions', () => {
    const authorization = new IdentityID(Buffer.alloc(20, 1));
    authorization.version = R_ADDR_VERSION;
    expect(() => IdentityCommitmentScript.fromCommitment(
      new CommitmentHash({ hash: Buffer.alloc(32, 2) }),
      new TxDestination(new KeyID(Buffer.alloc(20, 3))),
      new TxDestination(authorization)
    )).toThrow('canonical');
  });

  test('rechecks destination metadata after construction before exposing or serializing it', () => {
    const controller = new KeyID(Buffer.alloc(20, 1));
    const script = IdentityCommitmentScript.fromCommitment(
      new CommitmentHash({ hash: Buffer.alloc(32, 2) }), new TxDestination(controller)
    );
    controller.version = I_ADDR_VERSION;
    expect(() => script.toBuffer()).toThrow('canonical');
    expect(() => script.getController()).toThrow('canonical');
  });
});
