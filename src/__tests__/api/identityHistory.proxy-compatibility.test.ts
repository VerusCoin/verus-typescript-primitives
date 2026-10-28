import { GetIdentityHistoryRequest } from '../../api/classes/GetIdentityHistory/GetIdentityHistoryRequest';

const CHAIN = 'VRSCTEST';
const IDENTITY = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';
type HistoryOptions = [number | undefined, number | undefined, boolean | undefined, number | undefined];

// All subsets of start height, end height, proof toggle and proof height.
// Explicit expected arrays lock the daemon defaults and exact proxy positions.
const cases: Array<{ name: string; options: HistoryOptions; expected: Array<string | number | boolean> }> = [
  { name: 'no options', options: [undefined, undefined, undefined, undefined], expected: [IDENTITY] },
  { name: 'start', options: [25, undefined, undefined, undefined], expected: [IDENTITY, 25] },
  { name: 'end', options: [undefined, 75, undefined, undefined], expected: [IDENTITY, 0, 75] },
  { name: 'start and end', options: [25, 75, undefined, undefined], expected: [IDENTITY, 25, 75] },
  { name: 'proof toggle', options: [undefined, undefined, true, undefined], expected: [IDENTITY, 0, 0, true] },
  { name: 'start and proof toggle', options: [25, undefined, true, undefined], expected: [IDENTITY, 25, 0, true] },
  { name: 'end and proof toggle', options: [undefined, 75, true, undefined], expected: [IDENTITY, 0, 75, true] },
  { name: 'start, end and proof toggle', options: [25, 75, true, undefined], expected: [IDENTITY, 25, 75, true] },
  { name: 'proof height', options: [undefined, undefined, undefined, 100], expected: [IDENTITY, 0, 0, false, 100] },
  { name: 'start and proof height', options: [25, undefined, undefined, 100], expected: [IDENTITY, 25, 0, false, 100] },
  { name: 'end and proof height', options: [undefined, 75, undefined, 100], expected: [IDENTITY, 0, 75, false, 100] },
  { name: 'start, end and proof height', options: [25, 75, undefined, 100], expected: [IDENTITY, 25, 75, false, 100] },
  { name: 'proof toggle and proof height', options: [undefined, undefined, true, 100], expected: [IDENTITY, 0, 0, true, 100] },
  { name: 'start, proof toggle and proof height', options: [25, undefined, true, 100], expected: [IDENTITY, 25, 0, true, 100] },
  { name: 'end, proof toggle and proof height', options: [undefined, 75, true, 100], expected: [IDENTITY, 0, 75, true, 100] },
  { name: 'all options', options: [25, 75, true, 100], expected: [IDENTITY, 25, 75, true, 100] },
];

describe('identity history proxy-compatible optional arguments', () => {
  test.each(cases)('$name preserves positions with typed daemon defaults', ({ options, expected }) => {
    const request = new GetIdentityHistoryRequest(CHAIN, IDENTITY, ...options);
    expect(request.prepare()).toEqual([CHAIN, 'getidentityhistory', expected]);
    expect(request.getParams()).not.toContain(null);
    // Match the Rust allowlist's [str, int, int, bool, int] type contract.
    request.getParams().forEach((value, index) => {
      if (index === 0) expect(typeof value).toBe('string');
      else if (index === 3) expect(typeof value).toBe('boolean');
      else expect(Number.isInteger(value)).toBe(true);
    });

    // Serializing the request stores the caller's optional values; defaults
    // belong only in the wire parameter list and must not mutate those values.
    expect(request.heightstart).toBe(options[0]);
    expect(request.heightend).toBe(options[1]);
    expect(request.txproofs).toBe(options[2]);
    expect(request.txproofheight).toBe(options[3]);
    const stored = JSON.parse(JSON.stringify(request.toJSON()));
    expect(GetIdentityHistoryRequest.fromJSON(stored).prepare()).toEqual(request.prepare());
    expect(GetIdentityHistoryRequest.fromJson(stored).prepare()).toEqual(request.prepare());
    expect(request.toJson()).toEqual(request.toJSON());
  });

  test.each([
    { options: [0, 0, false, 0] as HistoryOptions, expected: [IDENTITY, 0, 0, false, 0] },
    { options: [undefined, -1, false, undefined] as HistoryOptions, expected: [IDENTITY, 0, -1, false] },
    { options: [0, undefined, false, undefined] as HistoryOptions, expected: [IDENTITY, 0, 0, false] },
    { options: [undefined, undefined, undefined, 0] as HistoryOptions, expected: [IDENTITY, 0, 0, false, 0] },
  ])('preserves explicit zero, mempool height, and false: $expected', ({ options, expected }) => {
    const request = new GetIdentityHistoryRequest(CHAIN, IDENTITY, ...options);
    expect(request.getParams()).toEqual(expected);
    expect(GetIdentityHistoryRequest.fromJSON(request.toJSON()).getParams()).toEqual(expected);
  });

  test('normalizes optional nulls restored from JSON while preserving omitted trailing values', () => {
    const request = GetIdentityHistoryRequest.fromJSON({
      chain: CHAIN,
      nameOrAddress: IDENTITY,
      heightstart: null,
      heightend: 75,
      txproofs: null,
      txproofheight: 100,
    });
    expect(request.getParams()).toEqual([IDENTITY, 0, 75, false, 100]);
    expect(GetIdentityHistoryRequest.fromJSON({
      chain: CHAIN,
      nameOrAddress: IDENTITY,
      heightstart: null,
      heightend: null,
      txproofs: null,
      txproofheight: null,
    }).getParams()).toEqual([IDENTITY]);
  });
});
