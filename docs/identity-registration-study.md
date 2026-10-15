# Verus identity registration: implementation study

**Study date:** 13 October 2026

**Status:** Source-grounded implementation design; the proposed APIs and feature are not implemented by this document.

**Target repositories:** `verus-typescript-primitives`, `verusid-ts-client`, and `Verus-Mobile`.

**Protocol reference:** the local working tree at `../VerusCoin`.

Navigation: [Protocol](#2-registration-protocol) · [Sub-identities](#3-names-parents-and-sub-identities) · [Serialization](#4-primitives-and-wire-formats) · [Scripts](#5-transaction-layout-and-authorization) · [Fees](#6-registration-pricing-and-referrals) · [Primitives work](#7-changes-to-verus-typescript-primitives) · [Client work](#8-changes-to-verusid-ts-client) · [Mobile work](#9-changes-to-verus-mobile) · [Tests](#10-validation-and-test-plan) · [Delivery](#11-delivery-sequence-and-completion-criteria) · [Sources](#13-source-index).

## 1. Recommendation and evidence boundary

Implement registration as a locally constructed, locally signed, resumable **commit/reveal operation**. The client should expose two transaction builders: one creates the name commitment transaction and its private reservation preimage; the other spends the confirmed commitment to create the identity and publish that reservation. Mobile owns approval, encrypted persistence, signing-key access, broadcast, and recovery after interruption.

The important implementation constraints are:

- A commitment does **not** allocate the name. Availability can change before registration confirms.
- Modern ordinary registrations, including names directly under the native chain, normally use `CAdvancedNameReservation`. “Advanced” does not mean “only sub-identities.”
- Sub-identities require an eligible **registered currency namespace**. A bare personal VerusID is not automatically an issuer of child identities in this source tree.
- Parent namespace, registration chain, issuing/payment currency, and fee-pricing currency can differ. Carry them separately.
- Commitment and reservation outputs default to **zero native value**. The commitment remains an indispensable input, even though generic funding selection can discard it.
- Fees, referrals, restricted issuance, transaction expiry, and output ordering are part of the protocol, not just UI options.
- The current transaction dependency needs additional handling for reservation scripts and multiple signatures on a single smart-transaction input. Merely wrapping the existing identity-update builder is insufficient.

This study read local source. It did not call a live daemon, send transactions, build the daemon, or prove acceptance on a deployed network. Protocol statements refer to the checked-out implementation, including its local modifications. New names, types, modules, and UI flows below are proposals. References such as **V1**, **P1**, and **M1** resolve in the source index.

### 1.1 Inspected revisions

| Repository | HEAD | Working-tree qualification |
| --- | --- | --- |
| `verus-typescript-primitives` | `3ffa9d77a3dd98c23fe4f66cf4368946906de780` | Existing untracked `docs/`, including `dream-handshake-study.md`, before this study. |
| `verusid-ts-client` | `933e8f8da1a51b99ba7533701dddb9914b7a06b7` | Existing untracked local files. |
| `Verus-Mobile` | `7d74cd6a53e47f6277cff47ebad2978c23951dee` | Existing Android build and environment-file modifications. |
| `VerusCoin` | `ed2be9f45bbe34bfe32e0c61c2397f08d64d28d6` | Extensive modifications, including the protocol files cited here. HEAD alone does not reproduce this study. |
| `BitGoJS` dependency source | `2d3240429b7664fb01ca3f0f9e1c2b6da803f68d` | Matches the client's pinned `@bitgo/utxo-lib` dependency; examined to identify integration gaps. |

No applicable `AGENTS.md` was found. This work adds only this study. It leaves existing code and documents untouched.

### 1.2 Intended feature coverage

The complete feature should support native-chain identities and eligible sub-identities, including referrals and namespaces requiring an issuer or referral signature. An implementation can land in stages, but a native-only screen is not completion of the sub-identity requirement.

| Case | Required behavior |
| --- | --- |
| Name under the current native chain | Advanced reservation on current PBaaS-era chains; native pricing and optional referrals. |
| Name under an eligible non-native token namespace | Parent-bound advanced reservation; issuer-token payment/burn and native import/transfer costs as applicable. |
| Permissioned namespace | Prove required issuer authorization through signed transaction inputs; support local or externally completed signatures. |
| Referral-required namespace | Obtain a qualifying identity's transaction signature, separately from any referral reward calculation. |
| Fractional or gateway namespace | Resolve registration system and converter, use the correct historical pricing state and expiry rules. |
| Ordinary identity with no currency definition | Reject as an issuance parent, even if this wallet controls it. |
| NFT-token or `NoIDs` parent | Reject before paying for a commitment. |
| Namespace registered on another system | Select a supported wallet/network for that system or explain the unsupported system; do not silently use the current chain. |
| Historical legacy reservation | Parse/validate for compatibility; avoid offering legacy-chain creation until its height/version rules are tested. |

Currency creation, turning an ordinary identity into a currency namespace, identity import/export between chains, and creating tokenized identity control are separate workflows. Private/shielded funding can be added through an appropriate local Sapling transaction builder; it is not supplied by the existing transparent identity-update flow. These boundaries do not restrict creation of identities that happen to contain supported private-address metadata.

## 2. Registration protocol

### 2.1 The two transactions

```mermaid
sequenceDiagram
    participant U as User
    participant W as Mobile
    participant C as verusid-ts-client
    participant R as Chain RPC
    U->>W: Choose name, namespace, authorities, funding
    W->>C: Resolve policy, validate, quote
    C->>R: Read chain, parent, identities, funding UTXOs
    W->>W: Generate salt and persist encrypted reservation
    W->>C: Build and verify commitment transaction
    U->>W: Approve commitment
    W->>W: Sign; persist signed bytes and txid
    W->>R: Broadcast commitment
    W->>R: Wait for active-chain confirmation and unspent outpoint
    W->>C: Revalidate reservation and build registration
    C->>R: Refresh quote, referral history, authority state
    U->>W: Approve registration and exact costs
    W->>W: Sign all required inputs; persist transaction
    W->>R: Broadcast registration
    W->>R: Confirm and verify created identity
    W->>W: Link identity and retain operation receipt
```

**Commitment transaction.** Generate a cryptographically random, nonzero 256-bit salt. Serialize the reservation exactly and hash it with SHA256d. Pay the commitment transaction fee and create an `EVAL_IDENTITY_COMMITMENT` output containing the hash, controlled by the chosen commitment controller and any additional required namespace authority. Save the reservation privately. The daemon's `registernamecommitment` RPC performs this construction and immediately broadcasts; its response contains `{ txid, namereservation }`. It is a reference for behavior, not a suitable remote-wallet signing API for Mobile. **[V1, V2]**

**Registration transaction.** Spend that commitment outpoint and enough additional funding. Output the complete identity, any issuer payment or burn, the required referral payments, and the reservation preimage. The daemon's `registeridentity` RPC can return transaction hex with `returntx=true`, but still uses its own wallet and chain state. Mobile should build the equivalent transaction without transferring its keys to the daemon. **[V3]**

Use explicit public names such as `createNameReservationTransaction` for the first requested client function, but document that it creates the **commitment transaction**. The actual reservation data becomes a transaction output only during registration.

### 2.2 Confirmation, exclusivity, and retry rules

Consensus requires the commitment to have been mined in a previous block: `0 < commitmentHeight < registrationCandidateHeight`. One active-chain confirmation is enough for this condition; a wallet may wait longer as a product policy. Building a reveal while the commitment is only in the mempool, or trying to mine both in the same block, does not satisfy it. Check membership in the active chain, not merely a positive height reported by an old RPC response. **[V4]**

Several people can commit to the same name. A successful commitment says nothing definitive about who will register first. Check availability before committing and again before signing registration; also handle conflicting mempool or confirmed registrations. A lookup failure is not proof that a name is available. Revoked registered names are not available simply because the identity is revoked.

No maximum age of an already-confirmed commitment was found in the registration validators. Ordinary transaction expiry, an outpoint being spent, lost signing authority, changing policy/prices, and reorgs still matter. Distinguish an **expired unmined transaction** from an **old confirmed commitment**. A registration can be rebuilt with new funding/expiry while keeping the same reservation, provided its commitment is still unspent.

The commitment spend validator permits a signed spend with no reservation output. This provides cancellation/cleanup, after the source commitment is confirmed. It must still satisfy the original commitment spend condition, including issuer/referrer co-signatures for a restricted 2-of-2 commitment; the controller cannot necessarily cancel alone. It does not refund the commitment transaction fee. Standard commitments carry zero value, so cancellation normally costs another fee and primarily consumes the outpoint. Reservation outputs themselves are unspendable. **[V5]**

### 2.3 What the commitment binds

The reservation binds the leaf name, referral ID, salt, and, in the advanced form, the parent and reservation version. Changing any of those bytes requires a new commitment. It does not bind the future identity's complete primary-address list or recovery/revocation authorities. Those can be finalized at registration, subject to validation and renewed user approval.

The identity's leaf name must match the reservation **byte for byte**, including case, despite identity-name derivation being case insensitive. Base58 i-address strings themselves are case sensitive. `CReserveTransactionDescriptor` requires exact string equality; advanced reservations also require exact parent equality. Persist the serialized reservation so no later normalization or JSON round-trip accidentally changes it. **[V6]**

## 3. Names, parents, and sub-identities

### 3.1 Keep four identities/currencies separate

| Value | Meaning | Example use |
| --- | --- | --- |
| `parentID` | Namespace included in the child identity's name-derived address. | `alice` under a registered `community` currency. |
| `systemID` | Chain on which this registration is made and identity is homed. | Determines native UTXOs, broadcast endpoint, and transaction context. |
| `issuerID` | Currency that receives or is burned for registration payment; can be a gateway converter. | Determines payment/referral currency. |
| `feePricingCurrencyID` | Denomination used to establish registration price before conversion. | May be a reserve of a fractional issuer. |

The commitment controller, funding address, new identity's primary addresses, revocation identity, recovery identity, and namespace-authorizing identity are also separate roles. They may coincide in a simple case; the API must not collapse them into a single `address` parameter.

### 3.2 What a sub-identity actually requires

The advanced reservation includes an explicit `parent`. Both the RPC and consensus resolve it as a `CCurrencyDefinition`. `GetCachedCurrency` returns an invalid definition if the currency lookup fails; there is no general fallback synthesizing a currency definition from an ordinary identity. The registration checks then apply `NoIDs`, NFT, system, gateway, and issuance-option rules. **[V7]**

For `alice.community@`, resolve the complete `community` namespace on the selected network, verify that it has an eligible currency definition, then commit the **leaf** `alice` and that parent's i-address. Do not hash `alice.community` as a single leaf with the same parent, which would apply the hierarchy twice.

Nested names do not make every intermediate identity an issuer. To create `device.alice.community@`, the immediate parent `alice.community@` must itself be an eligible namespace under these rules. Ownership of `alice.community@` alone is insufficient. A personal identity can still be the new ID's recovery/revocation authority, independently of its naming parent. This distinction also matters for app-specific sub-ID designs.

PBaaS chains are name controllers. A gateway without name-controller status can route naming/payment through its launch system and gateway converter. Resolve this from definitions and verify both the parent and converter relationships. Avoid deciding the registration chain from the display suffix alone. **[V2, V3, V7]**

### 3.3 Canonicalization and ID derivation

The reference is `ParseSubNames`, `CleanName`, and `CIdentity::GetID`, not an approximate JavaScript regular expression. **[V8]**

- Names have dot-separated hierarchy; trailing-dot absolute syntax and `@` parsing have explicit behavior.
- `CleanName` can mutate the parent by hashing suffixes from right to left. Implicit root behavior depends on whether a parent was already supplied.
- Each component is bounded by `KOMODO_ASSETCHAIN_MAXLEN - 1`, currently **64 UTF-8 bytes**. Measure bytes, not JavaScript UTF-16 code units.
- The C++ code has truncating paths. Wallet creation should reject overlong input with a clear error rather than silently registering a different string.
- Validate UTF-8, spacing, invalid/control characters, empty labels, separators, and explicit-parent consistency against the daemon behavior. Do not add Unicode NFC/NFKC normalization or locale-sensitive lowercasing unless compatible with the protocol.
- The existing TypeScript naming helpers already contain C-locale-style case handling and FQN validation; extend/test those instead of introducing a separate mobile implementation.
- Names differing only by supported case folding derive the same identity ID; the reservation preimage preserves the approved name bytes. Do not lowercase a saved preimage or a Base58 i-address.
- Reject names that are forbidden by creation checks, including a Base58Check address used as the leaf name. Address lookup and name input are different operations.

For a cleaned leaf, the derivation is conceptually:

```text
leafHash = SHA256d(UTF8(C-locale-lowercase(leaf)))
combined = parentIsNull ? leafHash : SHA256d(raw20(parent) || leafHash)
identityID = HASH160(combined)
identityAddress = Base58Check(identityAddressVersion || raw20(identityID))
```

Use the existing helpers for raw ID representation and Base58Check. Do not reverse an i-address payload as if it were displayed uint256 hex. Require a selected root-system name for FQN parsing; library defaults must not accidentally select mainnet when operating on testnet or another chain.

Creation should return a resolved name object containing the approved leaf bytes, parent i-address, full display name, derived identity i-address, and registration system. Compare RPC-returned identity/currency IDs against locally derived/requested IDs before using their policies.

## 4. Primitives and wire formats

### 4.1 Required serialized objects

| C++ object / proposed TS class | Serialized field order | Notes |
| --- | --- | --- |
| `CNameReservation` / `NameReservation` | `CompactSize(nameByteLength)`, UTF-8 name, raw 20-byte referral ID, raw 32-byte salt | No version or parent in this binary form. An absent referral is 20 zero bytes. |
| `CAdvancedNameReservation` / `AdvancedNameReservation` | fixed `uint32` little-endian version, CompactSize-prefixed UTF-8 name, raw 20-byte parent ID, raw 20-byte referral ID, raw 32-byte salt | Current reservation version is **1**. It is not the identity version or CC version. |
| `CCommitmentHash` / `CommitmentHash` | raw 32-byte hash, conditionally followed by inherited `CTokenOutput` serialization | Ordinary name commitments contain just the hash. See the separate advanced-hash case below. |

For a name of `N` bytes (at most 64), legacy length is `1 + N + 20 + 32`; advanced length is `4 + 1 + N + 20 + 20 + 32`. The leading string-length byte is CompactSize even though this valid range fits in one byte. The advanced version is **not** CompactSize or the C++ `VARINT` encoding. **[V1]**

The hash calculation is exactly `SHA256(SHA256(serializedReservation))`, through C++ `GetHash`/`CHashWriter`. It is not VerusHash, a VDXF hash, a JSON hash, or HASH160. **[V9]**

Salt and hash JSON use the daemon's displayed uint256 hex convention; serialized uint256 bytes are in its internal byte order. Define conversion methods explicitly and test asymmetric byte sequences so an accidental reversal is detectable. Reject malformed hex and wrong byte lengths. A zero salt is invalid. For newly created reservations require the supported version, a valid parent where needed, and strict creation validation; the C++ reservation `IsValid()` alone only checks name length/nonemptiness and nonzero salt.

The JSON representation includes `name`, `salt`, `referral`, `parent`, and `nameid`, and advanced JSON additionally includes `version`. Legacy JSON `parent` and `nameid` are derived/contextual metadata, not extra serialized fields. Derive `nameid` and compare any supplied value; do not trust it as authoritative. **[V10]**

### 4.2 Advanced reservation is not an advanced commitment hash

An advanced **name reservation** still hashes to an ordinary 32-byte commitment. `CCommitmentHash` has another form: if the first 20 raw hash bytes equal the VDXF key for `vrsc::system.identity.advancedcommitmenthash`, the serialization appends `CTokenOutput`. This supports other commitment/offer uses. Do not activate it merely because the reservation has a parent.

The new primitive should either parse this distinct form correctly using the existing token-output primitive or reject it explicitly where the name-registration builder requires an ordinary commitment. A generic commitment parser must not silently discard its reserve values, and a registration builder must not inadvertently consume such an offer as a name commitment. **[V1, V5]**

### 4.3 Reuse the full identity primitive

Use the existing `Identity` serializer and `IdentityScript.fromIdentity`. A new registration is a full identity, not a `PartialIdentity` update. On the current PBaaS-era path the identity version is 3; select transaction/identity versions using supported chain context. Current script construction only supports current identity versions, so historical creation requires separate work.

The full identity needs the exact reserved leaf/parent, current `systemID`, primary addresses, signature threshold, authorities, and supported optional identity data. The daemon defaults absent recovery/revocation authorities to the new identity itself and an absent/zero minimum-signature value to 1. Mobile should make its own defaults explicit and show the resulting authorities for approval. External recovery/revocation IDs must exist and be valid/unrevoked on the relevant chain; the self-authority case is valid without an existing identity.

Current primary authorities are distinct public-key/public-key-hash destinations, with 1–25 primary addresses, threshold at least 1 and at most the number of keys, and threshold at most 13. Do not substitute parent or recovery i-addresses into the primary-key list. Default ordinary creation flags to zero; do not accidentally mark a new ID revoked, locked, an active currency, or tokenized. Optional content and private-address fields should use existing validation and size limits. **[V11, P1]**

## 5. Transaction layout and authorization

### 5.1 Evaluation codes and script structure

| Object | Eval code |
| --- | --- |
| Identity primary | `0x0e` / 14 |
| Identity commitment | `0x11` / 17 |
| Legacy reservation | `0x12` / 18 |
| Advanced reservation | `0x0a` / 10 |

The advanced code already exists in TypeScript constants. It must be wired into parsers/validators; it is not a newly allocated code and is not 27. **[V12, P2]**

`MakeMofNCCScript` builds a version-3 smart transaction with a master/index `COptCCParams` chunk, `OP_CHECKCRYPTOCONDITION`, the condition/data parameters chunk, and `OP_DROP`. For a single object-bearing condition, its parameters include the serialized object. The reference's script extraction also exposes master parameters in parsed `vData`; do not interpret a C++ check for `vData.size() > 1` as an instruction to duplicate the master chunk inside the TypeScript object's payload. Compare entire script bytes against C++ output. **[V13]**

For the RPC-equivalent commitment, the master/index destination is the commitment controller. The condition destinations and threshold are:

| Namespace policy | Commitment condition |
| --- | --- |
| Permissionless | 1-of-1: commitment controller. |
| `IDRequiresPermission()` | 2-of-2: controller and parent identity. |
| Else `IDReferralRequired()` | 2-of-2: controller and supplied referral identity. |

The permission branch takes precedence when both options are present. These are nested identity-aware conditions: a destination that is an identity may itself require multiple primary-key signatures. Test repeated/overlapping controller and authority roles instead of assuming two destinations always need exactly two distinct keys. The commitment can be published by a payer before those parties co-sign its later spend; surface missing future approval before charging the first transaction fee.

### 5.2 Canonical transaction outputs

```text
Commitment transaction
  inputs:  approved funding UTXOs
  outputs: commitment (normally zero native value)
           approved native/reserve change
  fee:     ordinary native commitment transaction fee

Registration transaction
  inputs:  exact confirmed commitment outpoint
           approved funding UTXOs
           additional authorization input only when the chosen policy path needs it
  outputs: full identity (normally zero native value)
           optional issuer payment / token burn
           referral rewards in required order
           matching legacy or advanced reservation (zero native value)
           approved native/reserve change
  fee:     branch-specific native registration remainder or import fee
```

The daemon puts the identity output first, then issuer payment/burn when applicable, then referral outputs, then reservation. Follow this construction exactly. Do not apply generic output sorting or insert change between the identity and reservation. The relative sequence is used to recognize referral history and validate fee outputs. Avoid combining multiple name registrations in one transaction; the normal path requires one matching identity/reservation pair. **[V3, V4, V6]**

The identity script includes primary, revoke, and recover conditions through `IdentityUpdateOutputScript`; an `EVAL_IDENTITY_PRIMARY` object alone is not sufficient. The reservation is addressed to the new identity i-address but remains unspendable by consensus. A zero-value output must not be dropped as dust by a generic builder. **[V5, V11]**

### 5.3 Restricted namespace authorization

Consensus checks more than the commitment hash and a referral field:

- With permissioned issuance, a qualifying input must be addressed to the parent/issuer identity and its smart-transaction signatures must include enough of that identity's primary keys, using `SIGHASH_ALL`.
- With referral-required issuance, a qualifying input may be addressed to a valid, unrevoked identity under the same parent, or the parent identity itself, and must carry its threshold of primary-key signatures with `SIGHASH_ALL`.
- The payment referrer and the identity supplying referral-required authorization are logically distinct in consensus. The daemon's standard commitment construction uses the supplied referrer for both roles.

The standard 2-of-2 commitment makes the required addressed input available without spending the parent's identity-definition UTXO. Prefer that construction. An alternative authorization-input design must satisfy the actual checks and preserve the semantics/value of its source output; adding a message signature or a JSON approval is not enough. Do not casually spend a parent identity's definition outpoint as a fee/authorization input. **[V14]**

At registration time refresh relevant authorities and UTXOs. Ownership can have changed since commitment. Partial-signature workflows must identify which input, condition, and identity threshold remain unsatisfied. Do not treat “one key signed” or the existence of transaction hex as proof of a complete transaction.

## 6. Registration pricing and referrals

### 6.1 Integer calculations

Read registration settings from the resolved currency definition and apply the reference branches. Do not hard-code a quoted VRSC price or assume three referral levels on every namespace.

Let `F = idRegistrationFees`, `L = idReferralLevels`, with amounts in atomic units. These price settings are captured from the **parent** definition before gateway-converter substitution in the RPC and spending validator. The effective issuer then determines payment currency, `FeePricingCurrency`, and several branch/referral-level checks. Do not overwrite parent prices with converter prices merely because payment goes through a converter.

```text
if IDReferrals:
    referredTotal = floor(F * (L + 1) / (L + 2))
    perReferral   = floor(F / (L + 2))
else:
    referredTotal = F
    perReferral   = 0

minimumOffer = economicReferralsApply ? referredTotal : F
rewardTotal = actualRequiredReferralCount * perReferral
registrationRemainder = approvedOffer - rewardTotal
```

`IDReferralLevels()` returns zero unless the referral or referral-required option is enabled. The discount itself depends on `IDReferrals`, not merely referral-required authorization. Economic referrals require a supplied valid referrer and an applicable supported referral-level configuration: consensus takes the full-fee path if the effective issuer has zero referral levels or the referral is null. The RPC chooses its minimum based on whether a referral is supplied, so zero-level or differing parent/converter configurations need explicit acceptance fixtures. Preserve each C++ integer truncation step; do not compute in floating point and round the final display total. **[V15, V17]**

Convert JSON coin amounts into atomic integers once at the boundary with validated decimal handling, rejecting values that cannot be represented exactly under the chosen transport. The current TypeScript currency schema uses JSON numbers; arbitrary large monetary values may require lossless JSON parsing/string representations. There is also an unusual overload to preserve: `FeePricingCurrency()` interprets the issuer's internal `idImportFees` as a reserve-array index when it is fractional and the value is in range; otherwise it returns the issuer itself. JSON still emits that field using `ValueFromAmount`, so recover its internal integer before interpreting it as an index. This is distinct from the native chain's monetary `IDImportFee()`. **[V15, V19]**

A synthetic native example, solely to explain accounting: for `F=100` coins and `L=3`, the referred total is 80 and each reward is 20. With two required recipients, the registration transaction pays 40 in reward outputs and leaves 40 as its native registration fee. It does **not** pay 80 as a native fee plus another 40 in referrals. This is not a statement of current network prices.

### 6.2 Payment branches

| Issuance branch | Registration payment | Additional native requirements |
| --- | --- | --- |
| Ordinary native issuance | Registration remainder is the transaction's native fee; referral outputs carry their shares. | Commitment has its own ordinary transaction fee. |
| Active `PROOF_CHAINID` issuer branch | Remainder paid to issuer identity, in native value or issuer-token reserve output as the RPC constructs it. | RPC selects current chain `IDImportFee()` as native transaction fee when it creates the explicit payment output. |
| Token burn branch | `CReserveTransfer` with `VALID + BURN_CHANGE_PRICE`, issuer currency/value, issuer destination/import currency, and native fee currency. | Native `IDImportFee()` plus transfer-output fee/value from `GetTransactionTransferFee()`. |
| Fractional/gateway-converter issuance | Convert the relevant price amounts using the correct issuer state, then use the applicable payment/burn branch. | Native import/transfer costs remain separately funded. |

The `endBlock` and activation branches matter, including boundary behavior. The RPC and validation code are not identical at every historical/boundary case; use consensus fixtures to establish supported cases, not only a transcription of the RPC. In particular, test the native `PROOF_CHAINID` path and non-default gateway pricing before enabling them. The RPC constructs a native transparent issuer payment in one case while validators have reserve-output-specific checks. Moreover, consensus uses native transaction fees for `feePaid` when the issuer is the native chain, while the explicit-payment RPC branch sets the transaction fee to `IDImportFee()`. Changing only the output template may therefore still underpay. Treat that uncommon combination as unresolved until daemon acceptance establishes its valid accounting. **[V3, V4, V16]**

The commitment RPC currently selects `DEFAULT_TRANSACTION_FEE` (10,000 atomic units) for its ordinary fee. This is a reference default, not a universal future policy. The registration RPC also selects an extra `DEFAULT_TRANSACTION_FEE` worth of input coverage after setting the actual transaction fee; this coin-selection margin is not automatically an additional mandatory fee. Derive the actual fee from verified input/output values and the chosen branch. Never turn a coin-selection buffer into an unexplained charge. **[V2, V3]**

Quote fields should expose the commitment fee, total registration offer, each referral payment, issuer payment/burn, native import fee, transfer fee/output value, change by currency, and the total additional funding required. Credit any actual value in the commitment input. Keep `BN`/integer values internally and explicit decimal strings at persistence/UI boundaries.

### 6.3 Referral history

The referrer must satisfy same-parent/parent-identity rules. The RPC additionally requires an unrevoked valid referral at commitment creation and reads the referral state at `commitmentHeight - 1` when registering. Consensus requires the referring identity's **first** registration to precede the commitment strictly when applicable; an ID first mined in the same block as the commitment is too new. **[V2, V3, V17]**

Read the referrer's original defining transaction and reconstruct the referral ancestry from its ordered outputs. A current `getidentity` result can describe a later update, so its current `txid` is not necessarily the transaction needed. In this tree `getidentity(id, 0)` still uses the current height; zero is **not** a first-registration selector. `getidentityhistory(id, 0, commitmentHeight - 1)` supplies history entries with identity, block hash, height and output reference. Identify and verify the original creation transaction from that history, handling imported/bootstrap identities and unavailable history explicitly. Compare this adapter's result with C++ `LookupFirstIdentity` in fixtures. **[V20]**

Follow the native versus issuer-token payout scripts, referral-level cap, genesis/height-1 exceptions, parent-referral cases, and activation-dependent traversal. Validate exact recipient order/count and minimum amounts. Do not infer ancestry from display-name hierarchy, invent missing recipients, or pay only the immediate referrer when the chain requires more. An RPC history error must stop construction rather than silently reducing rewards.

### 6.4 Fractional pricing and expiry

Fractional registration validation reads pricing state at:

```text
pricingHeight = transaction.expiryHeight - DEFAULT_PRE_BLOSSOM_TX_EXPIRY_DELTA - 1
```

The delta is chain-dependent. It starts at the minimum of 20 and is initialized from block time with a clamp to 20–60 in this tree; it is not a universal 20 on every chain. The normal contextual transaction builder uses candidate height and network-upgrade rules, including expiry clipping at an incompatible epoch. Resolve the correct supported transaction context rather than setting an arbitrary future expiry. **[V16, V18]**

Bind a quote to the system, tip/block hash, intended expiry, pricing height/state, parent and issuer definitions, referral evidence, and approved amount limits. If expiry changes, recompute the corresponding pricing state and all amounts before re-signing. Implement `ReserveToNative` semantics with exact integers and daemon fixtures; a displayed spot-price multiplication is insufficient. Explicitly reject an unsupported pricing state instead of producing a plausible but invalid burn.

## 7. Changes to verus-typescript-primitives

### 7.1 Existing reusable support and precise gaps

| Area | Existing support | Required change |
| --- | --- | --- |
| Identity | `Identity`, `IdentityID`, `PartialIdentity`, complete identity serialization and scripts. | Reuse full `Identity`; add registration-specific validation without weakening update behavior. |
| Name handling | Name/parent and FQN derivation, normalization, C-locale case conversion. | Audit creation parity and expose a resolved-name contract; test explicit parent/network handling. |
| Reservation payloads | No `NameReservation`, `AdvancedNameReservation`, or `CommitmentHash` classes found. | Add serializable classes and JSON mappings, hash helpers, strict byte/field validation. |
| Smart-transaction envelope | `OptCCParams`, `SmartTransactionScript`, destinations and script helpers. | Add commitment/reservation builders/parsers using the existing envelope. |
| Advanced reservation eval | Enum exists as value 10. | Add it to both `OptCCParams.getParamObject()` and `isValid()` dispatch. Current parsing accepts the numeric header but these methods omit the eval. |
| Token payment objects | `TokenOutput`, `CurrencyValueMap`, `ReserveTransfer` and related destinations. | Reuse for fee/referral/burn outputs, with exact branch-specific construction. |
| Currency RPC data | JSON `CurrencyDefinition` and get-currency response types. | Add needed gateway-converter IDs/names, block-time and other proven schema gaps; model historical state responses and exact amount conversion. Do not assume a full serialized currency-definition/state implementation already exists. |
| Currency policy calculations | JSON fields are available, but no equivalent currency-option/ID-price methods. | Add tested integer option/registration-price helpers corresponding to C++ methods; keep RPC/state resolution in the client. |
| Exports | Central public export surface. | Export new primitives/types/constants consistently and test importability. |

**[P1–P5]**

Suggested files:

```text
src/pbaas/NameReservation.ts
src/pbaas/AdvancedNameReservation.ts
src/pbaas/CommitmentHash.ts
src/pbaas/transaction/IdentityCommitmentScript.ts
src/pbaas/transaction/IdentityReservationScript.ts
src/pbaas/OptCCParams.ts                         # extend existing dispatch
src/pbaas/index.ts                              # package submodule exports
src/index.ts                                   # public exports
src/__tests__/pbaas/...                         # cross-language fixtures
```

A shared reservation-script class discriminated by eval/payload is sufficient; separate legacy/advanced subclasses are optional. Provide `fromBuffer`, `toBuffer`, `getByteLength`, JSON conversion, `getCommitment`, and clearly separated syntactic versus creation validation following existing library conventions. Decode within explicit buffer bounds, reject truncated fields/trailing bytes where a complete payload is required, and avoid mutating input buffers during endian conversion.

Deterministic byte encoding belongs here. RPC lookup, funding selection, device random generation, user approval, broadcast, and registration jobs belong in the client/Mobile layers. A strict primitive constructor may accept explicit salt; Mobile supplies secure randomness before persisting its operation.

### 7.2 Compatibility and tests

Maintain legacy parsing because existing chain history/referrals may contain legacy reservations. Do not replace the legacy format with a parent-bearing schema under the same eval. Preserve absent-referral behavior and JSON metadata differences. Treat current creation support separately from forward-compatible inspection of unknown versions.

Add fixture-based tests for the exact binary objects and entire scripts, not just TS serialize/deserialize round trips. The advanced reservation enum omission needs a regression test that exercises `getParamObject`, validity, script parsing, and object recovery together. Existing identity-update, token-output, and smart-script tests must continue to pass.

## 8. Changes to verusid-ts-client

### 8.1 Architecture and API shape

Keep `VerusIdInterface` as the public entry point, following the existing identity-update build/complete/sign pattern, while moving substantial registration logic into focused internal modules. Separate chain resolution/quotation, deterministic construction, validation, and signing. Builders should return transaction data; they should not implicitly broadcast or hold an operation open waiting for confirmations. **[C1]**

The following types are illustrative API contracts, not existing exports or a required exact TypeScript signature:

```ts
type AtomicAmount = string; // base-10 integer; convert to BN internally
type Outpoint = { txid: string; vout: number };
type ChainSnapshot = {
  systemID: string;
  rootSystemName: string;
  tipHeight: number;
  tipHash: string;
  candidateHeight: number;
  expiryHeight: number;
  expiryDelta: number;
};

type ReservationPayload =
  | { kind: "legacy"; reservation: NameReservationJSON }
  | { kind: "advanced"; reservation: AdvancedNameReservationJSON };

type ReservationRecord = ReservationPayload & {
  schemaVersion: 1; // local API/persistence schema, NOT on-chain version
  reservationHex: string; // canonical serialized preimage; contains secret salt
  identityAddress: string;
  parentID: string | null; // null only for explicitly supported legacy root cases
  systemID: string;
  commitmentHashHex: string; // convention explicitly documented
  controller: Destination;
};

type SignatureRequirement = {
  input: Outpoint;
  role: "funding" | "commitment" | "issuer" | "referral";
  identityID?: string;
  threshold: number;
  eligibleKeyIDs: string[];
};

type PreparedRegistrationTransaction = {
  txHex: string;
  inputs: VerifiedPrevout[]; // exactly one per vin, in final transaction input order
  requiredSignatures: SignatureRequirement[];
  outputPlan: RegistrationOutputPlan;
  quote: RegistrationQuote;
  snapshot: ChainSnapshot;
  signingStatus: "unsigned" | "partial" | "complete";
};

createNameReservationTransaction({
  resolvedName, controller, referralID, salt, funding, change, snapshot
}): Promise<{
  reservation: ReservationRecord;
  transaction: PreparedRegistrationTransaction;
  commitmentVout: number;
}>;

createIdentityRegistrationTransaction({
  reservation, commitment: { outpoint, rawTransaction, confirmation },
  identity, funding, change, quote, snapshot
}): Promise<PreparedRegistrationTransaction>;
```

Supporting operations should include resolving/quoting a registration, completing funding with verified prevouts, validating a prepared/funded/signed transaction, and signing/merging partial transactions. Each `VerifiedPrevout` includes its raw source transaction, outpoint, script, actual values and chain evidence. Reuse existing result conventions where useful, but do not hide necessary metadata inside raw hex. Derive txids from final signed bytes; an unsigned transaction's txid is not a stable broadcast identifier when signatures change its bytes.

### 8.2 Chain-data requirements

Use the existing RPC interface for available methods, behind a registration-specific adapter that can be mocked and validated:

| Evidence | Purpose |
| --- | --- |
| Chain/native currency definition, current tip/block hash, upgrade context | Correct system, transaction version/branch, fee and expiry rules. |
| Parent and issuer/converter definitions | Namespace eligibility, authorization, referral policy, pricing/payment branch. |
| Identity lookup by exact i-address, current and historical | Availability, controllers/authorities, referral state before commitment. |
| Referrer's original registration transaction and block | Ordered ancestry and first-registration timing. |
| Raw funding and commitment transactions | Independently derive txid, outpoint bounds, script, native/reserve values. |
| UTXO/spent state and mempool/active-chain status | Detect spent commitment, competing registration, reorg, or double-spent funding. |
| Historical currency state at computed pricing height | Fractional price conversion and quote validation. |
| Broadcast response and transaction lookup | Idempotent submission and reconciliation after timeouts. |

Existing primitives support historical `getidentity` arguments. The daemon also exposes `getidentityhistory`, `getcurrencystate(currencyID, pricingHeight)`, and `gettxout(txid, vout, true)`, but the inspected primitives/RPC wrapper do not expose typed methods for these three reads. Add their request/response types in primitives and use the RPC interface's public generic `request<D>(ApiRequest)` through a narrow client adapter, or deliberately add convenience methods to `verusd-rpc-ts-client` as an ancillary fourth-repository change. `gettxout` accounts for mempool spends when requested and can inspect a zero-value commitment directly; a null result alone does not identify the spending transaction. Verify actual endpoint availability and preserve RPC errors. **[V20, C3]**

Remote `cansignfor`, `canspendfor`, or `isspendable` describe the remote wallet/indexer's view, not proof that Mobile controls the necessary keys. Establish local signability independently. Verify lookup binding and raw transaction consistency. A single RPC remains a trust dependency for chain-state truth unless a separate proof-verification design is implemented; do not label simple response validation full consensus verification.

### 8.3 Commitment builder algorithm

1. Resolve the leaf/parent/system and verify supported context. Check availability, eligible currency, mandatory authority/referral feasibility, and enough funding for the full two-stage operation.
2. Validate controller, optional referral and authorities. Return the expected registration-signature requirements before charging a commitment fee.
3. Accept a securely generated salt and create the appropriate reservation. Current PBaaS plus non-null parent selects advanced; legacy/null-root exceptions need explicit compatibility handling.
4. Serialize once, compute SHA256d, derive the expected identity address, and return the private record for durable storage.
5. Construct the commitment script with the correct nested threshold and index/master destination. Preserve zero output value.
6. Select only approved funding; return reserve/native change correctly. Validate exact output scripts and amounts, input values and total fee, and transaction context before signing.
7. Return the expected output index and complete signing metadata. Mobile persists the private record and then the signed bytes before broadcast.

Availability lookup can reveal the desired name to the RPC even though the on-chain commitment hides it. Keep the reservation salt/preimage out of telemetry and ordinary RPC calls until reveal; explain this privacy boundary accurately.

### 8.4 Registration builder algorithm

1. Reconstruct the reservation from saved bytes and verify all derived metadata. Require an explicitly identified `(txid, vout)`, not “the first commitment in this transaction.”
2. Hash the raw source transaction to verify its txid; bounds-check `vout`; parse the exact script. Require the ordinary name commitment form, matching hash, intended controller/authority policy, actual amounts, active-chain confirmation, and unspent state.
3. Refresh chain context, parent/issuer policy, availability, external authorities, signature feasibility, and funding. Reorg or changed authority returns a resumable error rather than creating another commitment automatically.
4. Construct the complete identity with the reserved name/parent, selected `systemID`, explicit primary keys and thresholds, and approved authorities/content. Require exact reserved name bytes.
5. Obtain and validate referral history; calculate the quote for the exact expiry/pricing context. Compare the quote against user-approved limits.
6. Construct identity, issuer payment/burn, ordered referrals, and reservation outputs. Freeze that semantic output plan.
7. Add the exact commitment input independently of normal coin selection; subtract its actual native/reserve value from funding need. Add any separately required authorized inputs only by explicit plan.
8. Fund the remaining amounts with eligible UTXOs, preserve every reserve balance, append change, and validate the final transaction.
9. Return per-input signature requirements and a construction receipt. After partial-signature merge, validate again before allowing broadcast.

### 8.5 Funding and validation must understand registration

The current identity-update client verifies raw prevout hashes, scripts, values, intended outputs, and fee deltas. Reuse these verification principles. Do not copy its assumption that the special input has zero satoshis; read the actual commitment output even though the standard builder creates zero-value commitments. **[C1]**

The pinned BitGo `unpackOutput` accepts identity-primary outputs only with its non-transfer option but rejects commitment, legacy reservation, and advanced reservation outputs. Its generic funded-transfer validator invokes this path for both inputs and outputs. BitGo's own optional-parameter dispatch also omits advanced eval 10; changing only this repository's primitive does not fix the transitive copy. **[B1, B2]**

Recommended containment: implement a registration-aware parser/validator and funding adapter in `verusid-ts-client`, using the new primitives for registration outputs and the existing transfer parsers only for supported ordinary funding/change outputs. An alternative is an explicit BitGo patch plus updated pins in both consumers. Decide this at the first implementation spike; do not disable output validation or pass an unrestricted “ignore unknown evals” flag.

The daemon's explicit-UTXO `fundrawtransaction` path has another important behavior: it skips zero-value candidates, preserves existing inputs, appends selected funding inputs, and inserts change **before the final template output**. If that final output is the reservation, the raw funded result has change inside the identity/reservation segment. The adapter must identify/verify the allowed change and place it after the reservation before any signatures are made, then validate the complete rebuilt output plan; alternatively construct funding/change locally. Never accept the funded transaction unchanged just because the RPC returned success. Pass the computed explicit native fee and prove accounting for any pre-existing nonzero mandatory input; input-value credit and excess-value change also need dedicated tests. **[V21]**

Validation must prove:

- All prevout bytes match their referenced transaction hashes and indexes; no duplicate input outpoints.
- Exactly the intended commitment is consumed; no unrelated identity definition, offer, or zero-value authorization output is selected accidentally.
- The identity and reservation bytes match the approved plan, including parent/system/authorities and commitment preimage.
- Issuer/referral scripts, currency IDs, recipients, amounts, and order match policy and the approved quote.
- Every other output is approved change or an explicitly approved output, with reserve balances and native fee accounted for.
- No unexpected shielded component, value balance, version/branch change, locktime/expiry mutation, or extra burn can hide value movement.
- Actual fees are within the approved branch-specific limits. Do not apply an update-sized default maximum to a legitimate registration fee.

### 8.6 Multiple signatures are explicit implementation work

A focused read-only experiment against the installed pinned BitGo dependency successfully signed a commitment input once, then rejected a second distinct key with `Key pair cannot sign for this input`. Its transaction builder expands a smart input around one public key and creates a one-element smart signature collection. The existing client loop over `keys[][]` does not establish signature merging. Another experiment confirmed advanced eval 10 was considered invalid/nonstandard by the current parser/classifier. These are dependency behavior checks, not daemon acceptance tests. **[B1, B2]**

Restricted namespaces can require controller and issuer/referrer signatures on the **same input**, with further thresholds inside identity destinations. Implement a smart-signature assembly/merge adapter using the dependency's exported `Transaction`, `ECPair`, `ECSignature`, `SmartTransactionSignature`, `SmartTransactionSignatures`, and `script`, or fix the dependency. These exports exist; verify their exact byte/digest semantics and daemon compatibility before committing to the adapter approach. A design proposal is not proof that the adapter is correct.

For each input: compute the proper chain/version-specific signature digest over the exact prevout script and value; sign with `SIGHASH_ALL`; merge keyed signatures without duplicates; preserve valid existing signatures; verify each signature and identity threshold; serialize the fulfillment in canonical form. Import/export of partial transactions must bind the full transaction plan and prevout evidence. Reject external completions that change outputs, fees, inputs, expiry, or chain context outside an explicitly approved rebuild.

External co-signing is a transaction authorization workflow, not the provider-provisioning webhook protocol. A local wallet lacking required keys should return a clear partial/missing-authority result, not broadcast and hope the node supplies signatures.

The dependency also applies a default maximum fee rate of 2,500 atomic units/byte in `build()`, and its fee guard uses a 32-bit `>>> 0` conversion on input values. A native registration's legitimate protocol fee can be large, so this is not an adequate monetary guard. The existing update client's default `maxFee=5` is also inappropriate as a universal registration limit. Use an explicit build/signing policy backed by independent integer accounting of the approved protocol charge and any extra fee. Neither disabling the guard nor using `buildIncomplete()` alone establishes safety or completeness. **[B2, C1]**

## 9. Changes to Verus-Mobile

### 9.1 Integrate with the active VerusID service

The active service overview and intro offer **Link VerusID**. Add **Register VerusID** alongside it. Existing provider provisioning is a different feature: it signs a `LoginConsentProvisioningRequest` and posts it to a provider webhook; it does not build the two on-chain transactions described here. Keep that path operational. The legacy personal-information identity saga is not the integration point for this feature. **[M1, M2]**

Use existing modal conventions for form/review/signing, plus a persistent registration detail/progress screen that reopens by job ID. A modal alone cannot own a process that waits for a mined commitment and must survive application termination.

| Existing integration point | Proposed work |
| --- | --- |
| VerusID service overview and intro | Add registration entry and pending-registration summaries. |
| Send-modal constants, dispatchers, component mappings | Add a registration modal type and appropriate form/confirmation/result components. |
| `utils/api/channels/verusid/requests/updateIdentity.js` pattern | Add registration wrappers around the new client builders, validation, signing, and broadcast. |
| `getVerusIdInterface(systemID)` | Reuse selected-system client/endpoint wiring; keep immutable network context per job. |
| Existing identity/currency lookup wrappers | Reuse lookup-binding validation; namespace selection must perform currency lookup. |
| Funding-source picker | Filter for supported signing and currencies; support multi-currency quote needs. |
| Encrypted VerusID service data | Add versioned `registration_jobs` with atomic state transitions. |
| VerusID wallet initialization/refresh | Load sanitized pending-job summaries; reconcile after unlock/resume. |

**[M1–M7]**

Suggested new modules, subject to the repository's final component layout:

```text
src/utils/api/channels/verusid/requests/registerIdentity.js
src/utils/identityRegistration/{jobs,reconcile,validation,selectors}.js
src/actions/actions/services/dispatchers/verusid/registration.js
src/components/SendModal/RegisterIdentity/...
src/containers/.../IdentityRegistrationProgress/...
```

### 9.2 Form, review, and approval

The basic flow should ask for a name and eligible namespace, choose supported wallet keys and funding, and show the resulting full name/i-address and costs. An advanced section can expose primary-address threshold, recovery/revocation IDs, referral, and supported optional identity data. Use the library's resolved name object throughout; do not copy provisioning's leaf splitting or recreate FQNs with ad hoc string concatenation.

Show the registration chain/network and namespace with the identity name on each review. A user's personal ID can be offered as recovery/revocation authority without suggesting it is a valid naming parent. Explain restricted-namespace authorization and missing co-signers before spending on a commitment. A namespace picker should resolve registered currency policy, not list every owned identity as an issuer.

Default to a wallet-controlled supported transparent key-hash primary address. The current `Principal` parser throws for compressed public-key principal entries; either keep that explicit creation restriction or extend the representation and tests before exposing all daemon-supported primary destinations. The protocol permits more than the current library implementation can necessarily round-trip. **[P1]**

Review two separately approved transactions. The first page shows the commitment fee and estimated remaining registration cost. After commitment confirmation, the second review shows the exact identity, authorities, required signatures, referral recipients, issuer payment/burn, native fees, and change. If the quote or identity configuration changes, request fresh approval of the actual transaction. A pending job is not indefinite permission to spend newly increased fees.

The existing update form assumes a simple fee delta, and its confirmation supplies one funding key to every input. Registration needs multiple currency deltas and keys selected by input role. Reuse presentation and authentication components, not those assumptions. **[M3]**

### 9.3 Durable state machine

Persist state transitions before an external effect. A useful state model is:

```text
draft -> quoted -> commitment_prepared -> commitment_signed
    -> commitment_pending -> commitment_confirmed
    -> registration_prepared -> registration_signed
    -> registration_pending -> registered

Additional resumable states:
  commitment_broadcast_unknown / registration_broadcast_unknown
  needs_funds / needs_authority / needs_review
  reorged / expired_transaction / conflict / cancelled_tracking
```

These names are application states, not node status strings. Model errors independently from the last successful durable stage so a failed lookup does not destroy recovery information.

1. Capture account/session scope and immutable chain/network context. Resolve intent, eligibility, signability, availability, and a two-stage funding estimate.
2. Generate salt using **`await randomBytes(32)`** from the existing native RNG wrapper. Reject zero or malformed results and abort if secure randomness fails. Never fall back to `Math.random()`.
3. Save the exact reservation bytes, controller, intended identity, and policy/quote snapshot in encrypted storage. Failure to persist must prevent commitment broadcast.
4. Construct/validate/sign the commitment; derive txid from signed bytes. Save signed bytes, txid, and commitment vout before sending.
5. If broadcast times out, enter unknown state and look up the locally derived txid. Re-send identical bytes when appropriate; do not generate another salt or commitment in response to uncertainty.
6. Track the actual block hash/height and unspent commitment. Advance only on verified active-chain confirmation, not a timer or estimated minute count.
7. Revalidate all reveal inputs and obtain a fresh quote. Build, review, sign, and persist the registration before sending. Collect required local/external signatures and explicitly distinguish partial from complete.
8. Reconcile unknown registration broadcast similarly. Preserve the reservation through failures and transaction expiry. A replacement reveal can reuse the existing confirmed commitment, after new validation and approval.
9. Confirm the expected identity on the intended chain. Verify the registration transaction/output and approved identity fields; then link it through existing service actions and refresh the wallet. Repeated completion must be idempotent.

If the identity has already been legitimately updated after creation, verify the original registration against the approved intent and assess its current state separately; do not erase a successful receipt merely because current fields changed. Conversely, a name existing with different registration evidence must not be misreported as this job succeeding.

### 9.4 Storage, secrets, and account isolation

Use a new versioned `registration_jobs` collection inside encrypted VerusID service data. The existing `modifyServiceStoredDataForUser` supports a queued callback operating on the latest decrypted data before re-encryption/write. Use that callback form so concurrent job updates do not replace the service object from a stale snapshot. Existing linking, provider-pending and cleanup actions can still read a snapshot before queuing and later replace the whole blob, overwriting newer jobs. Convert **all writers of that shared VerusID service record** to current-data callbacks, or isolate registration jobs in a separately protected encrypted record with equivalent account/session handling. Updating only the new job writers does not solve the race. **[M7, M8]**

Each job should retain:

| Group | Fields |
| --- | --- |
| Identity and ownership | Schema version, random job ID, revision, originating account, system/network, expected identity address, canonical leaf/parent and full display name. |
| Private reservation | Exact serialized reservation including salt, form/version, commitment digest and controller. |
| Approved intent | Complete identity configuration, referral, funding/change selections, signature-role plan, quote/policy snapshot, amount limits and approval revision. |
| Commitment | Signed bytes, txid/vout, actual prevout script/values, broadcast status, block hash/height. |
| Registration | Prepared/partially/finally signed bytes, txid, input descriptors, expiry/pricing context and missing signatures. |
| Recovery | Last durable stage, redacted error code, retry metadata, timestamps and final receipt. |

Do not store WIFs/private keys or authentication passwords in the job. Keep the salt, reservation bytes, and pre-broadcast reveal transaction out of Redux, navigation parameters, logs, analytics, crash reports, clipboard, and notifications. Redux receives only an explicit sanitized summary. Screens navigate by job ID and load protected data through the service layer. After reveal, the preimage is public on-chain, but still avoid retaining redundant secret-bearing diagnostics.

Do **not** reuse provider `pending_ids`: its records are copied into Redux, and old records are deleted after seven days during initialization. Registration recovery must not inherit that cleanup rule. Also, a new arbitrary `SecureStorage` key is not automatically encrypted in every path; use the established encrypted service-data mechanism. **[M7, M8]**

A seed can restore signing keys but cannot recreate an independently random reservation salt. Include pending jobs in the appropriate encrypted backup/export design, or clearly define the limitation before users delete the profile/app data. Verify restoration, password changes, migration, and device-storage failure. Do not delete a pending reservation simply because the UI was closed, a provider TTL elapsed, or a registration transaction expired.

Capture the existing account hash/session epoch before asynchronous work. Check session scope after lookups, after authentication, before saving state, and immediately before signing/broadcast. Use `requestPrivKey` with the originating request context. Cancel/suspend orchestration on sign-out or account switch; a delayed result must not write into the newly active account. Session invalidation cannot retract a transaction already sent, so reconcile that effect under the original job when the account returns. **[M9]**

### 9.5 Polling, failure recovery, and cancellation

Use bounded, account-scoped foreground/resume reconciliation with backoff. Mobile operating systems can suspend background JavaScript; app survival must not depend on a continuous timer. Reopen jobs on unlock and refresh balances/chain state without automatically requesting keys or spending.

Do not reuse `waitForTransactionConfirm` as the registration orchestrator. In this checkout it decrements `triesLeft` but tests `tries`, and rejects on error without always clearing its interval. More fundamentally, it is an ephemeral wait with no durable job recovery. Reuse basic transaction lookups where appropriate. **[M10]**

| Event | Required recovery |
| --- | --- |
| RPC error/timeout during availability lookup | Show unknown availability; no inference that the name is free. |
| Crash before commitment send | Resume persisted prepared/signed job; no new reservation unless explicitly replacing the old intent. |
| Timeout after either send | Check known txid, then reconcile/rebroadcast identical bytes. |
| Commitment reorg | Return to confirmation tracking; hold reveal until its input is valid again. |
| Commitment spent by intended registration | Reconcile that registration, including after an ambiguous previous send. |
| Commitment spent by another transaction | Report conflict/cancellation; keep evidence and stop trying to spend it. |
| Unconfirmed commitment transaction expires | Rebuild it using the saved reservation only after ruling out confirmation/acceptance and revalidating inputs; save its new signed txid/outpoint. |
| Reveal expires or funding input is spent | Keep reservation and confirmed commitment; rebuild/requote/reapprove registration. |
| Referral/issuer authority or price changes | Return to needs-authority/review; do not silently change the committed referral. |
| Name registered by someone else | Report loss of availability; offer supported commitment cleanup, not a refund claim. |
| User stops tracking | Explain that broadcast transactions remain effective. Preserve/export recovery material as appropriate. |
| User requests on-chain cancellation | Construct a separately reviewed signed commitment spend if still available; it can race a pending reveal and costs a fee. |

### 9.6 Completion and existing service actions

Use `linkVerusId` and `updateVerusIdWallet` after confirmation. Existing provider readiness detection looks for any wallet address among primary addresses; that is too weak as the registration completion criterion and does not prove threshold control. Compare the exact expected registration identity and actual signing capability, then allow watch-only linking only as a separately explicit product choice. **[M8]**

The generic `getSpendableUtxos` filter excludes zero-value outputs unless they have relevant reserve values, and it relies on transfer-oriented output unpacking. Supply the commitment and any special authorization inputs explicitly through the registration plan. Keep ordinary funding selection from sweeping other pending commitments. **[M5]**

## 10. Validation and test plan

### 10.1 Cross-language fixtures are the foundation

Produce deterministic fixtures from the intended daemon revision/test chain: input JSON, serialized payload hex, commitment raw bytes/display hex, derived identity ID, complete output scripts, raw transactions, relevant currency definitions/state, block heights/hashes and expected acceptance/rejection. Use fixed asymmetric salt/ID bytes so endian bugs are visible. Avoid fixtures whose parent and referral are both all-zero except for explicit null cases.

For serialization, TS round-trip tests alone can pass when both directions share the same mistake. Require C++ ↔ TypeScript byte equality for legacy/advanced reservations, commitments, the composed identity script, normal/restricted commitment scripts, reservation scripts, referral outputs, and issuer payment/burn outputs.

### 10.2 Required scenarios

| Layer | Positive coverage | Rejection/failure coverage |
| --- | --- | --- |
| Primitives | Legacy and advanced payloads, JSON conversion, null referral, UTF-8 byte boundaries, exact scripts, public exports. | Zero salt, bad hex/endian convention, truncated/extra bytes, unsupported emit version, overlong/invalid name, malformed CC parameters. |
| Names and parents | Native and testnet roots, explicit registered parent, nested eligible currency hierarchy, case-insensitive ID plus preserved name bytes. | Parent applied twice, inconsistent FQN/parent, bare personal-ID parent, NFT/NoIDs, wrong registration system, address-like names. |
| Commitment | Correct ordinary and restricted scripts, explicit zero-value outpoint, nonzero value accounting if supported. | Wrong vout/hash/controller, unrelated offer commitment, duplicate inputs, mempool-only/same-block source, spent/reorged commitment. |
| Identity | Self authorities, external valid authorities, supported optional content, supported multi-key thresholds. | Wrong reserved name bytes/parent/system, invalid or duplicate primary keys, excessive threshold, revoked/missing external authorities, unexpected flags. |
| Referrals | None; one/multiple ancestors; first registration history; parent and genesis cases; referral-required authorization. | First registration not before commitment, wrong parent, missing/extra/reordered recipients, wrong currency/amount, history unavailable. |
| Fees | Native fee remainder, issuer payment, token burn, native import/transfer cost, exact integer conversions. | Double-counted referrals, fee above approval, wrong burn flags/destination, missing native fee, changed quote/expiry/pricing state, 32-bit overflow. |
| Funding | Native/reserve change, explicit mandatory input, verified raw prevouts, multi-input order. | Forged UTXO metadata, extra input/output, changed change destination, unauthorized reserve burn, injected shielded value flow, special-output sweep. |
| Signing | Distinct controller/funding keys, same-input multi-key signatures, identity threshold, safe partial merge. | Wrong sighash/chain/script/value, duplicate signature counted twice, insufficient threshold called complete, modified external completion. |
| Persistence | Restart at every stage, accepted send followed by timeout, identical-byte retry, protected restore. | Salt lost/regenerated, broadcast before durable write, provider-TTL deletion, secret leakage, concurrent stale updates. |
| Session/UI | Clear two-stage review, multiple fee currencies, namespace policy, completion/linking. | Account switch/logout during query/auth/sign/send, stale quote silently approved, partial transaction broadcast, reorg misreported as success. |

Test token/fractional/gateway and `PROOF_CHAINID` combinations against the daemon, including activation and `endBlock` boundaries. Some combinations may prove unsupported in this reference tree; expose explicit capability errors until acceptance is established. Include a native parent and at least one real eligible non-native namespace in the release gate. Restricted-parent support also needs a real registration with multiple signatures on one input.

### 10.3 Existing tests and commands to extend

Primitives already have address, identity, and identity-script tests. The client has identity-update tests that inject RPC handlers, verify raw prevout bytes rather than supplied metadata, and check UTXO order against transaction inputs. Extend those conventions for registration-specific assertions. **[P5, C2]**

Useful Mobile regression suites include `provisionIdentitySession`, `verusIdNotificationSession`, `verusIdCallerSession`, `identitySignatureThreshold`, `identityStateChangeConfirmation`, `currencyTransferIntent`, `transactionSecurity`, `secureRandomPolicy`, `secureStoreTransitions`, `secureStoreNotifications`, and `fundRawTransactionError` under `src/utils/__tests__/unit/`. Keep provider provisioning and identity updates passing. **[M11]**

After implementation, run focused new tests plus package build/lint checks (`npm run build`, `npm run lint`) and the appropriate offline suites using each package's established install workflow. Primitives uses `npm test`. The client's Jest configuration includes `src/__tests__/live/`, so use an explicit offline command such as `npm test -- --testPathIgnorePatterns=/live/`; run its full/live suites only with their configured endpoint/test environment. Mobile uses pnpm and Jest; run targeted `pnpm test` suites, applicable lint checks, and actual Android/iOS testnet flows. Test native RNG, keychain/authentication, suspension, app termination, account changes, and recovery on devices/emulators. Do not invoke live/broadcast tests against user funds as part of a routine unit-test run.

No new runtime implementation was made for this study, so these acceptance tests have **not** been run. The limited dependency parser/signing experiments described above establish gaps only.

## 11. Delivery sequence and completion criteria

1. **Establish the compatibility target.** Pin the intended daemon source/build and supported networks/activation context. Capture C++ fixtures and settle first-registration/history/currency-state RPC access. Reconcile differences between this modified working tree and deployment targets.
2. **Land primitive support.** Add payload classes, scripts, exports, eval-10 dispatch, name/creation validation, and fixture tests. Decide whether to extend compressed-public-key principals or explicitly support key-hash creation first.
3. **Prove the transaction dependency path.** Implement registration parsing/funding validation and same-input signature aggregation in the client, or land a deliberate BitGo fix. Verify fee guards and large values. Demonstrate daemon acceptance for a native registration and a restricted namespace before building the whole UI around it.
4. **Land client builders.** Add immutable reservation results, explicit mandatory input, policy/quote resolution, ordered fee/referral outputs, verification, partial/completed signing, and typed errors. Exercise all supported payment branches.
5. **Land Mobile persistence and orchestration.** Implement encrypted jobs, state transitions, idempotent send/reconcile, session isolation, redacted summaries, and backup/recovery behavior before exposing paid creation.
6. **Land Mobile UI and linking.** Add namespace/name/funding/authority selection, two-stage approvals, pending/retry/co-signing views, completion, and correct fee accounting.
7. **Update dependencies and release.** Move primitives dependency and resolution pins together in the client; release/build `dist` and `lib` according to package conventions. Pin/install the resulting versions in Mobile, update its lockfile/resolutions, and ensure there is one compatible primitives/BitGo representation on each path. Git-pinned consumers do not automatically use sibling source changes.

Completion requires a user to create and recover an interrupted native identity registration and an eligible sub-identity registration through Mobile; demonstrate the advertised referral/restricted/multi-currency branches; reject unsupported parents before commitment; verify exact transaction intent before signing; and survive restart/reorg/ambiguous broadcast without losing the salt or paying twice. Unsupported capabilities must be visible before the first fee is paid.

## 12. Decisions and uncertainties to resolve during implementation

These are concrete engineering gates, not reasons to omit the relevant feature from the design:

- **Deployment parity:** which daemon release/working-tree changes are the actual compatibility target? The local reference is modified.
- **Dependency strategy:** registration-aware client adapter versus a BitGo patch, including smart-signature aggregation and monetary fee guards. Either must be tested against the daemon.
- **RPC evidence coverage:** first-registration retrieval, unspent status including zero-value CC outpoints, historical currency state, and block/activation context through the selected Mobile endpoint. Extend a typed wrapper only where needed.
- **Non-default economic branches:** gateway definitions can distinguish parent price settings from converter settings, and RPC/validator/end-block branches need matched acceptance fixtures. Quote only proven supported combinations.
- **User-controlled signing scope:** basic local key-hash IDs, multi-key IDs, externally approved restricted namespaces, and compressed public-key principals need explicit supported capability descriptions. Do not conflate UI readiness with consensus support.
- **Pending-secret backup:** choose an encrypted backup/restore/export mechanism and retention policy; random salt cannot be recovered from seed alone.
- **Private funding:** the existing transparent client path does not implement local Sapling construction. If offered, separately design native private-source funding; daemon wallet code alone is not mobile support.

## 13. Source index

Paths below are relative to this document. Line references describe the working trees inspected on the study date and may move. The protocol reference is C++ validation together with construction code; a comment or RPC help string alone is not treated as consensus.

### VerusCoin

| Ref | Source and relevant locations |
| --- | --- |
| V1 | [identity.h](../../VerusCoin/src/pbaas/identity.h): 39–108 commitment; 110–174 legacy reservation; 176–251 advanced reservation. [komodo_defs.h](../../VerusCoin/src/komodo_defs.h): 8 name-size constant. |
| V2 | [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 14503–14935 `registernamecommitment`, especially 14619–14762 policy/name/script and 14812 funding. [wallet.h](../../VerusCoin/src/wallet/wallet.h): 52 ordinary default fee. |
| V3 | [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 14937–15783 `registeridentity`; 15032–15164 parent/pricing; 15265–15378 commitment verification; 15379–15534 ordered outputs/referrals; 15535–15755 fees/funding/build. |
| V4 | [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 1069–1850 registration spending validation; 1542–1550 duplicate ID; 1590–1603 commitment/maturity; 1860–2277 reservation precheck, especially 2243–2248 active-chain reference. |
| V5 | [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 3466–3573 commitment spend, matching reveal and cancellation; 3576–3585 unspendable reservations. |
| V6 | [reserves.cpp](../../VerusCoin/src/pbaas/reserves.cpp): 2888–2917 exact reservation/identity name and parent equality. [txmempool.cpp](../../VerusCoin/src/txmempool.cpp): 626–660 duplicate registration tracking. |
| V7 | [pbaas.cpp](../../VerusCoin/src/pbaas/pbaas.cpp): 7703–7724 cached currency lookup; [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 113–278 currency-definition lookup; [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 1292–1344, 1519–1539, 1902–1988 namespace/system/converter rules; [crosschainrpc.h](../../VerusCoin/src/pbaas/crosschainrpc.h): 1208–1241 `NoIDs`, NFT and name-controller helpers. |
| V8 | [key_io.cpp](../../VerusCoin/src/key_io.cpp): 1729–1766 `CleanName`, 1800–1822 `GetID`; [vdxf.cpp](../../VerusCoin/src/pbaas/vdxf.cpp): 60–159 trimming/filtering, 187–259 subname parsing; [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 2181–2190 address-like name rejection. |
| V9 | [hash.h](../../VerusCoin/src/hash.h): 118–163 `CHashWriter` and serialized `GetHash`. |
| V10 | [core_write.cpp](../../VerusCoin/src/core_write.cpp): 1541–1579 reservation JSON. |
| V11 | [identity.h](../../VerusCoin/src/pbaas/identity.h): 253–354 principal versions/limits; 386–401 flags/parent/system; 747–757 identity validity. [key_io.cpp](../../VerusCoin/src/key_io.cpp): 1873–1921 identity output composition. [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 2533–2550 unique primary destinations, 2630–2781 script conditions. |
| V12 | [eval.h](../../VerusCoin/src/cc/eval.h): 41–59 identity evaluation codes. |
| V13 | [CCinclude.h](../../VerusCoin/src/cc/CCinclude.h): 97–110 single-condition script, 154–172 three-condition script. [script.cpp](../../VerusCoin/src/script/script.cpp): 596–619, 686–704 reconstructed master parameters during parsing. |
| V14 | [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 1105–1193 issuer permission, 1195–1289 referral-required authorization. [crosschainrpc.h](../../VerusCoin/src/pbaas/crosschainrpc.h): 556–575 currency option flags. |
| V15 | [crosschainrpc.h](../../VerusCoin/src/pbaas/crosschainrpc.h): 1289–1353 permission/referral flags and fee helpers. |
| V16 | [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 1328–1344 and 1969–1988 fractional pricing; 1379–1457 and 2034–2100 fee output branches; 1643–1647 native import fee. |
| V17 | [identity.cpp](../../VerusCoin/src/pbaas/identity.cpp): 1623–1634 referral age, 1671–1755 parent/history/order checks. [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 15440–15515 historical referral construction. |
| V18 | [main.cpp](../../VerusCoin/src/main.cpp): 110 default delta, 10438–10470 contextual transaction creation. [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 457 chain-derived expiry delta. [crosschainrpc.h](../../VerusCoin/src/pbaas/crosschainrpc.h): 534–535 expiry bounds. |
| V19 | [crosschainrpc.h](../../VerusCoin/src/pbaas/crosschainrpc.h): 972–982 fee-pricing reserve index; [core_write.cpp](../../VerusCoin/src/core_write.cpp): 337–339 monetary JSON fields, 363–373 converter/block-time fields; [crosschainrpc.cpp](../../VerusCoin/src/pbaas/crosschainrpc.cpp): 1160–1166 amount parsing. |
| V20 | [pbaasrpc.cpp](../../VerusCoin/src/rpc/pbaasrpc.cpp): 16868–16885 `getidentity` height interpretation; 17178–17321 `getidentityhistory`; 12806 onward `getcurrencystate`; [blockchain.cpp](../../VerusCoin/src/rpc/blockchain.cpp): 1422–1502 `gettxout`. |
| V21 | [rpcwallet.cpp](../../VerusCoin/src/wallet/rpcwallet.cpp): 5311–5330 zero-value funding candidates, 5343–5379 input/fee accounting, 5406–5424 appending funding inputs and inserting change. |

### TypeScript primitives, client, and transaction dependency

| Ref | Source and relevant locations |
| --- | --- |
| P1 | [Identity.ts](../src/pbaas/Identity.ts): 48 initialization type, 75 versions, 168 sizing, 237 serialization, 533 JSON; [Principal.ts](../src/pbaas/Principal.ts): 106–117 principal parsing/public-key limitation; [IdentityScript.ts](../src/pbaas/transaction/IdentityScript.ts): 17 construction. |
| P2 | [OptCCParams.ts](../src/pbaas/OptCCParams.ts): 66 and 104 eval dispatch; [evals.ts](../src/utils/evals.ts): 12 advanced eval and alias, 21–22 commitment/reservation; [SmartTransactionScript.ts](../src/pbaas/transaction/SmartTransactionScript.ts): 18–24, 48–52 envelope. |
| P3 | [address.ts](../src/utils/address.ts): 48 leaf/parent derivation, 66–142 FQN handling, 238/303 parsing/cleaning; [hash.ts](../src/utils/hash.ts): 3 SHA256d. |
| P4 | [CurrencyDefinition.ts](../src/currency/CurrencyDefinition.ts), [TokenOutput.ts](../src/pbaas/TokenOutput.ts), [ReserveTransfer.ts](../src/pbaas/ReserveTransfer.ts), [GetIdentityRequest.ts](../src/api/classes/GetIdentity/GetIdentityRequest.ts), [GetCurrencyResponse.ts](../src/api/classes/GetCurrency/GetCurrencyResponse.ts), [FundRawTransactionRequest.ts](../src/api/classes/FundRawTransaction/FundRawTransactionRequest.ts): explicit fee support. |
| P5 | [pbaas/index.ts](../src/pbaas/index.ts), [index.ts](../src/index.ts), [address.test.ts](../src/__tests__/utils/address.test.ts), [identityscript.test.ts](../src/__tests__/pbaas/transaction/identityscript.test.ts), [package.json](../package.json). |
| C1 | [VerusIdInterface.ts](../../verusid-ts-client/src/VerusIdInterface.ts): 1457–1501 prevout verification; 1529–1597 completion/zero-valued special input; 1782 update builder; 1789 fee default; 1881 update+transfer; 2059 signer. [index.ts](../../verusid-ts-client/src/index.ts): public exports. |
| C2 | [verusidupdate.test.ts](../../verusid-ts-client/src/__tests__/verusidupdate.test.ts): 10 UTXO shapes, 21 order, 35 injected RPC, 148 bad metadata; [package.json](../../verusid-ts-client/package.json): 50–58 pinned dependencies/resolutions; [jest.config.js](../../verusid-ts-client/jest.config.js): live tests included in default discovery. |
| C3 | [VerusdRpcInterface.ts](../../verusd-rpc-ts-client/src/VerusdRpcInterface.ts): 153 public generic request transport, 260 onward typed methods. |
| B1 | [smart_transactions.ts](../../BitGoJS/src/smart_transactions.ts): 391–488 unpacking, 648/671 validation, 959–978 funded builder; [optccparams.js](../../BitGoJS/src/optccparams.js): 25/65 dispatch; [smarttransaction/output.js](../../BitGoJS/src/templates/smarttransaction/output.js): 24 validity/classification. |
| B2 | [transaction_builder.js](../../BitGoJS/src/transaction_builder.js): 265 single-key expansion, 501 fee guard default, 787 build guard, 827–876 signing, 934–944 fee arithmetic; [smart_transaction_signatures.js](../../BitGoJS/src/smart_transaction_signatures.js): 8/42 collection; [smart_transaction_signature.js](../../BitGoJS/src/smart_transaction_signature.js): 5/63 entries; [index.js](../../BitGoJS/src/index.js): 13 exports. |

### Verus-Mobile

| Ref | Source and relevant locations |
| --- | --- |
| M1 | [VerusIdServiceOverview.render.js](../../Verus-Mobile/src/containers/Services/ServiceComponents/VerusIdService/VerusIdServiceOverview/VerusIdServiceOverview.render.js): 58–85; [VerusIdServiceIntroSlider.js](../../Verus-Mobile/src/containers/Services/ServiceComponents/VerusIdService/VerusIdServiceIntroSlider/VerusIdServiceIntroSlider.js): 58–85; [sendModal constants](../../Verus-Mobile/src/utils/constants/sendModal.js): 67–75; [SendModal.render.js](../../Verus-Mobile/src/components/SendModal/SendModal.render.js): 76–116; [modal dispatchers](../../Verus-Mobile/src/actions/actions/sendModal/dispatchers/sendModal.js): 137–149, 186–194, 228–244. |
| M2 | [ProvisionIdentityForm.js](../../Verus-Mobile/src/components/SendModal/ProvisionIdentity/ProvisionIdentityForm/ProvisionIdentityForm.js): 35–76, 215–250; [ProvisionIdentityConfirm.js](../../Verus-Mobile/src/components/SendModal/ProvisionIdentity/ProvisionIdentityConfirm/ProvisionIdentityConfirm.js): 105–113, 170–194. |
| M3 | [updateIdentity.js](../../Verus-Mobile/src/utils/api/channels/verusid/requests/updateIdentity.js): 8–59 source validation, 74–130 construction, 237–246 broadcast; [UpdateIdentityForm.js](../../Verus-Mobile/src/components/SendModal/UpdateIdentity/UpdateIdentityForm/UpdateIdentityForm.js): 41–62 fee delta; [UpdateIdentityConfirm.js](../../Verus-Mobile/src/components/SendModal/UpdateIdentity/UpdateIdentityConfirm/UpdateIdentityConfirm.js): 38–47 signing. |
| M4 | [vrpcInterface.js](../../Verus-Mobile/src/utils/vrpc/vrpcInterface.js): 346–388 client factory; [getIdentity.js](../../Verus-Mobile/src/utils/api/channels/verusid/requests/getIdentity.js): 5–35; [getCurrency.js](../../Verus-Mobile/src/utils/api/channels/verusid/requests/getCurrency.js): 4–29 lookup binding. |
| M5 | [getAddressUtxos.js](../../Verus-Mobile/src/utils/api/channels/vrpc/requests/getAddressUtxos.js): 11–35 funding filter; [sendRawTransaction.js](../../Verus-Mobile/src/utils/api/channels/vrpc/requests/sendRawTransaction.js): 3–5 broadcast. |
| M6 | [IdentityUpdatePaymentConfiguration.js](../../Verus-Mobile/src/containers/DeepLink/IdentityUpdatePaymentConfiguration/IdentityUpdatePaymentConfiguration.js): 76–95, 153–168 funding picker. |
| M7 | [services.js](../../Verus-Mobile/src/actions/actions/services/dispatchers/services.js): 86–133 queued encrypted mutation; [serviceStoredDataStorage.js](../../Verus-Mobile/src/utils/asyncStore/serviceStoredDataStorage.js): 9–23, 52–73; [secureStore.js](../../Verus-Mobile/src/utils/keychain/secureStore.js): 1008–1027 selective encryption, 1265–1273 service data. |
| M8 | [verusid.js](../../Verus-Mobile/src/actions/actions/services/dispatchers/verusid/verusid.js): 64–89 linking, 116–147 provider pending records, 346–359 readiness, 405–424 cleanup; [VerusidWalletReduxManager.js](../../Verus-Mobile/src/actions/actions/channels/verusid/dispatchers/VerusidWalletReduxManager.js): 35–55 initialization, 60–73 refresh, 86–98 pending-ID projection. |
| M9 | [sessionRequests.js](../../Verus-Mobile/src/actions/actions/updates/sessionRequests.js): 11–32; [authBox.js](../../Verus-Mobile/src/utils/auth/authBox.js): 108–155; [randomBytes.js](../../Verus-Mobile/src/utils/crypto/randomBytes.js): 4–22. |
| M10 | [getTransaction.js](../../Verus-Mobile/src/utils/api/channels/vrpc/requests/getTransaction.js): 3–45 transaction lookup and interval wait. |
| M11 | [unit tests](../../Verus-Mobile/src/utils/__tests__/unit/), [package.json](../../Verus-Mobile/package.json): scripts, runtime and dependency requirements. |

### Working-tree source fingerprints

These SHA-256 hashes identify the main modified C++ files used for this study; they are content fingerprints, not Git object IDs:

```text
src/pbaas/identity.h       c47b0f5194605d59cfce16e4761fb4341e9f41b00d84d07f5fe0b04317e0db77
src/pbaas/identity.cpp     1637ae4833d358072fec5df255f5ea629ad54dfa83bb4b4b40db6013db012393
src/rpc/pbaasrpc.cpp       7c558c3ff2567be372b274b1115b529a864fec6044afd1b456844e1b38ea6171
src/pbaas/crosschainrpc.h  c97a72d589d376a82d234c436b77aa5e52f638b9664a2d948718b6dd32ba8a30
src/key_io.cpp            75365d70d450a767be1a63de376cae3ce09b9c89bf100d7f052a51331f60bfca
src/pbaas/vdxf.cpp         d70995d43c50e5a435cab4582dc57881aecf755529b72aef40784277cf136bb3
```
