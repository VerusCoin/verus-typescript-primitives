import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { NULL_ADDRESS } from '../../constants/vdxf';
import { CredentialKey, DataDescriptorKey } from '../../vdxf/vdxfdatakeys';

const objectdata = Buffer.from('ff', 'hex');
const createBase = () => new DataDescriptor({
  flags: DataDescriptor.FLAG_ENCRYPTED_DATA,
  objectdata,
});
const parse = (buffer: Buffer) => {
  const descriptor = new DataDescriptor();
  expect(descriptor.fromBuffer(buffer)).toBe(buffer.length);
  return descriptor;
};
const jsonValue = (value: string | Buffer) => Buffer.isBuffer(value) ? value.toString('hex') : value;

describe.each([
  { field: 'label', jsonField: 'label', flag: 0x20, value: 'added label', replacement: 'new label', absent: '' },
  { field: 'mimeType', jsonField: 'mimetype', flag: 0x40, value: 'application/json', replacement: 'application/octet-stream', absent: '' },
  { field: 'salt', jsonField: 'salt', flag: 0x02, value: Buffer.from('11', 'hex'), replacement: Buffer.from('2233', 'hex'), absent: undefined },
  { field: 'epk', jsonField: 'epk', flag: 0x04, value: Buffer.from('44', 'hex'), replacement: Buffer.from('5566', 'hex'), absent: undefined },
  { field: 'ivk', jsonField: 'ivk', flag: 0x08, value: Buffer.from('77', 'hex'), replacement: Buffer.from('8899', 'hex'), absent: undefined },
  { field: 'ssk', jsonField: 'ssk', flag: 0x10, value: Buffer.from('aa', 'hex'), replacement: Buffer.from('bbcc', 'hex'), absent: undefined },
  { field: 'vdxfKey', jsonField: 'vdxfkey', flag: 0x80, value: DataDescriptorKey.vdxfid, replacement: CredentialKey.vdxfid, absent: NULL_ADDRESS },
])('DataDescriptor $field edits', ({ field, jsonField, flag, value, replacement, absent }) => {
  test('serializes an added field in JSON and binary after parsing', () => {
    const descriptor = parse(createBase().toBuffer());
    Object.assign(descriptor, { [field]: value });

    // JSON must reflect the edit before any binary serializer synchronizes flags.
    const json = descriptor.toJson();
    expect(json.flags).toBe(1 | flag);
    expect(json[jsonField]).toBe(jsonValue(value));

    const binaryFirst = parse(createBase().toBuffer());
    Object.assign(binaryFirst, { [field]: value });
    const wire = binaryFirst.toBuffer();
    expect(binaryFirst.getByteLength()).toBe(wire.length);
    expect(descriptor.toBuffer()).toEqual(wire);
    const restored = parse(wire);
    expect(restored.toJson()).toEqual(json);
    expect(restored.toBuffer()).toEqual(wire);
    expect(DataDescriptor.fromJson(JSON.parse(JSON.stringify(json))).toBuffer()).toEqual(wire);
    expect(restored.hasEncryptedData()).toBe(true);
  });

  test('preserves replacements and removes fields without manual flag changes', () => {
    const original = createBase();
    Object.assign(original, { [field]: value });
    original.setFlags();
    const descriptor = parse(original.toBuffer());
    Object.assign(descriptor, { [field]: replacement });

    const replacementJson = descriptor.toJson();
    expect(replacementJson.flags).toBe(1 | flag);
    expect(replacementJson[jsonField]).toBe(jsonValue(replacement));
    expect(parse(descriptor.toBuffer()).toJson()).toEqual(replacementJson);

    Object.assign(descriptor, { [field]: absent });
    const removedJson = descriptor.toJson();
    expect(removedJson.flags).toBe(1);
    expect(removedJson).not.toHaveProperty(jsonField);
    expect(descriptor.toBuffer()).toEqual(createBase().toBuffer());
    expect(parse(descriptor.toBuffer()).hasEncryptedData()).toBe(true);
  });
});

test.each([
  { field: 'label', limit: 64 },
  { field: 'mimeType', limit: 128 },
])('validates a newly assigned $field before serialization', ({ field, limit }) => {
  const descriptor = parse(createBase().toBuffer());
  Object.assign(descriptor, { [field]: 'a'.repeat(limit + 1) });

  expect(descriptor.isValid()).toBe(false);
  expect(() => descriptor.toBuffer()).toThrow(/too long/);
});

test('first parse clears prepopulated optional fields absent from the wire', () => {
  const descriptor = new DataDescriptor({
    vdxfKey: DataDescriptorKey.vdxfid,
    label: 'stale label',
    mimeType: 'text/plain',
    salt: Buffer.from('11', 'hex'),
    epk: Buffer.from('22', 'hex'),
    ivk: Buffer.from('33', 'hex'),
    ssk: Buffer.from('44', 'hex'),
  });
  const wire = createBase().toBuffer();

  expect(descriptor.fromBuffer(wire)).toBe(wire.length);
  expect(descriptor.toJson()).toEqual({ version: 1, flags: 1, objectdata: 'ff' });
  expect(descriptor.toBuffer()).toEqual(wire);
});
