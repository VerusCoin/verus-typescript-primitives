import { BN } from 'bn.js';
import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';
import { GenericEnvelope } from '../../vdxf/classes/envelope/GenericEnvelope';
import { GeneralTypeOrdinalVDXFObject } from '../../vdxf/classes/ordinals';

describe('GenericEnvelope — details isolating functions', () => {
  function makeDetail(hex: string): GeneralTypeOrdinalVDXFObject {
    return new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from(hex, 'hex'),
      key: DEFAULT_VERUS_CHAINID,
    });
  }

  describe('getDetailsBufferLength / getDetailsBuffer / setDetailsFromBuffer — single detail', () => {
    it('produces a buffer whose length matches getDetailsBufferLength', () => {
      const detail = makeDetail('cafebabe');
      const env = new GenericEnvelope({ details: [detail] });

      expect(env.hasMultiDetails()).toBe(false);
      const buf = env.getDetailsBuffer();
      expect(buf.length).toBe(env.getDetailsBufferLength());
    });

    it('round trips a single detail through buffer', () => {
      const detail = makeDetail('deadbeef');
      const env = new GenericEnvelope({ details: [detail] });

      const buf = env.getDetailsBuffer();

      const restored = new GenericEnvelope({ details: [makeDetail('00')] });
      restored.setDetailsFromBuffer(buf, 0);

      expect(restored.details.length).toBe(1);
      expect(restored.details[0]).toBeInstanceOf(GeneralTypeOrdinalVDXFObject);
      expect((restored.details[0] as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    });
  });

  describe('getDetailsBufferLength / getDetailsBuffer / setDetailsFromBuffer — multi detail', () => {
    it('produces a buffer whose length matches getDetailsBufferLength', () => {
      const d1 = makeDetail('aa');
      const d2 = makeDetail('bb');
      const env = new GenericEnvelope({ details: [d1, d2] });

      expect(env.hasMultiDetails()).toBe(true);
      const buf = env.getDetailsBuffer();
      expect(buf.length).toBe(env.getDetailsBufferLength());
    });

    it('round trips multiple details through buffer', () => {
      const d1 = makeDetail('11223344');
      const d2 = makeDetail('55667788');
      const d3 = makeDetail('aabbccdd');
      const env = new GenericEnvelope({ details: [d1, d2, d3] });

      const buf = env.getDetailsBuffer();

      // Restore into a fresh envelope that has multi-details flag set
      const restored = new GenericEnvelope({ details: [makeDetail('00'), makeDetail('00')] });
      restored.setDetailsFromBuffer(buf, 0);

      expect(restored.details.length).toBe(3);
      expect((restored.details[0] as GeneralTypeOrdinalVDXFObject).data).toEqual(d1.data);
      expect((restored.details[1] as GeneralTypeOrdinalVDXFObject).data).toEqual(d2.data);
      expect((restored.details[2] as GeneralTypeOrdinalVDXFObject).data).toEqual(d3.data);
    });
  });

  describe('getDetailsBuffer is consistent with full envelope toBuffer/fromBuffer', () => {
    it('single detail: isolated details buffer matches full envelope details', () => {
      const detail = makeDetail('face');
      const env = new GenericEnvelope({ details: [detail] });

      const fullBuf = env.toBuffer();
      const clone = new GenericEnvelope();
      clone.fromBuffer(fullBuf, 0);

      expect(clone.getDetailsBuffer().toString('hex')).toEqual(env.getDetailsBuffer().toString('hex'));
    });

    it('multi detail: isolated details buffer matches full envelope details', () => {
      const d1 = makeDetail('1234');
      const d2 = makeDetail('5678');
      const env = new GenericEnvelope({ details: [d1, d2] });

      const fullBuf = env.toBuffer();
      const clone = new GenericEnvelope();
      clone.fromBuffer(fullBuf, 0);

      expect(clone.getDetailsBuffer().toString('hex')).toEqual(env.getDetailsBuffer().toString('hex'));
    });
  });

  describe('setDetailsFromBuffer with offset', () => {
    it('returns the updated offset after reading', () => {
      const detail = makeDetail('abcd');
      const env = new GenericEnvelope({ details: [detail] });
      const detailsBuf = env.getDetailsBuffer();

      // Prepend some padding bytes
      const padding = Buffer.from('0000000000', 'hex');
      const combined = Buffer.concat([padding, detailsBuf]);

      const restored = new GenericEnvelope({ details: [makeDetail('00')] });
      const endOffset = restored.setDetailsFromBuffer(combined, padding.length);

      expect(endOffset).toBe(combined.length);
      expect((restored.details[0] as GeneralTypeOrdinalVDXFObject).data).toEqual(detail.data);
    });
  });
});
