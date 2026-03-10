import { I_ADDR_VERSION, X_ADDR_VERSION } from "../../constants/vdxf";
import { fqnToParent, getDataKey, nameAndParentAddrToIAddr, toIAddress } from "../../utils/address";
import { DATA_TYPE_DEFINEDKEY, IDENTITY_UPDATE_REQUEST_VDXF_KEY, VERUSPAY_INVOICE_VDXF_KEY, WALLET_VDXF_KEY } from "../../vdxf";

describe('Address tests', () => {
  test('toIAddress tests', async () => {
    expect(toIAddress("VRSCTEST")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(toIAddress("Andromeda.VRSCTEST")).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu");
    expect(toIAddress("service.VRSCTEST@")).toBe("iFZC7A1HnnJGwBmoPjX3mG37RKbjZZLPhm");
    expect(toIAddress("VRSC")).toBe("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
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

  test('nameAndParentAddrToIAddr tests', async () => {
    expect(nameAndParentAddrToIAddr("VRSCTEST")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");
    expect(nameAndParentAddrToIAddr("Andromeda", "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq")).toBe("iNC9NG5Jqk2tqVtqfjfiSpaqxrXaFU6RDu");
    expect(nameAndParentAddrToIAddr("VRSC")).toBe("i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV");
    expect(nameAndParentAddrToIAddr("The Verus Coin Foundation", "i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV")).toBe("iDV1KZA6vBXi9k6K3imiSLe5CsYG6MdH4V");
  });

  test('fqnToParent tests', () => {
    // Core invariant: parent of child.parent.root@ === toIAddress("parent.root@")
    expect(fqnToParent("michael.valuid.vrsc@")).toBe(toIAddress("valuid.vrsc@"));
    expect(fqnToParent("michael.valuid@", "vrsc")).toBe(toIAddress("valuid.vrsc@"));
    expect(fqnToParent("michael.valuid.vrsc@", "vrsc")).toBe(toIAddress("valuid.vrsc@"));

    // Three levels deep
    expect(fqnToParent("a.b.c.vrsc@")).toBe(toIAddress("b.c.vrsc@"));
    expect(fqnToParent("a.b.c@", "vrsc")).toBe(toIAddress("b.c.vrsc@"));

    // Single level under root — parent is the root identity
    expect(fqnToParent("michael.vrsc@")).toBe(toIAddress("vrsc@"));
    expect(fqnToParent("michael@", "vrsc")).toBe(toIAddress("vrsc@"));
    expect(fqnToParent("michael.vrsc@", "vrsc")).toBe(toIAddress("vrsc@"));

    // Known values cross-check with nameAndParentAddrToIAddr
    expect(fqnToParent("Andromeda.VRSCTEST@")).toBe(toIAddress("VRSCTEST@"));
    expect(fqnToParent("Andromeda.VRSCTEST@")).toBe("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq");

    // Root identity — no parent, returns null
    expect(fqnToParent("vrsc@")).toBeNull();           // empty chain → no parent
    expect(fqnToParent("vrsc", "vrsc")).toBeNull();    // rootSystemName matches → no parent
    expect(fqnToParent("vrsc@", "vrsc")).toBeNull();
    expect(fqnToParent("VRSCTEST@")).toBeNull();       // empty chain → root identity, no parent
    expect(fqnToParent("VRSCTEST@", "VRSCTEST")).toBeNull();

    // Case insensitivity — result must match regardless of case
    expect(fqnToParent("Michael.VALUID.VRSC@")).toBe(fqnToParent("michael.valuid.vrsc@"));
    expect(fqnToParent("MICHAEL.VALUID.VRSC@")).toBe(toIAddress("valuid.vrsc@"));

    // Trailing @ (explicit empty chain) behaves like no @ when chain is empty
    expect(fqnToParent("michael.vrsc@")).toBe(fqnToParent("michael.vrsc"));

    // rootSystemName already present in FQN — should not be duplicated
    expect(fqnToParent("michael.valuid.vrsc@", "vrsc")).toBe(fqnToParent("michael.valuid.vrsc@"));

    // Invalid FQN — multiple @ separators
    expect(() => fqnToParent("michael@valuid@vrsc")).toThrow();
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
});
