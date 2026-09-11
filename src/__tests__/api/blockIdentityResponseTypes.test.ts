import { BlockInfo, BlockTransaction } from "../../block/BlockInfo";
import { GetBlockResponse } from "../../api/classes/GetBlock/GetBlockResponse";
import { GetIdentityResponse } from "../../api/classes/GetIdentity/GetIdentityResponse";
import { ApiPrimitive } from "../../api/ApiPrimitive";

const hash = "00".repeat(32);
const identityAddress = "iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq";

describe("block and identity RPC response types", () => {
  test("accepts block transaction IDs and verbosity-2 transaction objects", () => {
    // rpc/blockchain.cpp blockToJSON calls TxToJSON with a null block hash.
    const legacyTransaction: BlockTransaction = {
      txid: hash,
      overwintered: false,
      version: 1,
      locktime: 0,
      vin: [{ coinbase: "00", sequence: 4294967295 }],
      vout: [],
      vjoinsplit: [],
    };
    const saplingTransaction: BlockTransaction = {
      ...legacyTransaction,
      overwintered: true,
      version: 4,
      versiongroupid: "892f2085",
      expiryheight: 0,
      valueBalance: 0,
      valueBalanceZat: 0,
      vShieldedSpend: [],
      vShieldedOutput: [],
    };
    const block: BlockInfo = {
      hash, validationtype: "work", confirmations: 1, size: 200,
      height: 0, version: 4, merkleroot: hash, segid: -1,
      finalsaplingroot: hash, tx: [legacyTransaction, saplingTransaction],
      time: 1, nonce: hash, solution: "00", bits: "1f07ffff",
      difficulty: 1, chainwork: hash, chainstake: hash, anchor: hash,
      blocktype: "mined", valuePools: [{ id: "sprout", monitored: false }],
      proofroot: {
        version: 1, type: 1, systemid: identityAddress, height: 0,
        stateroot: hash, blockhash: hash, power: hash,
      },
    };
    const verbose: GetBlockResponse["result"] = block;
    const idsOnly: GetBlockResponse["result"] = { ...block, tx: [hash] };
    const raw: GetBlockResponse["result"] = "00";
    const transactionValue: ApiPrimitive = legacyTransaction;

    expect(verbose.tx).toEqual([legacyTransaction, saplingTransaction]);
    expect(idsOnly.tx).toEqual([hash]);
    expect(raw).toBe("00");
    expect(transactionValue).toBe(legacyTransaction);

    // @ts-expect-error A single verbosity selects IDs or objects for the whole array.
    const mixedTransactions: BlockInfo["tx"] = [hash, legacyTransaction];
    expect(mixedTransactions).toHaveLength(2);
  });

  test("keeps identity proofs as optional serialized hex strings", () => {
    // primitives/transaction.cpp CPartialTransactionProof::ToUniValue returns hex.
    const withoutProof: GetIdentityResponse["result"] = {
      identity: {
        name: "alice", parent: identityAddress,
        primaryaddresses: ["RQVsJRf98iq8YmRQdehzRcbLGHEx6YfjdH"],
        minimumsignatures: 1,
      },
      status: "active", canspendfor: false, cansignfor: false,
      blockheight: 1, txid: hash, vout: 0,
    };
    const withProof: GetIdentityResponse["result"] = {
      ...withoutProof,
      proof: "0100",
    };

    expect(withoutProof.proof).toBeUndefined();
    expect(withProof.proof).toBe("0100");
    // @ts-expect-error Proof JSON is a hex string, not a structured proof object.
    const objectProof: GetIdentityResponse["result"]["proof"] = { version: 1 };
    expect(typeof objectProof).toBe("object");
  });
});
