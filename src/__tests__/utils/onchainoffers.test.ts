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

// Version-byte oracle: real, 263+-confirmation VRSCTEST listing tx
// e1163193932773419237ae974059f4952de99e0af60f33e50244de5c53367da6
// (offer for identity iFxzUnbkaoVRYT3jgGNSZRa42QBcLVE76o, seller
// RGrkx8zoGVLBYBcUYgEdkfDaFsG89PTmSE), confirmed indexed by native `getoffers`
// (docs/NATIVE_OFFER_DISCOVERY_SOLVED_2026-07-09.md). Supersedes ORACLE_A_OPRET
// above, which used the pre-fix version byte (0001) and was NEVER
// getoffers-discoverable despite being confirmed on-chain.
const ORACLE_C_OFFER_TX =
  "0400008085202f89011f13a26c1e491f5bd165c2156962410f3a940e731ffc7bb22f1a6787f23eec7000000000694c670183010121036401843c7f279079abe66c0342106cf32e3fb0b8e12b3ba6af938c2a23165a4c409f1bc9336a28382678d0f08b50a49c740c2e41278c61367527a39731cfb9d9d77f1cb2f39befc5c1818f065ee8b434415d507fea40cf94f8f6fe7fe0451c0ed7ffffffff018093dc14000000001976a91453220c4dad61fab31b81449ccf8ee90871aec0bb88ac00000000fd6311000000000000000000000000";
const ORACLE_C_OPRET =
  "6a4ce70500000003000201000000000100000000d10400008085202f89011f13a26c1e491f5bd165c2156962410f3a940e731ffc7bb22f1a6787f23eec7000000000694c670183010121036401843c7f279079abe66c0342106cf32e3fb0b8e12b3ba6af938c2a23165a4c409f1bc9336a28382678d0f08b50a49c740c2e41278c61367527a39731cfb9d9d77f1cb2f39befc5c1818f065ee8b434415d507fea40cf94f8f6fe7fe0451c0ed7ffffffff018093dc14000000001976a91453220c4dad61fab31b81449ccf8ee90871aec0bb88ac00000000fd631100000000000000000000000000000000";

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

  test("reproduces the live, getoffers-indexed OP_RETURN script byte-exactly", () => {
    expect(buildListingOpReturnScript(ORACLE_C_OFFER_TX).toString("hex")).toBe(
      ORACLE_C_OPRET
    );
  });
});
