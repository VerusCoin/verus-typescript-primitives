import { BN } from "bn.js";
import { PRINCIPAL_DEFAULT_FLAGS, PRINCIPAL_VERSION_CURRENT, Principal } from "../../pbaas/Principal";
import { KeyID } from "../../pbaas/KeyID";
import { fromBase58Check } from "../../utils/address";

describe('Serializes and deserializes Principal', () => {
  test('(de)serialize Principal with 2 primary addrs and minsig 1', () => {
    const p = new Principal({
      version: PRINCIPAL_VERSION_CURRENT,
      flags: PRINCIPAL_DEFAULT_FLAGS,
      minSigs: new BN(1),
      primaryAddresses: [
        KeyID.fromAddress("RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"),
        KeyID.fromAddress("RP4Qct9197i5vrS11qHVtdyRRoAHVNJS47")
      ]
    });
    const pFromBuf = new Principal();

    pFromBuf.fromBuffer(p.toBuffer())

    expect(pFromBuf.toBuffer().toString('hex')).toBe(p.toBuffer().toString('hex'))
  });
});