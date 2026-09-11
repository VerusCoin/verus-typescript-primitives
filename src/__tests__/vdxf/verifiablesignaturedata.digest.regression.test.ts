import { BN } from "bn.js";
import { HASH_TYPE_SHA256 } from "../../constants/pbaas";
import { CompactIAddressObject } from "../../vdxf/classes/CompactAddressObject";
import {
  CliSignatureData,
  VerifiableSignatureData,
} from "../../vdxf/classes/VerifiableSignatureData";

const SYSTEM_ID = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
const IDENTITY_ID = "i4M7ar436N7wKHgZodjGAWdsBSNjG7cz8s";
const SIGNATURE_HEIGHT = 1;

// Fixed SHA256 vectors independently serialized from VerusCoin ed2be9f45:
// src/pbaas/crosschainrpc.cpp, CIdentitySignature::IdentitySignatureHash (v2).
// Preimage: nonempty metadata vectors, system uint160, LE uint32 height,
// identity uint160, CompactSize-prefixed "Verus signed data:\n", message hash.
// The expected values do not call either library signature implementation.
describe("VerifiableSignatureData daemon digest regressions", () => {
  test("sorts VDXF key names by UTF8 bytes when calculating a v2 SHA256 digest", () => {
    const signature = new VerifiableSignatureData({
      version: new BN(1),
      signatureVersion: new BN(2),
      hashType: new BN(HASH_TYPE_SHA256),
      systemID: CompactIAddressObject.fromAddress(SYSTEM_ID, "VRSCTEST"),
      identityID: CompactIAddressObject.fromAddress(IDENTITY_ID, "VRSCTEST"),
      // U+E000 precedes U+10000 in UTF8 byte order; UTF16 sorts them oppositely.
      // The daemon's sorted vector serializes as 02 03 ee8080 04 f0908080.
      vdxfKeyNames: ["\ue000", "\u{10000}"],
    });

    expect(
      signature.getIdentityHash(SIGNATURE_HEIGHT, Buffer.alloc(32)).toString("hex")
    ).toBe("7402cdcba1fed45bf2f44f6ff0af41ce938505e89ef3677c86acec724141bece");
  });

  test("preserves SHA256 outer CLI bound-hash byte order in the identity digest", () => {
    const messageHash = Buffer.alloc(32, 1);
    const boundHash = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    const cli: CliSignatureData = {
      signaturedata: {
        version: 1,
        systemid: SYSTEM_ID,
        hashtype: HASH_TYPE_SHA256.toNumber(),
        signaturehash: messageHash.toString("hex"),
        identityid: IDENTITY_ID,
        signaturetype: 1,
        signature: "",
        // CSignatureData JSON exposes uint256 GetHex(), unlike the outer CLI.
        boundhashes: ["1f1e1d1c1b1a191817161514131211100f0e0d0c0b0a09080706050403020100"],
      },
      system: "VRSCTEST",
      systemid: SYSTEM_ID,
      hashtype: "sha256",
      hash: messageHash.toString("hex"),
      identity: "endorsetest.VRSCTEST@",
      canonicalname: "endorsetest.vrsctest@",
      address: IDENTITY_ID,
      signatureheight: SIGNATURE_HEIGHT,
      signature: "",
      signatureversion: 2,
      boundhashes: [boundHash],
    };

    // rpcwallet.cpp:1835-1846 and misc.cpp:1483-1494 reverse uint256S bytes
    // for HASH_SHA256, canceling the display-to-uint256 reversal. The outer
    // CLI retains the original input; the hashed vector is 01 000102...1f.
    // This control guards against the audit's retracted endian false positive.
    const signature = VerifiableSignatureData.fromCLIJson(cli, "VRSCTEST");

    expect(
      signature.getIdentityHash(SIGNATURE_HEIGHT, messageHash).toString("hex")
    ).toBe("6c14b0f982db7a54ce466e9a6ec20b7ca3bd9a99946873659d41ffc71a550ea8");
  });
});
