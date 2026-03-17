import { BN } from "bn.js";
import { IdentityID } from "../../../pbaas/IdentityID";
import { SmartTransactionScript } from "../../../pbaas/transaction/SmartTransactionScript";
import { OptCCParams } from "../../../pbaas/OptCCParams";
import { TxDestination } from "../../../pbaas/TxDestination";

describe('Serializes and deserializes SmartTransactionScripts', () => {
  test('(de)serialize a basic identity registration outscript (v2) from daemon', () => {
    const scriptString = "46040300010314a484f66e98c3d787b2ff8854d3ceeb5b61446978150476a348fd730beb2694f54a7114dbf14aa699f9fa150476a348fd730beb2694f54a7114dbf14aa699f9facc4ce304030e0101150476a348fd730beb2694f54a7114dbf14aa699f9fa4c8e010000000000000001143cdad2d09cbc6e164804af104b1f3f56f0d10d78010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0161000076a348fd730beb2694f54a7114dbf14aa699f9fa76a348fd730beb2694f54a7114dbf14aa699f9fa016931943a1979b5e0308a4da1cb62688e6d6433e4501d2c5a474987deee3137144a48978919d7e6a47670501b04030f0101150476a348fd730beb2694f54a7114dbf14aa699f9fa1b0403100101150476a348fd730beb2694f54a7114dbf14aa699f9fa75";
    
    const script = new SmartTransactionScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
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

    const script = new SmartTransactionScript(prevOutMaster, prevOutParams);

    const scriptFromBuf = new SmartTransactionScript();
    scriptFromBuf.fromBuffer(script.toBuffer());

    expect(script.toBuffer().toString('hex')).toBe(scriptFromBuf.toBuffer().toString('hex'));
  });
});