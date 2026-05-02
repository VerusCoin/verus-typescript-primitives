import { BN } from 'bn.js';
import bufferutils from '../../../utils/bufferutils';
import varuint from '../../../utils/varuint';
import { BigNumber } from '../../../utils/types/BigNumber';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';

const { BufferReader, BufferWriter } = bufferutils;

export interface CreateWalletBackupDetailsInterface {
  backupType?: BigNumber;
}

export interface CreateWalletBackupDetailsJson {
  backuptype: number;
}

export class CreateWalletBackupDetails implements SerializableEntity {
  backupType: BigNumber;

  static NFC_NDEF_BACKUP = new BN(1, 10);
  static DEFAULT_BACKUP_TYPE = CreateWalletBackupDetails.NFC_NDEF_BACKUP;

  constructor(data?: CreateWalletBackupDetailsInterface) {
    this.backupType = data?.backupType || CreateWalletBackupDetails.DEFAULT_BACKUP_TYPE;
  }

  isValid(): boolean {
    return this.backupType.gte(new BN(0, 10));
  }

  getByteLength(): number {
    return varuint.encodingLength(this.backupType.toNumber());
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.backupType.toNumber());

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.backupType = new BN(reader.readCompactSize(), 10);

    return reader.offset;
  }

  toJson(): CreateWalletBackupDetailsJson {
    return {
      backuptype: this.backupType.toNumber()
    };
  }

  static fromJson(json: CreateWalletBackupDetailsJson | { backupType: number }): CreateWalletBackupDetails {
    return new CreateWalletBackupDetails({
      backupType: new BN((json as CreateWalletBackupDetailsJson).backuptype ?? (json as { backupType: number }).backupType, 10)
    });
  }
}
