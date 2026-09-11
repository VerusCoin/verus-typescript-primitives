import { GetVdxfIdRequest } from '../../api/classes/GetVdxfId/GetVdxfIdRequest';
import { GetVdxfIdResponse } from '../../api/classes/GetVdxfId/GetVdxfIdResponse';
import { ZGetOperationStatusResponse } from '../../api/classes/ZGetOperationStatus/ZGetOperationStatusResponse';
import { IdentityDefinition } from '../../identity/IdentityDefinition';

const identityId = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
const uri = 'vrsc::data.type.string';
const hash = '12'.repeat(32);

describe('identity contentmultimap JSON contract', () => {
  test('accepts arrays of raw and typed values, including multi-value entries', () => {
    // core_write.cpp:1793–1824 groups entries under each key in an array;
    // VDXF arrays with multiple elements remain nested inside that array.
    const identity: IdentityDefinition = {
      name: 'alice', parent: identityId,
      primaryaddresses: [], minimumsignatures: 1,
      contentmultimap: {
        [identityId]: [
          '00',
          { [uri]: 'hello' },
          [{ [uri]: 'first' }, { [uri]: 'second' }],
        ],
      },
    };

    expect(JSON.parse(JSON.stringify(identity)).contentmultimap[identityId]).toEqual([
      '00', { [uri]: 'hello' }, [{ [uri]: 'first' }, { [uri]: 'second' }],
    ]);

    const existingForms: Array<IdentityDefinition['contentmultimap']> = [
      { [identityId]: '00' },
      { [identityId]: { [uri]: 'hello' } },
      [{ [identityId]: { [uri]: 'hello' } }],
    ];
    expect(existingForms).toHaveLength(3);
  });
});

describe('getvdxfid optional binding contracts', () => {
  // key_io.cpp:87–111 reads each binding independently. uni_get_int in
  // pbaas/vdxf.cpp:421–429 accepts both string and numeric input indices.
  const bindings: Array<GetVdxfIdRequest['initialdata']> = [
    undefined,
    {},
    { vdxfkey: identityId },
    { uint256: hash },
    { indexnum: 1 },
    { uint256: hash, indexnum: 2 },
    { vdxfkey: identityId, uint256: hash, indexnum: '3' },
  ];

  test.each(bindings)('preserves supplied binding %j in RPC parameters and JSON', initialdata => {
    const request = new GetVdxfIdRequest('VRSC', uri, initialdata);
    const expected = initialdata === undefined ? [uri] : [uri, initialdata];

    expect(request.getParams()).toEqual(expected);
    expect(GetVdxfIdRequest.fromJson(JSON.parse(JSON.stringify(request.toJson()))).getParams())
      .toEqual(expected);
  });

  // key_io.cpp:116–138 selects one qualifier; :199–212 emits optional
  // indexid and bounddata, with numeric output indexnum.
  const results: Array<GetVdxfIdResponse['result']> = [
    {
      vdxfid: identityId, hash160result: '12'.repeat(20),
      qualifiedname: { name: identityId, parentid: identityId },
    },
    {
      vdxfid: identityId, hash160result: '12'.repeat(20), indexid: 'xPwgY6oPdusaAgNK3u5yHCQG5NsHEcBpi5',
      qualifiedname: { name: uri, namespace: identityId },
      bounddata: { indexnum: 1 },
    },
    {
      vdxfid: identityId, hash160result: '12'.repeat(20),
      qualifiedname: { name: `0x${'12'.repeat(20)}`, currencyaddresstype: identityId },
      bounddata: { uint256: hash },
    },
  ];

  test.each(results)('accepts qualified name $qualifiedname.name', result => {
    expect(new GetVdxfIdResponse(result).toJson()).toEqual(result);
  });

  test('keeps bound output indices numeric', () => {
    const keyOnly: GetVdxfIdResponse['result']['bounddata'] = { vdxfkey: identityId };
    const complete: GetVdxfIdResponse['result']['bounddata'] = {
      vdxfkey: identityId, uint256: hash, indexnum: 3,
    };
    // @ts-expect-error getvdxfid emits an integer, even when its input was a string.
    const stringIndex: GetVdxfIdResponse['result']['bounddata'] = { indexnum: '3' };

    expect(keyOnly).toEqual({ vdxfkey: identityId });
    expect(complete.indexnum).toBe(3);
    expect(stringIndex.indexnum).toBe('3');
  });
});

describe('asynchronous operation parameter contracts', () => {
  test('accepts z_sendmany context objects and sendcurrency output arrays', () => {
    // rpcwallet.cpp:7286–7292 supplies an object, while pbaasrpc.cpp:12689–12697
    // supplies the output array. AsyncRPCOperation_sendmany returns either as params.
    const result: ZGetOperationStatusResponse['result'] = [
      {
        id: 'opid-sendmany', status: 'executing', method: 'z_sendmany', creation_time: 1,
        params: { fromaddress: '*', amounts: [{ address: identityId, amount: 1 }], minconf: 1, fee: 0.0001 },
      },
      {
        id: 'opid-sendcurrency', status: 'queued', method: 'sendcurrency', creation_time: 2,
        params: [{ address: identityId, currency: identityId, amount: 1 }],
      },
    ];

    expect(new ZGetOperationStatusResponse(result).toJson()).toEqual(result);
    expect(Array.isArray(result[0].params)).toBe(false);
    expect(Array.isArray(result[1].params)).toBe(true);
  });
});
