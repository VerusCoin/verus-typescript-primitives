/**
 * On-chain marketplace offer listing primitives.
 *
 * A signed partial offer transaction (makeoffer-style, SIGHASH_SINGLE |
 * ANYONECANPAY) becomes discoverable via getoffers when a "listing"
 * transaction is posted on chain carrying:
 *  - a deposit output (>= the network default fee on PBaaS chains) whose
 *    script is an identity-commitment cryptocondition tagged with the two
 *    on-chain offer index keys, and
 *  - an OP_RETURN output embedding the signed offer transaction.
 *
 * These builders produce byte-exact equivalents of the daemon's own
 * listing outputs (COnChainOffer / GetOpRetChainOffer format), so any
 * wallet holding ordinary funds can post a listing for an offer it signed,
 * paying its own fee and keeping the reclaimable deposit.
 */
export declare const IDENTITY_OFFER_BASE_KEY = "04e9923a4e0736bdf2098564cb3e7c68f9d12359";
export declare const CURRENCY_OFFER_BASE_KEY = "37ea50baa4f2fb07e33252be3202319e35790380";
export declare const OFFER_FOR_IDENTITY_BASE_KEY = "1a077aae5e356da8191e780c8a68452998a86201";
export declare const OFFER_FOR_CURRENCY_BASE_KEY = "ecbb3a6edc834d4dbdc7fb83514cf65e97667eba";
/**
 * CCrossChainRPCData::GetConditionID(baseKey, targetID): the per-target
 * offer index key, as indexed on chain (address-index P2PKH form).
 */
export declare const deriveOfferIndexKey: (baseKeyHash160Hex: string, targetIAddress: string) => Buffer;
/**
 * The identity-commitment deposit output script carrying the offer index
 * keys. Spendable by ownerHash160 (a P2PKH destination) — spending it (e.g.
 * via closeoffers) reclaims the deposit and delists the offer.
 */
export declare const buildListingDepositScript: (forIndexKey: Buffer, offerIndexKey: Buffer, ownerHash160: Buffer) => Buffer;
/**
 * The OP_RETURN script embedding the signed offer transaction in the
 * CCrossChainProof/CPartialTransactionProof envelope getoffers parses.
 */
export declare const buildListingOpReturnScript: (signedOfferTxHex: string) => Buffer;
