import { toIAddress } from "../../utils/address";

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
  });
});
