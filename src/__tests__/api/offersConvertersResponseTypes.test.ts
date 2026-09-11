import { GetCurrencyConvertersResponse } from '../../api/classes/GetCurrencyConverters/GetCurrencyConvertersResponse';
import { GetOffersResponse } from '../../api/classes/GetOffers/GetOffersResponse';
import { ListedIdentityOffering, ListedOffer, ListedOfferTerms } from '../../offers/OfferList';

const currencyid = 'i5w5MuNik5NtLcYmNzcvaoixooEebB6MGV';
const identityid = 'iQa13cLx5a4bB9nnd8EZPigrqLTsn75VrF';
const txid = 'ab'.repeat(32);
const identity: ListedIdentityOffering = {
  name: 'alice', identityid, systemid: currencyid, original: true,
};
const terms: ListedOfferTerms = {
  offer: identity,
  accept: { [currencyid]: 10 },
  blockexpiry: 2000000,
  txid,
};

describe('offer and currency converter RPC result types', () => {
  test('accepts currency and identity offer categories, including optional transaction hex', () => {
    // ../VerusCoin/src/rpc/pbaasrpc.cpp: IdOfferInfo and getoffers.
    const result: GetOffersResponse['result'] = {
      [`id_${identityid}_for_currency_${currencyid}`]: [
        { currencyid, price: 10, offer: terms },
      ],
      [`currency_${currencyid}_for_ids`]: [
        { identityid, price: 10, offer: { ...terms, tx: '04000080' } },
      ],
    };

    expect(new GetOffersResponse(result).toJson()).toEqual(result);
    expect(result[`currency_${currencyid}_for_ids`][0].offer.tx).toBe('04000080');

    const unavailable: GetOffersResponse['result'] = false;
    expect(new GetOffersResponse(unavailable).result).toBe(false);
  });

  test('rejects the old offer scalar types and missing category identity', () => {
    // @ts-expect-error IdOfferInfo emits a boolean, not a numeric flag.
    const oldIdentity: ListedIdentityOffering = { ...identity, original: 1 };
    // @ts-expect-error getoffers emits a hexadecimal transaction ID string.
    const oldTerms: ListedOfferTerms = { ...terms, txid: 1 };
    // @ts-expect-error Every outer offer identifies either a currency or an identity.
    const missingID: ListedOffer = { price: 10, offer: terms };

    expect(oldIdentity.original).toBe(1);
    expect(oldTerms.txid).toBe(1);
    expect(missingID).not.toHaveProperty('currencyid');
  });

  test('accepts converter metadata alongside the raw currency definition', () => {
    // getcurrencyconverters adds metadata to a dynamically keyed definition.
    // Its nested objects come from core_write.cpp ToUniValue implementations.
    const converter: GetCurrencyConvertersResponse['result'][number] = {
      [currencyid]: {
        version: 1, options: 33, name: 'basket', currencyid,
        systemid: currencyid, notarizationprotocol: 1, proofprotocol: 1,
        startblock: 1, endblock: 0,
        currencies: [currencyid], weights: [1], initialsupply: 100,
        prelaunchcarveout: 0, idregistrationfees: 100,
        idreferrallevels: 3, idimportfees: 0.01,
      },
      fullyqualifiedname: 'basket.VRSC',
      height: 1000000,
      output: { txid, voutnum: 1 },
      lastnotarization: {
        version: 1, launchconfirmed: true, launchcomplete: true,
        proposer: { type: 4, address: identityid },
        currencyid, notarizationheight: 1000000,
        currencystate: {
          version: 1, flags: 1, currencyid, initialsupply: 100,
          emitted: 0, supply: 100, reservecurrencies: [],
          currencies: {}, primarycurrencyfees: 0,
          primarycurrencyconversionfees: 0, primarycurrencyout: 0, preconvertedout: 0,
        },
        prevnotarizationtxid: txid, prevnotarizationout: 0, prevheight: 999999,
        hashprevcrossnotarization: '00'.repeat(32),
        currencystates: [], proofroots: [], nodes: [],
      },
    };
    const result: GetCurrencyConvertersResponse['result'] = [
      converter,
      { ...converter, targetamount: 1.5, sourceamounts: { [currencyid]: 2.5 } },
    ];

    expect(new GetCurrencyConvertersResponse(result).toJson()).toEqual(result);
    expect(result[0].output.voutnum).toBe(1);
    expect(result[0]).not.toHaveProperty('targetamount');
    expect(result[1].sourceamounts[currencyid]).toBe(2.5);

    // @ts-expect-error Metadata height is numeric, not a currency definition.
    const wrongHeight: typeof converter = { ...converter, height: {} };
    // @ts-expect-error Source amounts are JSON numbers from ValueFromAmount.
    const wrongAmount: typeof converter = { ...converter, sourceamounts: { [currencyid]: '2.5' } };
    expect(wrongHeight.height).toEqual({});
    expect(wrongAmount.sourceamounts[currencyid]).toBe('2.5');
  });
});
