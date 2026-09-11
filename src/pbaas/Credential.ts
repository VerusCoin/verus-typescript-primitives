import { SerializableEntityBase } from '../utils/types/SerializableEntityBase';
import { BN } from 'bn.js';
import { BigNumber } from "../utils/types/BigNumber";
import { SerializableEntity } from "../utils/types/SerializableEntity";
import bufferutils from "../utils/bufferutils";
import varuint from "../utils/varuint";
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, NULL_ADDRESS } from '../constants/vdxf';
import varint from '../utils/varint';
import { readLimitedString } from '../utils/string';
import { fromBase58Check, toBase58Check } from '../utils/address';

const { BufferReader, BufferWriter } = bufferutils;

export type CredentialJson = {
  version?: number,
  flags?: number,
  credentialkey?: string,
  credential?: Object,
  scopes?: Object,
  label?: string,
}

function hasValidTextLengths(data: Credential): boolean {
  return Buffer.byteLength(JSON.stringify(data.credential), 'utf8') <= Credential.MAX_JSON_STRING_LENGTH
    && Buffer.byteLength(JSON.stringify(data.scopes), 'utf8') <= Credential.MAX_JSON_STRING_LENGTH
    && Buffer.byteLength(data.label, 'utf8') <= Credential.MAX_JSON_STRING_LENGTH;
}

export class Credential extends SerializableEntityBase implements SerializableEntity {

  // Credential enum types 
  static VERSION_INVALID = new BN(0, 10);
  static VERSION_FIRST = new BN(1, 10);
  static VERSION_LAST = new BN(1, 10);
  static VERSION_CURRENT = new BN(1, 10);

  static FLAG_LABEL_PRESENT = new BN(1, 10);

  static MAX_JSON_STRING_LENGTH = 512;

  version: BigNumber;
  flags: BigNumber;
  credentialKey: string;
  credential: Object;
  scopes: Object;
  label: string;

  constructor(data?: {
    version?: BigNumber,
    flags?: BigNumber,
    credentialKey?: string,
    credential?: Object,
    scopes?: Object,
    label?: string,
  }) {
    super();
    this.version = Credential.VERSION_INVALID;
    this.flags = new BN(0, 10);
    this.credentialKey = "";
    this.credential = {};
    this.scopes = {};
    this.label = "";

    if (data) {
      if (data.flags) this.flags = new BN(data.flags);
      if (data.version) this.version = new BN(data.version);
      if (data.credentialKey) this.credentialKey = data.credentialKey;
      if (data.credential) this.credential = data.credential;
      if (data.scopes) this.scopes = data.scopes;
      if (data.label) this.label = data.label;

      if (!hasValidTextLengths(this)) {
        this.version = Credential.VERSION_INVALID;
      }

      this.setFlags();
    }
  }

  getByteLength(): number {
    if (!hasValidTextLengths(this)) {
      throw new Error('Credential text exceeds the 512-byte limit');
    }

    let length = 0;

    length += varint.encodingLength(this.version);
    length += varint.encodingLength(this.flags);
    
    length += HASH160_BYTE_LENGTH; // Credential key

    // Both the credential and scopes are serialized as JSON strings.
    const credStr = JSON.stringify(this.credential);
    const credentialLength = Buffer.byteLength(credStr, 'utf8');
    length += varuint.encodingLength(credentialLength);
    length += credentialLength;

    const scopesStr = JSON.stringify(this.scopes);
    const scopesLength = Buffer.byteLength(scopesStr, 'utf8');
    length += varuint.encodingLength(scopesLength);
    length += scopesLength;

    if (this.hasLabel()) {
      const labelLength = Buffer.byteLength(this.label, 'utf8');
      length += varuint.encodingLength(labelLength);
      length += labelLength;
    } 

    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarInt(this.version);
    writer.writeVarInt(this.flags);
    
    writer.writeSlice(fromBase58Check(this.credentialKey).hash);

    writer.writeVarSlice(Buffer.from(JSON.stringify(this.credential)));
    writer.writeVarSlice(Buffer.from(JSON.stringify(this.scopes)));

    if (this.hasLabel()) {
      writer.writeVarSlice(Buffer.from(this.label));
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new BufferReader(buffer, offset);

    this.version = new BN(reader.readVarInt(), 10);
    this.flags = new BN(reader.readVarInt(), 10);

    this.credentialKey = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
    
    this.credential = JSON.parse(
      Buffer.from(readLimitedString(reader, Credential.MAX_JSON_STRING_LENGTH)
    ).toString());

    this.scopes = JSON.parse(
      Buffer.from(readLimitedString(reader, Credential.MAX_JSON_STRING_LENGTH)
    ).toString());

    if (this.hasLabel()) {
      this.label = Buffer.from(readLimitedString(reader, Credential.MAX_JSON_STRING_LENGTH)).toString();
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

  // The credential is invalid if its version, key, or serialized text lengths are invalid.
  isValid(): boolean {
    return this.version.gte(Credential.VERSION_FIRST) && this.version.lte(Credential.VERSION_LAST)
      && this.credentialKey !== NULL_ADDRESS && hasValidTextLengths(this);
  }

  toJson(): CredentialJson {
    const ret: CredentialJson = {
      version: this.version.toNumber(),
      flags: this.flags.toNumber(),
      credentialkey: this.credentialKey,
      credential: this.credential,
      scopes: this.scopes,
      label: this.hasLabel() ? this.label : null
    };

    return ret;
  }

  static fromJson(json: CredentialJson): Credential {
    return new Credential({
      version: json.version ? new BN(json.version, 10) : undefined,
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      credentialKey: json.credentialkey,
      credential: json.credential,
      scopes: json.scopes,
      label: json.label,
    });
  }
}
