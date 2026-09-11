import { VerusScript } from "../../../pbaas/transaction/VerusScript";

describe('Serializes and deserializes VerusScripts', () => {
  test('(de)serialize a basic identity registration outscript (v2) from daemon', () => {
    const scriptString = "46040300010314a484f66e98c3d787b2ff8854d3ceeb5b61446978150476a348fd730beb2694f54a7114dbf14aa699f9fa150476a348fd730beb2694f54a7114dbf14aa699f9facc4ce304030e0101150476a348fd730beb2694f54a7114dbf14aa699f9fa4c8e010000000000000001143cdad2d09cbc6e164804af104b1f3f56f0d10d78010000001af5b8015c64d39ab44c60ead8317f9f5a9b6c4c0161000076a348fd730beb2694f54a7114dbf14aa699f9fa76a348fd730beb2694f54a7114dbf14aa699f9fa016931943a1979b5e0308a4da1cb62688e6d6433e4501d2c5a474987deee3137144a48978919d7e6a47670501b04030f0101150476a348fd730beb2694f54a7114dbf14aa699f9fa1b0403100101150476a348fd730beb2694f54a7114dbf14aa699f9fa75";
    
    const script = new VerusScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
  });

  test('(de)serialize a basic op return script from daemon', () => {
    const scriptString = "6a44564202000000cd370700003a0700b00ac5745d82c2b2a7be719ebace6d32f9fce209ab9d533d909a9af2020000000414066fd4131869fabb30b440fd499742d9b3f9ef63";
    
    const script = new VerusScript();
    script.fromBuffer(Buffer.from(scriptString, 'hex'));

    expect(script.toBuffer().toString('hex')).toBe(scriptString);
  });
});

describe('VerusScript push boundaries', () => {
  test.each([
    ['direct push with a missing payload byte', '0201'],
    ['PUSHDATA1 with a missing length', '4c'],
    ['PUSHDATA1 with a missing payload byte', '4c0201'],
    ['PUSHDATA2 with a truncated length', '4d01'],
    ['PUSHDATA2 with a missing payload byte', '4d020001'],
    ['PUSHDATA4 with a truncated length', '4e010000'],
    ['PUSHDATA4 with a missing payload byte', '4e0200000001'],
  ])('rejects %s instead of returning an empty script', (_name, hex) => {
    expect(() => new VerusScript().fromBuffer(Buffer.from(hex, 'hex'))).toThrow();
  });

  test.each([
    ['', ''],
    ['51', '51'],
    ['020102', '020102'],
    ['4c0101', '51'],
    ['4d010001', '51'],
    ['4e0100000001', '51'],
  ])('accepts complete script %s and serializes it as %s', (input, output) => {
    const wire = Buffer.from(input, 'hex');
    const script = new VerusScript();

    expect(script.fromBuffer(wire)).toBe(wire.length);
    expect(script.toBuffer().toString('hex')).toBe(output);
  });
});
