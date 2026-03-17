import { BN } from "bn.js";
import { IdentityID } from "../../pbaas/IdentityID";
import { Identity } from "../../pbaas/Identity";
import { OptCCParams } from "../../pbaas/OptCCParams";
import { TxDestination } from "../../pbaas/TxDestination";
import { compile, decompile } from "../../utils/script";
import { OPS } from "../../utils/ops";
import { EVALS } from "../../utils/evals";
import { KeyID } from "../../pbaas/KeyID";
import { toIAddress } from "../../utils/address";

describe('Serializes and deserializes TxDestination variants', () => {
  test('(de)serialize a basic OptCCParams class to/from a chunk with a tx destination', () => {
    var prevOutDest = 'iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF'

    const params = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: [new TxDestination(IdentityID.fromAddress(prevOutDest))]
    })

    const paramFromChunk = OptCCParams.fromChunk(params.toChunk())

    expect(paramFromChunk.toBuffer().toString('hex')).toBe(params.toBuffer().toString('hex'));
  });

  test('(de)serialize a basic OptCCParams class to/from a chunk without a tx destination', () => {
    var prevOutDest = 'iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF'

    const params = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: []
    })

    const paramFromChunk = OptCCParams.fromChunk(params.toChunk())

    expect(paramFromChunk.toBuffer().toString('hex')).toBe(params.toBuffer().toString('hex'));
  });

  test('deserialize a valid OptCCParams chunk', () => {
    var optcc = '04030001011504e763c569b60cfc702488e1ff5d8764acd9a56e44';

    const params = OptCCParams.fromChunk(Buffer.from(optcc, 'hex'));

    expect(params.destinations.length).toBe(1);
    expect(params.destinations[0].toAddress()).toBe("iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF");

    expect(params.vData.length).toBe(0);

    expect(params.version.toNumber()).toBe(3);
    expect(params.evalCode.toNumber()).toBe(0);
    expect(params.m.toNumber()).toBe(1);
    expect(params.n.toNumber()).toBe(1);

    expect(params.toChunk().toString('hex')).toBe(optcc);
  });

  test('(de)serialize a basic output script', () => {
    var prevOutDest = 'iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF'

    const prevOutMaster = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(0),
      n: new BN(0)
    })
    const prevOutParams = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: [new TxDestination(IdentityID.fromAddress(prevOutDest))]
    })

    const prevOutputScript = compile([
      prevOutMaster.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      prevOutParams.toChunk(),
      OPS.OP_DROP
    ]);

    const decomp = decompile(prevOutputScript);

    expect(OptCCParams.fromChunk(decomp[0] as Buffer).toBuffer().toString('hex')).toBe(prevOutMaster.toBuffer().toString('hex'));
    expect(OptCCParams.fromChunk(decomp[2] as Buffer).toBuffer().toString('hex')).toBe(prevOutParams.toBuffer().toString('hex'));
  });

  test('(de)serialize a basic identity registration outscript (v2)', () => {
    const iaddr = "i4NpJp1vqrXgDvSNBXkNYvTR1VF2HMkeDA"
    const outscript = "470403000103150409e3b761a1ba45d349a1e224f80cd3c209f3516b150409e3b761a1ba45d349a1e224f80cd3c209f3516b150409e3b761a1ba45d349a1e224f80cd3c209f3516bcc4d670104030e0101150409e3b761a1ba45d349a1e224f80cd3c209f3516b4d1101020000000000000001144f646be015a78301ca59996dd8be2bfd43e32900010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c046d696b6501cf19fddae8aa266c8d0d4807196681666cfd4562906898c60c12cb3821d8cb316658891b1204efad89fde8ff605823da45655ff101cf19fddae8aa266c8d0d4807196681666cfd4562906898c60c12cb3821d8cb316658891b1204efad89fde8ff605823da45655ff109e3b761a1ba45d349a1e224f80cd3c209f3516b09e3b761a1ba45d349a1e224f80cd3c209f3516b014347dcfa8db8b018669ed910ae5d09fc39e971add77c11e51a2260f13079463998dd1c3361d78b0df7c4f11af5b8015c64d39ab44c60ead8317f9f5a9b6c4c000000001b04030f0101150409e3b761a1ba45d349a1e224f80cd3c209f3516b1b0403100101150409e3b761a1ba45d349a1e224f80cd3c209f3516b75"

    const decomp = decompile(Buffer.from(outscript, 'hex'));

    const outMaster = OptCCParams.fromChunk(decomp[0] as Buffer);
    const outParams = OptCCParams.fromChunk(decomp[2] as Buffer);

    const identity = new Identity();
    identity.fromBuffer(outParams.getParamObject()!)

    const outParams2 = OptCCParams.fromChunk(outParams.vData[1]);
    const outParams3 = OptCCParams.fromChunk(outParams.vData[2]);

    expect(outParams2.destinations[0].toAddress()).toBe(identity.revocationAuthority.toAddress());
    expect(outParams3.destinations[0].toAddress()).toBe(identity.recoveryAuthority.toAddress());

    const contentmap = new Map();
    contentmap.set("iNMaSiS33Mu7SKDkcVY9UrYHu2DcSWxfhz", Buffer.from("906898c60c12cb3821d8cb316658891b1204efad89fde8ff605823da45655ff1", 'hex'));

    const masterToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_NONE),
      m: new BN(1),
      n: new BN(3),
      destinations: [
        new TxDestination(IdentityID.fromAddress(iaddr)),
        new TxDestination(IdentityID.fromAddress(iaddr)),
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: []
    })
    const paramsToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_IDENTITY_PRIMARY),
      m: new BN(1),
      n: new BN(1),
      destinations: [
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: [
        new Identity({
          version: new BN(2),
          flags: new BN(0),
          contentMap: contentmap,
          primaryAddresses: [KeyID.fromAddress("RGWym55BkmCXAUnM6eJkG7geWfzo62xFrP")],
          minSigs: new BN(1),
          parent: IdentityID.fromAddress(toIAddress("VRSC")),
          systemId: IdentityID.fromAddress(toIAddress("VRSC")),
          name: 'mike',
          revocationAuthority: IdentityID.fromAddress(iaddr),
          recoveryAuthority: IdentityID.fromAddress(iaddr),
          privateAddresses: identity.privateAddresses,
          unlockAfter: new BN(0)
        }).toBuffer(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_REVOKE),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_RECOVER),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk()
      ]
    });

    const prevOutScript = compile([
      masterToBuf.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      paramsToBuf.toChunk(),
      OPS.OP_DROP
    ]);

    expect(prevOutScript.toString('hex')).toBe(outscript);
  });

  test('(de)serialize a basic identity registration outscript (v1)', () => {
    const iaddr = "iEHpmxiynXmwZKNgMm7BpXWP3EqCJt663q"
    const outscript = "46040300010314a484f66e98c3d787b2ff8854d3ceeb5b61446978150476a348fd730beb2694f54a7114dbf14aa699f9fa150476a348fd730beb2694f54a7114dbf14aa699f9facc4ce304030e0101150476a348fd730beb2694f54a7114dbf14aa699f9fa4c8e010000000000000001143cdad2d09cbc6e164804af104b1f3f56f0d10d78010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0161000076a348fd730beb2694f54a7114dbf14aa699f9fa76a348fd730beb2694f54a7114dbf14aa699f9fa016931943a1979b5e0308a4da1cb62688e6d6433e4501d2c5a474987deee3137144a48978919d7e6a47670501b04030f0101150476a348fd730beb2694f54a7114dbf14aa699f9fa1b0403100101150476a348fd730beb2694f54a7114dbf14aa699f9fa75"

    const decomp = decompile(Buffer.from(outscript, 'hex'));

    const outMaster = OptCCParams.fromChunk(decomp[0] as Buffer);
    const outParams = OptCCParams.fromChunk(decomp[2] as Buffer);

    const identity = new Identity();
    identity.fromBuffer(outParams.getParamObject()!);

    const outParams2 = OptCCParams.fromChunk(outParams.vData[1]);
    const outParams3 = OptCCParams.fromChunk(outParams.vData[2]);

    expect(outParams2.destinations[0].toAddress()).toBe(identity.revocationAuthority.toAddress());
    expect(outParams3.destinations[0].toAddress()).toBe(identity.recoveryAuthority.toAddress());

    const contentmap = new Map();

    const masterToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_NONE),
      m: new BN(1),
      n: new BN(3),
      destinations: [
        new TxDestination(KeyID.fromAddress("RQH6BP5HcmR8jxvsBMk6aEFzbjBYBU826p")),
        new TxDestination(IdentityID.fromAddress(iaddr)),
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: []
    })
    const paramsToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_IDENTITY_PRIMARY),
      m: new BN(1),
      n: new BN(1),
      destinations: [
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: [
        new Identity({
          version: new BN(1),
          flags: new BN(0),
          contentMap: contentmap,
          primaryAddresses: [KeyID.fromAddress("REpxm9bCLMiHRNVPA9unPBWixie7uHFA5C")],
          minSigs: new BN(1),
          parent: IdentityID.fromAddress(toIAddress("VRSC")),
          systemId: IdentityID.fromAddress(toIAddress("VRSC")),
          name: 'a',
          revocationAuthority: IdentityID.fromAddress(iaddr),
          recoveryAuthority: IdentityID.fromAddress(iaddr),
          privateAddresses: identity.privateAddresses,
          unlockAfter: new BN(0)
        }).toBuffer(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_REVOKE),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_RECOVER),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk()
      ]
    });

    const prevOutScript = compile([
      masterToBuf.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      paramsToBuf.toChunk(),
      OPS.OP_DROP
    ]);

    expect(prevOutScript.toString('hex')).toBe(outscript);
  });

  test('(de)serialize a basic identity registration outscript (v3)', () => {
    const iaddr = "i5Se1kEvXtc2A3B4JnQvryCnDF4wfqxmYE"
    const outscript = "47040300010315041594e9abc769e5b872c741ab403208e68d292a3115041594e9abc769e5b872c741ab403208e68d292a3115041594e9abc769e5b872c741ab403208e68d292a31cc4cd004030e010115041594e9abc769e5b872c741ab403208e68d292a314c7b03000000000000000114d5b1e45496078876605585be584f1bd0cc8a3d8701000000bd4b2b0e81c6761723fb3ec1274260ee3c25058e016100001594e9abc769e5b872c741ab403208e68d292a311594e9abc769e5b872c741ab403208e68d292a31001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c000000001b04030f010115041594e9abc769e5b872c741ab403208e68d292a311b040310010115041594e9abc769e5b872c741ab403208e68d292a3175"

    const decomp = decompile(Buffer.from(outscript, 'hex'));

    const outMaster = OptCCParams.fromChunk(decomp[0] as Buffer);
    const outParams = OptCCParams.fromChunk(decomp[2] as Buffer);

    const identity = new Identity();
    identity.fromBuffer(outParams.getParamObject()!);

    const outParams2 = OptCCParams.fromChunk(outParams.vData[1]);
    const outParams3 = OptCCParams.fromChunk(outParams.vData[2]);

    expect(outParams2.destinations[0].toAddress()).toBe(identity.revocationAuthority.toAddress());
    expect(outParams3.destinations[0].toAddress()).toBe(identity.recoveryAuthority.toAddress());

    const contentmap = new Map();

    const masterToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_NONE),
      m: new BN(1),
      n: new BN(3),
      destinations: [
        new TxDestination(IdentityID.fromAddress(iaddr)),
        new TxDestination(IdentityID.fromAddress(iaddr)),
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: []
    })
    const paramsToBuf = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(EVALS.EVAL_IDENTITY_PRIMARY),
      m: new BN(1),
      n: new BN(1),
      destinations: [
        new TxDestination(IdentityID.fromAddress(iaddr))
      ],
      vData: [
        new Identity({
          version: new BN(3),
          flags: new BN(0),
          contentMap: contentmap,
          primaryAddresses: [KeyID.fromAddress("RUm77XHPni9KxsppF6B5geJ83cM4ZR1TPT")],
          minSigs: new BN(1),
          parent: IdentityID.fromAddress("iLjRC7LcFiwgPxvNP421TY1CPAX4XAMnhX"),
          systemId: IdentityID.fromAddress(toIAddress("VRSC")),
          name: 'a',
          revocationAuthority: IdentityID.fromAddress(iaddr),
          recoveryAuthority: IdentityID.fromAddress(iaddr),
          privateAddresses: identity.privateAddresses,
          unlockAfter: new BN(0)
        }).toBuffer(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_REVOKE),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk(),
        new OptCCParams({
          version: new BN(3),
          evalCode: new BN(EVALS.EVAL_IDENTITY_RECOVER),
          m: new BN(1),
          n: new BN(1),
          destinations: [
            new TxDestination(IdentityID.fromAddress(iaddr))
          ],
          vData: []
        }).toChunk()
      ]
    });

    const prevOutScript = compile([
      masterToBuf.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      paramsToBuf.toChunk(),
      OPS.OP_DROP
    ]);

    expect(prevOutScript.toString('hex')).toBe(outscript);
  });
});