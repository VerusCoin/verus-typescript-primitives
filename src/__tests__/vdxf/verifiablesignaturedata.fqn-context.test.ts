import { BN } from 'bn.js';
import { createHash } from 'crypto';
import { decode as decodeBase58Check } from 'bs58check';
import { GenericEnvelope } from '../../vdxf/classes/envelope/GenericEnvelope';
import {
  AuthenticationRequestOrdinalVDXFObject,
  AuthenticationResponseOrdinalVDXFObject,
  CompactIAddressObject,
  DEFAULT_VERUS_CHAINID,
  GenericRequest,
  GenericResponse,
  HASH_TYPE_SHA256,
  TESTNET_VERUS_CHAINID,
  VerifiableSignatureData,
} from '../../';

const HEIGHT = 1;
const MESSAGE_HASH = Buffer.alloc(32);
// Opaque public test bytes; these tests check identity/digest preservation, not
// cryptographic signature validity or authorization against a live identity.
const SIGNATURE_BYTES = Buffer.from('aabbcc', 'hex');

const NETWORKS = [
  {
    root: 'VRSC',
    isTestnet: false,
    system: DEFAULT_VERUS_CHAINID,
    alice: 'i5ULg5wze6A1uWGiXSoLjc9KBF1Ea6ZuGd',
    digest: 'bdbdffc60e648902908d736fb2a4b63f657a51d9489900afca10cd74ab31917a',
  },
  {
    root: 'VRSCTEST',
    isTestnet: true,
    system: TESTNET_VERUS_CHAINID,
    alice: 'i5f5njYtso65186mo5WHMkRme9YG6hrZE2',
    digest: '8b75d43a86beaffa34663dbf526e5b9d169c51ab576269328a7113f21f0e16d4',
  },
];
type Network = typeof NETWORKS[number];
type Encoding = 'signer FQN' | 'system FQN' | 'both FQN' | 'explicit addresses' | 'omitted system';
const ENCODINGS: Encoding[] = [
  'signer FQN', 'system FQN', 'both FQN', 'explicit addresses', 'omitted system',
];

// Independent v2 SHA256 preimage from daemon CIdentitySignature::IdentitySignatureHash
// (VerusCoin/src/pbaas/crosschainrpc.cpp): system uint160, LE height, identity
// uint160, CompactSize-prefixed string, message hash. No library address/hash
// helpers are used for the oracle, and the expected addresses are fixed vectors.
function identityDigest(system: string, identity: string, messageHash = MESSAGE_HASH): Buffer {
  const height = Buffer.alloc(4);
  height.writeUInt32LE(HEIGHT);
  return createHash('sha256').update(Buffer.concat([
    decodeBase58Check(system).subarray(1),
    height,
    decodeBase58Check(identity).subarray(1),
    Buffer.from('\x13Verus signed data:\n', 'utf8'),
    messageHash,
  ])).digest();
}

function makeSignature(network: Network, encoding: Encoding = 'both FQN'): VerifiableSignatureData {
  const signerFqn = encoding !== 'system FQN' && encoding !== 'explicit addresses';
  const systemFqn = encoding === 'system FQN' || encoding === 'both FQN';
  const signature = new VerifiableSignatureData({
    version: new BN(1),
    signatureVersion: new BN(2),
    hashType: HASH_TYPE_SHA256,
    isTestnet: network.isTestnet,
    identityID: signerFqn
      ? CompactIAddressObject.fromFQN(`alice.${network.root}@`, network.root)
      : CompactIAddressObject.fromAddress(network.alice, network.root),
    systemID: systemFqn
      ? CompactIAddressObject.fromFQN(network.root, network.root)
      : CompactIAddressObject.fromAddress(network.system, network.root),
    signatureAsVch: Buffer.from(SIGNATURE_BYTES),
  });
  // The constructor always sets FLAG_HAS_SYSTEM. Clear it explicitly to exercise
  // the supported compact wire form that relies on the enclosing network flag.
  if (encoding === 'omitted system') signature.flags = new BN(0);
  return signature;
}

const ENVELOPES = [
  { name: 'request', Constructor: GenericRequest },
  { name: 'response', Constructor: GenericResponse },
];

function makeEnvelope(Constructor: typeof GenericRequest | typeof GenericResponse,
  network: Network, encoding: Encoding = 'both FQN'): GenericRequest | GenericResponse {
  return new Constructor({
    flags: network.isTestnet ? GenericRequest.FLAG_IS_TESTNET : new BN(0),
    createdAt: new BN(1800000000),
    signature: makeSignature(network, encoding),
    details: [Constructor === GenericRequest
      ? new AuthenticationRequestOrdinalVDXFObject()
      : new AuthenticationResponseOrdinalVDXFObject()],
  });
}

function expectSignature(signature: VerifiableSignatureData, network: Network,
  messageHash = MESSAGE_HASH): void {
  expect({
    identity: signature.identityID.toIAddress(),
    system: signature.systemID.toIAddress(),
    digest: signature.getIdentityHash(HEIGHT, messageHash).toString('hex'),
  }).toEqual({
    identity: network.alice,
    system: network.system,
    digest: identityDigest(network.system, network.alice, messageHash).toString('hex'),
  });
}

describe.each(NETWORKS)('$root FQN signature context', network => {
  test('matches the independent fixed SHA256 vector before and after standalone parsing', () => {
    const signature = makeSignature(network);
    expect(identityDigest(network.system, network.alice).toString('hex')).toBe(network.digest);
    expectSignature(signature, network);
    const wire = signature.toBuffer();
    const restored = new VerifiableSignatureData({ isTestnet: network.isTestnet });
    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.toBuffer()).toEqual(wire);
    expect(restored.signatureAsVch).toEqual(SIGNATURE_BYTES);
    expectSignature(restored, network);
  });

  describe.each(ENVELOPES)('$name', ({ Constructor }) => {
    test.each(ENCODINGS)('preserves addresses and signing digest with %s', encoding => {
      const original = makeEnvelope(Constructor, network, encoding);
      const messageHash = original.getRawDataSha256();
      const expectedDigest = identityDigest(network.system, network.alice, messageHash);
      expect(original.getDetailsIdentitySignatureHash(HEIGHT)).toEqual(expectedDigest);
      const wire = original.toBuffer();
      // Exercise nonzero offsets with unrelated bytes on both sides.
      const prefix = Buffer.from('deadbeef', 'hex');
      const framed = Buffer.concat([prefix, wire, Buffer.from('cafebabe', 'hex')]);
      const restored = new Constructor();
      expect(restored.fromBuffer(framed, prefix.length)).toBe(prefix.length + wire.length);
      expect(restored.toBuffer()).toEqual(wire);
      expect(restored.isTestnet()).toBe(network.isTestnet);
      expect(restored.signature.isTestnet).toBe(network.isTestnet);
      expect(restored.signature.identityID.rootSystemName).toBe(network.root);
      expect(restored.signature.hasSystem()).toBe(encoding !== 'omitted system');
      expect(restored.signature.systemID.rootSystemName).toBe(network.root);
      expect(restored.signature.signatureAsVch).toEqual(SIGNATURE_BYTES);
      expect(restored.getRawDataSha256()).toEqual(messageHash);
      expectSignature(restored.signature, network, messageHash);
      expect(restored.getDetailsIdentitySignatureHash(HEIGHT)).toEqual(expectedDigest);
      // Conversion to PBaaS signing data must retain the same resolved IDs.
      const signingData = restored.signature.toSignatureData(messageHash);
      expect(signingData.identityID).toBe(network.alice);
      expect(signingData.systemID).toBe(network.system);
    });
  });

  test('a fresh parser resolves an omitted system from its supplied network context', () => {
    // Literal wire fixture: v1, flags=0, signature v2, SHA256, compact FQN
    // v1/type1/6-byte "alice@", and empty signature. No network is serialized.
    const wire = Buffer.from('01000205010106616c6963654000', 'hex');
    const restored = new VerifiableSignatureData({ isTestnet: network.isTestnet });
    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.hasSystem()).toBe(false);
    expect(restored.toBuffer()).toEqual(wire);
    expectSignature(restored, network);
  });

  test('a parser opting into reuse resolves an omitted system instead of retaining the previous explicit system', () => {
    class RepeatableSignature extends VerifiableSignatureData {
      constructor() {
        super({ isTestnet: network.isTestnet });
        this.allowRepeatedFromBuffer = true;
      }
    }

    const previousNetwork = NETWORKS.find(candidate => candidate.isTestnet !== network.isTestnet);
    const previous = makeSignature(network, 'signer FQN');
    // A testnet envelope may legitimately bind a signature to an explicit
    // nondefault system. A following flags-zero signature must use the default.
    previous.systemID = CompactIAddressObject.fromAddress(previousNetwork.system, network.root);
    const restored = new RepeatableSignature();
    restored.fromBuffer(previous.toBuffer());
    expect(restored.systemID.toIAddress()).toBe(previousNetwork.system);

    const wire = Buffer.from('01000205010106616c6963654000', 'hex');
    expect(restored.fromBuffer(wire)).toBe(wire.length);
    expect(restored.hasSystem()).toBe(false);
    expect(restored.toBuffer()).toEqual(wire);
    expectSignature(restored, network);
  });

});

describe('testnet FQN spellings and transport entry points', () => {
  const network = NETWORKS[1];

  test.each([
    ['alice', 'alice'],
    ['alice@', 'alice@'],
    ['alice.VRSCTEST', 'alice'],
    ['alice.vRsCtEsT@', 'alice@'],
    ['alice.VRSCTEST.', 'alice.VRSCTEST.'],
    ['alice.VRSCTEST.@', 'alice.VRSCTEST.@'],
  ])('preserves the signer for %s (wire name %s)', (name, wireName) => {
    const signature = makeSignature(network);
    signature.identityID = CompactIAddressObject.fromFQN(name, network.root);
    expectSignature(signature, network);
    const restored = new VerifiableSignatureData({ isTestnet: true });
    restored.fromBuffer(signature.toBuffer());
    expect(restored.identityID.address).toBe(wireName);
    expectSignature(restored, network);
  });

  test.each(['QR', 'wallet deeplink'])('preserves FQN signing context through %s', transport => {
    const request = makeEnvelope(GenericRequest, network) as GenericRequest;
    const restored = transport === 'QR'
      ? GenericRequest.fromQrString(request.toQrString())
      : GenericRequest.fromWalletDeeplinkUri(request.toWalletDeeplinkUri());
    expect(restored.toBuffer()).toEqual(request.toBuffer());
    expect(restored.isTestnet()).toBe(true);
    expectSignature(restored.signature, network, request.getRawDataSha256());
  });

  test('standalone FQN wire requires caller-supplied network context', () => {
    const wire = Buffer.from('01000205010106616c6963654000', 'hex');
    const parsers = NETWORKS.map(context => {
      const parsed = new VerifiableSignatureData({ isTestnet: context.isTestnet });
      parsed.fromBuffer(wire);
      expect(parsed.toBuffer()).toEqual(wire);
      expectSignature(parsed, context);
      return parsed;
    });
    expect(parsers[0].identityID.toIAddress()).not.toBe(parsers[1].identityID.toIAddress());
    expect(parsers[0].getIdentityHash(HEIGHT, MESSAGE_HASH))
      .not.toEqual(parsers[1].getIdentityHash(HEIGHT, MESSAGE_HASH));
  });

  test.each(ENVELOPES)('a $name parser opting into reuse follows each envelope network flag', ({ Constructor }) => {
    const Base: new () => GenericEnvelope = Constructor;
    class RepeatableEnvelope extends Base {
      constructor() {
        super();
        this.allowRepeatedFromBuffer = true;
      }
    }

    const restored = new RepeatableEnvelope();
    for (const context of [NETWORKS[0], NETWORKS[1], NETWORKS[0]]) {
      const envelope = makeEnvelope(Constructor, context);
      const wire = envelope.toBuffer();
      expect(restored.fromBuffer(wire)).toBe(wire.length);
      expect(restored.toBuffer()).toEqual(wire);
      expect(restored.isTestnet()).toBe(context.isTestnet);
      expectSignature(restored.signature, context, envelope.getRawDataSha256());
    }
  });
});
