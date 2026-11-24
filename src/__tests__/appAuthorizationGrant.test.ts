import { deriveAppAuthorizationGrantID } from "../pbaas/AppAuthorizationGrant";
import { toBase58Check } from "../utils/address";
import { I_ADDR_VERSION } from "../constants/vdxf";

const address = (n: number) =>
  toBase58Check(Buffer.alloc(20, n), I_ADDR_VERSION);
const user = { systemID: address(1), identityID: address(2) };
const delegate = { systemID: address(3), identityID: address(4) };
const requestHash = Buffer.from(
  Array.from({ length: 32 }, (_, i) => i)
).toString("hex");
const derive = () =>
  deriveAppAuthorizationGrantID(user, delegate, address(5), requestHash);

// Fixed digest vectors were computed independently with Python hashlib.

test("grant ID matches independent SHA-256 vector with decoded address order and literal domain", () => {
  expect(derive()).toBe(
    "abf6108b0f1ac5bc5dc9e7fbe085abbd5092b3ddbe9839e25c21143c363c70a8"
  );
});

test("the delegator inherits the delegate's system unless a distinct system is specified", () => {
  const forDelegatorSystem = (delegatorSystemID: string) =>
    deriveAppAuthorizationGrantID(user, delegate, address(5), requestHash, delegatorSystemID);

  expect(forDelegatorSystem(delegate.systemID)).toBe(derive());
  expect(forDelegatorSystem(address(6))).toBe(
    "dd7d99bfd47b1932a8e760bb6e5a55b1bd1601ca09ab732f9dd7b6e2f85ceda6"
  );
  expect(forDelegatorSystem(address(6))).not.toBe(derive());
  expect(() => forDelegatorSystem(toBase58Check(Buffer.alloc(20), 60))).toThrow();
});

test("user and signer system bindings change the grant", () => {
  expect(
    deriveAppAuthorizationGrantID(
      { ...user, systemID: address(6) },
      delegate,
      address(5),
      requestHash
    )
  ).not.toBe(derive());
  expect(
    deriveAppAuthorizationGrantID(
      user,
      { ...delegate, identityID: address(6) },
      address(5),
      requestHash
    )
  ).not.toBe(derive());
});

test("rejects malformed hashes and non-identity addresses", () => {
  for (const hash of ["", "00", "g".repeat(64), requestHash + "00"]) {
    expect(() =>
      deriveAppAuthorizationGrantID(user, delegate, address(5), hash)
    ).toThrow();
  }

  expect(() =>
    deriveAppAuthorizationGrantID(
      user,
      delegate,
      toBase58Check(Buffer.alloc(20), 60),
      requestHash
    )
  ).toThrow();
});
