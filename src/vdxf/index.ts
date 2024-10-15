import base64url from "base64url";
import createHash = require("create-hash");
import { VDXF_OBJECT_DEFAULT_VERSION, HASH160_BYTE_LENGTH, I_ADDR_VERSION } from '../constants/vdxf';
import { fromBase58Check, toBase58Check } from '../utils/address';
import bufferutils from '../utils/bufferutils';
import varint from '../utils/varint';
import varuint from '../utils/varuint';
import { Hash160 } from "./classes/Hash160";
import { IDENTITY_AUTH_SIG_VDXF_KEY, LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY, VDXFKeyInterface } from './keys';
import { BN } from "bn.js";
import { BigNumber } from "../utils/types/BigNumber";
export * from './keys'
export * from './scopes'
export * from './keymap'
export * from './identitydatakeys'
export * from './vdxfdatakeys'
export interface VDXFObjectInterface {
  vdxfkey: string;
  toString: () => string;
  toJson: () => { [key: string]: any };
  toBuffer: () => Buffer;
  toDataBuffer: () => Buffer;
  fromDataBuffer: (buffer: Buffer, offset: number) => number;
  fromBuffer: (buffer: Buffer, offset: number) => number;
  dataByteLength: () => number;
  byteLength: () => number;
  getVersionNoFlags: () => BigNumber;
}

export interface VerusIDSignatureInterface {
  signature: string;
}

export type VerusIDSignatureJson = {
  signature: string,
  vdxfkey: string,
  serializekey: boolean
}

export class VDXFObject implements VDXFObjectInterface {
  vdxfkey: string;
  version: BigNumber;
  serializekey: boolean = true;

  constructor(key: string = "", serializekey: boolean = true) {
    this.vdxfkey = key;
    this.version = VDXF_OBJECT_DEFAULT_VERSION;
    this.serializekey = serializekey;
  }

  getVersionNoFlags() {
    return this.version;
  }

  toJson() {
    return {};
  }

  toString(includeKey: boolean = this.serializekey) {
    return base64url.encode(this.toBuffer(includeKey))
  }

  dataByteLength() {
    return 0;
  }

  toDataBuffer() {
    return Buffer.alloc(0);
  }

  fromDataBuffer(buffer: Buffer, offset: number = 0) {
    return offset;
  }

  isValidVersion() {
    return true;
  }

  fromBuffer(buffer: Buffer, offset: number = 0, vdxfkey?: string) {
    const reader = new bufferutils.BufferReader(buffer, offset);

    if (vdxfkey == null) {
      const keyHash = reader.readSlice(HASH160_BYTE_LENGTH);
      this.vdxfkey = toBase58Check(keyHash, I_ADDR_VERSION)
    }
    
    const version = reader.readVarInt();
    
    this.version = version;

    if (!this.isValidVersion()) throw new Error("Unsupported version for vdxf object.")

    if (offset < buffer.length - 1) {
      reader.offset = this.fromDataBuffer(reader.buffer, reader.offset)
    }

    return reader.offset
  }

  byteLength(includeKey: boolean = this.serializekey) {
    const dataLength = this.dataByteLength();
    const keyLength = includeKey ? fromBase58Check(this.vdxfkey).hash.length : 0;
    const versionEncodingLength = varint.encodingLength(new BN(this.version));
    const dataEncodingLength = varuint.encodingLength(dataLength);

    return dataLength + keyLength + versionEncodingLength + dataEncodingLength;
  }

  toBuffer(includeKey: boolean = this.serializekey) {
    const key = fromBase58Check(this.vdxfkey);
    const dataLength = this.dataByteLength();
    const buffer = Buffer.alloc(this.byteLength(includeKey));
    const writer = new bufferutils.BufferWriter(buffer);

    if (includeKey) {
      writer.writeSlice(key.hash);
    }
    
    writer.writeVarInt(new BN(this.version, 10));
    
    writer.writeVarSlice(this.toDataBuffer());    

    return writer.buffer;
  }

  toSha256() {
    return createHash("sha256").update(this.toBuffer()).digest();
  }
}

export class BufferDataVdxfObject extends VDXFObject {
  data: string;
  encoding: BufferEncoding = "hex";

  constructor(
    data: string = "",
    vdxfkey: string = "",
    encoding: BufferEncoding = "hex"
  ) {
    super(vdxfkey);

    this.data = data;
    this.encoding = encoding;
  }

  dataByteLength(): number {
    return this.toDataBuffer().length;
  }

  toDataBuffer(): Buffer {
    return Buffer.from(this.data, this.encoding);
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.data = reader.readVarSlice().toString(this.encoding);

    return reader.offset;
  }

  toJson() {
    return {
      data: this.data,
      vdxfkey: this.vdxfkey,
    };
  }
}

export class VDXFData extends VDXFObject {
  data: Buffer
  
    constructor(
      data: Buffer = Buffer.from(""),
      vdxfkey: string = ""
    ) {
      super(vdxfkey);
      this.data = data;
    }
  
    dataByteLength(): number {
      return this.data.length;
    }
  
    toDataBuffer(): Buffer {
      return this.data;
    }

    fromDataBuffer(buffer: Buffer, offset?: number): number {
      const reader = new bufferutils.BufferReader(buffer, offset);
  
      this.data = reader.readVarSlice();
  
      return reader.offset;
    }
  
    toJson() {
      return {
        data: this.data.toString("hex"),
        vdxfkey: this.vdxfkey,
      };
    }
  
  }

export class Utf8DataVdxfObject extends BufferDataVdxfObject {
  constructor(data: string = "", vdxfkey: string = "") {
    super(data, vdxfkey, "utf-8");
  }
}

export class HexDataVdxfObject extends BufferDataVdxfObject {
  constructor(data: string = "", vdxfkey: string = "") {
    super(data, vdxfkey, "hex");
  }
}

export class Utf8OrBase58Object extends VDXFObject {
  data: string;

  // VDXF keys that would cause this object to be base58 instead of utf8
  base58Keys: {[key: string]: boolean} = {};

  constructor(data: string = "", vdxfkey: string = "", base58Keys: Array<string> = []) {
    super(vdxfkey);

    for (const key of base58Keys) {
      this.base58Keys[key] = true
    }

    this.data = data
  }

  isBase58(): boolean {
    return this.base58Keys[this.vdxfkey];
  }

  dataByteLength(): number {
    return this.toDataBuffer().length;
  }

  toDataBuffer(): Buffer {
    return this.isBase58()
      ? (Hash160.fromAddress(this.data, false)).toBuffer()
      : Buffer.from(this.data as string, "utf-8");
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    if (this.isBase58()) {
      const _data = new Hash160();

      // varlength is set to true here because vdxf objects always have a 
      // variable length data field. This has160 object was not creted with
      // varlength true, but this is a shortcut instead of writing readVarSlice 
      // and then fromBuffer. 
      reader.offset = _data.fromBuffer(reader.buffer, true, reader.offset);
      _data.varlength = false;

      this.data = _data.toAddress();
    } else {
      this.data = reader.readVarSlice().toString('utf-8')
    }

    return reader.offset
  }

  toJson() {
    return {
      data: this.data,
      vdxfkey: this.vdxfkey,
    };
  }
}

export class VerusIDSignature extends VDXFObject {
  signature: string;

  constructor(
    sig: VerusIDSignatureInterface = { signature: "" },
    vdxfkey: VDXFKeyInterface = IDENTITY_AUTH_SIG_VDXF_KEY,
    serializekey: boolean = true
  ) {
    super(vdxfkey.vdxfid, serializekey);
    this.signature = sig.signature;
  }

  dataByteLength(): number {
    return this.toDataBuffer().length;
  }

  toDataBuffer(): Buffer {
    return Buffer.from(this.signature, "base64");
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.signature = reader.readVarSlice().toString("base64");

    return reader.offset;
  }

  static fromJson(data: VerusIDSignatureJson): VerusIDSignature {
    return new VerusIDSignature(
      { signature: data.signature },
      IDENTITY_AUTH_SIG_VDXF_KEY,
      data.serializekey
    )
  }

  toJson(): VerusIDSignatureJson {
    return {
      vdxfkey: this.vdxfkey,
      signature: this.signature,
      serializekey: this.serializekey
    };
  }
}
