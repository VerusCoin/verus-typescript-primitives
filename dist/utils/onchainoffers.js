"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildListingOpReturnScript = exports.buildListingDepositScript = exports.deriveOfferIndexKey = exports.OFFER_FOR_CURRENCY_BASE_KEY = exports.OFFER_FOR_IDENTITY_BASE_KEY = exports.CURRENCY_OFFER_BASE_KEY = exports.IDENTITY_OFFER_BASE_KEY = void 0;
const crypto_1 = require("crypto");
const address_1 = require("./address");
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
// hash160result of vrsc::system.exchange.identityoffer
exports.IDENTITY_OFFER_BASE_KEY = "04e9923a4e0736bdf2098564cb3e7c68f9d12359";
// hash160result of vrsc::system.exchange.currencyoffer
exports.CURRENCY_OFFER_BASE_KEY = "37ea50baa4f2fb07e33252be3202319e35790380";
// hash160result of vrsc::system.exchange.offerforidentity
exports.OFFER_FOR_IDENTITY_BASE_KEY = "1a077aae5e356da8191e780c8a68452998a86201";
// hash160result of vrsc::system.exchange.offerforcurrency
exports.OFFER_FOR_CURRENCY_BASE_KEY = "ecbb3a6edc834d4dbdc7fb83514cf65e97667eba";
const sha256 = (b) => (0, crypto_1.createHash)("sha256").update(b).digest();
const dsha256 = (b) => sha256(sha256(b));
const hash160 = (b) => (0, crypto_1.createHash)("ripemd160").update(sha256(b)).digest();
/**
 * CCrossChainRPCData::GetConditionID(baseKey, targetID): the per-target
 * offer index key, as indexed on chain (address-index P2PKH form).
 */
const deriveOfferIndexKey = (baseKeyHash160Hex, targetIAddress) => {
    const target = (0, address_1.fromBase58Check)(targetIAddress).hash;
    const base = Buffer.from(baseKeyHash160Hex, "hex").reverse();
    return hash160(dsha256(Buffer.concat([target, base])));
};
exports.deriveOfferIndexKey = deriveOfferIndexKey;
/**
 * The identity-commitment deposit output script carrying the offer index
 * keys. Spendable by ownerHash160 (a P2PKH destination) — spending it (e.g.
 * via closeoffers) reclaims the deposit and delists the offer.
 */
const buildListingDepositScript = (forIndexKey, offerIndexKey, ownerHash160) => {
    if (forIndexKey.length !== 20 || offerIndexKey.length !== 20 || ownerHash160.length !== 20) {
        throw new Error("Index keys and owner hash must be 20 bytes");
    }
    return Buffer.concat([
        Buffer.from("2f0403000202", "hex"),
        Buffer.from("14", "hex"),
        forIndexKey,
        Buffer.from("14", "hex"),
        offerIndexKey,
        Buffer.from("cc", "hex"),
        Buffer.from("3b0403110101", "hex"),
        Buffer.from("14", "hex"),
        ownerHash160,
        Buffer.from("20", "hex"),
        Buffer.alloc(32),
        Buffer.from("75", "hex"),
    ]);
};
exports.buildListingDepositScript = buildListingDepositScript;
const compactSize = (n) => {
    if (n < 0xfd)
        return Buffer.from([n]);
    if (n <= 0xffff) {
        const b = Buffer.alloc(3);
        b[0] = 0xfd;
        b.writeUInt16LE(n, 1);
        return b;
    }
    const b = Buffer.alloc(5);
    b[0] = 0xfe;
    b.writeUInt32LE(n, 1);
    return b;
};
/**
 * The OP_RETURN script embedding the signed offer transaction in the
 * CCrossChainProof/CPartialTransactionProof envelope getoffers parses.
 */
const buildListingOpReturnScript = (signedOfferTxHex) => {
    const tx = Buffer.from(signedOfferTxHex, "hex");
    const payload = Buffer.concat([
        Buffer.from("0500000003000101000000000100000000", "hex"),
        compactSize(tx.length),
        tx,
        Buffer.alloc(4),
    ]);
    let push;
    if (payload.length <= 75)
        push = Buffer.from([payload.length]);
    else if (payload.length <= 0xff)
        push = Buffer.from([0x4c, payload.length]);
    else {
        push = Buffer.alloc(3);
        push[0] = 0x4d;
        push.writeUInt16LE(payload.length, 1);
    }
    return Buffer.concat([Buffer.from("6a", "hex"), push, payload]);
};
exports.buildListingOpReturnScript = buildListingOpReturnScript;
