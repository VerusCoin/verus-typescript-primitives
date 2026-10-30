import { BN } from "bn.js";
import {
  CurrencyIdentityRegistration,
  CurrencyIdentityRegistrationInit,
  CurrencyOptions,
  currencyAmountToAtomic,
} from "../../currency/CurrencyIdentityRegistration";

function policy(
  overrides: Partial<CurrencyIdentityRegistrationInit> = {}
): CurrencyIdentityRegistration {
  return new CurrencyIdentityRegistration({
    currencyID: "issuer",
    options: 0,
    currencies: ["reserve0", "reserve1"],
    IDRegistrationFees: "101",
    IDReferralLevels: 3,
    IDImportFees: "1",
    ...overrides,
  });
}

describe("CCurrencyDefinition identity policy", () => {
  test("keeps restricted issuance, referral authorization and economic rewards independent", () => {
    const required = policy({
      options:
        CurrencyOptions.ID_ISSUANCE | CurrencyOptions.ID_REFERRALREQUIRED,
    });
    expect(required.IDRequiresPermission()).toBe(true);
    expect(required.IDReferralRequired()).toBe(true);
    expect(required.IDReferrals()).toBe(false);
    expect(required.getIDReferralLevels()).toBe(3);
    expect(required.IDReferredRegistrationAmount().toString()).toBe("101");
    expect(required.IDReferralAmount().toString()).toBe("0");
    expect(policy().getIDReferralLevels()).toBe(0);
  });

  test("matches C++ integer truncation separately for each referral amount", () => {
    // crosschainrpc.h: IDReferredRegistrationAmount and IDReferralAmount.
    const referrals = policy({ options: CurrencyOptions.ID_REFERRALS });
    expect(referrals.IDFullRegistrationAmount().toString()).toBe("101");
    expect(referrals.IDReferredRegistrationAmount().toString()).toBe("80");
    expect(referrals.IDReferralAmount().toString()).toBe("20");
    const zeroLevels = policy({
      options: CurrencyOptions.ID_REFERRALS,
      IDReferralLevels: 0,
    });
    expect(zeroLevels.IDReferredRegistrationAmount().toString()).toBe("50");
    expect(zeroLevels.getIDReferralLevels()).toBe(0);
    // The client must choose the full-fee path when no economic referral applies.
  });

  test("calculates above the JS integer limit without losing one atomic unit", () => {
    const referrals = policy({
      options: CurrencyOptions.ID_REFERRALS,
      IDRegistrationFees: "9007199254740993",
    });
    expect(referrals.IDReferredRegistrationAmount().toString()).toBe(
      "7205759403792794"
    );
    expect(referrals.IDReferralAmount().toString()).toBe("1801439850948198");
  });

  test("NFT and no-ID flags forbid IDs; PBaaS and explicit name-controller flags identify controllers", () => {
    expect(policy({ options: CurrencyOptions.NFT_TOKEN }).noIDs()).toBe(true);
    expect(policy({ options: CurrencyOptions.NO_IDS }).noIDs()).toBe(true);
    expect(policy({ options: CurrencyOptions.TOKEN }).noIDs()).toBe(false);
    expect(policy({ options: CurrencyOptions.PBAAS }).isNameController()).toBe(
      true
    );
    expect(
      policy({
        options: CurrencyOptions.GATEWAY_NAMECONTROLLER,
      }).isNameController()
    ).toBe(true);
    expect(
      policy({ options: CurrencyOptions.GATEWAY }).isNameController()
    ).toBe(false);
  });

  test("recovers idimportfees atomic index before selecting fractional fee pricing currency", () => {
    const fractional = CurrencyIdentityRegistration.fromJSON({
      currencyid: "issuer",
      options: CurrencyOptions.FRACTIONAL,
      currencies: ["reserve0", "reserve1"],
      idregistrationfees: 100,
      idreferrallevels: 3,
      idimportfees: 0.00000001,
    });
    expect(fractional.feePricingCurrency()).toBe("reserve1");
    expect(fractional.IDFullRegistrationAmount().toString()).toBe(
      "10000000000"
    );
    expect(fractional.IDImportFee().toString()).toBe("1");
    expect(
      policy({
        options: CurrencyOptions.FRACTIONAL,
        IDImportFees: "0",
      }).feePricingCurrency()
    ).toBe("reserve0");
    for (const IDImportFees of ["-1", "2", "9223372036854775807"]) {
      expect(
        policy({
          options: CurrencyOptions.FRACTIONAL,
          IDImportFees,
        }).feePricingCurrency()
      ).toBe("issuer");
    }
    expect(policy().feePricingCurrency()).toBe("issuer");
    expect(
      policy({
        options: CurrencyOptions.FRACTIONAL,
        currencies: [],
      }).feePricingCurrency()
    ).toBe("issuer");
  });

  test("copies mutable amounts and reserve lists at the boundary", () => {
    const fee = new BN(101);
    const reserves = ["a", "b"];
    const original = policy({
      IDRegistrationFees: fee,
      currencies: reserves,
      options: CurrencyOptions.FRACTIONAL,
    });
    fee.iaddn(1);
    reserves[1] = "mutated";
    original.IDFullRegistrationAmount().iaddn(100);
    original.IDImportFee().iaddn(1);
    expect(original.IDFullRegistrationAmount().toString()).toBe("101");
    expect(original.feePricingCurrency()).toBe("b");
  });

  test.each([
    0.01,
    Number.MAX_SAFE_INTEGER + 1,
    "1.5",
    "1e8",
    "9223372036854775808",
    "-1",
  ])(
    "rejects invalid or ambiguous atomic registration fees %s",
    (IDRegistrationFees) => {
      expect(() => policy({ IDRegistrationFees })).toThrow();
    }
  );

  test("rejects unsupported options and referral counts", () => {
    expect(() => policy({ options: 0x2000 })).toThrow();
    expect(() => policy({ options: 0.1 })).toThrow();
    expect(() => policy({ IDReferralLevels: -1 })).toThrow();
    expect(() => policy({ IDReferralLevels: 6 })).toThrow();
  });
});

describe("exact RPC currency amounts", () => {
  test.each([
    ["0", "0"],
    [0.1, "10000000"],
    [0.00000001, "1"],
    ["-0.00000001", "-1"],
    ["1.230000000", "123000000"],
    ["9.99999999999999999e9", "999999999999999999"],
    ["90071992.54740993", "9007199254740993"],
  ])("converts %s to exactly %s atoms", (amount, expected) => {
    expect(currencyAmountToAtomic(amount).toString()).toBe(expected);
  });

  test.each([
    NaN,
    Infinity,
    "0.000000001",
    0.1 + 0.2,
    "10000000000",
    "1e1000000",
    " 1",
    "0x10",
    "",
    90071992.54740993,
    67108864.00000001,
  ])("rejects malformed, overflowing or imprecise amount %s", (amount) => {
    expect(() => currencyAmountToAtomic(amount)).toThrow();
  });
});
