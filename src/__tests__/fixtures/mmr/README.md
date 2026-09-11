# Verus MMR wire fixtures

`veruscoin-v1.json` combines two kinds of compatibility vectors:

- canonical, source-derived encodings for daemon `VARINT`, CompactSize,
  standalone branch types 1–5, and polymorphic `CMMRProof` framing;
- proofs captured from the local VRSCTEST daemon at pinned heights, including
  both sides of the 127/128 and 16511/16512 `VARINT` transitions and two real
  identity transaction proofs.

The live records keep serialized (`wireHex`) and RPC-display (`displayHex`)
hash byte order separate. The checked-in fixture is used by normal tests, so CI
does not need a daemon.

To deliberately refresh it, run:

```sh
VRSCTEST_RPC_URL=http://127.0.0.1:18843 \
VRSCTEST_RPC_USER=... \
VRSCTEST_RPC_PASSWORD=... \
yarn fixtures:mmr
```

The generator performs only read-only RPC calls, validates the pinned chain
anchor before writing, and never includes RPC credentials in its output.
Review the resulting fixture diff before accepting a refresh.
