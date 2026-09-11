import { GetAddressMempoolResponse } from '../../api/classes/GetAddressMempool/GetAddressMempoolResponse';
import { GetAddressUtxosResponse } from '../../api/classes/GetAddressUtxos/GetAddressUtxosResponse';
import { GetAddressDeltasResponse } from '../../api/classes/GetAddressDeltas/GetAddressDeltasResponse';

type MempoolEntry = GetAddressMempoolResponse['result'][number];
type Utxo = Extract<GetAddressUtxosResponse['result'], unknown[]>[number];
type Delta = Extract<GetAddressDeltasResponse['result'], unknown[]>[number];

const address = 'R9J8E2no2HVjQmzX6Ntes2ShSGcn7WiRcx';
const currency = 'iCtawpxUiCc2sEupt7Z4u8SDAncGZpgSKm';
const txid = '11'.repeat(32);
const hash = '22'.repeat(32);

// Handwritten fixtures follow the JSON construction in current
// ../VerusCoin/src/rpc/misc.cpp, rather than its sometimes-stale RPC help text.
const mempoolEntry: MempoolEntry = {
  address,
  txid,
  index: 0,
  satoshis: 100,
  spending: false,
  timestamp: 1750000000,
};

const utxo: Utxo = {
  address,
  txid,
  outputIndex: 0,
  script: '76a914' + '33'.repeat(20) + '88ac',
  satoshis: 100,
  height: 1,
  isspendable: true,
};

const delta: Delta = {
  address,
  txid,
  index: 0,
  blockindex: 0,
  height: 1,
  satoshis: 100,
  spending: false,
};

describe('address RPC response type contracts', () => {
  test('models pending receives and spends without confirmed block fields', () => {
    const result: GetAddressMempoolResponse['result'] = [mempoolEntry, {
      ...mempoolEntry,
      satoshis: -100,
      spending: true,
      prevtxid: hash,
      prevout: 2,
      sent: {
        outputs: [{ addresses: address, amounts: { [currency]: 0.000001 } }],
        privateoutput: 50,
        outputfunctions: ['invalid'],
      },
    }];
    const response = new GetAddressMempoolResponse(result);

    expect(response.result.map(entry => entry.spending)).toEqual([false, true]);
    expect(response.result[0].timestamp).toBe(1750000000);
    expect(response.result[1].prevout).toBe(2);
    // @ts-expect-error Mempool entries do not contain a confirmed block height.
    expect(response.result[0].height).toBeUndefined();
    // @ts-expect-error Mempool entries do not contain a block transaction index.
    expect(response.result[0].blockindex).toBeUndefined();
  });

  test('accepts bare UTXOs and the existing chaininfo wrapper', () => {
    const results: GetAddressUtxosResponse['result'][] = [
      [utxo],
      { utxos: [{ ...utxo, addresses: [address, currency], blocktime: 1750000000 }], hash, height: 1 },
    ];

    for (const result of results) {
      const response = new GetAddressUtxosResponse(result);
      const entries = Array.isArray(response.result) ? response.result : response.result.utxos;
      expect(entries[0].isspendable).toBe(true);
      if (!Array.isArray(response.result)) {
        expect(response.result.hash).toBe(hash);
        expect(response.result.height).toBe(1);
      }
    }
  });

  test('accepts bare deltas and chaininfo with both block boundaries', () => {
    const results: GetAddressDeltasResponse['result'][] = [
      [delta],
      { deltas: [delta], start: { hash, height: 1 }, end: { hash, height: 1 } },
    ];

    for (const result of results) {
      const response = new GetAddressDeltasResponse(result);
      const entries = Array.isArray(response.result) ? response.result : response.result.deltas;
      expect(entries[0].spending).toBe(false);
      if (!Array.isArray(response.result)) {
        expect(response.result.start.height).toBe(1);
        expect(response.result.end.hash).toBe(hash);
      }
    }
  });

  test('rejects the stale field types and missing required fields at compile time', () => {
    // @ts-expect-error isspendable is emitted as a JSON boolean, not a number.
    const numericSpendable: Utxo = { ...utxo, isspendable: 1 };
    const { timestamp, ...withoutTimestamp } = mempoolEntry;
    // @ts-expect-error Every mempool entry includes its timestamp.
    const missingTimestamp: MempoolEntry = withoutTimestamp;
    const { spending, ...withoutSpending } = delta;
    // @ts-expect-error Every confirmed delta includes spending.
    const missingSpending: Delta = withoutSpending;
    // @ts-expect-error chaininfo UTXO responses always include the tip hash.
    const missingTipHash: GetAddressUtxosResponse['result'] = { utxos: [utxo], height: 1 };
    // @ts-expect-error chaininfo delta responses always include the end boundary.
    const missingEnd: GetAddressDeltasResponse['result'] = { deltas: [delta], start: { hash, height: 1 } };

    expect([numericSpendable, missingTimestamp, missingSpending, missingTipHash, missingEnd]).toHaveLength(5);
  });
});
