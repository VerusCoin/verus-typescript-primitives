import {
  CurrencyIdentityRegistration, CurrencyIdentityRegistrationJSON,
  CurrencyOptions, currencyAmountToAtomic,
} from '../../index';

const fixture: {
  provenance: { chainID: string };
  currencies: Array<{ name: string; result: CurrencyIdentityRegistrationJSON }>;
} = require('../fixtures/identity-registration/data-v1.json');

// Independent fixed expectations, calculated in atomic units from the captured
// immutable definitions using CCurrencyDefinition's C++ integer formulas.
// These are source-derived policy expectations, not daemon RPC quote results.
const expected = [
  ['native-referrals', '10000000000', '8000000000', '2000000000', 3, '2000000'],
  ['subnamespace-reserve-index-one', '1500000000', '1125000000', '375000000', 2, '1'],
  ['fractional-reserve-index-three', '777000000', '777000000', '0', 0, '3'],
  ['restricted-required-referral', '2700000000', '2160000000', '540000000', 3, '2000000'],
  ['required-referral', '133700000000', '106960000000', '26740000000', 3, '2000000'],
  ['one-atomic-unit-fee', '1', '1', '0', 0, '1'],
  ['NFT-no-identities', '10000000000', '10000000000', '0', 0, '2000000'],
  ['five-referral-levels', '77700000000', '66600000000', '11100000000', 5, '2000000'],
] as const;

function definition(name: string): CurrencyIdentityRegistrationJSON {
  return fixture.currencies.find(row => row.name === name).result;
}

describe('daemon currency identity-registration policy data', () => {
  test.each(expected)('%s converts daemon coin amounts and applies C++ referral arithmetic', (name, full, referred, reward, levels, importFee) => {
    const raw = definition(name);
    const policy = CurrencyIdentityRegistration.fromJSON(raw);
    expect(policy.currencyID).toBe(raw.currencyid);
    expect(policy.options).toBe(raw.options);
    expect(policy.IDFullRegistrationAmount().toString()).toBe(full);
    expect(policy.IDReferredRegistrationAmount().toString()).toBe(referred);
    expect(policy.IDReferralAmount().toString()).toBe(reward);
    expect(policy.getIDReferralLevels()).toBe(levels);
    expect(policy.IDImportFee().toString()).toBe(importFee);
    expect(currencyAmountToAtomic(raw.idregistrationfees).toString()).toBe(full);
  });

  test('selects actual reserve IDs from one- and three-atom fractional fee indices', () => {
    const one = CurrencyIdentityRegistration.fromJSON(definition('subnamespace-reserve-index-one'));
    const three = CurrencyIdentityRegistration.fromJSON(definition('fractional-reserve-index-three'));
    expect(one.isFractional()).toBe(true);
    expect(one.feePricingCurrency()).toBe('iFawzbS99RqGs7J2TNxME1TmmayBGuRkA2');
    expect(three.feePricingCurrency()).toBe('iGhBps9rmbN7U544dZY7nx2rfg26QTh1zY');
    // Ordinary 0.02-coin import fees do not select reserve index 2,000,000.
    const ordinary = CurrencyIdentityRegistration.fromJSON(definition('five-referral-levels'));
    expect(ordinary.feePricingCurrency()).toBe(ordinary.currencyID);
  });

  test('keeps actual referral authorization and restricted issuance flags separate', () => {
    const restricted = CurrencyIdentityRegistration.fromJSON(definition('restricted-required-referral'));
    const required = CurrencyIdentityRegistration.fromJSON(definition('required-referral'));
    expect(restricted.options).toBe(CurrencyOptions.TOKEN | CurrencyOptions.ID_ISSUANCE | CurrencyOptions.ID_REFERRALS | CurrencyOptions.ID_REFERRALREQUIRED);
    expect(restricted.IDRequiresPermission()).toBe(true);
    expect(required.IDRequiresPermission()).toBe(false);
    expect(restricted.IDReferralRequired()).toBe(true);
    expect(required.IDReferralRequired()).toBe(true);
    expect(required.IDReferrals()).toBe(true);
  });

  test('does not treat a real NFT subcurrency as an eligible child-identity namespace', () => {
    const NFT = CurrencyIdentityRegistration.fromJSON(definition('NFT-no-identities'));
    const parent = CurrencyIdentityRegistration.fromJSON(definition('subnamespace-reserve-index-one'));
    expect(NFT.isToken()).toBe(true);
    expect(NFT.isNFTToken()).toBe(true);
    expect(NFT.noIDs()).toBe(true);
    expect(parent.isToken()).toBe(true);
    expect(parent.isNFTToken()).toBe(false);
    expect(parent.noIDs()).toBe(false);
    expect(parent.isNameController()).toBe(false);
  });

  test('distinguishes the native PBaaS name controller from fractional namespaces', () => {
    const native = CurrencyIdentityRegistration.fromJSON(definition('native-referrals'));
    expect(native.currencyID).toBe(fixture.provenance.chainID);
    expect(native.isPBAASChain()).toBe(true);
    expect(native.isNameController()).toBe(true);
    expect(native.isFractional()).toBe(false);
    expect(native.feePricingCurrency()).toBe(native.currencyID);
  });
});
