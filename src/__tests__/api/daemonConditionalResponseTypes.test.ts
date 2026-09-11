import { GetCurrencyResponse } from '../../api/classes/GetCurrency/GetCurrencyResponse';
import { GetInfoResponse } from '../../api/classes/GetInfo/GetInfoResponse';
import { GetRawTransactionResponse } from '../../api/classes/GetRawTransaction/GetRawTransactionResponse';
import { ListCurrenciesResponse } from '../../api/classes/ListCurrencies/ListCurrenciesResponse';
import { CurrencyDefinition, RawCurrencyDefinition } from '../../currency/CurrencyDefinition';
import { RawTransaction } from '../../transaction/RawTransaction';

const currencyid = 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV';
const hash = '00'.repeat(32);
const definition: RawCurrencyDefinition = {
  version: 1, options: 32, name: 'token', currencyid, systemid: currencyid,
  notarizationprotocol: 1, proofprotocol: 1, startblock: 0, endblock: 0,
  idregistrationfees: 100, idreferrallevels: 3, idimportfees: 0.01,
};
const legacy: RawTransaction = {
  hex: '00', txid: hash, overwintered: false, version: 1,
  locktime: 0, vin: [], vout: [], vjoinsplit: [],
};

describe('daemon response fields that are conditional', () => {
  test('accepts raw definitions and list entries without getcurrency state metadata', () => {
    // core_write.cpp CCurrencyDefinition::ToUniValue omits empty vectors,
    // null parent/launch IDs, and fractional-only supply fields.
    expect(definition).not.toHaveProperty('currencies');
    expect(definition).not.toHaveProperty('parent');
    expect(definition).not.toHaveProperty('initialsupply');

    // rpc/pbaasrpc.cpp listcurrencies puts chain state outside the definition.
    const listed: ListCurrenciesResponse['result'] = [{
      currencydefinition: {
        ...definition, currencyidhex: '00'.repeat(20), fullyqualifiedname: 'token.VRSC',
      },
      bestheight: 0,
    }];
    expect(new ListCurrenciesResponse(listed).toJson()).toEqual(listed);
    expect(listed[0].currencydefinition).not.toHaveProperty('bestheight');
    expect(listed[0].currencydefinition).not.toHaveProperty('currencynames');
  });

  test('keeps getcurrency enrichment separate and its conditional metadata optional', () => {
    // getcurrency always emits bestheight, but an external token can omit
    // lastconfirmedheight; names and definition UTXO fields are conditional.
    const result: GetCurrencyResponse['result'] = {
      ...definition, currencyidhex: '00'.repeat(20), fullyqualifiedname: 'token.VRSC',
      bestheight: 0,
    };
    const withReserves: CurrencyDefinition = {
      ...result, options: 33, parent: currencyid, launchsystemid: currencyid,
      currencies: [currencyid], weights: [1], conversions: [1],
      initialsupply: 100, prelaunchcarveout: 0, initialcontributions: [10],
      currencynames: { [currencyid]: 'VRSC' }, definitiontxid: hash, definitiontxout: 0,
      lastconfirmedheight: 0,
    };

    expect(new GetCurrencyResponse(result).toJson()).toEqual(result);
    expect(result.lastconfirmedheight).toBeUndefined();
    expect(withReserves.weights).toEqual([1]);
    // @ts-expect-error A raw definition lacks getcurrency's required enrichment.
    const rawAsEnriched: CurrencyDefinition = definition;
    // @ts-expect-error Optional reserve weights still contain JSON numbers.
    const wrongWeights: RawCurrencyDefinition = { ...definition, weights: ['1'] };
    expect(rawAsEnriched).toBe(definition);
    expect(wrongWeights.weights).toEqual(['1']);
  });

  test('accepts legacy unconfirmed transactions without upgraded or block fields', () => {
    // rpc/rawtransaction.cpp TxToJSONExpanded conditions these fields on the
    // transaction version and a non-null block hash.
    const response = new GetRawTransactionResponse(legacy);
    const result: GetRawTransactionResponse['result'] = legacy;
    expect(response.toJson()).toEqual(result);
    expect(legacy.versiongroupid).toBeUndefined();
    expect(legacy.valueBalance).toBeUndefined();
    expect(legacy.blockhash).toBeUndefined();
  });

  test('accepts Overwinter, Sapling, and inactive-block transaction metadata', () => {
    const overwinter: RawTransaction = {
      ...legacy, overwintered: true, version: 3,
      versiongroupid: '03c48270', expiryheight: 0,
    };
    const sapling: RawTransaction = {
      ...overwinter, version: 4, versiongroupid: '892f2085',
      valueBalance: 0, vShieldedSpend: [], vShieldedOutput: [],
      blockhash: hash, height: 1, confirmations: 2, time: 1, blocktime: 1,
    };
    const inactive: RawTransaction = {
      ...overwinter, blockhash: hash, height: -1, confirmations: 0,
    };
    expect(overwinter.vShieldedSpend).toBeUndefined();
    expect(sapling.confirmations).toBe(2);
    expect(inactive.blocktime).toBeUndefined();
    // @ts-expect-error Conditional heights remain numbers when present.
    const wrongHeight: RawTransaction = { ...legacy, expiryheight: '0' };
    expect(wrongHeight.expiryheight).toBe('0');
  });

  test('accepts current getinfo without historical notarization or conditional fields', () => {
    // rpc/misc.cpp getinfo: wallet, chain-tip, CC, and asset-chain fields depend
    // on build/runtime configuration; the seven historical fields are absent.
    const info: GetInfoResponse['result'] = {
      VRSCversion: '1.2.14', version: 1010214, protocolversion: 170009,
      chainid: currencyid, name: 'VRSC', blocks: -1, longestchain: -1,
      timeoffset: 0, nextblocktime: 0, connections: 0, proxy: '', difficulty: 1,
      testnet: false, tls_established: 0, tls_verified: 0, relayfee: 0.00001, errors: '',
    };
    const withWallet: GetInfoResponse['result'] = {
      ...info, walletversion: 60000, keypoololdest: 1, keypoolsize: 100,
      unlocked_until: 0, paytxfee: 0, tiptime: 1,
    };
    const historical: GetInfoResponse['result'] = {
      ...info, notarized: 0, prevMoMheight: 0, notarizedhash: hash,
      notarizedtxid: hash, notarizedtxid_height: '0', KMDnotarized_height: 0,
      notarized_confirms: 0,
    };
    expect(new GetInfoResponse(info).toJson()).toEqual(info);
    expect(info.notarized).toBeUndefined();
    expect(info.eras).toBeUndefined();
    expect(withWallet.keypoolsize).toBe(100);
    expect(historical.notarized).toBe(0);
    // @ts-expect-error Conditional fee values remain JSON numbers.
    const wrongFee: GetInfoResponse['result'] = { ...info, paytxfee: '0.1' };
    expect(wrongFee.paytxfee).toBe('0.1');
  });
});
