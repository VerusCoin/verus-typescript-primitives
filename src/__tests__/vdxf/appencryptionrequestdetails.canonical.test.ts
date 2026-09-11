import { BN } from 'bn.js';
import { SaplingPaymentAddress } from '../../pbaas/SaplingPaymentAddress';
import { AppEncryptionRequestDetails, AppEncryptionRequestDetailsJson } from '../../vdxf/classes/appencryption/AppEncryptionRequestDetails';

// The details wire format is CompactSize(flags), then VarInt(derivationNumber)
// when no optional fields are present. Version is not serialized here.
// These literal VarInt vectors follow VerusCoin src/serialize.h WriteVarInt:
// for each continued byte, n = (n >> 7) - 1. They deliberately do not use the
// serializer, varint.encode, or varuint.encodingLength to build the oracle.
// In particular, VarInt changes width at 128, 16512, and 2113664, whereas
// CompactSize changes width at 253, 65536, and 4294967296.
const DERIVATION_VECTORS = [
  { derivationNumber: 0, varIntHex: '00' },
  { derivationNumber: 42, varIntHex: '2a' },
  { derivationNumber: 127, varIntHex: '7f' },
  { derivationNumber: 128, varIntHex: '8000' },
  { derivationNumber: 252, varIntHex: '807c' },
  { derivationNumber: 253, varIntHex: '807d' },
  { derivationNumber: 16511, varIntHex: 'ff7f' },
  { derivationNumber: 16512, varIntHex: '808000' },
  { derivationNumber: 65535, varIntHex: '82fe7f' },
  { derivationNumber: 65536, varIntHex: '82ff00' },
  { derivationNumber: 2113663, varIntHex: 'ffff7f' },
  { derivationNumber: 2113664, varIntHex: '80808000' },
  { derivationNumber: 4294967295, varIntHex: '8efefefe7f' },
  { derivationNumber: 4294967296, varIntHex: '8efefeff00' },
];

describe('AppEncryptionRequestDetails canonical derivation payloads', () => {
  describe.each(DERIVATION_VECTORS)(
    'derivationNumber=$derivationNumber (VarInt=$varIntHex)',
    ({ derivationNumber, varIntHex }) => {
      const canonical = Buffer.from(`00${varIntHex}`, 'hex');

      const makeDetails = () => new AppEncryptionRequestDetails({
        flags: new BN(0),
        derivationNumber: new BN(derivationNumber),
      });

      test('reports exactly the size of flags plus the canonical VarInt', () => {
        const details = makeDetails();

        expect(details.isValid()).toBe(true);
        expect(details.getByteLength()).toBe(canonical.length);
      });

      test('serializes to the exact canonical bytes without trailing padding', () => {
        expect(makeDetails().toBuffer().toString('hex')).toBe(canonical.toString('hex'));
      });

      test('decodes the canonical payload at an offset and stops before the next field', () => {
        const prefix = Buffer.from('aabb', 'hex');
        const suffix = Buffer.from('ccdd', 'hex');
        const framed = Buffer.concat([prefix, canonical, suffix]);
        const restored = new AppEncryptionRequestDetails();
        const end = restored.fromBuffer(framed, prefix.length);

        expect(restored.isValid()).toBe(true);
        expect(restored.flags.toNumber()).toBe(0);
        expect(restored.derivationNumber.toString(10)).toBe(String(derivationNumber));
        expect(end).toBe(prefix.length + canonical.length);
        expect(framed.subarray(end)).toEqual(suffix);
      });

      test('preserves canonical input byte for byte after decoding', () => {
        const restored = new AppEncryptionRequestDetails();

        expect(restored.fromBuffer(canonical)).toBe(canonical.length);
        expect(restored.toBuffer().toString('hex')).toBe(canonical.toString('hex'));
      });
    },
  );
});

describe('AppEncryptionRequestDetails optional reply address JSON', () => {
  const canonical = Buffer.from('00807d', 'hex');
  const withoutReply: AppEncryptionRequestDetailsJson = {
    version: 1,
    flags: 0,
    derivationnumber: 253,
  };
  const replyAddress = 'zs1wczplx4kegw32h8g0f7xwl57p5tvnprwdmnzmdnsw50chcl26f7tws92wk2ap03ykaq6jyyztfa';

  test('exports constructor data without a reply address', () => {
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(253),
    });

    expect(details.toJson().encryptresponsetoaddress).toBeUndefined();
    expect(JSON.parse(JSON.stringify(details.toJson()))).toEqual(withoutReply);
  });

  test('round trips canonical absent-address bytes through JSON text', () => {
    const details = new AppEncryptionRequestDetails();
    expect(details.fromBuffer(canonical)).toBe(canonical.length);

    const json = JSON.parse(JSON.stringify(details.toJson()));
    expect(json).toEqual(withoutReply);
    expect(json).not.toHaveProperty('encryptresponsetoaddress');
    expect(AppEncryptionRequestDetails.fromJson(json).toBuffer()).toEqual(canonical);
    expect(AppEncryptionRequestDetails.fromJson(withoutReply).toBuffer()).toEqual(canonical);
  });

  test('preserves a present reply address through binary and JSON text', () => {
    const address = SaplingPaymentAddress.fromAddressString(replyAddress);
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(253),
      encryptResponseToAddress: address,
    });
    const canonicalWithReply = Buffer.concat([
      Buffer.from('02', 'hex'),
      address.toBuffer(),
      Buffer.from('807d', 'hex'),
    ]);
    expect(details.toBuffer()).toEqual(canonicalWithReply);

    const decoded = new AppEncryptionRequestDetails();
    expect(decoded.fromBuffer(canonicalWithReply)).toBe(canonicalWithReply.length);
    const json = JSON.parse(JSON.stringify(decoded.toJson()));
    expect(json).toEqual({ ...withoutReply, flags: 2, encryptresponsetoaddress: replyAddress });
    expect(AppEncryptionRequestDetails.fromJson(json).toBuffer()).toEqual(canonicalWithReply);
  });

  test('omits a prepopulated reply address when the parsed presence flag is absent', () => {
    const address = SaplingPaymentAddress.fromAddressString(replyAddress);
    const details = new AppEncryptionRequestDetails({
      flags: new BN(0),
      derivationNumber: new BN(0),
      encryptResponseToAddress: address,
    });
    expect(details.fromBuffer(canonical)).toBe(canonical.length);
    expect(details.encryptResponseToAddress).toBe(address);
    expect(details.hasEncryptResponseToAddress()).toBe(false);

    expect(details.toJson().encryptresponsetoaddress).toBeUndefined();
    const json = JSON.parse(JSON.stringify(details.toJson()));
    expect(json).toEqual(withoutReply);
    expect(AppEncryptionRequestDetails.fromJson(json).toBuffer()).toEqual(canonical);
    expect(details.toBuffer()).toEqual(canonical);
  });
});
