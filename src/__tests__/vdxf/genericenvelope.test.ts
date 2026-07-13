import { DEFAULT_VERUS_CHAINID } from '../../constants/pbaas';
import { createHash } from 'crypto';
import { DataDescriptor } from '../../pbaas/DataDescriptor';
import { GenericEnvelope } from '../../vdxf/classes/envelope/GenericEnvelope';
import { DataDescriptorOrdinalVDXFObject, GeneralTypeOrdinalVDXFObject } from '../../vdxf/classes/ordinals';

describe('GenericEnvelope — details isolating functions', () => {
  function makeDetail(hex: string): GeneralTypeOrdinalVDXFObject {
    return new GeneralTypeOrdinalVDXFObject({
      data: Buffer.from(hex, 'hex'),
      key: DEFAULT_VERUS_CHAINID,
    });
  }

  function makeCipherData(plainText: Buffer): Buffer {
    return Buffer.concat([
      Buffer.from('encrypted-details:', 'utf8'),
      createHash('sha256').update(plainText).digest()
    ]);
  }

  function makeEncryptedDetailsDescriptor(cipherData: Buffer): DataDescriptorOrdinalVDXFObject {
    return new DataDescriptorOrdinalVDXFObject({
      data: new DataDescriptor({
        flags: DataDescriptor.FLAG_ENCRYPTED_DATA,
        objectdata: cipherData,
        epk: Buffer.alloc(32, 1)
      })
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

  describe('FLAG_DETAILS_ARE_ENCRYPTED', () => {
    it('uses a non-colliding flag number above inherited request/response flags', () => {
      expect(GenericEnvelope.FLAG_DETAILS_ARE_ENCRYPTED.toNumber()).toBe(1024);
    });

    it('serializes one encrypted data descriptor even when the plaintext details were multi-detail', () => {
      const d1 = makeDetail('11223344');
      const d2 = makeDetail('55667788');
      const plaintextDetails = new GenericEnvelope({ details: [d1, d2] }).getDetailsBuffer();
      const cipherData = makeCipherData(plaintextDetails);
      const encryptedDetails = makeEncryptedDetailsDescriptor(cipherData);
      const flags = GenericEnvelope.FLAG_DETAILS_ARE_ENCRYPTED.or(GenericEnvelope.FLAG_MULTI_DETAILS);
      const env = new GenericEnvelope({ details: [encryptedDetails], flags });

      expect(cipherData).not.toEqual(plaintextDetails);
      expect(env.detailsAreEncrypted()).toBe(true);
      expect(env.hasMultiDetails()).toBe(true);
      expect(env.getDetailsBufferLength()).toBe(encryptedDetails.getByteLength());
      expect(env.getDetailsBuffer().toString('hex')).toBe(encryptedDetails.toBuffer().toString('hex'));

      const restored = new GenericEnvelope({ details: [], flags });
      const endOffset = restored.setDetailsFromBuffer(env.getDetailsBuffer(), 0);

      expect(endOffset).toBe(env.getDetailsBufferLength());
      expect(restored.details.length).toBe(1);
      expect(restored.getDetails(0)).toBeInstanceOf(DataDescriptorOrdinalVDXFObject);
      const descriptor = restored.getDetails(0) as DataDescriptorOrdinalVDXFObject;
      expect(descriptor.data.hasEncryptedData()).toBe(true);
      expect(descriptor.data.hasEPK()).toBe(true);
      expect(descriptor.data.objectdata).toEqual(cipherData);
      expect(descriptor.data.objectdata).not.toEqual(plaintextDetails);
    });

    it('rejects the encrypted-details flag without a data descriptor', () => {
      const env = new GenericEnvelope({
        details: [makeDetail('aa')],
        flags: GenericEnvelope.FLAG_DETAILS_ARE_ENCRYPTED
      });

      expect(() => env.getDetailsBuffer()).toThrow(/DataDescriptorOrdinalVDXFObject/);
    });

    it('rejects a data descriptor that is not marked encrypted', () => {
      const descriptor = new DataDescriptorOrdinalVDXFObject({
        data: new DataDescriptor({ objectdata: Buffer.from('aa', 'hex') })
      });
      const env = new GenericEnvelope({
        details: [descriptor],
        flags: GenericEnvelope.FLAG_DETAILS_ARE_ENCRYPTED
      });

      expect(() => env.getDetailsBuffer()).toThrow(/encrypted DataDescriptor/);
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
