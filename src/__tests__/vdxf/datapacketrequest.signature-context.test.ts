import { BN } from 'bn.js';
import {
  CompactIAddressObject,
  DataPacketRequestDetails,
  DataPacketRequestOrdinalVDXFObject,
  DEFAULT_VERUS_CHAINID,
  GenericRequest,
  TESTNET_VERUS_CHAINID,
  VerifiableSignatureData,
} from '../../';

// Fixed address/digest vectors also independently checked against the daemon
// preimage in verifiablesignaturedata.fqn-context.test.ts (height 1, zero hash).
const NETWORKS = {
  mainnet: {
    root: 'VRSC',
    isTestnet: false,
    system: DEFAULT_VERUS_CHAINID,
    signer: 'i5ULg5wze6A1uWGiXSoLjc9KBF1Ea6ZuGd',
    digest: 'bdbdffc60e648902908d736fb2a4b63f657a51d9489900afca10cd74ab31917a',
  },
  testnet: {
    root: 'VRSCTEST',
    isTestnet: true,
    system: TESTNET_VERUS_CHAINID,
    signer: 'i5f5njYtso65186mo5WHMkRme9YG6hrZE2',
    digest: '8b75d43a86beaffa34663dbf526e5b9d169c51ab576269328a7113f21f0e16d4',
  },
};

function expectSignature(signature: VerifiableSignatureData, network: typeof NETWORKS.testnet) {
  expect({
    isTestnet: signature.isTestnet,
    signer: signature.identityID.toIAddress(),
    system: signature.systemID.toIAddress(),
    digest: signature.getIdentityHash(1, Buffer.alloc(32)).toString('hex'),
  }).toEqual({
    isTestnet: network.isTestnet,
    signer: network.signer,
    system: network.system,
    digest: network.digest,
  });
}

describe('DataPacketRequestDetails nested signature context', () => {
  test('preserves the signer and digest in the audited testnet request fixture', () => {
    const wire = Buffer.from(
      '011009012c0401010568656c6c6f011002050102a6ef9ea235635e328124ff3429db9f9e91b64e2d010105616c69636500',
      'hex',
    );
    const restored = new GenericRequest();

    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.toBuffer()).toEqual(wire);
    expectSignature((restored.details[0].data as DataPacketRequestDetails).signature, NETWORKS.testnet);
  });

  test.each([
    { network: NETWORKS.mainnet, systemEncoding: 'FQN' },
    { network: NETWORKS.testnet, systemEncoding: 'FQN' },
    { network: NETWORKS.testnet, systemEncoding: 'omitted' },
  ])('preserves $network.root signatures with $systemEncoding system', ({ network, systemEncoding }) => {
    const signature = new VerifiableSignatureData({
      version: new BN(1),
      isTestnet: network.isTestnet,
      identityID: CompactIAddressObject.fromFQN('alice', network.root),
      systemID: CompactIAddressObject.fromFQN(network.root, network.root),
    });
    // Exercise the supported compact form that takes its system from context.
    if (systemEncoding === 'omitted') signature.flags = new BN(0);
    expectSignature(signature, network);

    const request = new GenericRequest({
      flags: network.isTestnet ? GenericRequest.FLAG_IS_TESTNET : new BN(0),
      details: [new DataPacketRequestOrdinalVDXFObject({
        data: new DataPacketRequestDetails({
          flags: new BN(0), signableObjects: ['hello'], signature,
        }),
      })],
    });
    const wire = request.toBuffer();
    const restored = new GenericRequest();

    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.toBuffer()).toEqual(wire);
    expectSignature((restored.details[0].data as DataPacketRequestDetails).signature, network);
  });

  test('honors a mixed-case testnet root and nonzero offset in direct parsing', () => {
    const details = new DataPacketRequestDetails({
      flags: new BN(0),
      signableObjects: ['hello'],
      signature: new VerifiableSignatureData({
        version: new BN(1),
        isTestnet: true,
        identityID: CompactIAddressObject.fromFQN('alice', 'VRSCTEST'),
      }),
      requestID: CompactIAddressObject.fromFQN('request', 'VRSCTEST'),
    });
    const wire = details.toBuffer();
    const framed = Buffer.concat([Buffer.from('aabb', 'hex'), wire, Buffer.from('cc', 'hex')]);
    const restored = new DataPacketRequestDetails();

    expect(restored.fromBuffer(framed, 2, 'vRsCtEsT')).toBe(2 + wire.length);
    expect(restored.toBuffer()).toEqual(wire);
    expect(restored.requestID.toIAddress()).toBe(details.requestID.toIAddress());
    expectSignature(restored.signature, NETWORKS.testnet);
  });
});
