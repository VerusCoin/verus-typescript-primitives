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

## Core methods and upload commitments

`daemon-core.json` is produced by `scripts/generate-mmr-core-fixtures.py`. It
extracts the local daemon's MMR algorithm bodies unchanged and compiles them with
the small storage/hash adapters in `scripts/fixtures/mmr-core-harness.cpp`.
Undefined-behavior sanitization aborts on the first error. The fixture covers
roots, all positions in small trees, larger boundary positions, normal/power
branch checks, invalid positions, equal siblings and direction-index limits.
The duplicate-peak daemon proof-generation defect has a named fixture; tests
verify the correct TypeScript proof rather than copying that invalid output.

```sh
npm run fixtures:mmr:core
# Optional alternate checkout/dependency prefix:
VERUS_DEPENDS_PREFIX=/path/to/depends/prefix \
  python3 scripts/generate-mmr-core-fixtures.py /path/to/VerusCoin
```

`daemon-rpc.json` contains 576 synthetic unsigned tree captures through 65,537
leaves, including repeated leaves, mixed hash-only leaves and all nine supported
object/MMR hash combinations. A second `signdata` call commits to the daemon's
own tagged descriptor serialization. Expected roots and commitments come from
RPC, not from the TypeScript code under test. SHA-256 supplied hash strings use
digest order; SHA-256D/Blake2b supplied hash strings use reversed display order.

The RPC generator also checks 45 encrypted components (root, hash vector and
three distinct leaves for each hash combination) in both directions using the
daemon and a native adapter. The expanded encryption matrix authenticates 815
additional components, including empty hash-only descriptors, mixed leaf vectors
at 252/253/254 entries, and payloads around both CompactSize boundaries. It sends
68 representative components and all nine complete MMR hash combinations through
both encryption directions. Negative captures cover wrong viewing keys, damaged
authentication tags and truncated ciphertext.
The offline tests check captured plaintext commitments; they do not run native
encryption on each Jest invocation.

`public-recipient.json` is a synthetic, publicly reproducible test recipient;
its viewing key is intentionally public. `scripts/mmr-native-crypto.c` links to
the daemon's librustzcash/libsodium, implements the descriptor KDF/framing, and
is test tooling only. Its header contains the macOS build command. Adjust the
dependency prefix/linker flags for another platform. After compiling the adapter:

```sh
npm run build
VRSCTEST_RPC_URL=http://127.0.0.1:18843 \
VRSCTEST_RPC_USER=... \
VRSCTEST_RPC_PASSWORD=... \
VERUS_NATIVE_CRYPTO=/tmp/local-upload-native-crypto \
  npm run fixtures:mmr:rpc
```

Set `VERUS_DAEMON_SOURCE` to inspect a checkout other than `../VerusCoin`.
The fixture records its source revision, source hashes, relevant working-tree
state and the native adapter/executable hashes. RPC-reported daemon version is
recorded separately: the running binary's source revision is not exposed by RPC
and is not inferred from the local checkout. Encryption uses fresh ephemeral
keys, so ciphertext changes when regenerating; plaintext commitments are stable.
Completed sections are checkpointed in the temporary directory before the final
fixture is replaced, so a failed RPC does not discard all capture progress.

Captured rejected requests include bare-string MMR leaves and the daemon's
current base64 parsing defect. Metadata cases record lossy whitespace and UTF-8
truncation, which the lossless daemon JSON methods deliberately reject.

The boundary helpers in `scripts/fixtures/` enumerate optional descriptor fields,
numeric limits, null/default handling, metadata byte limits and every character
in the daemon's metadata normalization alphabet. Request captures cover recognized
key precedence in both insertion orders, malformed encodings, prior-MMR behavior,
empty inputs and supplied-hash byte order. Each record distinguishes supported
lossless conversion from a deliberate local rejection or an RPC validation error.
The descriptor records retain their capture-time input-error annotations. Current
tests also verify canonical acceptance of the three zero-reference cases that
were rejected by the earlier library, using the unchanged daemon commitments.
Omitted/null salt captures retain the daemon's generated 32-byte salts for ordinary
leaves; hash-only defaults retain an empty descriptor. Tests independently hash
the captured salts, whose values can change when the fixture is regenerated.
The running binary preserves 1/31/33-byte descriptor JSON keys that the current
source and library reject. The fixtures preserve that version difference rather
than treating current source behavior as an observation from the older process.

This is a finite boundary matrix, not a claim that every possible input has
been exercised live. Additional local tests cover binary decoding and input
validation without requiring RPC captures.
