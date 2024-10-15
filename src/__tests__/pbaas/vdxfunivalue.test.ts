import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { KeyID } from "../../pbaas/KeyID";
import { fromBase58Check } from "../../utils/address";
import { VDXF_UNI_VALUE_VERSION_CURRENT, VdxfUniValue } from "../../pbaas/VdxfUniValue";
import { DATA_TYPE_STRING, VERUSPAY_INVOICE_VDXF_KEY } from "../../vdxf";

describe('Encodes and decodes VdxfUniValue', () => {
  test('encode/decode VdxfUniValue with string data', () => {
    const values = new Map();
    values.set(DATA_TYPE_STRING.vdxfid, "Test String 123454321");

    const v = new VdxfUniValue({
      values,
      version: VDXF_UNI_VALUE_VERSION_CURRENT
    });

    const vFromBuf = new VdxfUniValue();

    vFromBuf.fromBuffer(v.toBuffer(), 0);

    expect(vFromBuf.toBuffer().toString('hex')).toBe(v.toBuffer().toString('hex'));
    expect(VdxfUniValue.fromJson(v.toJson()).toBuffer().toString('hex')).toBe(vFromBuf.toBuffer().toString('hex'));
  });

  test('fail to encode/decode VdxfUniValue with unknown data', () => {
    const values = new Map();
    values.set(VERUSPAY_INVOICE_VDXF_KEY.vdxfid, Buffer.alloc(20));

    const v = new VdxfUniValue({
      values,
      version: VDXF_UNI_VALUE_VERSION_CURRENT
    });

    const vFromBuf = new VdxfUniValue();

    expect(() => vFromBuf.fromBuffer(v.toBuffer(), 0)).toThrowError();
  });
});