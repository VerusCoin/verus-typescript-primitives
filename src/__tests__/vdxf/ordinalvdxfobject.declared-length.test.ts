import {
  AuthenticationRequestOrdinalVDXFObject,
  IdentityUpdateRequestOrdinalVDXFObject,
  OrdinalVDXFObject,
  VerusPayInvoiceDetailsOrdinalVDXFObject,
} from '../../vdxf/classes/ordinals';
import { IdentityUpdateRequestDetails } from '../../vdxf/classes/identity/IdentityUpdateRequestDetails';
import { VerusPayInvoiceDetails } from '../../vdxf/classes/payment/VerusPayInvoiceDetails';
import { PartialIdentity } from '../../pbaas/PartialIdentity';
import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';

// Authentication-request ordinal 2, version 1, body length 1, flags 0.
const canonical = Buffer.from('02010100', 'hex');
const extended = Buffer.from('02010500deadbeef', 'hex');

describe('Serializable ordinal payload consumption', () => {
  test('round-trips a complete typed body through the factory', () => {
    const { obj, offset } = OrdinalVDXFObject.createFromBuffer(canonical);

    expect(obj).toBeInstanceOf(AuthenticationRequestOrdinalVDXFObject);
    expect(offset).toBe(canonical.length);
    expect(obj.toBuffer()).toEqual(canonical);
  });

  test('rejects unconsumed declared body bytes through the factory', () => {
    expect(() => OrdinalVDXFObject.createFromBuffer(extended)).toThrow();
  });

  test('rejects unconsumed declared body bytes through fromBuffer', () => {
    expect(() => new AuthenticationRequestOrdinalVDXFObject().fromBuffer(extended)).toThrow();
  });

  test('rejects unconsumed body bytes through fromDataBuffer', () => {
    const body = Buffer.from('00deadbeef', 'hex');

    expect(() => new AuthenticationRequestOrdinalVDXFObject().fromDataBuffer(body)).toThrow();
  });
});

describe.each([
  {
    name: 'identity update',
    create: () => new IdentityUpdateRequestOrdinalVDXFObject({
      data: new IdentityUpdateRequestDetails({ identity: new PartialIdentity({ name: 'alice' }) }),
    }),
    parser: () => new IdentityUpdateRequestOrdinalVDXFObject(),
  },
  {
    name: 'invoice',
    create: () => {
      const data = new VerusPayInvoiceDetails({ requestedcurrencyid: DEFAULT_VERUS_CHAINID });
      data.setFlags({ acceptsAnyAmount: true, acceptsAnyDestination: true });
      return new VerusPayInvoiceDetailsOrdinalVDXFObject({ data });
    },
    parser: () => new VerusPayInvoiceDetailsOrdinalVDXFObject(),
  },
])('$name ordinal payload override', ({ create, parser }) => {
  test('round-trips its complete body', () => {
    const wire = create().toBuffer();
    const { obj, offset } = OrdinalVDXFObject.createFromBuffer(wire);

    expect(offset).toBe(wire.length);
    expect(obj.toBuffer()).toEqual(wire);
  });

  test('rejects extra body bytes through both payload parsing and the factory', () => {
    const original = create();
    const body = original.toDataBuffer();
    const extendedBody = Buffer.concat([body, Buffer.from('deadbeef', 'hex')]);
    expect(() => parser().fromDataBuffer(extendedBody)).toThrow();

    const wire = original.toBuffer();
    const lengthOffset = wire.length - body.length - 1;
    expect(wire[lengthOffset]).toBe(body.length);
    const extendedWire = Buffer.concat([
      wire.subarray(0, lengthOffset), Buffer.from([extendedBody.length]), extendedBody,
    ]);
    expect(() => OrdinalVDXFObject.createFromBuffer(extendedWire)).toThrow();
  });
});
