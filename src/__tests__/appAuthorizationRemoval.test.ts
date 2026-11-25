import { hashData } from "../utils/hash";
import { HASH_TYPE_BLAKE2B } from "../constants/pbaas";
import { ContentMultiMapRemove } from "../pbaas/ContentMultiMapRemove";
import { toBase58Check } from "../utils/address";
import { I_ADDR_VERSION } from "../constants/vdxf";

// Fixed digest vectors were computed independently with Python hashlib.

test("CMM removal uses personalized BLAKE2b of all original bytes and reversed RPC hex", () => {
  const bytes = Buffer.from(Array.from({ length: 64 }, (_, i) => i));
  const expected =
    "45cc1dee5344925bc04e1c9f03e8ea300ac7c60f9073437536afd175b8a57780";
  expect(hashData(bytes, HASH_TYPE_BLAKE2B.toNumber()).toString("hex")).toBe(
    expected
  );
  const removal = ContentMultiMapRemove.removeStoredValue(
    toBase58Check(Buffer.alloc(20, 1), I_ADDR_VERSION),
    bytes
  );
  expect(removal.toJson().valuehash).toBe(
    Buffer.from(expected, "hex").reverse().toString("hex")
  );
  expect(ContentMultiMapRemove.fromJson(removal.toJson()).toBuffer()).toEqual(
    removal.toBuffer()
  );
  expect(hashData(bytes.subarray(1), HASH_TYPE_BLAKE2B.toNumber())).not.toEqual(
    removal.valueHash
  );
  expect(() =>
    ContentMultiMapRemove.removeStoredValue(
      toBase58Check(Buffer.alloc(20, 1), I_ADDR_VERSION),
      Buffer.alloc(0)
    )
  ).toThrow();
});

test("complete encrypted-descriptor wrapper matches the daemon's native hashing calls", () => {
  // Native libsodium init_salt_personal/update/final vector using the exact parameters
  // in VerusCoin/src/hash.h:CBLAKE2bWriter. CMM hashes raw stored bytes (identity.cpp).
  const stored = Buffer.from(
    "08a2ebb2c55f83a8e2a426a53320ed4d42124f4d0143010140000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
    "hex"
  );
  const expected = Buffer.from(
    "f78a3e70788487d60ed6e9f2d22eaf01cef7a1c86c06c33caf97b895d2f45427",
    "hex"
  );
  const removal = ContentMultiMapRemove.removeStoredValue(
    toBase58Check(Buffer.alloc(20, 1), I_ADDR_VERSION),
    stored
  );

  expect(
    removal.action.eq(ContentMultiMapRemove.ACTION_REMOVE_ALL_KEYVALUE)
  ).toBe(true);
  expect(removal.valueHash).toEqual(expected);
  expect(removal.toBuffer().subarray(-32)).toEqual(expected);
  expect(removal.toJson().valuehash).toBe(
    Buffer.from(expected).reverse().toString("hex")
  );
});
