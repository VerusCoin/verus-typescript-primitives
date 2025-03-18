import { BigNumber } from "../utils/types/BigNumber";
import { BN } from 'bn.js';
import bufferutils from "../utils/bufferutils";
import { SerializableEntity } from "../utils/types/SerializableEntity";
import varuint from "../utils/varuint";

const { BufferReader, BufferWriter } = bufferutils;

export type CredentialJSON = {
  version?: number,
  flags?: number,
  credentialType?: number,
  credential?: string,
  recipient?: string,
  note?: string,
}

export class Credential implements SerializableEntity {

  // Credential enum types 
  static VERSION_INVALID = new BN(0, 10);
  static VERSION_FIRST = new BN(1, 10);
  static VERSION_LAST = new BN(1, 10);
  static VERSION_CURRENT = new BN(1, 10);

  static FLAG_NOTE_PRESENT = new BN(1, 10);

  // Credential type definitions
  static CREDENTIAL_UNKNOWN = new BN(0, 10);                // unknown credential
  static CREDENTIAL_USERNAME = new BN(1, 10);
  static CREDENTIAL_PASSWORD = new BN(2, 10);
  static CREDENTIAL_CARD_NUMBER = new BN(3, 10);            // payment credentials
  static CREDENTIAL_CARD_EXPIRATION_MONTH = new BN(4, 10);  
  static CREDENTIAL_CARD_EXPIRATION_YEAR = new BN(5, 10);
  static CREDENTIAL_CARD_SECURITY_CODE = new BN(6, 10);
  static CREDENTIAL_ADDRESS = new BN(7, 10);
  static CREDENTIAL_AREA_CODE = new BN(8, 10);
  static CREDENTIAL_DATE_OF_BIRTH = new BN(9, 10);
  static CREDENTIAL_ID = new BN(10, 10);

  version: BigNumber;
  flags: BigNumber;
  credentialType: BigNumber;
  credential: string;
  recipient: string;
  note: string;

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    credentialType?: BigNumber,
    credential?: string,
    recipient?: string,
    note?: string,
  }) {
    this.version = Credential.VERSION_INVALID;
    this.flags = new BN(0, 10);
    this.credentialType = Credential.CREDENTIAL_UNKNOWN;
    this.credential = "";
    this.recipient = "";
    this.note = "";

    if (data) {
      if (data.flags) this.flags = data.flags;
      if (data.version) this.version = data.version;
      if (data.credentialType) this.credentialType = data.credentialType;
      if (data.credential) this.credential = data.credential;
      if (data.recipient) this.recipient = data.recipient;
      if (data.note) this.note = data.note;

      this.setFlags();
    }
  }

  getByteLength(): number {
    let length = 0;

    length += 4; // version (UInt32)
    length += 4; // flags (UInt32)
    length += 4; // credentialType (UInt32)

    const credentialLength = this.credential.length;
    length += varuint.encodingLength(credentialLength);
    length += credentialLength;

    const recipientLength = this.recipient.length;
    length += varuint.encodingLength(recipientLength);
    length += recipientLength;

    if (this.hasNote()) {
      length += varuint.encodingLength(this.note.length);
      length += Buffer.from(this.note).length;
    } 

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeUInt32(this.version.toNumber());
    writer.writeUInt32(this.flags.toNumber());
    writer.writeUInt32(this.credentialType.toNumber());

    writer.writeVarSlice(Buffer.from(this.credential));
    writer.writeVarSlice(Buffer.from(this.recipient));

    if (this.hasNote()) {
      writer.writeVarSlice(Buffer.from(this.note));
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readUInt32(), 10);
    this.flags = new BN(reader.readUInt32(), 10);
    this.credentialType = new BN(reader.readUInt32(), 10);

    this.credential = Buffer.from(reader.readVarSlice()).toString();
    this.recipient = Buffer.from(reader.readVarSlice()).toString();

    if (this.hasNote()) {
      this.note = Buffer.from(reader.readVarSlice()).toString();
    }

    return reader.offset;
  }

  hasNote(): boolean {
    return this.flags.and(Credential.FLAG_NOTE_PRESENT).gt(new BN(0, 10));
  }

  calcFlags(): BigNumber {
    return this.note.length > 0 ? Credential.FLAG_NOTE_PRESENT : new BN(0, 10);
  }

  setFlags() {
    this.flags = this.calcFlags();
  }

  isValid(): boolean {
    return this.version.gte(Credential.VERSION_FIRST) && this.version.lte(Credential.VERSION_LAST);
  }

  toJSON(): CredentialJSON {
    const ret: CredentialJSON = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      credentialType: this.credentialType.toNumber(),
      credential: this.credential,
      recipient: this.recipient,
      note: this.hasNote() ? this.note : null
    };

    return ret;
  }

  static fromJSON(json: CredentialJSON): Credential {
    return new Credential({
      version: json.version ? new BN(json.version, 10) : undefined,
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      credentialType: json.credentialType ? new BN(json.credentialType, 10) : undefined,
      credential: json.credential,
      recipient: json.recipient,
      note: json.note,
    });
  }
}