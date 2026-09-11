import { BN } from 'bn.js';
import { Credential } from '../../pbaas/Credential';
import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { toBase58Check } from '../../utils/address';

// Independent wire fixtures: CDataDescriptor / CCredential in the daemon's
// src/pbaas/vdxf.h serialize text with LIMITED_STRING. In src/serialize.h this
// writes CompactSize(std::string.size()), then the UTF-8 bytes. Prefixes below
// are literal protocol bytes, never obtained from the serializers under test.
// Every fixture stays within the daemon's byte limits (64 / 128 / 512).
const descriptorCases = [
  {
    name: 'ASCII label control',
    label: 'label',
    mimeType: '',
    hex: '012000056c6162656c',
  },
  {
    name: 'ASCII MIME control',
    label: '',
    mimeType: 'text/plain',
    hex: '0140000a746578742f706c61696e',
  },
  {
    name: 'two-byte UTF-8 label',
    label: 'é',
    mimeType: '',
    hex: '01200002c3a9',
  },
  {
    name: 'four-byte UTF-8 label (a UTF-16 surrogate pair)',
    label: '🔑',
    mimeType: '',
    hex: '01200004f09f9491',
  },
  {
    name: 'UTF-8 label at the 64-byte limit',
    label: 'é'.repeat(32),
    mimeType: '',
    hex: '01200040' + 'c3a9'.repeat(32),
  },
  {
    name: 'UTF-8 MIME field at the 128-byte limit',
    label: '',
    mimeType: 'text/' + 'é'.repeat(61) + 'x',
    hex: '01400080746578742f' + 'c3a9'.repeat(61) + '78',
  },
  {
    name: 'UTF-8 label followed by MIME text',
    label: 'é',
    mimeType: 'text/plain',
    hex: '01600002c3a90a746578742f706c61696e',
  },
];

describe.each(descriptorCases)('canonical DataDescriptor text: $name', ({ label, mimeType, hex }) => {
  const canonical = Buffer.from(hex, 'hex');
  const create = () => new DataDescriptor({ label, mimeType });

  test('reports the complete UTF-8 wire length', () => {
    expect(create().getByteLength()).toBe(canonical.length);
  });

  test('serializes constructor input to the canonical bytes', () => {
    expect(create().toBuffer()).toEqual(canonical);
  });

  test('serializes JSON input to the canonical bytes', () => {
    const descriptor = DataDescriptor.fromJson({ version: 1, label, mimetype: mimeType });

    expect(descriptor.toBuffer()).toEqual(canonical);
  });

  test('decodes and reserializes independently supplied canonical bytes', () => {
    const descriptor = new DataDescriptor();

    expect(descriptor.fromBuffer(canonical)).toBe(canonical.length);
    expect(descriptor.isValid()).toBe(true);
    expect(descriptor.objectdata).toEqual(Buffer.alloc(0));
    expect(descriptor.label ?? '').toBe(label);
    expect(descriptor.mimeType ?? '').toBe(mimeType);
    expect(descriptor.toBuffer()).toEqual(canonical);
  });
});

// The key is a fixed uint160 on the wire; Base58 is only its API representation.
const credentialKeyHex = '11'.repeat(20);
const credentialKey = toBase58Check(Buffer.from(credentialKeyHex, 'hex'), 102);
const credentialCases = [
  {
    name: 'ASCII JSON and label control',
    credential: 'a',
    scopes: 'b',
    label: 'label',
    flagsHex: '01',
    fieldsHex: '0322612203226222056c6162656c',
  },
  {
    name: 'UTF-8 JSON credential string',
    credential: 'é',
    scopes: {},
    label: '',
    flagsHex: '00',
    fieldsHex: '0422c3a922027b7d',
  },
  {
    name: 'UTF-8 JSON scopes string',
    credential: {},
    scopes: 'é',
    label: '',
    flagsHex: '00',
    fieldsHex: '027b7d0422c3a922',
  },
  {
    name: 'UTF-8 JSON object member',
    credential: { name: 'é' },
    scopes: {},
    label: '',
    flagsHex: '00',
    fieldsHex: '0d7b226e616d65223a22c3a9227d027b7d',
  },
  {
    name: 'UTF-8 JSON credential at the 512-byte limit',
    credential: 'é'.repeat(255),
    scopes: {},
    label: '',
    flagsHex: '00',
    fieldsHex: 'fd000222' + 'c3a9'.repeat(255) + '22027b7d',
  },
  {
    name: 'short UTF-8 label control',
    credential: {},
    scopes: {},
    label: 'é',
    flagsHex: '01',
    fieldsHex: '027b7d027b7d02c3a9',
  },
  {
    name: 'ASCII label at the 253-byte CompactSize transition control',
    credential: {},
    scopes: {},
    label: 'a'.repeat(253),
    flagsHex: '01',
    fieldsHex: '027b7d027b7dfdfd00' + '61'.repeat(253),
  },
  {
    name: 'UTF-8 label immediately below the CompactSize transition (252 bytes)',
    credential: {},
    scopes: {},
    label: 'é'.repeat(126),
    flagsHex: '01',
    fieldsHex: '027b7d027b7dfc' + 'c3a9'.repeat(126),
  },
  {
    name: 'UTF-8 label at the CompactSize transition (253 bytes, 127 UTF-16 units)',
    credential: {},
    scopes: {},
    label: 'é'.repeat(126) + 'a',
    flagsHex: '01',
    fieldsHex: '027b7d027b7dfdfd00' + 'c3a9'.repeat(126) + '61',
  },
];

describe.each(credentialCases)(
  'canonical Credential text: $name',
  ({ credential, scopes, label, flagsHex, fieldsHex }) => {
    const canonical = Buffer.from('01' + flagsHex + credentialKeyHex + fieldsHex, 'hex');
    const create = () => new Credential({ version: new BN(1), credentialKey, credential, scopes, label });

    test('reports the complete UTF-8 wire length', () => {
      expect(create().getByteLength()).toBe(canonical.length);
    });

    test('serializes constructor input to the canonical bytes', () => {
      expect(create().toBuffer()).toEqual(canonical);
    });

    test('serializes JSON input to the canonical bytes', () => {
      const parsed = Credential.fromJson({ version: 1, credentialkey: credentialKey, credential, scopes, label });

      expect(parsed.toBuffer()).toEqual(canonical);
    });

    test('decodes and reserializes independently supplied canonical bytes', () => {
      const parsed = new Credential();

      expect(parsed.fromBuffer(canonical)).toBe(canonical.length);
      expect(parsed.isValid()).toBe(true);
      expect(parsed.credentialKey).toBe(credentialKey);
      expect(parsed.credential).toEqual(credential);
      expect(parsed.scopes).toEqual(scopes);
      expect(parsed.label).toBe(label);
      expect(parsed.toBuffer()).toEqual(canonical);
    });
  }
);
