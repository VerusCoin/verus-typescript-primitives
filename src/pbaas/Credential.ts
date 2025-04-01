import { BN } from 'bn.js';
import { BigNumber } from "../utils/types/BigNumber";
import { SerializableEntity } from "../utils/types/SerializableEntity";
import bufferutils from "../utils/bufferutils";
import varuint from "../utils/varuint";

const { BufferReader, BufferWriter } = bufferutils;

export type CredentialJSON = {
  version?: number,
  flags?: number,
  credentialKey?: string,
  credential?: string,
  scopes?: string,
  label?: string,
}

export class Credential implements SerializableEntity {

  // Credential enum types 
  static VERSION_INVALID = new BN(0, 10);
  static VERSION_FIRST = new BN(1, 10);
  static VERSION_LAST = new BN(1, 10);
  static VERSION_CURRENT = new BN(1, 10);

  static FLAG_LABEL_PRESENT = new BN(1, 10);

  version: BigNumber;
  flags: BigNumber;
  credentialKey: string;
  credential: string;
  scopes: string;
  label: string;

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    credentialKey?: string,
    credential?: string,
    scopes?: string,
    label?: string,
  }) {
    this.version = Credential.VERSION_INVALID;
    this.flags = new BN(0, 10);
    this.credentialKey = "";
    this.credential = "";
    this.scopes = "";
    this.label = "";

    if (data) {
      if (data.flags) this.flags = data.flags;
      if (data.version) this.version = data.version;
      if (data.credentialKey) this.credentialKey = data.credentialKey;
      if (data.credential) this.credential = data.credential;
      if (data.scopes) this.scopes = data.scopes;
      if (data.label) this.label = data.label;

      this.setFlags();
    }
  }

  getByteLength(): number {
    let length = 0;

    length += 4; // version (UInt32)
    length += 4; // flags (UInt32)
    
    const credentialKeyLength = this.credentialKey.length;
    length += varuint.encodingLength(credentialKeyLength);
    length += credentialKeyLength;

    const credentialLength = this.credential.length;
    length += varuint.encodingLength(credentialLength);
    length += credentialLength;

    const scopesLength = this.scopes.length;
    length += varuint.encodingLength(scopesLength);
    length += scopesLength;

    if (this.hasLabel()) {
      length += varuint.encodingLength(this.label.length);
      length += Buffer.from(this.label).length;
    } 

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeUInt32(this.version.toNumber());
    writer.writeUInt32(this.flags.toNumber());
    
    writer.writeVarSlice(Buffer.from(this.credentialKey));

    writer.writeVarSlice(Buffer.from(this.credential));
    writer.writeVarSlice(Buffer.from(this.scopes));

    if (this.hasLabel()) {
      writer.writeVarSlice(Buffer.from(this.label));
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readUInt32(), 10);
    this.flags = new BN(reader.readUInt32(), 10);

    this.credentialKey = Buffer.from(reader.readVarSlice()).toString();

    this.credential = Buffer.from(reader.readVarSlice()).toString();
    this.scopes = Buffer.from(reader.readVarSlice()).toString();

    if (this.hasLabel()) {
      this.label = Buffer.from(reader.readVarSlice()).toString();
    }

    return reader.offset;
  }

  hasLabel(): boolean {
    return this.flags.and(Credential.FLAG_LABEL_PRESENT).gt(new BN(0, 10));
  }

  calcFlags(): BigNumber {
    return this.label.length > 0 ? Credential.FLAG_LABEL_PRESENT : new BN(0, 10);
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
      credentialKey: this.credentialKey,
      credential: this.credential,
      scopes: this.scopes,
      label: this.hasLabel() ? this.label : null
    };

    return ret;
  }

  static fromJSON(json: CredentialJSON): Credential {
    return new Credential({
      version: json.version ? new BN(json.version, 10) : undefined,
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      credentialKey: json.credentialKey,
      credential: json.credential,
      scopes: json.scopes,
      label: json.label,
    });
  }
}