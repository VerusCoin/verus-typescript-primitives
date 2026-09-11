import { BN } from 'bn.js';
import { SeedDetails } from '../../vdxf/classes/backup/SeedDetails';
import { IdentityUpdateRequestDetails } from '../../vdxf/classes/identity/IdentityUpdateRequestDetails';
import { TEST_PARTIAL_IDENTITY } from '../constants/fixtures';

describe('CompactSize scalar compatibility', () => {
  const aboveSizeLimit = 0x02000001;

  test('identity expiry heights above the collection size limit round-trip', () => {
    const details = new IdentityUpdateRequestDetails({
      identity: TEST_PARTIAL_IDENTITY,
      expiryHeight: new BN(aboveSizeLimit),
    });
    const buffer = details.toBuffer();
    const restored = new IdentityUpdateRequestDetails();

    expect(restored.fromBuffer(buffer)).toBe(buffer.length);
    expect(restored.expiryHeight.toNumber()).toBe(aboveSizeLimit);
    expect(restored.toBuffer()).toEqual(buffer);
  });

  test('seed KDF iterations above the collection size limit round-trip', () => {
    const details = new SeedDetails({
      containsKDFIters: true,
      KDFIters: new BN(aboveSizeLimit),
      data: Buffer.from('0011223344', 'hex'),
    });
    const buffer = details.toBuffer();
    const restored = new SeedDetails();

    expect(restored.fromBuffer(buffer)).toBe(buffer.length);
    expect(restored.KDFIters.toNumber()).toBe(aboveSizeLimit);
    expect(restored.data).toEqual(details.data);
    expect(restored.toBuffer()).toEqual(buffer);
  });
});
