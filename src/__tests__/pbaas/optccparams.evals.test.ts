import { OptCCParams } from '../../pbaas/OptCCParams';
import { EVALS } from '../../utils/evals';

describe('Eval name compatibility', () => {
  test('names code 10 correctly while preserving its deprecated alias', () => {
    // ../VerusCoin/src/cc/eval.h assigns 0x0a to advanced reservations.
    expect(EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION).toBe(10);
    expect(EVALS.EVAL_RESERVE_UNUSED).toBe(10);
  });

  test('correcting the name preserves raw parsing without adding helper support', () => {
    const chunk = Buffer.from('04030a000002abcd', 'hex');
    const params = OptCCParams.fromChunk(chunk);

    expect(params.evalCode.toNumber()).toBe(EVALS.EVAL_IDENTITY_ADVANCEDRESERVATION);
    expect(params.vData).toEqual([Buffer.from('abcd', 'hex')]);
    expect(params.toChunk()).toEqual(chunk);
    expect(params.isValid()).toBe(false);
    expect(params.getParamObject()).toBeNull();
  });

  test.each(['0f', '10', '16', '17', '18', '19', '1a'])(
    'retains existing helper behavior for unsupported eval 0x%s',
    (evalHex) => {
      const chunk = Buffer.from('0403' + evalHex + '0000', 'hex');
      const params = OptCCParams.fromChunk(chunk);

      expect(params.toChunk()).toEqual(chunk);
      expect(params.isValid()).toBe(false);
      expect(params.getParamObject()).toBeNull();
    }
  );

  test('retains rejection above the existing parser range', () => {
    expect(() => OptCCParams.fromChunk(Buffer.from('04031b0000', 'hex')))
      .toThrow('invalid header values');
  });
});
