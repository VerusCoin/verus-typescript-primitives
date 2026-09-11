import { BN } from "bn.js";
import { CurrencyValueMap } from "../../pbaas/CurrencyValueMap";
import {
  TokenOutput,
  TOKEN_OUTPUT_VERSION_CURRENT,
  TOKEN_OUTPUT_VERSION_MULTIVALUE
} from "../../pbaas/TokenOutput";
import { BigNumber } from "../../utils/types/BigNumber";

// Canonical CTokenOutput bytes from the daemon: flagged version, count, then sorted ID/int64 pairs.
const MULTIVALUE_VDATA = "86fefeff010275939018c507ed9cf366d309d4614b2e43ca3c009008abfbd8080000848374dd2a47335f0252c8caa066b94de4bf800f804a5d0500000000";
const FIRST_CURRENCY = "iECDGNNufPkSa9aHfbnQUjvhRN6YGR8eKM";
const SECOND_CURRENCY = "iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm";

function twoCurrencyValueMap(multivalue: boolean = false) {
  return new CurrencyValueMap({
    valueMap: new Map<string, BigNumber>([
      [FIRST_CURRENCY, new BN("9728028248208", 10)],
      [SECOND_CURRENCY, new BN("90000000", 10)]
    ]),
    multivalue
  });
}

describe('Serializes and deserializes token output properly', () => {
  test('multivalue version 1', async () => {
    const out_frombuf = new TokenOutput()
    out_frombuf.fromBuffer(Buffer.from(MULTIVALUE_VDATA, 'hex'))

    expect(out_frombuf.reserveValues.valueMap.get(FIRST_CURRENCY)!.toString()).toBe("9728028248208")
    expect(out_frombuf.reserveValues.valueMap.get(SECOND_CURRENCY)!.toString()).toBe("90000000")

    const to_outbuf = new TokenOutput({
      values: twoCurrencyValueMap(true),
      version: new BN(1, 10).xor(TOKEN_OUTPUT_VERSION_MULTIVALUE)
    })

    expect(to_outbuf.toBuffer().toString('hex')).toBe(MULTIVALUE_VDATA)
  });

  test('derives daemon-compatible multivalue encoding from map cardinality', () => {
    const output = new TokenOutput({
      values: twoCurrencyValueMap(),
      version: TOKEN_OUTPUT_VERSION_CURRENT.clone()
    });

    expect(output.toBuffer().toString('hex')).toBe(MULTIVALUE_VDATA);
  });

  test('round-trips every currency in a naturally constructed multivalue output', () => {
    const output = new TokenOutput({
      values: twoCurrencyValueMap(),
      version: TOKEN_OUTPUT_VERSION_CURRENT.clone()
    });
    const encoded = output.toBuffer();
    const decoded = new TokenOutput();
    const bytesRead = decoded.fromBuffer(encoded);

    expect({
      bytesRead,
      encodedLength: encoded.length,
      mapSize: decoded.reserveValues.valueMap.size,
      firstValue: decoded.reserveValues.valueMap.get(FIRST_CURRENCY)?.toString(10),
      secondValue: decoded.reserveValues.valueMap.get(SECOND_CURRENCY)?.toString(10)
    }).toStrictEqual({
      bytesRead: encoded.length,
      encodedLength: encoded.length,
      mapSize: 2,
      firstValue: "9728028248208",
      secondValue: "90000000"
    });
  });

  test('normalizes the wire-only multivalue flag after parsing', () => {
    const encoded = Buffer.from(MULTIVALUE_VDATA, 'hex');
    const decoded = new TokenOutput();
    const bytesRead = decoded.fromBuffer(encoded);

    expect({
      bytesRead,
      version: decoded.getVersion().toString(16),
      valid: decoded.isValid()
    }).toStrictEqual({
      bytesRead: encoded.length,
      version: TOKEN_OUTPUT_VERSION_CURRENT.toString(16),
      valid: true
    });
  });

  test('non-multivalue version 1', async () => {
    const nonmultivalue_vdata = "01848374dd2a47335f0252c8caa066b94de4bf800f83e1ac00"
    const out_frombuf = new TokenOutput()
    out_frombuf.fromBuffer(Buffer.from(nonmultivalue_vdata, 'hex'))

    expect(out_frombuf.reserveValues.valueMap.get("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm")!.toString()).toBe("10000000")

    const to_outbuf = new TokenOutput({
      values: new CurrencyValueMap({
        valueMap: new Map<string, BigNumber>([
          ["iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm", new BN("10000000", 10)]
        ])
      }),
      version: new BN(1, 10)
    })

    expect(to_outbuf.toBuffer().toString('hex')).toBe(nonmultivalue_vdata)
  });
});
