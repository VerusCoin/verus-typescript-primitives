import { BN } from 'bn.js';
import { SeedDetails, SeedDetailsInterface, SeedDetailsJson } from './SeedDetails';

export type SpendableKeyDetailsInterface = SeedDetailsInterface;
export type SpendableKeyDetailsJson = SeedDetailsJson;

export class SpendableKeyDetails extends SeedDetails {
  static FLAG_ENCRYPTED = SeedDetails.FLAG_ENCRYPTED;
  static FLAG_CONTAINS_KDF_ITERS = SeedDetails.FLAG_CONTAINS_KDF_ITERS;

  static SEED_FORMAT_BIP39 = SeedDetails.SEED_FORMAT_BIP39;
  static DEFAULT_SEED_FORMAT = SeedDetails.DEFAULT_SEED_FORMAT;

  static ENCRYPTION_FORMAT_NONE = SeedDetails.ENCRYPTION_FORMAT_NONE;
  static ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM = SeedDetails.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM;
  static DEFAULT_ENCRYPTION_FORMAT = SeedDetails.DEFAULT_ENCRYPTION_FORMAT;

  constructor(data?: SpendableKeyDetailsInterface) {
    super(data);
  }

  static fromJson(json: SpendableKeyDetailsJson): SpendableKeyDetails {
    return new SpendableKeyDetails({
      flags: new BN(json.flags ?? 0, 10),
      seedFormat: new BN(json.seedformat ?? SpendableKeyDetails.DEFAULT_SEED_FORMAT.toNumber(), 10),
      encryptionFormat: new BN(json.encryptionformat ?? SpendableKeyDetails.DEFAULT_ENCRYPTION_FORMAT.toNumber(), 10),
      KDFIters: new BN(json.KDFIters ?? 0, 10),
      data: json.data ? Buffer.from(json.data, 'hex') : Buffer.alloc(0)
    });
  }
}
