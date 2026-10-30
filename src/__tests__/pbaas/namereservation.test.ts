import { AdvancedNameReservation } from '../../pbaas/AdvancedNameReservation';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { NameReservation } from '../../pbaas/NameReservation';

// CNameReservation / CAdvancedNameReservation field order from identity.h.
// Fixed digests and identity IDs were computed independently using hashlib SHA256d/HASH160.
const SALT = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
const SALT_JSON = '1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100';
const REFERRAL = '3132333435363738393a3b3c3d3e3f4041424344';
const PARENT = 'a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4';
const PARENT_ADDRESS = 'iJDB4LHXQoW88r8PmyULZ7mKRwv9uKqo55';
const REFERRAL_ADDRESS = 'i7xegSAPPYfvjWfsN9i9FXs82s2ZFLFGsb';
const IDENTITY_ADDRESS = 'iFHbDRShoAa69DJZc3bEHbfBcfFwbFQ8RN';
const ROOT_IDENTITY_ADDRESS = 'i7zmPkt8NiPoFu6JvquczuSj72wTU467Rx';
const LEGACY = '05416c696365' + REFERRAL + SALT;
const ADVANCED = '0100000005416c696365' + PARENT + REFERRAL + SALT;

const data = (name = 'Alice') => ({
  name,
  parent: new IdentityID(Buffer.from(PARENT, 'hex')),
  referral: new IdentityID(Buffer.from(REFERRAL, 'hex')),
  salt: Buffer.from(SALT, 'hex')
});

const formats = [
  { label: 'legacy', Class: NameReservation, hex: LEGACY, nameOffset: 0, hash: 'fdd9a5f445119d13fca9a0b1f794d3ae62948fc3d3f1a29df7c5dc0dc8f493f2' },
  { label: 'advanced', Class: AdvancedNameReservation, hex: ADVANCED, nameOffset: 4, hash: '62dd15ac56fdcedb6efe9c57adb850d5c11873517f77796a39f26719c8f4ba26' }
];

describe.each(formats)('$label reservation payload', ({ Class, hex, nameOffset, hash }) => {
  test('does not coerce text into a raw uint256 salt', () => {
    expect(() => new Class({ ...data(), salt: 'a'.repeat(32) as any })).toThrow('Buffer');
  });

  test('matches independent field-order, raw uint256, and SHA256d vectors', () => {
    const reservation = new Class(data());
    expect(reservation.isValid()).toBe(true);
    expect(reservation.toBuffer().toString('hex')).toBe(hex);
    expect(reservation.getByteLength()).toBe(hex.length / 2);
    expect(reservation.getCommitment().hash.toString('hex')).toBe(hash);
    expect(reservation.getCommitment().toBuffer()).toHaveLength(32);
    expect(reservation.getCommitment().isAdvanced()).toBe(false);
    expect(reservation.toJSON().salt).toBe(SALT_JSON);
    expect(reservation.toJSON().referral).toBe(REFERRAL_ADDRESS);
    expect(JSON.parse(JSON.stringify(reservation))).toEqual(reservation.toJSON());
    expect(JSON.parse(JSON.stringify({ reservation }))).toEqual({ reservation: reservation.toJSON() });
    expect(reservation.salt.toString('hex')).toBe(SALT);
  });

  test('encodes an absent referral as exactly twenty zero bytes', () => {
    const reservation = new Class({ ...data(), referral: undefined });
    const bytes = reservation.toBuffer();
    expect(bytes.subarray(bytes.length - 52, bytes.length - 32)).toEqual(Buffer.alloc(20));
    expect(reservation.toJSON().referral).toBe('');
    expect(Class.fromHex(bytes.toString('hex')).referral.hash).toEqual(Buffer.alloc(20));
  });

  test('preserves UTF-8 bytes and the 64-byte boundary without truncation or normalization', () => {
    for (const name of ['a'.repeat(64), 'é'.repeat(32), '🌐'.repeat(16)]) {
      const reservation = new Class(data(name));
      reservation.validateForCreation();
      expect(reservation.toBuffer()[nameOffset]).toBe(64);
      expect(Class.fromHex(reservation.toBuffer().toString('hex')).name).toBe(name);
    }
    for (const name of ['', 'a'.repeat(65), 'é'.repeat(32) + 'a', '\ud800']) {
      const invalid = new Class(data(name));
      expect(invalid.isValid()).toBe(false);
      expect(() => invalid.toBuffer()).toThrow();
      expect(() => invalid.getByteLength()).toThrow();
    }
    const composed = new Class(data('é'));
    const decomposed = new Class(data('e\u0301'));
    expect(composed.getCommitment().hash).not.toEqual(decomposed.getCommitment().hash);
  });

  test('preserves approved case in the commitment preimage', () => {
    const upper = new Class(data('Alice'));
    const lower = new Class(data('alice'));
    expect(upper.getCommitment().hash).not.toEqual(lower.getCommitment().hash);
    expect(upper.getIdentityAddress(PARENT_ADDRESS)).toBe(lower.getIdentityAddress(PARENT_ADDRESS));
  });

  test('distinguishes structural decoding from stricter creation validation', () => {
    for (const name of [' bad', 'bad:name', 'bad  name', 'bad\u0000name']) {
      const reservation = new Class(data(name));
      expect(reservation.isValid()).toBe(true);
      const parsed = Class.fromHex(reservation.toBuffer().toString('hex'));
      expect(parsed.name).toBe(name);
      expect(() => parsed.validateForCreation()).toThrow();
    }
  });

  test('rejects noncanonical CompactSize and invalid UTF-8 names', () => {
    const bytes = Buffer.from(hex, 'hex');
    for (const lengthHex of ['fd0500', 'fe05000000', 'ff0500000000000000']) {
      const malformed = Buffer.concat([bytes.subarray(0, nameOffset), Buffer.from(lengthHex, 'hex'), bytes.subarray(nameOffset + 1)]);
      expect(() => new Class().fromBuffer(malformed)).toThrow('CompactSize');
    }
    for (const nameBytes of [Buffer.from([0xc3]), Buffer.from([0xff]), Buffer.from([0xc0, 0xaf])]) {
      const malformed = Buffer.concat([bytes.subarray(0, nameOffset), Buffer.from([nameBytes.length]), nameBytes, bytes.subarray(nameOffset + 6)]);
      expect(() => new Class().fromBuffer(malformed)).toThrow('UTF-8');
    }
    for (const length of [0, 65, 252]) {
      const malformed = Buffer.from(bytes);
      malformed[nameOffset] = length;
      expect(() => new Class().fromBuffer(malformed)).toThrow();
    }
  });

  test('rejects every truncated prefix and enforces explicit payload bounds', () => {
    const bytes = Buffer.from(hex, 'hex');
    for (let length = 0; length < bytes.length; length++) {
      expect(() => new Class().fromBuffer(bytes.subarray(0, length))).toThrow();
    }
    const framed = Buffer.concat([Buffer.from([9, 8]), bytes, Buffer.from([7, 6])]);
    const parsed = new Class();
    expect(parsed.fromBuffer(framed, 2, bytes.length)).toBe(2 + bytes.length);
    expect(parsed.toBuffer()).toEqual(bytes);
    expect(new Class().fromBuffer(framed, 2)).toBe(2 + bytes.length);
    expect(() => new Class().fromBuffer(framed, 2, bytes.length + 1)).toThrow('Trailing');
    expect(() => new Class().fromBuffer(framed, 2, bytes.length - 1)).toThrow();
    for (const [offset, length] of [[-1, 1], [0.5, 1], [0, -1], [0, 0.5], [0, framed.length + 1], [framed.length + 1, 0]]) {
      expect(() => new Class().fromBuffer(framed, offset, length)).toThrow('bounds');
    }
  });

  test('fromHex requires one complete payload and accepts uppercase hex', () => {
    expect(Class.fromHex(hex.toUpperCase()).toBuffer().toString('hex')).toBe(hex);
    for (const invalid of ['', '0', 'zz', '0x' + hex, hex + '00', hex.slice(0, -1)]) {
      expect(() => Class.fromHex(invalid)).toThrow();
    }
  });

  test('allows only one deserialization attempt, including a failed attempt', () => {
    const bytes = Buffer.from(hex, 'hex');
    const parsed = new Class();
    parsed.fromBuffer(bytes);
    expect(() => parsed.fromBuffer(bytes)).toThrow('already attempted');
    const failed = new Class();
    expect(() => failed.fromBuffer(Buffer.alloc(0))).toThrow();
    expect(() => failed.fromBuffer(bytes)).toThrow('already attempted');
  });

  test('does not alias caller buffers, identity hashes, or serialized output', () => {
    const supplied = data();
    const reservation = new Class(supplied);
    supplied.salt.fill(0);
    supplied.referral.hash.fill(0);
    supplied.parent.hash.fill(0);
    expect(reservation.toBuffer().toString('hex')).toBe(hex);
    const input = Buffer.from(hex, 'hex');
    const parsed = new Class();
    parsed.fromBuffer(input);
    input.fill(0);
    parsed.toBuffer().fill(0);
    parsed.getCommitment().hash.fill(0);
    expect(parsed.toBuffer().toString('hex')).toBe(hex);
  });

  test('rejects zero or incorrectly sized salts and non-identity referral fields', () => {
    for (const salt of [Buffer.alloc(32), Buffer.alloc(31, 1), Buffer.alloc(33, 1)]) {
      const reservation = new Class({ ...data(), salt });
      expect(reservation.isValid()).toBe(false);
      expect(() => reservation.toBuffer()).toThrow();
    }
    for (const referral of [new KeyID(Buffer.alloc(20, 1)), new IdentityID(Buffer.alloc(19, 1)), new IdentityID(Buffer.alloc(21, 1))]) {
      expect(() => new Class({ ...data(), referral })).toThrow('Referral');
    }
    const mutated = new Class(data());
    mutated.salt = Buffer.alloc(32);
    expect(() => mutated.getCommitment()).toThrow();
    expect(new Class().isValid()).toBe(false);
  });
});

describe('legacy reservation context and JSON', () => {
  const json = { name: 'Alice', salt: SALT_JSON, referral: REFERRAL_ADDRESS };

  test('uses display uint256 hex while requiring explicit parent context for name IDs', () => {
    const reservation = NameReservation.fromJSON(json);
    expect(reservation.toBuffer().toString('hex')).toBe(LEGACY);
    expect(reservation.toJSON()).toEqual(json);
    expect(reservation.getIdentityAddress(PARENT_ADDRESS)).toBe(IDENTITY_ADDRESS);
    expect(reservation.getIdentityAddress(null)).toBe(ROOT_IDENTITY_ADDRESS);
    expect(() => reservation.getIdentityAddress(undefined)).toThrow('explicit parent');
    expect(reservation.toJSONWithParent(PARENT_ADDRESS)).toEqual({ ...json, parent: PARENT_ADDRESS, nameid: IDENTITY_ADDRESS });
    expect(reservation.toJSONWithParent(null)).toEqual({ ...json, parent: '', nameid: ROOT_IDENTITY_ADDRESS });
    expect(NameReservation.fromJSON({ ...json, parent: 'metadata only' }).toBuffer().toString('hex')).toBe(LEGACY);
    expect(NameReservation.fromJSON({ ...json, nameid: IDENTITY_ADDRESS }, PARENT_ADDRESS).toBuffer().toString('hex')).toBe(LEGACY);
    expect(() => NameReservation.fromJSON({ ...json, nameid: IDENTITY_ADDRESS })).toThrow('explicit parent');
    expect(() => NameReservation.fromJSON({ ...json, nameid: ROOT_IDENTITY_ADDRESS }, PARENT_ADDRESS)).toThrow('nameid');
  });

  test('normalizes only hex case and accepts an omitted or empty referral', () => {
    expect(NameReservation.fromJSON({ ...json, salt: SALT_JSON.toUpperCase() }).toJSON()).toEqual(json);
    for (const referral of [undefined, '']) {
      expect(NameReservation.fromJSON({ ...json, referral }).referral.hash).toEqual(Buffer.alloc(20));
    }
    for (const salt of ['00'.repeat(32), SALT_JSON.slice(2), SALT_JSON + '00', '0x' + SALT_JSON, 'gg'.repeat(32)]) {
      expect(() => NameReservation.fromJSON({ ...json, salt })).toThrow();
    }
    const wrongVersion = new KeyID(Buffer.from(REFERRAL, 'hex')).toAddress();
    for (const referral of ['someone@', wrongVersion]) expect(() => NameReservation.fromJSON({ ...json, referral })).toThrow();
    expect(() => NameReservation.fromJSON(json).getIdentityAddress(wrongVersion)).toThrow();
  });
});

describe('advanced reservation version, parent, and JSON', () => {
  const json = { version: 1, name: 'Alice', parent: PARENT_ADDRESS, referral: REFERRAL_ADDRESS, salt: SALT_JSON, nameid: IDENTITY_ADDRESS };

  test('roundtrips complete daemon-shaped JSON and verifies supplied nameid', () => {
    const reservation = AdvancedNameReservation.fromJSON(json);
    expect(reservation.toBuffer().toString('hex')).toBe(ADVANCED);
    expect(reservation.toBuffer().subarray(0, 4)).toEqual(Buffer.from([1, 0, 0, 0]));
    expect(reservation.toJSON()).toEqual(json);
    expect(reservation.getIdentityAddress()).toBe(IDENTITY_ADDRESS);
    expect(() => AdvancedNameReservation.fromJSON({ ...json, nameid: ROOT_IDENTITY_ADDRESS })).toThrow('nameid');
    expect(AdvancedNameReservation.fromJSON({ ...json, nameid: undefined }).toJSON()).toEqual(json);
  });

  test.each([0, 2, 256, 0xffffffff])('rejects unsupported version %s in JSON and fixed-width binary', version => {
    const bytes = Buffer.from(ADVANCED, 'hex');
    bytes.writeUInt32LE(version);
    expect(() => AdvancedNameReservation.fromHex(bytes.toString('hex'))).toThrow('version');
    expect(() => AdvancedNameReservation.fromJSON({ ...json, version })).toThrow('version');
    const reservation = new AdvancedNameReservation({ ...data(), version });
    expect(reservation.isValid()).toBe(false);
    expect(() => reservation.toBuffer()).toThrow('version');
  });

  test('rejects wrong parent destination versions and byte lengths', () => {
    for (const parent of [new KeyID(Buffer.alloc(20, 1)), new IdentityID(Buffer.alloc(19, 1)), new IdentityID(Buffer.alloc(21, 1))]) {
      expect(() => new AdvancedNameReservation({ ...data(), parent })).toThrow('Parent');
    }
    const wrongVersion = new KeyID(Buffer.from(PARENT, 'hex')).toAddress();
    expect(() => AdvancedNameReservation.fromJSON({ ...json, parent: wrongVersion })).toThrow();
    expect(() => AdvancedNameReservation.fromJSON({ ...json, referral: wrongVersion })).toThrow();
  });

  test('can inspect a structurally valid null parent while creation requires a namespace', () => {
    const reservation = new AdvancedNameReservation({ ...data(), parent: new IdentityID(Buffer.alloc(20)) });
    expect(reservation.isValid()).toBe(true);
    expect(AdvancedNameReservation.fromHex(reservation.toBuffer().toString('hex')).parent.hash).toEqual(Buffer.alloc(20));
    expect(() => reservation.getIdentityAddress()).toThrow('explicit root system');
    expect(() => reservation.toJSON()).toThrow('explicit root system');
    expect(() => JSON.stringify({reservation})).toThrow('explicit root system');
    expect(reservation.getIdentityAddress('VRSCTEST')).toBe('i5f5njYtso65186mo5WHMkRme9YG6hrZE2');
    expect(reservation.getIdentityAddress('VRSC')).toBe('i5ULg5wze6A1uWGiXSoLjc9KBF1Ea6ZuGd');
    expect(reservation.getIdentityAddress('VRSCTEST')).not.toBe(ROOT_IDENTITY_ADDRESS);
    const contextualJSON = reservation.toJSONWithRootSystem('VRSCTEST');
    expect(contextualJSON.parent).toBe('i3UXS5QPRQGNRDDqVnyWTnmFCTHDbzmsYk');
    expect(contextualJSON.nameid).toBe('i5f5njYtso65186mo5WHMkRme9YG6hrZE2');
    expect(() => AdvancedNameReservation.fromJSON(contextualJSON)).toThrow('explicit root system');
    expect(AdvancedNameReservation.fromJSON(contextualJSON, 'VRSCTEST').toBuffer()).toEqual(reservation.toBuffer());
    expect(() => AdvancedNameReservation.fromJSON(contextualJSON, 'VRSC')).toThrow('nameid');
    expect(AdvancedNameReservation.fromJSON({...contextualJSON, nameid: undefined}).toBuffer()).toEqual(reservation.toBuffer());
    expect(() => reservation.validateForCreation()).toThrow();
  });

  test('null-parent root names do not have the same root appended twice', () => {
    const fixture = require('../fixtures/identity-registration/names-v1.json');
    for (const rootSystemName of ['VRSCTEST', 'VRSC']) {
      for (const name of [rootSystemName, rootSystemName.toLowerCase()]) {
        const reservation = new AdvancedNameReservation({...data(), name, parent: new IdentityID(Buffer.alloc(20))});
        expect(reservation.getIdentityAddress(rootSystemName)).toBe(fixture.roots[rootSystemName].vdxfid);
        expect(reservation.toJSONWithRootSystem(rootSystemName).nameid).toBe(fixture.roots[rootSystemName].vdxfid);
      }
    }
    for (const rootSystemName of ['', 'VRSC.', 'VRSC@', ' VRSC', 'a'.repeat(65)]) {
      const reservation = new AdvancedNameReservation({...data(), parent: new IdentityID(Buffer.alloc(20))});
      expect(() => reservation.getIdentityAddress(rootSystemName)).toThrow();
    }
  });
});
