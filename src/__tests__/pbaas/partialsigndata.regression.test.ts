import { DATA_TYPE_HEX, DATA_TYPE_MESSAGE, DATA_TYPE_MMRDATA, DATA_TYPE_VDXFDATA } from '../../constants/pbaas';
import { X_ADDR_VERSION } from '../../constants/vdxf';
import { IdentityID } from '../../pbaas/IdentityID';
import { KeyID } from '../../pbaas/KeyID';
import { PartialMMRData } from '../../pbaas/PartialMMRData';
import { PartialSignData } from '../../pbaas/PartialSignData';
import { FqnVdxfUniValue } from '../../pbaas/VdxfUniValue';
import { Hash160SerEnt } from '../../vdxf/classes/Hash160';
import { DataByteVectorKey, DataStringKey } from '../../vdxf/vdxfdatakeys';

const addressHash = Buffer.alloc(20, 0x31);
const identityAddress = new IdentityID(addressHash).toAddress();
const keyAddress = new KeyID(addressHash).toAddress();

function jsonRoundTrip(original: PartialSignData): PartialSignData {
  return PartialSignData.fromJson(JSON.parse(JSON.stringify(original.toJson())));
}

describe('PartialSignData address preservation', () => {
  test('rejects an R-address in CLI JSON', () => {
    expect(() => PartialSignData.fromCLIJson({ address: keyAddress, message: 'Sign this' })).toThrow();
  });

  test('rejects an R-address in serialized JSON', () => {
    expect(() => PartialSignData.fromJson({
      address: keyAddress,
      datatype: DATA_TYPE_MESSAGE.toString(10),
      data: Buffer.from('Sign this').toString('hex'),
    })).toThrow();
  });

  test.each([
    ['KeyID', new KeyID(addressHash)],
    ['generic hash with an unsupported version', new Hash160SerEnt(addressHash, X_ADDR_VERSION)],
  ])('rejects %s in the constructor', (_name, address) => {
    expect(() => new PartialSignData({ address })).toThrow();
  });

  test('rejects an address reassigned to a different family before serialization', () => {
    const request = PartialSignData.fromCLIJson({ address: identityAddress, message: 'Sign this' });
    request.address = new KeyID(addressHash);

    expect(() => request.getByteLength()).toThrow();
    expect(() => request.toBuffer()).toThrow();
    expect(() => request.toJson()).toThrow();
    expect(() => request.toCLIJson()).toThrow();
  });

  test('preserves an identity address through CLI, binary, and JSON round trips', () => {
    const original = PartialSignData.fromCLIJson({ address: identityAddress, message: 'Sign this' });
    const wire = original.toBuffer();
    const parsed = new PartialSignData();

    expect(parsed.fromBuffer(wire)).toBe(wire.length);
    expect(parsed.address).toBeInstanceOf(IdentityID);
    expect(parsed.address.toAddress()).toBe(identityAddress);
    expect(parsed.toBuffer()).toEqual(wire);
    expect(parsed.toCLIJson()).toEqual(original.toCLIJson());

    const restored = jsonRoundTrip(original);
    expect(restored.address.toAddress()).toBe(identityAddress);
    expect(restored.toBuffer()).toEqual(wire);
  });
});

describe('PartialSignData typed JSON preservation', () => {
  test.each([
    ['i-address key', { [DataStringKey.vdxfid]: 'Typed signing data' }],
    ['namespaced FQN key', { [DataStringKey.qualifiedname.name]: 'Typed signing data' }],
    ['multiple typed values', [
      { [DataStringKey.qualifiedname.name]: 'Typed signing data' },
      { [DataByteVectorKey.vdxfid]: '010203' },
    ]],
  ])('preserves FQN data with %s through JSON text', (_name, json) => {
    const data = FqnVdxfUniValue.fromJson(json);
    const original = new PartialSignData({ dataType: DATA_TYPE_VDXFDATA, data });
    const wire = original.toBuffer();

    expect(original.toJson().data).toEqual(data.toJson());
    const restored = jsonRoundTrip(original);

    expect(restored.data).toBeInstanceOf(FqnVdxfUniValue);
    expect((restored.data as FqnVdxfUniValue).toJson()).toEqual(data.toJson());
    expect(restored.toBuffer()).toEqual(wire);
  });

  test.each(['deadbeef', ''])('preserves opaque FQN hex %j through JSON text', hex => {
    const original = new PartialSignData({
      dataType: DATA_TYPE_VDXFDATA,
      data: FqnVdxfUniValue.fromJson(hex),
    });
    const wire = original.toBuffer();

    expect(original.toJson().data).toBe(hex);
    const restored = jsonRoundTrip(original);

    expect(restored.data).toBeInstanceOf(FqnVdxfUniValue);
    expect((restored.data as FqnVdxfUniValue).toJson()).toBe(hex);
    expect(restored.toBuffer()).toEqual(wire);
  });

  test('preserves explicitly empty VDXF data in CLI JSON', () => {
    const original = new PartialSignData({
      dataType: DATA_TYPE_VDXFDATA,
      data: FqnVdxfUniValue.fromJson(''),
    });
    const restored = PartialSignData.fromCLIJson(original.toCLIJson());

    expect(restored.data).toBeInstanceOf(FqnVdxfUniValue);
    expect(restored.toBuffer()).toEqual(original.toBuffer());
  });

  test('preserves structured MMR data through JSON text', () => {
    const data = new PartialMMRData({
      data: [{ type: DATA_TYPE_MESSAGE, data: Buffer.from('MMR signing data') }],
      salt: [Buffer.alloc(32, 0x11)],
      priormmr: [Buffer.alloc(32, 0x22)],
    });
    const original = new PartialSignData({ dataType: DATA_TYPE_MMRDATA, data });
    const restored = jsonRoundTrip(original);

    expect(restored.data).toBeInstanceOf(PartialMMRData);
    expect((restored.data as PartialMMRData).toJson()).toEqual(data.toJson());
    expect(restored.toBuffer()).toEqual(original.toBuffer());
  });

  test.each([
    ['message', DATA_TYPE_MESSAGE, Buffer.from('Plain signing data')],
    ['empty hex', DATA_TYPE_HEX, Buffer.alloc(0)],
  ])('preserves %s buffer data through JSON text', (_name, dataType, data) => {
    const original = new PartialSignData({ dataType, data });
    const restored = jsonRoundTrip(original);

    expect(Buffer.isBuffer(restored.data)).toBe(true);
    expect(restored.data).toEqual(data);
    expect(restored.toBuffer()).toEqual(original.toBuffer());
  });
});
