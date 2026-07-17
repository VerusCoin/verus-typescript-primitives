import { BN } from 'bn.js';
import { SerializableEntity } from '../../../utils/types/SerializableEntity';
import varuint from '../../../utils/varuint';
import bufferutils from '../../../utils/bufferutils';
import createHash = require('create-hash');
import { BigNumber } from '../../../utils/types/BigNumber';
import { fromBase58Check, toBase58Check } from '../../../utils/address';
import { HASH160_BYTE_LENGTH, I_ADDR_VERSION, R_ADDR_VERSION } from '../../../constants/vdxf';

const { BufferReader, BufferWriter } = bufferutils;

export type RegisterIdentityParamsJson = {
  name?: string;
  parent?: string;
  primaryaddresses?: string[];
  revocationauthority?: string;
  recoveryauthority?: string;
  commitmenttxid?: string;
  commitmentvout?: number;
}

export type RegisterIdentityRequestDetailsJson = {
  flags?: string;
  returnTxHex?: string;
  description?: string;
  registerParams?: RegisterIdentityParamsJson;
}

/**
 * Parameters a wallet needs to review / co-sign a registeridentity returntx:
 *   - identity leaf name + parent namespace
 *   - primaryaddresses the new ID will be controlled by
 *   - revocation/recovery authorities
 *   - commitment outpoint being spent
 * The unsigned (or partially signed) returntx hex lives on the outer Details.
 */
export class RegisterIdentityParams implements SerializableEntity {
  name?: string;
  parent?: string;
  primaryAddresses: string[];
  revocationAuthority?: string;
  recoveryAuthority?: string;
  commitmentTxid?: string;
  commitmentVout: number;

  constructor(data?: {
    name?: string,
    parent?: string,
    primaryAddresses?: string[],
    revocationAuthority?: string,
    recoveryAuthority?: string,
    commitmentTxid?: string,
    commitmentVout?: number
  }) {
    this.name = data?.name;
    this.parent = data?.parent;
    this.primaryAddresses = data?.primaryAddresses ? data.primaryAddresses.slice() : [];
    this.revocationAuthority = data?.revocationAuthority;
    this.recoveryAuthority = data?.recoveryAuthority;
    this.commitmentTxid = data?.commitmentTxid;
    this.commitmentVout = data?.commitmentVout != null ? data.commitmentVout : 0;
  }

  getByteLength(): number {
    let length = 0;
    const nameBuf = Buffer.from(this.name || '', 'utf8');
    length += varuint.encodingLength(nameBuf.length) + nameBuf.length;
    length += HASH160_BYTE_LENGTH; // parent i-addr
    length += varuint.encodingLength(this.primaryAddresses.length);
    length += this.primaryAddresses.length * HASH160_BYTE_LENGTH;
    length += HASH160_BYTE_LENGTH; // revocation
    length += HASH160_BYTE_LENGTH; // recovery
    length += 32; // commitment txid
    length += 4; // commitment vout uint32 LE
    return length;
  }

  toBuffer(): Buffer {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeVarSlice(Buffer.from(this.name || '', 'utf8'));
    writer.writeSlice(fromBase58Check(this.parent).hash);
    writer.writeCompactSize(this.primaryAddresses.length);
    for (const addr of this.primaryAddresses) {
      writer.writeSlice(fromBase58Check(addr).hash);
    }
    writer.writeSlice(fromBase58Check(this.revocationAuthority).hash);
    writer.writeSlice(fromBase58Check(this.recoveryAuthority).hash);
    const txidBuf = Buffer.from(this.commitmentTxid, 'hex').reverse();
    writer.writeSlice(txidBuf);
    const voutBuf = Buffer.alloc(4);
    voutBuf.writeUInt32LE(this.commitmentVout >>> 0, 0);
    writer.writeSlice(voutBuf);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0): number {
    const reader = new BufferReader(buffer, offset);

    this.name = reader.readVarSlice().toString('utf8');
    this.parent = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);

    const count = reader.readCompactSize();
    this.primaryAddresses = [];
    for (let i = 0; i < count; i++) {
      // Primary addresses are typically R-addrs (version 60).
      const hash = reader.readSlice(HASH160_BYTE_LENGTH);
      this.primaryAddresses.push(toBase58Check(hash, R_ADDR_VERSION));
    }

    this.revocationAuthority = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
    this.recoveryAuthority = toBase58Check(reader.readSlice(HASH160_BYTE_LENGTH), I_ADDR_VERSION);
    this.commitmentTxid = Buffer.from(reader.readSlice(32)).reverse().toString('hex');
    this.commitmentVout = reader.readSlice(4).readUInt32LE(0);

    return reader.offset;
  }

  isValid(): boolean {
    return (
      typeof this.name === 'string' &&
      this.name.length > 0 &&
      typeof this.parent === 'string' &&
      this.parent.length > 0 &&
      Array.isArray(this.primaryAddresses) &&
      this.primaryAddresses.length > 0 &&
      typeof this.revocationAuthority === 'string' &&
      this.revocationAuthority.length > 0 &&
      typeof this.recoveryAuthority === 'string' &&
      this.recoveryAuthority.length > 0 &&
      typeof this.commitmentTxid === 'string' &&
      this.commitmentTxid.length === 64 &&
      Number.isInteger(this.commitmentVout) &&
      this.commitmentVout >= 0
    );
  }

  toJson(): RegisterIdentityParamsJson {
    return {
      name: this.name,
      parent: this.parent,
      primaryaddresses: this.primaryAddresses,
      revocationauthority: this.revocationAuthority,
      recoveryauthority: this.recoveryAuthority,
      commitmenttxid: this.commitmentTxid,
      commitmentvout: this.commitmentVout
    };
  }

  static fromJson(json: RegisterIdentityParamsJson): RegisterIdentityParams {
    return new RegisterIdentityParams({
      name: json.name,
      parent: json.parent,
      primaryAddresses: json.primaryaddresses,
      revocationAuthority: json.revocationauthority,
      recoveryAuthority: json.recoveryauthority,
      commitmentTxid: json.commitmenttxid,
      commitmentVout: json.commitmentvout
    });
  }
}

export class RegisterIdentityRequestDetails implements SerializableEntity {
  static REGISTER_IDENTITY_REQUEST_VALID = new BN(0, 10);
  static REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX = new BN(1, 10);
  static REGISTER_IDENTITY_REQUEST_CONTAINS_DESC = new BN(2, 10);
  static REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS = new BN(4, 10);

  flags: BigNumber;
  returnTxHex?: string;
  description?: string;
  registerParams?: RegisterIdentityParams;

  constructor(data?: {
    flags?: BigNumber,
    returnTxHex?: string,
    description?: string,
    registerParams?: RegisterIdentityParams
  }) {
    this.flags = data && data.flags ? data.flags : new BN('0', 10);

    if (data?.returnTxHex) {
      if (!this.containsReturnTx()) this.toggleContainsReturnTx();
      this.returnTxHex = data.returnTxHex;
    }

    if (data?.description) {
      if (!this.containsDesc()) this.toggleContainsDesc();
      this.description = data.description;
    }

    if (data?.registerParams) {
      if (!this.containsRegisterParams()) this.toggleContainsRegisterParams();
      this.registerParams = data.registerParams;
    }
  }

  containsReturnTx() {
    return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX).toNumber());
  }

  containsDesc() {
    return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_DESC).toNumber());
  }

  containsRegisterParams() {
    return !!(this.flags.and(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS).toNumber());
  }

  toggleContainsReturnTx() {
    this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_RETURN_TX);
  }

  toggleContainsDesc() {
    this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_DESC);
  }

  toggleContainsRegisterParams() {
    this.flags = this.flags.xor(RegisterIdentityRequestDetails.REGISTER_IDENTITY_REQUEST_CONTAINS_REGISTER_PARAMS);
  }

  isValid(): boolean {
    if (!this.containsReturnTx() && !this.containsRegisterParams()) return false;
    if (this.containsReturnTx() && !this.returnTxHex) return false;
    if (this.containsDesc() && !this.description) return false;
    if (this.containsRegisterParams() && (this.registerParams == null || !this.registerParams.isValid())) {
      return false;
    }
    return true;
  }

  toSha256() {
    return createHash('sha256').update(this.toBuffer()).digest();
  }

  getByteLength(): number {
    let length = 0;

    length += varuint.encodingLength(this.flags.toNumber());

    if (this.containsReturnTx()) {
      length += varuint.encodingLength(Buffer.from(this.returnTxHex, 'hex').length);
      length += Buffer.from(this.returnTxHex, 'hex').length;
    }

    if (this.containsDesc()) {
      length += varuint.encodingLength(Buffer.from(this.description, 'utf8').length);
      length += Buffer.from(this.description, 'utf8').length;
    }

    if (this.containsRegisterParams()) {
      const paramsLength = this.registerParams.getByteLength();
      length += varuint.encodingLength(paramsLength);
      length += paramsLength;
    }

    return length;
  }

  toBuffer() {
    const writer = new BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.flags.toNumber());

    if (this.containsReturnTx()) {
      writer.writeVarSlice(Buffer.from(this.returnTxHex, 'hex'));
    }

    if (this.containsDesc()) {
      writer.writeVarSlice(Buffer.from(this.description, 'utf8'));
    }

    if (this.containsRegisterParams()) {
      writer.writeVarSlice(this.registerParams.toBuffer());
    }

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset: number = 0) {
    const reader = new BufferReader(buffer, offset);

    this.flags = new BN(reader.readCompactSize());

    if (this.containsReturnTx()) {
      this.returnTxHex = reader.readVarSlice().toString('hex');
    }

    if (this.containsDesc()) {
      this.description = reader.readVarSlice().toString('utf8');
    }

    if (this.containsRegisterParams()) {
      this.registerParams = new RegisterIdentityParams();
      this.registerParams.fromBuffer(reader.readVarSlice(), 0);
    }

    return reader.offset;
  }

  toJson(): RegisterIdentityRequestDetailsJson {
    return {
      flags: this.flags ? this.flags.toString(10) : undefined,
      returnTxHex: this.containsReturnTx() ? this.returnTxHex : undefined,
      description: this.containsDesc() ? this.description : undefined,
      registerParams: this.containsRegisterParams() ? this.registerParams.toJson() : undefined
    };
  }

  static fromJson(json: RegisterIdentityRequestDetailsJson): RegisterIdentityRequestDetails {
    return new RegisterIdentityRequestDetails({
      flags: json.flags ? new BN(json.flags, 10) : undefined,
      returnTxHex: json.returnTxHex,
      description: json.description,
      registerParams: json.registerParams ? RegisterIdentityParams.fromJson(json.registerParams) : undefined
    });
  }
}
