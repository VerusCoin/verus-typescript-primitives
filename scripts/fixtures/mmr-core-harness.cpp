// Fixture harness only: the generator inserts unchanged daemon methods at the
// markers below. This adapter stores uint256 in raw wire order, not RPC order.
#include <algorithm>
#include <array>
#include <cassert>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <vector>
#include <sodium.h>
#include "crypto/sha256.h"

#define SER_GETHASH 0
#define ADD_SERIALIZE_METHODS
#define READWRITE(x) ((void)0)
#define VARINT(x) (x)

struct uint256 {
    std::array<unsigned char, 32> bytes{};

    bool operator==(const uint256 &other) const { return bytes == other.bytes; }
    bool IsNull() const { return *this == uint256(); }

    std::string GetHex() const {
        std::ostringstream out;
        for (auto value : bytes) {
            out << std::hex << std::setw(2) << std::setfill('0') << (int)value;
        }
        return out.str();
    }
};

template<class Writer>
void Serialize(Writer &writer, const uint256 &hash) {
    writer.write((const char *)hash.bytes.data(), 32);
}

// @DAEMON_WRITER@
// @DAEMON_NODE@

using CDefaultMMRNode = CMMRNode<CBLAKE2bWriter>;
struct CDefaultMMRPowerNode {};

struct CMerkleBranchBase {
    enum BRANCH_TYPE {
        BRANCH_INVALID = 0, BRANCH_BTC = 1, BRANCH_MMRBLAKE_NODE = 2,
        BRANCH_MMRBLAKE_POWERNODE = 3, BRANCH_ETH = 4, BRANCH_MULTIPART = 5
    };
    uint8_t branchType = 0;
    CMerkleBranchBase() {}
    CMerkleBranchBase(BRANCH_TYPE type) : branchType(type) {}
    static uint64_t GetMMRProofIndex(uint64_t, uint64_t, int);
};

// @DAEMON_LAYER@
// @DAEMON_BRANCH@

struct PowerCount {
    static uint32_t GetExtraHashCount() { return 1; }
};

struct CMMRProof {
    std::vector<CMMRBranch<CBLAKE2bWriter>> proofSequence;
    CMMRProof &operator<<(const CMMRBranch<CBLAKE2bWriter> &proof) {
        proofSequence.push_back(proof);
        return *this;
    }
};

// @DAEMON_RANGE_VIEW@
// @DAEMON_INDEX@

template<bool Double>
struct SHAWriter {
    CSHA256 state;
    SHAWriter(int, int) {}
    SHAWriter &operator<<(const uint256 &hash) {
        state.Write(hash.bytes.data(), 32);
        return *this;
    }
    uint256 GetHash() {
        uint256 hash;
        state.Finalize(hash.bytes.data());
        if (Double) {
            CSHA256 next;
            next.Write(hash.bytes.data(), 32);
            next.Finalize(hash.bytes.data());
        }
        return hash;
    }
};

uint256 Leaf(unsigned index) {
    uint256 hash;
    for (unsigned j = 0; j < 32; j++) hash.bytes[j] = (index * 37 + j * 17 + 11) & 255;
    // Preserve distinct leaves beyond 256, while remaining easy to reconstruct.
    for (unsigned j = 0; j < 4; j++) hash.bytes[28 + j] = (index >> (j * 8)) & 255;
    return hash;
}

void EmitHashes(const std::vector<uint256> &hashes) {
    std::cout << '[';
    for (size_t i = 0; i < hashes.size(); i++) {
        if (i) std::cout << ',';
        std::cout << '"' << hashes[i].GetHex() << '"';
    }
    std::cout << ']';
}

bool Boundary(unsigned size) {
    const std::vector<unsigned> sizes = {
        31, 32, 33, 63, 64, 65, 127, 128, 129, 252, 253, 254,
        255, 256, 257, 511, 512, 513, 1023, 1024, 1025
    };
    return size <= 17 || std::find(sizes.begin(), sizes.end(), size) != sizes.end();
}

template<class Writer>
void Roots(int algorithm) {
    CMerkleMountainRange<CMMRNode<Writer>> range;
    for (unsigned size = 0; size <= 1025; size++) {
        if (size) range.Add(CMMRNode<Writer>(Leaf(size - 1)));
        if (!Boundary(size)) continue;
        CMerkleMountainView<CMMRNode<Writer>> view(range);
        std::cout << "{\"kind\":\"root\",\"algo\":" << algorithm
                  << ",\"size\":" << size << ",\"root\":\""
                  << view.GetRoot().GetHex() << "\"}\n";
    }
}

void Proofs() {
    CMerkleMountainRange<> range;
    for (unsigned size = 0; size <= 1025; size++) {
        if (size) range.Add(CDefaultMMRNode(Leaf(size - 1)));
        if (!Boundary(size)) continue;
        CMerkleMountainView<CDefaultMMRNode> view(range);
        for (unsigned pos = 0; pos < size; pos++) {
            if (size > 17 && pos != 0 && pos != 1 && pos != size / 2 &&
                pos != size - 2 && pos != size - 1) continue;
            CMMRProof proof;
            assert(view.GetProof(proof, pos));
            auto &branch = proof.proofSequence[0];
            assert(branch.SafeCheck(Leaf(pos)) == view.GetRoot());
            std::cout << "{\"kind\":\"proof\",\"size\":" << size
                      << ",\"pos\":" << pos << ",\"root\":\""
                      << view.GetRoot().GetHex() << "\",\"hashes\":";
            EmitHashes(branch.branch);
            std::cout << "}\n";
        }
    }
}

void Index(uint64_t pos, uint64_t size, int extra) {
    auto index = CMerkleBranchBase::GetMMRProofIndex(pos, size, extra);
    std::cout << "{\"kind\":\"index\",\"size\":" << size << ",\"pos\":" << pos
              << ",\"extra\":" << extra << ",\"index\":\"" << index << "\"}\n";
}

void Indices() {
    for (uint64_t size : {0ULL, 1ULL, 2ULL, 3ULL, 31ULL, 127ULL, 128ULL, 129ULL,
                         16511ULL, 16512ULL, 65535ULL, 65536ULL, 0x7fffffffULL,
                         0x80000000ULL, 0xffffffffULL, 0x100000000ULL}) {
        for (auto pos : std::vector<uint64_t>{0, 1, size / 2, size ? size - 1 : 0, size, size + 1}) {
            for (int extra : {0, 1}) Index(pos, size, extra);
        }
    }
    // Last defined uint64 direction bit and exact JavaScript numeric boundary.
    Index(1, 2, 63);
    Index(3, 4, 31);
    Index(9007199254740990ULL, 9007199254740991ULL, 0);
}

void Checks() {
    for (int power : {0, 1}) {
        for (unsigned size : {0U, 1U, 2U, 3U, 31U, 0xffffffffU}) {
            for (unsigned pos : {0U, 1U, size / 2, size ? size - 1 : 0U,
                                 size, size == 0xffffffffU ? size : size + 1}) {
                for (int count : {0, 1, 3}) {
                    std::vector<uint256> hashes;
                    for (int j = 0; j < count; j++) hashes.push_back(Leaf(j + 10));
                    CMMRBranch<CBLAKE2bWriter> normal;
                    CMMRBranch<CBLAKE2bWriter, PowerCount> powered;
                    normal.nIndex = powered.nIndex = pos;
                    normal.nSize = powered.nSize = size;
                    normal.branch = powered.branch = hashes;
                    auto result = power ? powered.SafeCheck(Leaf(0)) : normal.SafeCheck(Leaf(0));
                    std::cout << "{\"kind\":\"check\",\"size\":" << size
                              << ",\"pos\":" << pos << ",\"extra\":" << power
                              << ",\"hashes\":";
                    EmitHashes(hashes);
                    std::cout << ",\"checked\":\"" << result.GetHex() << "\"}\n";
                }
            }
        }
    }
    // Equal siblings are allowed for a left leaf but fail for a right leaf.
    for (int pos : {0, 1}) {
        CMMRBranch<CBLAKE2bWriter> branch;
        branch.nIndex = pos;
        branch.nSize = 2;
        branch.branch = {Leaf(0)};
        std::cout << "{\"kind\":\"equal\",\"pos\":" << pos
                  << ",\"checked\":\"" << branch.SafeCheck(Leaf(0)).GetHex() << "\"}\n";
    }
}

void DuplicatePeak() {
    CMerkleMountainRange<> range;
    for (unsigned i = 0; i < 6; i++) range.Add(CDefaultMMRNode(Leaf(i)));
    auto duplicate = range.GetNode(2, 0).hash;
    range.Add(CDefaultMMRNode(duplicate));
    CMerkleMountainView<CDefaultMMRNode> view(range);
    CMMRProof proof;
    assert(view.GetProof(proof, 6));
    auto &branch = proof.proofSequence[0];
    CMMRBranch<CBLAKE2bWriter> corrected;
    corrected.nIndex = 6;
    corrected.nSize = 7;
    corrected.branch = {view.GetPeaks()[0].CreateParentNode(view.GetPeaks()[1]).hash};
    assert(!(branch.SafeCheck(duplicate) == view.GetRoot()));
    assert(corrected.SafeCheck(duplicate) == view.GetRoot());
    std::cout << "{\"kind\":\"duplicatePeak\",\"root\":\"" << view.GetRoot().GetHex()
              << "\",\"leaf\":\"" << duplicate.GetHex() << "\",\"daemonHashes\":";
    EmitHashes(branch.branch);
    std::cout << ",\"correctedHashes\":";
    EmitHashes(corrected.branch);
    std::cout << "}\n";
}

int main() {
    Roots<CBLAKE2bWriter>(1);
    Roots<SHAWriter<false>>(5);
    Roots<SHAWriter<true>>(4);
    Proofs();
    Indices();
    Checks();
    DuplicatePeak();
    CMerkleMountainRange<> zero;
    zero.Add(CDefaultMMRNode(uint256()));
    CMerkleMountainView<CDefaultMMRNode> view(zero);
    std::cout << "{\"kind\":\"zeroRootNode\",\"isNull\":"
              << (view.GetRootNode() == nullptr ? "true" : "false") << "}\n";
}
