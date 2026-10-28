#!/usr/bin/env python3
"""Compile unchanged daemon MMR methods and capture their results.

Usage: python3 scripts/generate-mmr-core-fixtures.py [daemon] [output]
Set VERUS_DEPENDS_PREFIX when using another daemon dependency build. The default
is the checked-out daemon's aarch64-apple-darwin dependencies. No RPC is used.
"""

import hashlib
import json
import os
import pathlib
import subprocess
import sys
import tempfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
DAEMON = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT.parent / 'VerusCoin').resolve()
OUTPUT = pathlib.Path(
    sys.argv[2] if len(sys.argv) > 2 else ROOT / 'src/__tests__/fixtures/mmr/daemon-core.json'
).resolve()
DEPENDS = pathlib.Path(os.environ.get(
    'VERUS_DEPENDS_PREFIX', DAEMON / 'depends/aarch64-apple-darwin'
))


def between(source, start, end):
    offset = source.index(start)
    return source[offset:source.index(end, offset)]


def method(source, signature):
    start = source.index(signature)
    offset = source.index('{', start) + 1
    depth = 1
    while depth:
        depth += (source[offset] == '{') - (source[offset] == '}')
        offset += 1
    return source[start:offset]


def git(*args):
    return subprocess.check_output(['git', '-C', str(DAEMON), *args], text=True).strip()


def main():
    header = (DAEMON / 'src/mmr.h').read_text()
    implementation = (DAEMON / 'src/mmr.cpp').read_text()
    hash_header = (DAEMON / 'src/hash.h').read_text()

    # These bodies are inserted verbatim; only peripheral uint256/proof storage
    # and serialization glue are adapted by the harness.
    sections = {
        'WRITER': between(
            hash_header, 'const unsigned char BLAKE2Bpersonal',
            '/** A writer stream (for serialization) that computes a 256-bit Verus hash. */'
        ),
        'NODE': between(
            header, 'template <typename HASHALGOWRITER=CBLAKE2bWriter>\nclass CMMRNode',
            'typedef CMMRNode<CBLAKE2bWriter> CDefaultMMRNode;'
        ),
        'LAYER': between(
            header, 'template <typename NODE_TYPE, int CHUNK_SHIFT = 9>',
            '// NODE_TYPE must have a default constructor'
        ),
        'BRANCH': between(
            header, 'template <typename HASHALGOWRITER=CBLAKE2bWriter, typename NODETYPE=CDefaultMMRNode>',
            'typedef CMMRBranch<CBLAKE2bWriter> CMMRNodeBranch;'
        ),
        'RANGE_VIEW': between(
            header, 'template <typename NODE_TYPE=CDefaultMMRNode, typename LAYER_TYPE=CChunkedLayer<NODE_TYPE>, typename LAYER0_TYPE=LAYER_TYPE>',
            '\n\n#endif // MMR_H'
        ),
        'INDEX': method(implementation, 'uint64_t CMerkleBranchBase::GetMMRProofIndex('),
    }
    harness = ROOT / 'scripts/fixtures/mmr-core-harness.cpp'
    source = harness.read_text()
    for name, body in sections.items():
        source = source.replace('// @DAEMON_' + name + '@', body)

    compiler = os.environ.get('CXX', 'clang++')
    with tempfile.TemporaryDirectory(prefix='verus-mmr-core-') as temporary:
        temporary = pathlib.Path(temporary)
        (temporary / 'oracle.cpp').write_text(source)
        command = [
            compiler, '-std=c++17', '-O1', '-fsanitize=undefined',
            '-fno-sanitize-recover=undefined', '-I' + str(DAEMON / 'src'),
            '-I' + str(DEPENDS / 'include'), str(temporary / 'oracle.cpp'),
            str(DAEMON / 'src/crypto/sha256.cpp'),
            str(DEPENDS / 'lib/libsodium.a'), '-o', str(temporary / 'oracle'),
        ]
        subprocess.run(command, check=True)
        result = subprocess.run(
            [str(temporary / 'oracle')], check=True, capture_output=True, text=True
        )
        if result.stderr:
            raise RuntimeError(result.stderr)
        cases = [json.loads(line) for line in result.stdout.splitlines()]

    source_files = ['src/mmr.h', 'src/mmr.cpp', 'src/hash.h', 'src/crypto/sha256.cpp']
    fixture = {
        'provenance': {
            'kind': 'compiled-daemon-source',
            'generator': 'scripts/generate-mmr-core-fixtures.py',
            'daemonHead': git('rev-parse', 'HEAD'),
            'sourceHashes': {
                name: hashlib.sha256((DAEMON / name).read_bytes()).hexdigest()
                for name in source_files
            },
            'extractedMethodHashes': {
                name: hashlib.sha256(body.encode()).hexdigest()
                for name, body in sections.items()
            },
            'workingTreeDiff': git('diff', 'HEAD', '--', *source_files),
            'compiler': subprocess.check_output([compiler, '--version'], text=True).splitlines()[0],
            'sanitizer': 'undefined; abort on first failure',
            'runningDaemonVersion': None,
            'note': (
                'Compiled local source, independent of the running RPC binary. '
                'Unchanged algorithms use a 32-byte uint256 adapter, the daemon Blake2b '
                'writer/libsodium and daemon SHA256 implementation. Hash strings are raw '
                'wire order. Duplicate-peak proof output is a named excluded defect. '
                'Malformed branches intentionally exercise SafeCheck, which does not '
                'enforce exact proof length or establish a trusted root.'
            ),
        },
        'cases': cases,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(fixture, indent=2) + '\n')
    print(f'Wrote {len(cases)} compiled daemon cases to {OUTPUT}')


if __name__ == '__main__':
    main()
