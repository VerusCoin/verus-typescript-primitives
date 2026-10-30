import { BN } from 'bn.js';
import { CompactAddressObject, CompactXAddressObject, VerusPayInvoice, VerusPayInvoiceDetails } from '../../vdxf/classes';
import { VERUSPAY_VERSION_3, VERUSPAY_VERSION_4 } from '../../constants/vdxf/veruspay';
import { toIAddress } from '../../utils/address';
import { BigNumber } from '../../utils/types/BigNumber';

const CURRENCY = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
const X_ADDRESS = 'xA91QPpBrHZto92NCU5KEjCqRveS4dAPrf';
const DEFAULT_TAG = () => CompactXAddressObject.fromAddress(X_ADDRESS);

function taggedDetails(tag: CompactXAddressObject = DEFAULT_TAG(), isTestnet = false) {
  const details = new VerusPayInvoiceDetails({ requestedcurrencyid: CURRENCY, tag }, VERUSPAY_VERSION_4);
  details.setFlags({ acceptsAnyAmount: true, acceptsAnyDestination: true, isTagged: true, isTestnet });
  return details;
}

function taggedInvoice(tag: CompactXAddressObject = DEFAULT_TAG(), isTestnet = false) {
  return new VerusPayInvoice({ details: taggedDetails(tag, isTestnet), version: VERUSPAY_VERSION_4 });
}

describe('Tagged VerusPay V4 invoices', () => {
  test.each<[string, () => CompactXAddressObject, boolean]>([
    ['X-address', () => DEFAULT_TAG(), false],
    ['mainnet FQN', () => CompactXAddressObject.fromDataKey('invoice.vrsc', 'VRSC'), false],
    ['testnet FQN', () => CompactXAddressObject.fromDataKey('invoice.vrsctest', 'VRSCTEST'), true],
    ['mainnet VDXF key', () => CompactXAddressObject.fromDataKey('vrsc::applications.wallet'), false],
    ['testnet VDXF key', () => CompactXAddressObject.fromDataKey('vrsctest::invoice.payment', 'VRSCTEST'), true],
  ])('%s survives binary, JSON, deeplink and QR round trips', (_name, makeTag, isTestnet) => {
    const tag = makeTag();
    const invoice = taggedInvoice(tag, isTestnet);
    const bytes = invoice.toBuffer();
    const binary = new VerusPayInvoice();
    expect(binary.fromBuffer(bytes)).toBe(bytes.length);
    const restored = [
      binary,
      VerusPayInvoice.fromJson(invoice.toJson()),
      VerusPayInvoice.fromWalletDeeplinkUri(invoice.toWalletDeeplinkUri()),
      VerusPayInvoice.fromQrString(invoice.toQrString()),
    ];
    for (const result of restored) {
      expect(result.details.isTagged()).toBe(true);
      expect(result.details.isValid()).toBe(true);
      expect(result.details.tag).toBeInstanceOf(CompactXAddressObject);
      expect(result.details.tag.toAddress()).toBe(tag.toAddress());
      expect(result.details.tag.rootSystemName).toBe(isTestnet ? 'VRSCTEST' : 'VRSC');
      expect(result.toBuffer()).toEqual(bytes);
      expect(result.getDetailsHash(0)).toEqual(invoice.getDetailsHash(0));
    }
  });

  test('retains the existing direct X-address wire bytes', () => {
    expect(taggedDetails().toBuffer().toString('hex')).toBe(
      'fd3104a6ef9ea235635e328124ff3429db9f9e91b64e2d0103141e0bf38714a7bd2773686cc0093feaed8684cb'
    );
  });

  test('changing a tag changes the details hash', () => {
    const first = taggedInvoice();
    const second = taggedInvoice(CompactXAddressObject.fromDataKey('vrsc::invoice.another'));
    expect(first.getDetailsHash(0)).not.toEqual(second.getDetailsHash(0));
  });

  test('JSON factory restores the X subclass, version and namespace context', () => {
    const namespace = toIAddress('merchant', 'VRSCTEST');
    const tag = CompactXAddressObject.fromCompactAddressObjectJson({
      version: 1, type: 1, address: 'invoice', rootsystemname: 'VRSCTEST', namespace,
    });
    expect(tag).toBeInstanceOf(CompactXAddressObject);
    expect(tag.version.toNumber()).toBe(1);
    expect(tag.rootSystemName).toBe('VRSCTEST');
    expect(tag.nameSpace).toBe(namespace);
    expect(tag.toAddress()).toBe(CompactXAddressObject.fromDataKey('invoice', 'VRSCTEST').toAddress());
    const defaultNamespace = CompactXAddressObject.fromCompactAddressObjectJson({
      version: 1, type: 1, address: 'invoice', rootsystemname: 'VRSCTEST',
    });
    expect(defaultNamespace.nameSpace).toBe(toIAddress('VRSCTEST'));
  });

  const invalidTags: Array<[string, () => CompactXAddressObject]> = [
    ['missing tag', () => null],
    ['empty X-address', () => CompactXAddressObject.fromAddress('')],
    ['incorrect address prefix', () => CompactXAddressObject.fromAddress(CURRENCY)],
    ['invalid checksum', () => CompactXAddressObject.fromAddress('xA91QPpBrHZto92NCU5KEjCqRveS4dAPrg')],
    ['empty FQN', () => CompactXAddressObject.fromDataKey('')],
    ['whitespace FQN', () => CompactXAddressObject.fromDataKey('   ')],
    ['malformed FQN', () => CompactXAddressObject.fromDataKey('invoice@@')],
    ['I-address compact type', () => new CompactXAddressObject({ type: CompactAddressObject.TYPE_I_ADDRESS, address: CURRENCY })],
    ['unknown compact type', () => new CompactXAddressObject({ type: new BN(9), address: X_ADDRESS })],
    ['invalid compact version', () => new CompactXAddressObject({ version: new BN(0), type: CompactAddressObject.TYPE_X_ADDRESS, address: X_ADDRESS })],
    ['unsupported compact version', () => new CompactXAddressObject({ version: new BN(2), type: CompactAddressObject.TYPE_X_ADDRESS, address: X_ADDRESS })],
  ];

  test.each(invalidTags)('rejects %s', (_name, makeTag) => {
    const tag = makeTag();
    if (tag) expect(tag.isValid()).toBe(false);
    const details = taggedDetails(tag);
    expect(details.isValid()).toBe(false);
    expect(() => details.getByteLength()).toThrow();
    expect(() => details.toBuffer()).toThrow();
    expect(() => details.toJson()).toThrow();
    const json = taggedInvoice().toJson();
    json.details.tag = tag ? {
      version: tag.version.toNumber(), type: tag.BNType.toNumber(),
      address: tag.address, rootsystemname: tag.rootSystemName,
    } : undefined;
    expect(() => VerusPayInvoice.fromJson(json)).toThrow();
  });

  test.each<[string, () => Buffer]>([
    ['missing tag', () => Buffer.alloc(0)],
    ['truncated X-address', () => DEFAULT_TAG().toBuffer().subarray(0, 21)],
    ['I-address compact type', () => Buffer.concat([Buffer.from([1, 2]), DEFAULT_TAG().toBuffer().subarray(2)])],
    ['unknown compact type', () => Buffer.from([1, 9, 0])],
    ['invalid compact version', () => Buffer.concat([Buffer.from([0]), DEFAULT_TAG().toBuffer().subarray(1)])],
    ['unsupported compact version', () => Buffer.concat([Buffer.from([2]), DEFAULT_TAG().toBuffer().subarray(1)])],
    ['empty FQN', () => Buffer.from([1, 1, 0])],
  ])('rejects binary %s', (_name, makeBytes) => {
    const valid = taggedDetails().toBuffer();
    const prefix = valid.subarray(0, valid.length - DEFAULT_TAG().getByteLength());
    const malformed = Buffer.concat([prefix, makeBytes()]);
    expect(() => new VerusPayInvoiceDetails().fromBuffer(malformed)).toThrow();
  });

  test.each<[BigNumber, string]>([
    [VERUSPAY_VERSION_3, '11aed6c100a6ef9ea235635e328124ff3429db9f9e91b64e2d'],
    [VERUSPAY_VERSION_4, '11fe00e1f505a6ef9ea235635e328124ff3429db9f9e91b64e2d'],
  ])('preserves untagged V%s invoices and ignores unused tags', (version, expectedHex) => {
    const details = new VerusPayInvoiceDetails({
      requestedcurrencyid: CURRENCY, amount: new BN(100000000),
      tag: CompactXAddressObject.fromAddress('invalid unused tag'),
    }, version);
    details.setFlags({ acceptsAnyDestination: true });
    expect(details.isTagged()).toBe(false);
    expect(details.isValid()).toBe(true);
    expect(details.toBuffer().toString('hex')).toBe(expectedHex);
    expect(details.toJson().tag).toBeUndefined();
    const invoice = new VerusPayInvoice({ details, version: version });
    const restored = VerusPayInvoice.fromJson(invoice.toJson());
    expect(restored.details.isValid()).toBe(true);
    expect(restored.toBuffer()).toEqual(invoice.toBuffer());
  });
});
