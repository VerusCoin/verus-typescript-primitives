# Identity registration parity fixtures

These fixtures use the local VRSCTEST daemon as an independent oracle. Tests run
offline; regeneration needs an indexed node with the pinned historical data.

| File | Coverage | Daemon oracle |
| --- | --- | --- |
| `veruscoin-v1.json` | Six mined commitment/reservation pairs and their full identities: legacy root, native, sub-identity, referrals, mixed case, Unicode and emoji | `getrawtransaction`, `decodescript`, `getvdxfid` |
| `names-v1.json` | 70 name vectors, 560 resolver inputs and 29 negative inputs; native and nested namespaces, explicit roots, ASCII case folding and UTF-8 boundaries | `getvdxfid` |
| `scripted-v1.json` | 58 independently encoded scripts, seven creation-policy comparisons and one malformed daemon JSON diagnostic; authority types, two-of-two conditions, tagged token amounts and serialization boundaries | `decodescript` |
| `identities-v1.json` | 15 independently encoded full identities; versions 1–3, null parents, authority thresholds, content maps, multimap lengths/ordering, private addresses and invalid null keys | `decodescript`, `getvdxfid` |
| `data-v1.json` | Eight currency definitions, six identity histories with proofs, six currency-state queries (including OHLC/volume), six spent commitments and one unspent zero-value reservation | `getcurrency`, `getidentityhistory`, `getcurrencystate`, `gettxout` |

The C++ reference is `../VerusCoin` revision
`ed2be9f45bbe34bfe32e0c61c2397f08d64d28d6`. Each corpus records the running daemon
version and capture provenance. The generators do not import this package's
serializers: synthetic payloads/scripts are independently encoded, then decoded
by the daemon. Mined outputs retain exact scripts, extracted payloads, daemon JSON,
transaction/output IDs and pinned block hashes. Their reservation SHA256d must
match an earlier commitment actually spent by the registration transaction.

The captures contain no keys, RPC credentials or unbroadcast reservation secrets.
Historical reservation salts are public examples and must not be reused. History
responses retain the daemon's `cansign`/`canspend` observations.

## Regeneration

```sh
# Set VRSCTEST_RPC_URL, VRSCTEST_RPC_USER and VRSCTEST_RPC_PASSWORD in your shell.
npm run fixtures:identity-registration
```

The aggregate command runs all five generators. Individual commands append
`:mined`, `:names`, `:scripts`, `:identities` or `:data`. Authentication is read
only from the environment. RPC calls are read-only: the generators also use
`getinfo` and `getblockhash` to validate chain context and historical anchors.
They do not fund, sign or broadcast transactions. Tests run with
`npm test -- --runInBand --watchman=false`.

History and currency-state queries use explicit heights. Currency definitions
are anchored to their definition transactions. Tip-relative fields such as
confirmations, current currency state and UTXO metadata may change on regeneration.
UTXO presence does not imply consensus spendability; reservation outputs are
unspendable.

Each currency-state capture also records `proxyCompatibleParams`. The generator
queries the daemon with both the original parameters and the string heights
required by the Rust proxy, and checks that their results are identical.

## Interpretation and limits

- Decoding proves wire/JSON compatibility, not current consensus acceptance of a
  new transaction. Restricted two-party scripts are independently constructed
  and daemon-decoded; this corpus does not claim a mined restricted registration.
  Daemon `reqSigs` describes the master indexing condition; tests separately
  inspect the inner two-of-two authority condition.
- Name tests distinguish daemon normalization/truncation and VDXF fallback from
  strict creation validation. Creation rejects ambiguous or oversized input
  instead of silently changing the requested name. Advanced null-parent payloads
  require explicit root context. Legacy root reservations require an explicit
  absolute-parent context; their daemon JSON parent metadata is not committed.
- Identity tests verify canonical content-map ordering, historical omission of
  `contentmultimap`, null-key rejection and reconstruction of the omitted version
  1 system ID with chain context. Empty multimap values survive binary parsing
  but are omitted by daemon JSON, so that JSON projection is intentionally lossy.
- Tagged commitment fixtures retain original numeric JSON tokens and exact
  atomic strings at signed 64-bit boundaries. For `INT64_MIN`, this daemon emits
  a malformed JSON number (`--92233720368.-54775808`); the raw response is retained
  as a diagnostic, while binary tests verify the valid signed amount.
- Historical proof tests inspect raw proof bytes and embedded identity scripts;
  they do not perform full cryptographic proof verification. Fee tests apply the
  referenced C++ formulas to real currency definitions, rather than claiming a
  transaction fee quote from the daemon.
