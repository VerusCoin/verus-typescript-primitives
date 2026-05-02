import { BN } from 'bn.js';
import bufferutils from '../../../utils/bufferutils';
import varuint from '../../../utils/varuint';
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils;

export interface WalletBackupInterface {
  flags?: BigNumber;
  seedFormat?: BigNumber;
  encryptionFormat?: BigNumber;
  KDFIters?: BigNumber;
  data?: Buffer;
  encrypted?: boolean;
  containsKDFIters?: boolean;
}

export interface WalletBackupJson {
  flags: number;
  seedformat: number;
  encryptionformat: number;
  KDFIters?: number;
  data: string;
}

export class WalletBackup implements SerializableEntity {
  flags: BigNumber;
  seedFormat: BigNumber;
  encryptionFormat: BigNumber;
  KDFIters: BigNumber;
  data: Buffer;

  static FLAG_ENCRYPTED = new BN(1, 10);
  static FLAG_CONTAINS_KDF_ITERS = new BN(2, 10);

  static SEED_FORMAT_BIP39 = new BN(1, 10);
  static DEFAULT_SEED_FORMAT = WalletBackup.SEED_FORMAT_BIP39;

  static ENCRYPTION_FORMAT_NONE = new BN(0, 10);
  static ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM = new BN(1, 10);
  static DEFAULT_ENCRYPTION_FORMAT = WalletBackup.ENCRYPTION_FORMAT_NONE;

  constructor(data?: WalletBackupInterface) {
    this.flags = data?.flags || new BN(0, 10);
    this.seedFormat = data?.seedFormat || WalletBackup.DEFAULT_SEED_FORMAT;
    this.encryptionFormat = data?.encryptionFormat || WalletBackup.DEFAULT_ENCRYPTION_FORMAT;
    this.KDFIters = data?.KDFIters || new BN(0, 10);
    this.data = data?.data || Buffer.alloc(0);

    if (data?.encrypted) this.setEncrypted();
    if (data?.containsKDFIters) this.setContainsKDFIters();
  }

  isEncrypted(): boolean {
    return this.flags.and(WalletBackup.FLAG_ENCRYPTED).eq(WalletBackup.FLAG_ENCRYPTED);
  }

  containsKDFIters(): boolean {
    return this.flags.and(WalletBackup.FLAG_CONTAINS_KDF_ITERS).eq(WalletBackup.FLAG_CONTAINS_KDF_ITERS);
  }

  setEncrypted(): void {
    this.flags = this.flags.or(WalletBackup.FLAG_ENCRYPTED);
  }

  setContainsKDFIters(): void {
    this.flags = this.flags.or(WalletBackup.FLAG_CONTAINS_KDF_ITERS);
  }

  isBIP39(): boolean {
    return this.seedFormat.eq(WalletBackup.SEED_FORMAT_BIP39);
  }

  usesSaltedTaggedAes256Gcm(): boolean {
    return this.encryptionFormat.eq(WalletBackup.ENCRYPTION_FORMAT_SALTED_TAGGED_AES_256_GCM);
  }

  isValid(): boolean {
    let valid = this.flags.gte(new BN(0, 10));
    valid &&= this.seedFormat.gte(new BN(1, 10));
    valid &&= this.encryptionFormat.gte(new BN(0, 10));
    valid &&= this.KDFIters.gte(new BN(0, 10));
    valid &&= Buffer.isBuffer(this.data);

    if (this.isEncrypted() && this.usesSaltedTaggedAes256Gcm()) {
      valid &&= this.containsKDFIters();
    }

    return valid;
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());
    length += varuint.encodingLength(this.seedFormat.toNumber());
    length += varuint.encodingLength(this.encryptionFormat.toNumber());
    if (this.containsKDFIters()) length += varuint.encodingLength(this.KDFIters.toNumber());
    length += varuint.encodingLength(this.data.length);
    length += this.data.length;

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.flags.toNumber());
    writer.writeCompactSize(this.seedFormat.toNumber());
    writer.writeCompactSize(this.encryptionFormat.toNumber());
    if (this.containsKDFIters()) writer.writeCompactSize(this.KDFIters.toNumber());
    writer.writeVarSlice(this.data);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize(), 10);
    this.seedFormat = new BN(reader.readCompactSize(), 10);
    this.encryptionFormat = new BN(reader.readCompactSize(), 10);
    this.KDFIters = this.containsKDFIters() ? new BN(reader.readCompactSize(), 10) : new BN(0, 10);
    this.data = reader.readVarSlice();

    return reader.offset;
  }

  toJson(): WalletBackupJson {
    const json: WalletBackupJson = {
      flags: this.flags.toNumber(),
      seedformat: this.seedFormat.toNumber(),
      encryptionformat: this.encryptionFormat.toNumber(),
      data: this.data.toString('hex')
    };

    if (this.containsKDFIters()) json.KDFIters = this.KDFIters.toNumber();

    return json;
  }

  static fromJson(json: WalletBackupJson): WalletBackup {
    return new WalletBackup({
      flags: new BN(json.flags ?? 0, 10),
      seedFormat: new BN(json.seedformat ?? WalletBackup.DEFAULT_SEED_FORMAT.toNumber(), 10),
      encryptionFormat: new BN(json.encryptionformat ?? WalletBackup.DEFAULT_ENCRYPTION_FORMAT.toNumber(), 10),
      KDFIters: new BN(json.KDFIters ?? 0, 10),
      data: json.data ? Buffer.from(json.data, 'hex') : Buffer.alloc(0)
    });
  }
}
