import { I_ADDR_VERSION, X_ADDR_VERSION } from "../../constants/vdxf";
import { fromBase58Check, fqnToAddress, fqnToParentAddress, fqnToParentFqn, getDataKey, nameAndParentAddrToIAddr, toBase58Check, toIAddress, toXAddress } from "../../utils/address";
import { DATA_TYPE_DEFINEDKEY, IDENTITY_UPDATE_REQUEST_VDXF_KEY, VERUSPAY_INVOICE_VDXF_KEY, WALLET_VDXF_KEY } from "../../vdxf";

describe("toBase58Check", () => {
  test.each([
    [0x00, "112D2adLM3UKy4Z4giRbReR6gjWuvHUqB"],
    [I_ADDR_VERSION, "i3UYe6z1kkJqkBHPZUgw4DQfJ91jRhPDq5"],
    [0xff, "2mcBqHib6PMCtsVceJfehFQ42bKS4EyETmf"],
    [0x0100, "2n1XSGptP6XfmgvkjL5z1jXKpDpgzuYijFX"],
    [0x1cb8, "t1HsdDMzmJfq4vc7T17XYjEkLMLvbgM1fCi"],
    [0xffff, "8qeuudzJeVe4oE2MFn1yBnrNGgyJN9z5EJic"],
  ])("preserves known encoding for version %i", (version, expected) => {
    const hash = Buffer.from("000102030405060708090a0b0c0d0e0f10111213", "hex");

    expect(toBase58Check(hash, version)).toBe(expected);
    expect(fromBase58Check(expected)).toEqual({ version, hash });
  });

  describe.each([I_ADDR_VERSION, 0x1cb8])("version %i", (version) => {
    test.each([0, 1, 19, 21, 32])("rejects a %i-byte hash", (length) => {
      expect(() => toBase58Check(Buffer.alloc(length, 0xab), version)).toThrow(
        new TypeError("Expected a 20-byte hash Buffer")
      );
    });

    test.each([
      undefined, null, "00".repeat(20), new Uint8Array(20), Array(20).fill(0),
      { length: 20, copy: () => 0 },
    ])("rejects non-Buffer hash %p", (hash) => {
      expect(() => toBase58Check(hash as unknown as Buffer, version)).toThrow(
        new TypeError("Expected a 20-byte hash Buffer")
      );
    });

    test.each([0x00, 0xff])("round-trips a 20-byte hash filled with %i", (fill) => {
      const hash = Buffer.alloc(20, fill);

      expect(fromBase58Check(toBase58Check(hash, version))).toEqual({ version, hash });
    });
  });
});

describe("FQN component normalization", () => {
  // The daemon truncates each component to 64 UTF-8 bytes before validating it.
  const asciiName = "a".repeat(64);
  const asciiAddress = "iKSi5kxenahj44LqTzrC7Fv6HqEKqJtWdE";
  const unicodeName = "é".repeat(32);
  const unicodeAddress = "iPKUF1So8Ajwp9JZzKKBz4VH78Cf8fv34A";

  test.each([
    [asciiName, asciiAddress],
    [asciiName + "a", asciiAddress],
    [asciiName + " ", asciiAddress],
    [unicodeName, unicodeAddress],
    [unicodeName + "é", unicodeAddress],
    ["\u00a0alice", "iDwuAJpsrFYuk11Xy6hxNTLx6xFbqMvaYB"],
    ["alice\u200d", "iPXJvK2wsJQ47bkPTZhBKuzqaHTvfnGfMU"],
  ])("normalizes %s without changing the address version", (name, expected) => {
    expect(toIAddress(name + ".")).toBe(expected);
    expect(fqnToAddress(name + ".")).toBe(expected);

    const expectedX = toBase58Check(fromBase58Check(expected).hash, X_ADDR_VERSION);
    expect(toXAddress(name + ".")).toBe(expectedX);
    expect(fqnToAddress(name + ".", "", X_ADDR_VERSION)).toBe(expectedX);
  });

  test.each([
    [asciiName + "a", asciiName, asciiAddress],
    [unicodeName + "é", unicodeName, unicodeAddress],
  ])("normalizes parent and implicit root %s", (name, normalized, parentAddress) => {
    const childAddress = nameAndParentAddrToIAddr("child", parentAddress);

    expect(toIAddress(`child.${name}.`)).toBe(childAddress);
    expect(fqnToParentAddress(`child.${name}.`)).toBe(parentAddress);
    expect(fqnToParentFqn(`child.${name}.`)).toBe(normalized);
    expect(toIAddress("child@", name)).toBe(childAddress);
    expect(fqnToParentAddress("child@", name)).toBe(parentAddress);
    expect(fqnToParentFqn("child@", name)).toBe(normalized);
  });

  test("normalizes every ancestor in a multi-level name", () => {
    const parentAddress = nameAndParentAddrToIAddr(asciiName, unicodeAddress);
    const fqn = `child.${asciiName}a.${unicodeName}é.@`;

    expect(toIAddress(fqn)).toBe(nameAndParentAddrToIAddr("child", parentAddress));
    expect(fqnToParentAddress(fqn)).toBe(parentAddress);
    expect(fqnToParentFqn(fqn)).toBe(`${asciiName}.${unicodeName}`);
  });

  test.each([
    " alice", "alice ", "a".repeat(63) + " a",
    "a" + "é".repeat(32), "a".repeat(62) + "€", "a".repeat(61) + "😀",
  ])("rejects invalid component %s in any position", (component) => {
    const inputs: [string, string][] = [
      [`${component}.parent.`, ""],
      [`child.${component}.`, ""],
      ["child", component],
    ];

    for (const [fqn, root] of inputs) {
      for (const helper of [fqnToAddress, toIAddress, toXAddress, fqnToParentAddress, fqnToParentFqn]) {
        expect(() => helper(fqn, root)).toThrow("Invalid name");
      }
    }
  });

  test.each([".", ".@"])("preserves explicit root suffix %s", (suffix) => {
    expect(toIAddress(asciiName + "a" + suffix, "vrsc")).toBe(asciiAddress);
    expect(fqnToParentAddress(asciiName + "a" + suffix, "vrsc")).toBeNull();
  });

  test("selects the implicit root before truncating components", () => {
    const expected = nameAndParentAddrToIAddr(asciiName, asciiAddress);

    expect(toIAddress(asciiName + "a", asciiName)).toBe(expected);
    expect(fqnToParentFqn(asciiName + "a", asciiName)).toBe(asciiName);
  });
});

describe('Address tests', () => {
  test('toIAddress tests', async () => {
    expect(toIAddress("VRSCTEST")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(toIAddress("Andromeda.VRSCTEST")).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu");
    expect(toIAddress("service.VRSCTEST@")).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm");
    expect(toIAddress("VRSC")).toBe("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
    expect(toIAddress("VRSC.@")).toBe("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
    expect(toIAddress("The Verus Coin Foundation.VRSC@")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
    expect(toIAddress("The Verus Coin Foundation.VRSC")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
    expect(toIAddress("Test.VRSC-BTC.VRSCTEST@")).toBe("i9PCGgRJiaRvxbgZ8T5dd33qjFP4NVJvZm");
    expect(toIAddress("Test.VRSC-BTC@", "VRSCTEST")).toBe("i9PCGgRJiaRvxbgZ8T5dd33qjFP4NVJvZm");
    expect(toIAddress("The Verus Coin Foundation@", "VRSC")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
    expect(toIAddress("Ⓐ.VRSC")).toBe("iKaSEU4KPrKahpemwHLoQVLPUof6fSE1uk");
    expect(toIAddress("Ⓐtest.VRSC@")).toBe("iENnjC8BaDqjEWYQGxhEZuDeWeFQ5qfjGn");
    expect(toIAddress("The Verus Coin Foundation.vrsc")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
    expect(toIAddress("The Verus Coin Foundation.vrsc", "VRSC")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
  });

  test.each(["foo@@", "foo..bar"])("rejects malformed name %s", (name) => {
    expect(() => toIAddress(name)).toThrow("Invalid name");
    expect(() => fqnToParentAddress(name)).toThrow("Invalid name");
  });

  test('nameAndParentAddrToIAddr tests', async () => {
    expect(nameAndParentAddrToIAddr("VRSCTEST")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(nameAndParentAddrToIAddr("Andromeda", "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu");
    expect(nameAndParentAddrToIAddr("VRSC")).toBe("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
    expect(nameAndParentAddrToIAddr("The Verus Coin Foundation", "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
  });

  test('fqnToParentAddress tests', () => {
    // Core invariant: parent of child.parent.root@ === toIAddress("parent.root@")
    expect(fqnToParentAddress("michael.valuid.vrsc@")).toBe(toIAddress("valuid.vrsc@"));
    expect(fqnToParentAddress("michael.valuid@", "vrsc")).toBe(toIAddress("valuid.vrsc@"));
    expect(fqnToParentAddress("michael.valuid.vrsc@", "vrsc")).toBe(toIAddress("valuid.vrsc@"));

    // Three levels deep
    expect(fqnToParentAddress("a.b.c.vrsc@")).toBe(toIAddress("b.c.vrsc@"));
    expect(fqnToParentAddress("a.b.c@", "vrsc")).toBe(toIAddress("b.c.vrsc@"));

    // Single level under root — parent is the root identity
    expect(fqnToParentAddress("michael.vrsc@")).toBe(toIAddress("vrsc@"));
    expect(fqnToParentAddress("michael@", "vrsc")).toBe(toIAddress("vrsc@"));
    expect(fqnToParentAddress("michael.vrsc@", "vrsc")).toBe(toIAddress("vrsc@"));

    // Known values cross-check with nameAndParentAddrToIAddr
    expect(fqnToParentAddress("Andromeda.VRSCTEST@")).toBe(toIAddress("VRSCTEST@"));
    expect(fqnToParentAddress("Andromeda.VRSCTEST@")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");

    // Root identity — no parent, returns null
    expect(fqnToParentAddress("vrsc@")).toBeNull();           // empty chain → no parent
    expect(fqnToParentAddress("vrsc", "vrsc")).toBeNull();    // rootSystemName matches → no parent
    expect(fqnToParentAddress("vrsc@", "vrsc")).toBeNull();
    expect(fqnToParentAddress("VRSCTEST@")).toBeNull();       // empty chain → root identity, no parent
    expect(fqnToParentAddress("VRSCTEST@", "VRSCTEST")).toBeNull();

    // Case insensitivity — result must match regardless of case
    expect(fqnToParentAddress("Michael.VALUID.VRSC@")).toBe(fqnToParentAddress("michael.valuid.vrsc@"));
    expect(fqnToParentAddress("MICHAEL.VALUID.VRSC@")).toBe(toIAddress("valuid.vrsc@"));

    // Trailing @ (explicit empty chain) behaves like no @ when chain is empty
    expect(fqnToParentAddress("michael.vrsc@")).toBe(fqnToParentAddress("michael.vrsc"));

    // rootSystemName already present in FQN — should not be duplicated
    expect(fqnToParentAddress("michael.valuid.vrsc@", "vrsc")).toBe(fqnToParentAddress("michael.valuid.vrsc@"));

    // Invalid FQN — multiple @ separators
    expect(() => fqnToParentAddress("michael@valuid@vrsc")).toThrow();
  });

  test('getDataKey tests', () => {
    const keys = [
      VERUSPAY_INVOICE_VDXF_KEY, 
      IDENTITY_UPDATE_REQUEST_VDXF_KEY, 
      WALLET_VDXF_KEY,
      DATA_TYPE_DEFINEDKEY
    ]

    for (const key of keys) {
      const dataKeyI = getDataKey(key.qualifiedname.name, undefined, undefined, I_ADDR_VERSION);
      const dataKeyX = getDataKey(key.qualifiedname.name, undefined, undefined, X_ADDR_VERSION);

      expect(dataKeyI.id).toBe(key.vdxfid);
      expect(dataKeyI.namespace).toBe(key.qualifiedname.namespace);
      expect(dataKeyX.id).toBe(key.indexid!);
      expect(dataKeyX.namespace).toBe(key.qualifiedname.namespace);
    }
  });

  test("truncates VDXF names to 64 UTF-8 bytes", () => {
    expect(getDataKey("é".repeat(33)).id).toBe(getDataKey("é".repeat(32)).id);
    expect(() => getDataKey("a" + "é".repeat(32))).toThrow("No subnames found in name");
  });
});
