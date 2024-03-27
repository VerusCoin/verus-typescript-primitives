import { BN } from "bn.js";
import { CurrencyValueMap } from "../../pbaas/CurrencyValueMap";
import { TokenOutput, VERSION_MULTIVALUE } from "../../pbaas/TokenOutput";
import { BigNumber } from "../../utils/types/BigNumber";

describe('Serializes and deserializes token output properly', () => {
  test('multivalue version 1', async () => {
    const multivalue_vdata = "86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c009008abfbd8080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d0500000000"
    const out_frombuf = new TokenOutput()
    out_frombuf.fromBuffer(Buffer.from(multivalue_vdata, 'hex'))

    expect(out_frombuf.reserve_values.value_map.get("iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM")!.toString()).toBe("9728028248208")
    expect(out_frombuf.reserve_values.value_map.get("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")!.toString()).toBe("90000000")

    const to_outbuf = new TokenOutput({
      values: new CurrencyValueMap({
        value_map: new Map<string, BigNumber>([
          ["iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM", new BN("9728028248208", 10)],
          ["iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm", new BN("90000000", 10)]
        ]),
        multivalue: true
      }),
      version: new BN(1, 10).xor(VERSION_MULTIVALUE)
    })

    expect(to_outbuf.toBuffer().toString('hex')).toBe(multivalue_vdata)
  });

  test('non-multivalue version 1', async () => {
    const nonmultivalue_vdata = "01848374dd2a47335f0252c8caa066b94de4bf800f83e1ac00"
    const out_frombuf = new TokenOutput()
    out_frombuf.fromBuffer(Buffer.from(nonmultivalue_vdata, 'hex'))

    expect(out_frombuf.reserve_values.value_map.get("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")!.toString()).toBe("10000000")

    const to_outbuf = new TokenOutput({
      values: new CurrencyValueMap({
        value_map: new Map<string, BigNumber>([
          ["iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm", new BN("10000000", 10)]
        ])
      }),
      version: new BN(1, 10)
    })

    expect(to_outbuf.toBuffer().toString('hex')).toBe(nonmultivalue_vdata)
  });
});
