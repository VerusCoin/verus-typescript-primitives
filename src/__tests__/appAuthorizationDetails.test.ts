import { BN } from "bn.js";
import { AppAuthorizationRequestDetails as Request } from "../vdxf/classes/appauthorization/AppAuthorizationRequestDetails";
import { AppAuthorizationResponseDetails as Response } from "../vdxf/classes/appauthorization/AppAuthorizationResponseDetails";
import { CompactIAddressObject } from "../vdxf/classes/CompactAddressObject";
import { SpendableKeyDetails } from "../vdxf/classes/backup/SpendableKeyDetails";
import { toBase58Check } from "../utils/address";
import { I_ADDR_VERSION } from "../constants/vdxf";

const address = (n: number) =>
  toBase58Check(Buffer.alloc(20, n), I_ADDR_VERSION);
const ref = (n: number) => CompactIAddressObject.fromAddress(address(n));
const gift = () =>
  new SpendableKeyDetails({ data: Buffer.from("fixture seed") });
const request = () =>
  new Request({
    gift: gift(),
    offeredIdentities: [
      { role: 1, identity: ref(1) },
      { role: 2, identity: ref(2) },
    ],
  });
const response = (grantID = "ab".repeat(32)) =>
  new Response({
    outcome: 0,
    requestSigningSystemID: address(3),
    delegateID: address(4),
    grantID,
    storageBindings: [
      {
        storageIdentity: ref(1),
        revocationIdentity: ref(2),
        recoveryIdentity: ref(2),
      },
    ],
    grantTransaction: { txid: "00010203".repeat(8), vout: 0xffffffff },
  });

test("request binary and JSON round trips include nested gift", () => {
  const original = request();

  const parsed = new Request();
  expect(parsed.fromBuffer(original.toBuffer())).toBe(original.getByteLength());
  expect(parsed.toJson()).toEqual(original.toJson());
  expect(
    Request.fromJson(JSON.parse(JSON.stringify(original.toJson()))).toBuffer()
  ).toEqual(original.toBuffer());
});

test("response round trips preserve transaction wire byte order and selected bindings", () => {
  const uppercaseGrantID = "AB".repeat(32);
  const original = response(uppercaseGrantID);
  expect(original.grantID).toBe(uppercaseGrantID.toLowerCase());
  const bytes = original.toBuffer();
  expect(bytes.subarray(-36, -4)).toEqual(
    Buffer.from(original.grantTransaction.txid, "hex").reverse()
  );

  const parsed = new Response();
  parsed.fromBuffer(bytes);
  expect(parsed.grantID).toBe(original.grantID);
  expect(parsed.toJson()).toEqual(original.toJson());
  const json = JSON.parse(JSON.stringify(original.toJson()));
  const fromJson = Response.fromJson({ ...json, grantID: uppercaseGrantID });
  expect(fromJson.grantID).toBe(original.grantID);
  expect(fromJson.toBuffer()).toEqual(bytes);
  parsed.validate(true);
});

test("all truncated prefixes and trailing bytes fail", () => {
  for (const [original, construct] of [
    [request(), () => new Request()],
    [response(), () => new Response()],
  ] as const) {
    const bytes = original.toBuffer();

    for (let i = 0; i < bytes.length; i++) {
      expect(() => construct().fromBuffer(bytes.subarray(0, i))).toThrow();
    }
    expect(() =>
      construct().fromBuffer(Buffer.concat([bytes, Buffer.from([0])]))
    ).toThrow();
  }
});

test("role-tagged offers use only I-addresses and reject exact duplicates", () => {
  const value = new Request({
    offeredIdentities: [
      { role: 1, identity: ref(1) },
      { role: 2, identity: ref(1) },
    ],
  });

  // Header: version, flags, count. Each offer: role byte + compact I-address.
  expect(value.toBuffer()).toEqual(
    Buffer.concat([
      Buffer.from([1, 4, 2, 1]),
      ref(1).toBuffer(),
      Buffer.from([2]),
      ref(1).toBuffer(),
    ])
  );

  expect(
    () =>
      new Request({
        offeredIdentities: [
          { role: 1, identity: ref(1) },
          { role: 1, identity: ref(1) },
        ],
      })
  ).toThrow("Duplicate");

  expect(
    () =>
      new Request({
        offeredIdentities: [
          { role: 1, identity: CompactIAddressObject.fromFQN("alice@") },
        ],
      })
  ).toThrow();

  const json = value.toJson();
  expect(() =>
    Request.fromJson({
      ...json,
      offeredIdentities: [
        { ...json.offeredIdentities[0], systemID: address(3) },
      ],
    } as any)
  ).toThrow();
});

test("rejects reserved flags, unknown fields, invalid roles and malformed gifts", () => {
  for (const flags of [8, 16, 256, -1, 1.5]) {
    expect(
      () =>
        new Request({
          flags: Number.isInteger(flags) ? new BN(flags) : (flags as any),
        })
    ).toThrow();
  }
  expect(() => new Request({ permissions: {} } as any)).toThrow();
  expect(() =>
    Request.fromJson({ ...request().toJson(), permissions: {} } as any)
  ).toThrow();
  expect(() => new Request({ flags: new BN(2) })).toThrow();
  expect(() => new Request({ version: new BN(2) })).toThrow();
  expect(() => new Request({ offeredIdentities: [] })).toThrow();
  expect(
    () =>
      new Request({
        offeredIdentities: [{ role: 5, identity: ref(1) }],
      } as any)
  ).toThrow();
  expect(() => new Request().fromBuffer(Buffer.from([1, 4, 252]))).toThrow();
});

test("success requires a grant and failures cannot carry active grant fields", () => {
  const base = { requestSigningSystemID: address(3), delegateID: address(4) };
  expect(() => new Response({ ...base, outcome: 0 })).toThrow();

  for (const outcome of [1, 2, 3, 4]) {
    const value = new Response({ ...base, outcome });

    const parsed = new Response();
    parsed.fromBuffer(value.toBuffer());
    expect(parsed.outcome).toBe(outcome);
    expect(
      () => new Response({ ...base, outcome, grantID: "00".repeat(32) })
    ).toThrow();
  }

  expect(() => new Response({ ...base, outcome: 5 as any })).toThrow();
  expect(() =>
    new Response({ ...base, outcome: 0, grantID: "00".repeat(32) }).validate(
      true
    )
  ).toThrow();
});

test("response bindings encode S, R and C directly without reference flags", () => {
  const value = new Response({
    outcome: 0,
    requestSigningSystemID: address(3),
    delegateID: address(4),
    grantID: "ab".repeat(32),
    storageBindings: [
      {
        storageIdentity: ref(1),
        revocationIdentity: ref(2),
        recoveryIdentity: ref(2),
      },
    ],
  });

  expect(value.toBuffer()).toEqual(
    Buffer.concat([
      Buffer.from([1, 3, 0]), // Version, presence flags, success outcome.
      ref(3).toBuffer(),
      ref(4).toBuffer(),
      Buffer.from("ab".repeat(32), "hex"),
      Buffer.from([1]), // One S/R/C binding.
      ref(1).toBuffer(),
      ref(2).toBuffer(),
      ref(2).toBuffer(),
    ])
  );
});

test.each(["revocationIdentity", "recoveryIdentity"] as const)(
  "response bindings require %s to be independent of every storage identity",
  (role) => {
    const json = response().toJson();
    const [first] = json.storageBindings;
    const second = { ...first, storageIdentity: ref(5).toJson() };

    // Both bindings can share an independent identity for both authority roles.
    expect(() =>
      Response.fromJson({ ...json, storageBindings: [first, second] })
    ).not.toThrow();

    const selfConflict = { ...first, [role]: first.storageIdentity };
    const crossConflict = { ...first, [role]: second.storageIdentity };
    for (const storageBindings of [
      [selfConflict],
      [crossConflict, second],
      [second, crossConflict],
    ]) {
      expect(() => Response.fromJson({ ...json, storageBindings })).toThrow();
    }
  }
);

test("compact identity-address JSON rejects unsupported versions, types and system selectors", () => {
  const json = request().toJson();
  const offer = json.offeredIdentities[0];

  for (const identity of [
    { ...offer.identity, version: 2 },
    { ...offer.identity, version: 1.5 },
    { ...offer.identity, type: 2.5 },
    { ...offer.identity, type: 1 },
    { ...offer.identity, systemID: address(3) },
    { identityID: address(1), systemID: address(3) },
  ]) {
    expect(() =>
      Request.fromJson({
        ...json,
        offeredIdentities: [{ ...offer, identity }],
      } as any)
    ).toThrow();
  }

  const responseJson = response().toJson();
  const binding = responseJson.storageBindings[0];
  expect(() =>
    Response.fromJson({
      ...responseJson,
      storageBindings: [
        {
          ...binding,
          storageIdentity: { ...binding.storageIdentity, systemID: address(3) },
        },
      ],
    } as any)
  ).toThrow();
});

test("request and response codecs accept payloads above the former 256 KiB limit", () => {
  const identity = (index: number) => {
    const hash = Buffer.alloc(20);
    hash.writeUInt32LE(index);

    return CompactIAddressObject.fromAddress(
      toBase58Check(hash, I_ADDR_VERSION)
    );
  };

  const largeRequest = new Request({
    offeredIdentities: Array.from({ length: 12000 }, (_, i) => ({
      role: 1,
      identity: identity(i),
    })),
  });
  const requestBytes = largeRequest.toBuffer();
  expect(requestBytes.length).toBeGreaterThan(256 * 1024);

  const parsedRequest = new Request();
  expect(parsedRequest.fromBuffer(requestBytes)).toBe(requestBytes.length);
  expect(parsedRequest.offeredIdentities.length).toBe(12000);

  const largeResponse = new Response({
    outcome: 0,
    requestSigningSystemID: address(3),
    delegateID: address(4),
    grantID: "ab".repeat(32),
    storageBindings: Array.from({ length: 4000 }, (_, i) => ({
      storageIdentity: identity(i),
      revocationIdentity: ref(2),
      recoveryIdentity: ref(2),
    })),
  });
  const responseBytes = largeResponse.toBuffer();
  expect(responseBytes.length).toBeGreaterThan(256 * 1024);

  const parsedResponse = new Response();
  expect(parsedResponse.fromBuffer(responseBytes)).toBe(responseBytes.length);
  expect(parsedResponse.storageBindings.length).toBe(4000);
});

test("version ranges reject invalid values and unsupported CompactSize versions", () => {
  const base = {
    outcome: 1,
    requestSigningSystemID: address(3),
    delegateID: address(4),
  };

  for (const version of [
    Request.VERSION_INVALID,
    Request.VERSION_LAST.addn(1),
    new BN(-1),
    1.5,
    NaN,
  ]) {
    expect(() => new Request({ version: version as any })).toThrow();
    expect(() => new Response({ ...base, version: version as any })).toThrow();
  }

  // 0xfd 0xfd 0x00 encodes CompactSize 253, which is not currently supported.
  for (const value of [new Request(), new Response(base)]) {
    expect(() => value.fromBuffer(Buffer.from([0xfd, 0xfd, 0x00]))).toThrow();
  }

  expect(new Request().version.eq(Request.VERSION_CURRENT)).toBe(true);
  expect(new Response(base).version.eq(Response.VERSION_CURRENT)).toBe(true);
});

test("BN flags preserve constants, reject high bits and serialize as JSON numbers", () => {
  const value = request();
  expect(BN.isBN(value.version)).toBe(true);
  expect(BN.isBN(value.flags)).toBe(true);
  expect(
    value.flags.eq(Request.FLAG_CONTAINS_GIFT.or(Request.FLAG_CONTAINS_OFFERS))
  ).toBe(true);
  expect(typeof value.toJson().version).toBe("number");
  expect(typeof value.toJson().flags).toBe("number");
  expect(Request.FLAG_CONTAINS_GIFT.toNumber()).toBe(2);
  expect(Request.FLAGS_NONE.isZero()).toBe(true);

  const empty = new Request();
  empty.version.iaddn(1);
  empty.flags.iaddn(1);
  expect(Request.VERSION_CURRENT.toNumber()).toBe(1);
  expect(Request.FLAGS_NONE.isZero()).toBe(true);

  const highFlag = new BN(1).shln(64);
  expect(() => new Request({ flags: highFlag })).toThrow();
  expect(() =>
    Request.fromJson({ ...request().toJson(), flags: 1.5 })
  ).toThrow();
  expect(() =>
    Response.fromJson({ ...response().toJson(), version: 1.5 })
  ).toThrow();
});

test("gift size is client policy and declared lengths remain enforced", () => {
  const original = new Request({
    gift: new SpendableKeyDetails({ data: Buffer.alloc(300 * 1024, 0xab) }),
  });
  const bytes = original.toBuffer();
  const parsed = new Request();
  expect(parsed.fromBuffer(bytes)).toBe(bytes.length);
  expect(parsed.gift.data).toEqual(original.gift.data);
  expect(Request.fromJson(original.toJson()).gift.data).toEqual(
    original.gift.data
  );
  expect(() =>
    new Request().fromBuffer(bytes.subarray(0, bytes.length - 1))
  ).toThrow();
});
