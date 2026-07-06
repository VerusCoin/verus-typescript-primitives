import {
  deriveOfferIndexKey,
  buildListingDepositScript,
  buildListingOpReturnScript,
  IDENTITY_OFFER_BASE_KEY,
  OFFER_FOR_CURRENCY_BASE_KEY,
} from "../../utils/onchainoffers";

// Oracle fixtures: REAL listing transactions posted on VRSCTEST by the
// daemon's own COnChainOffer code path. These tests assert byte-exact
// reproduction of the daemon's outputs.
//
// listing tx babf8e7249e7e21238ab95404e829d58ae259f04098ca458e7b3ebc6b4c5089a
// (offer for identity iEAQBwMUxyZFBLP7iYmgbWfNK2xcm26aDW priced in VRSCTEST
// iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq, deposit owned by
// RTrhvhGvamEGeALM1nuhneuPQUG1hUa4CF)

const VRSCTEST_ID = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";
const NFT_A_ID = "iEAQBwMUxyZFBLP7iYmgbWfNK2xcm26aDW";
const NFT_B_ID = "iKuuH6prEEvXNJSVrgYzgMkwZUTnP2hJ2V";
const OWNER_H160 = "cbc8e819161dcd010152e8d19ecff781c5e85b5a";

const ORACLE_A_CC =
  "2f040300020214d2d3d4df0e9cef217223ba615e76a2e3753e910414a6e8b494505be4992bd56ab795b080591f257cf0cc3b040311010114cbc8e819161dcd010152e8d19ecff781c5e85b5a20000000000000000000000000000000000000000000000000000000000000000075";
const ORACLE_B_CC =
  "2f040300020214d2d3d4df0e9cef217223ba615e76a2e3753e91041424c67faf5af3fd31aa595ebc5fc6d3ed9027c5edcc3b040311010114cbc8e819161dcd010152e8d19ecff781c5e85b5a20000000000000000000000000000000000000000000000000000000000000000075";

const ORACLE_A_OFFER_TX =
  "0400008085202f8901abc6ca36d80455f9d2de81f1db08b498d8ed1e2b81838f59579ab2bdaae7342101000000694c6701010101210306e8b2df70cc527713d3612b3894860b6137e2c35658429b0709b8dd32cc325740205217fabb9fd8c12f90946cdf80b08c8a0720e23913091493c9ccf7c3b731823164dd8862c8e7269a41c1e28b143fdf060f184ca17f04e91b817313d450f901ffffffff0100ca9a3b000000001976a91456ec0a66abb2eaad7886dc89866a74aafbc57b4b88ac00000000085a11000000000000000000000000";
const ORACLE_A_OPRET =
  "6a4ce70500000003000101000000000100000000d10400008085202f8901abc6ca36d80455f9d2de81f1db08b498d8ed1e2b81838f59579ab2bdaae7342101000000694c6701010101210306e8b2df70cc527713d3612b3894860b6137e2c35658429b0709b8dd32cc325740205217fabb9fd8c12f90946cdf80b08c8a0720e23913091493c9ccf7c3b731823164dd8862c8e7269a41c1e28b143fdf060f184ca17f04e91b817313d450f901ffffffff0100ca9a3b000000001976a91456ec0a66abb2eaad7886dc89866a74aafbc57b4b88ac00000000085a1100000000000000000000000000000000";

describe("on-chain offer listing primitives (daemon byte-oracle)", () => {
  test("derives the offer-for-currency index key", () => {
    expect(
      deriveOfferIndexKey(OFFER_FOR_CURRENCY_BASE_KEY, VRSCTEST_ID).toString("hex")
    ).toBe("d2d3d4df0e9cef217223ba615e76a2e3753e9104");
  });

  test("derives identity offer index keys for both oracle NFTs", () => {
    expect(deriveOfferIndexKey(IDENTITY_OFFER_BASE_KEY, NFT_A_ID).toString("hex")).toBe(
      "a6e8b494505be4992bd56ab795b080591f257cf0"
    );
    expect(deriveOfferIndexKey(IDENTITY_OFFER_BASE_KEY, NFT_B_ID).toString("hex")).toBe(
      "24c67faf5af3fd31aa595ebc5fc6d3ed9027c5ed"
    );
  });

  test("reproduces both oracle deposit scripts byte-exactly", () => {
    const forKey = deriveOfferIndexKey(OFFER_FOR_CURRENCY_BASE_KEY, VRSCTEST_ID);
    const owner = Buffer.from(OWNER_H160, "hex");
    expect(
      buildListingDepositScript(
        forKey,
        deriveOfferIndexKey(IDENTITY_OFFER_BASE_KEY, NFT_A_ID),
        owner
      ).toString("hex")
    ).toBe(ORACLE_A_CC);
    expect(
      buildListingDepositScript(
        forKey,
        deriveOfferIndexKey(IDENTITY_OFFER_BASE_KEY, NFT_B_ID),
        owner
      ).toString("hex")
    ).toBe(ORACLE_B_CC);
  });

  test("reproduces the oracle OP_RETURN script byte-exactly", () => {
    expect(buildListingOpReturnScript(ORACLE_A_OFFER_TX).toString("hex")).toBe(
      ORACLE_A_OPRET
    );
  });
});
