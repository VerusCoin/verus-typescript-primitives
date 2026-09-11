import { BN } from "bn.js";
import { IdentityID } from "../../../pbaas/IdentityID";
import { SmartTransactionScript } from "../../../pbaas/transaction/SmartTransactionScript";
import { OptCCParams } from "../../../pbaas/OptCCParams";
import { TxDestination } from "../../../pbaas/TxDestination";
import { UnknownID } from "../../../pbaas/UnknownID";
import { OPS } from "../../../utils/ops";
import { compile } from "../../../utils/script";

const PREV_OUT_DEST = 'iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF';

function getValidParams(): { master: OptCCParams, params: OptCCParams } {
  const destination = new TxDestination(IdentityID.fromAddress(PREV_OUT_DEST));

  return {
    master: new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: [destination]
    }),
    params: new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: [destination]
    })
  };
}

function expectScriptToBeRejected(buffer: Buffer): void {
  const parsed = new SmartTransactionScript();

  expect(() => parsed.fromBuffer(buffer)).toThrow();
}

describe('Serializes and deserializes SmartTransactionScripts', () => {
  test('(de)serialize a basic identity registration outscript (v2) from daemon', () => {
    const scriptString = "46040300010314a484f66e98c3d787b2ff8854d3ceeb5b61446978150476a348fd730beb2694f54a7114dbf14aa699f9fa150476a348fd730beb2694f54a7114dbf14aa699f9facc4ce304030e0101150476a348fd730beb2694f54a7114dbf14aa699f9fa4c8e010000000000000001143cdad2d09cbc6e164804af104b1f3f56f0d10d78010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0161000076a348fd730beb2694f54a7114dbf14aa699f9fa76a348fd730beb2694f54a7114dbf14aa699f9fa016931943a1979b5e0308a4da1cb62688e6d6433e4501d2c5a474987deee3137144a48978919d7e6a47670501b04030f0101150476a348fd730beb2694f54a7114dbf14aa699f9fa1b0403100101150476a348fd730beb2694f54a7114dbf14aa699f9fa75";
    
    const script = new SmartTransactionScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
  });

  test('(de)serialize a basic output script', () => {
    var prevOutDest = PREV_OUT_DEST

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

    const script = new SmartTransactionScript(prevOutMaster, prevOutParams);

    const scriptFromBuf = new SmartTransactionScript();
    scriptFromBuf.fromBuffer(script.toBuffer());

    expect(script.toBuffer().toString('hex')).toBe(scriptFromBuf.toBuffer().toString('hex'));
  });

  test('accepts an index destination in the master parameters', () => {
    const { params } = getValidParams();
    const indexDestination = new TxDestination(
      new UnknownID(Buffer.alloc(20, 1)),
      TxDestination.TYPE_INDEX
    );
    const master = new OptCCParams({
      version: new BN(3),
      evalCode: new BN(0),
      m: new BN(1),
      n: new BN(1),
      destinations: [indexDestination]
    });
    const parsed = new SmartTransactionScript();

    parsed.fromBuffer(new SmartTransactionScript(master, params).toBuffer());

    expect(parsed.masterOptCC.destinations[0].type.eq(TxDestination.TYPE_INDEX)).toBe(true);
  });

  test('rejects a script with a different crypto-condition opcode', () => {
    const { master, params } = getValidParams();
    const malformed = compile([
      master.toChunk(),
      OPS.OP_CHECKSIG,
      params.toChunk(),
      OPS.OP_DROP
    ]);

    expectScriptToBeRejected(malformed);
  });

  test('rejects a script without the terminating OP_DROP', () => {
    const { master, params } = getValidParams();
    const malformed = compile([
      master.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      params.toChunk(),
      OPS.OP_DUP
    ]);

    expectScriptToBeRejected(malformed);
  });

  test('rejects an unbalanced trailing opcode', () => {
    const { master, params } = getValidParams();
    const malformed = compile([
      master.toChunk(),
      OPS.OP_CHECKCRYPTOCONDITION,
      params.toChunk(),
      OPS.OP_DROP,
      OPS.OP_1
    ]);

    expectScriptToBeRejected(malformed);
  });

  test.each(['master', 'params'] as const)(
    'rejects an invalid %s threshold',
    invalidPart => {
      const { master, params } = getValidParams();
      const masterChunk = Buffer.from(master.toChunk());
      const paramsChunk = Buffer.from(params.toChunk());

      // Each chunk begins with PUSH(4), followed by [version, evalCode, m, n].
      // Raise m above n without relying on the serializer to create invalid data.
      if (invalidPart === 'master') masterChunk[3] = 2;
      else paramsChunk[3] = 2;

      const malformed = compile([
        masterChunk,
        OPS.OP_CHECKCRYPTOCONDITION,
        paramsChunk,
        OPS.OP_DROP
      ]);

      expectScriptToBeRejected(malformed);
    }
  );

  test('rejects an unexpected opcode inside OptCCParams', () => {
    const { master, params } = getValidParams();
    const malformedMaster = Buffer.concat([
      master.toChunk(),
      Buffer.from([OPS.OP_DROP])
    ]);
    const malformed = compile([
      malformedMaster,
      OPS.OP_CHECKCRYPTOCONDITION,
      params.toChunk(),
      OPS.OP_DROP
    ]);

    expectScriptToBeRejected(malformed);
  });
});
