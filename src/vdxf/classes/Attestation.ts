import varuint from '../../utils/varuint'
import bufferutils from '../../utils/bufferutils'
import createHash = require("create-hash");
import { fromBase58Check, toBase58Check } from '../../utils/address';
import { I_ADDR_VERSION, HASH160_BYTE_LENGTH } from '../../constants/vdxf';
import { VDXFObject, VerusIDSignature } from "../";
import { CMerkleMountainRange, CMMRNode, CMerkleMountainView, CMMRProof } from "./MMR"
import { ATTESTATION_OBJECT, ATTESTATION_VIEW_RESPONSE } from '../keys';
import { Hash160 } from "./Hash160";
import { Utf8DataVdxfObject, HexDataVdxfObject, BufferDataVdxfObject, PNGImageVdxfObject } from '..';
import { IdentityDataClassTypes, IdentityVdxfidMap } from './IdentityData';
const { BufferReader, BufferWriter } = bufferutils;

export class AttestationDataType {

  dataItem: Utf8DataVdxfObject | HexDataVdxfObject | BufferDataVdxfObject | PNGImageVdxfObject | VDXFObject;
  salt: Buffer = Buffer.alloc(0);

  constructor(data?: any, vdxfkey?: string, salt?: string) {

    this.dataItem = AttestationDataType.getDataItem(vdxfkey, data);

    if (salt) {
      this.salt = Buffer.from(salt, "hex");
    }
  }

  static getDataItem(vdxfkey, data): any {
    switch (vdxfkey && IdentityVdxfidMap[vdxfkey]?.type) {
      case IdentityDataClassTypes.BUFFER_DATA_STRING:
        return new Utf8DataVdxfObject(data, vdxfkey);
      case IdentityDataClassTypes.BUFFER_DATA_BYTES:
        return new HexDataVdxfObject(data, vdxfkey);
      case IdentityDataClassTypes.BUFFER_DATA_BASE64:
        return new BufferDataVdxfObject(data, vdxfkey, "base64");
      case IdentityDataClassTypes.URL:
        return new BufferDataVdxfObject(data, vdxfkey, "utf8");
      case IdentityDataClassTypes.PNG_IMAGE:
        return new PNGImageVdxfObject(data, vdxfkey);
      case IdentityDataClassTypes.KEY_ONLY:
        return new VDXFObject(vdxfkey);
      case IdentityDataClassTypes.BOOLEAN: 
        return new HexDataVdxfObject(data, vdxfkey);
      case undefined:  
      default:
        return new HexDataVdxfObject(data, vdxfkey);
    }
  }

  dataByteLength(): number {

    let length = 0;

    length += this.dataItem.byteLength();
    length += varuint.encodingLength(this.salt.length);
    length += this.salt.length;

    return length;
  }

  toBuffer(): Buffer {

    const buffer = Buffer.alloc(this.dataByteLength());
    const writer = new bufferutils.BufferWriter(buffer);
    writer.writeSlice(this.dataItem.toBuffer());
    writer.writeVarSlice(this.salt);

    return writer.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset = 0, vdxfkey?: string): number {

    const reader = new bufferutils.BufferReader(buffer, offset);
    reader.offset = this.dataItem.fromBuffer(reader.buffer, reader.offset, vdxfkey);
    this.salt = reader.readVarSlice();

    return reader.offset;
  }
}

export const friendlyNames = (vdfxkey) => {

  if (vdfxkey in IdentityVdxfidMap) {

    return IdentityVdxfidMap[vdfxkey].name;

  } else {
    throw new Error("Unknown VDXF key");
  }
}

export class AttestationData {

  components: Map<number, AttestationDataType>;
  constructor(components: Map<number, AttestationDataType> = new Map()) {
    this.components = components;
  }

  dataByteLength(): number {
    let byteLength = 0;
    byteLength += varuint.encodingLength(this.components.size)

    for (const [key, item] of this.components) {
      byteLength += varuint.encodingLength(key);
      byteLength += item.dataByteLength();
    }

    return byteLength;
  }

  toDataBuffer(): Buffer {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));

    bufferWriter.writeCompactSize(this.components.size);

    for (const [key, item] of this.components) {
      bufferWriter.writeCompactSize(key);
      bufferWriter.writeSlice(item.toBuffer());
    }

    return bufferWriter.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);
    const componentsLength = reader.readCompactSize();
    this.components = new Map();

    for (var i = 0; i < componentsLength; i++) {
      const key = reader.readCompactSize();
      const vdxfid = toBase58Check(reader.readSlice(20), I_ADDR_VERSION);
      const attestationData = new AttestationDataType(null, vdxfid);
      reader.offset = attestationData.fromDataBuffer(reader.buffer, reader.offset, vdxfid);

      this.components.set(key, attestationData);
    }

    return reader.offset;
  }

  size(): number {
    return this.components.size;
  }

  setDataFromJson(data: Array<AttestationDataType>, getSalt: Function) {

    if (!this.components) {
      this.components = new Map();
    }

    for (let i = 0; i < data.length; i++) {

      const item = data[i];

      if (!(item.salt instanceof Buffer) || item.salt.length !== 32) {
        if (typeof getSalt === "function") {
          item.salt = getSalt();
        } else {
          throw new Error("Salt is required to be a 32 random byte Buffer");
        }
      }

      try {
        fromBase58Check(item.dataItem.vdxfkey)
      } catch (e) {
        throw new Error("Attestation Key is required to be base58 format");
      }

      this.components.set(i, item);
    }

  }

  getHash(key): Buffer {

    let value: Buffer;

    value = this.components.get(key).toBuffer();

    return createHash("sha256").update(value).digest();
  }

}

export interface AttestationRequestInterfaceDataInterface {
  accepted_attestors: Array<Hash160 | string>,
  attestation_keys: Array<Hash160 | string>,
  attestor_filters?: Array<Hash160 | string>
}
export class AttestationRequest extends VDXFObject {
  data: AttestationRequestInterfaceDataInterface;

  dataByteLength(): number {

    let length = 0;
    length += varuint.encodingLength(this.data.accepted_attestors?.length ?? 0);
    length += this.data.accepted_attestors?.reduce((sum, current: Hash160) => sum + current.byteLength(), 0) ?? 0;
    length += varuint.encodingLength(this.data.attestation_keys?.length ?? 0);
    length += this.data.attestation_keys?.reduce((sum, current: Hash160) => sum + current.byteLength(), 0) ?? 0;
    length += varuint.encodingLength(this.data.attestor_filters?.length ?? 0);
    length += this.data.attestor_filters?.reduce((sum, current: Hash160) => sum + current.byteLength(), 0) ?? 0;

    return length;
  }

  toDataBuffer(): Buffer {

    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.dataByteLength()))

    writer.writeArray(this.data.accepted_attestors.map((x: Hash160) => x.toBuffer()));
    writer.writeArray(this.data.attestation_keys.map((x: Hash160) => x.toBuffer()));
    writer.writeArray(this.data.attestor_filters.map((x: Hash160) => x.toBuffer()));

    return writer.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);
    reader.readVarInt(); //skip data length

    function readHash160Array(arr: (Hash160 | string)[]): void {
      const length = reader.readVarInt();
      for (let i = 0; i < length.toNumber(); i++) {
        const member = new Hash160();
        reader.offset = member.fromBuffer(reader.buffer, false, reader.offset);
        arr.push(member);
      }
      if (length.toNumber() === 0) arr = [];
    }

    readHash160Array(this.data.accepted_attestors);
    readHash160Array(this.data.attestation_keys);
    readHash160Array(this.data.attestor_filters);
    return reader.offset;
  }

  static initializeData(data: string | AttestationRequestInterfaceDataInterface) {
    var retData;
    if (typeof data === 'object') {
      retData = {
        accepted_attestors: (data.accepted_attestors || []).map((x) => typeof x === 'string' ? Hash160.fromAddress(x) : x),
        attestation_keys: (data.attestation_keys || []).map((x) => typeof x === 'string' ? Hash160.fromAddress(x) : x),
        attestor_filters: (data.attestor_filters || []).map((x) => typeof x === 'string' ? Hash160.fromAddress(x) : x)
      }
    }
    else {
      retData = {
        accepted_attestors: [],
        attestation_keys: [],
        attestor_filters: []
      }
    }
    return retData;
  }

  toJson() {
    const { accepted_attestors, attestation_keys, attestor_filters } = this.data;
    return {
      vdxfkey: this.vdxfkey,
      data: {
        accepted_attestors: accepted_attestors?.map((x: Hash160) => x.toAddress()) || [],
        attestation_keys: attestation_keys?.map((x: Hash160) => x.toAddress()) || [],
        attestor_filters: attestor_filters?.map((x: Hash160) => x.toAddress()) || []
      }
    };
  }

}

export class Attestation extends VDXFObject {

  static TYPE_STRING = 1;
  static TYPE_BYTES = 2;
  static TYPE_BASE64 = 3;
  static TYPE_URL = 4;

  data: AttestationData;
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignature;
  mmr: CMerkleMountainRange;

  constructor(data?: {
    data?: AttestationData;
    signature?: VerusIDSignature;
    mmr?: CMerkleMountainRange;
    system_id: string,
    signing_id: string,
  }, vdxfkey: string = ATTESTATION_OBJECT.vdxfid) {
    super(vdxfkey);

    if (data) {
      this.data = data.data;
      this.signature = data.signature
      this.mmr = data.mmr;
      this.system_id = data.system_id;
      this.signing_id = data.signing_id;
    }

  }

  dataByteLength(): number {

    let byteLength = 0;

    byteLength += this.data.dataByteLength();

    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
        { signature: "" },
      );

      byteLength += _system_id.byteLength();
      byteLength += _signing_id.byteLength();
      byteLength += _signature.byteLength();

    if (this.mmr) {
      byteLength += this.mmr.getbyteLength();

    } else {
      byteLength += varuint.encodingLength(0);
    }
    return byteLength;
  }

  toDataBuffer(): Buffer {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));

    bufferWriter.writeSlice(this.data.toDataBuffer());

    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
        { signature: "" },
      );

    bufferWriter.writeSlice(_system_id.toBuffer());
    bufferWriter.writeSlice(_signing_id.toBuffer());
    bufferWriter.writeSlice(_signature.toBuffer());

    if (this.mmr) {

      bufferWriter.writeVarSlice(this.mmr.toBuffer());

    } else {
      bufferWriter.writeCompactSize(0);
    }

    return bufferWriter.buffer
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);
    const attestationsByteLength = reader.readCompactSize(); //dummy read

    if (!this.data) {
      this.data = new AttestationData();
    }

    reader.offset = this.data.fromDataBuffer(reader.buffer, reader.offset);

    this.system_id = toBase58Check(
      reader.readSlice(HASH160_BYTE_LENGTH),
      I_ADDR_VERSION
    );

    this.signing_id = toBase58Check(
      reader.readSlice(HASH160_BYTE_LENGTH),
      I_ADDR_VERSION
    );

    const _sig = new VerusIDSignature();
    reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
    this.signature = _sig;

    const leafLength = reader.readCompactSize();

    if (leafLength > 0) {
      const referenceTreeLength = reader.readCompactSize();
      const nodes = {};

      for (var i = 0; i < referenceTreeLength; i++) {

        const nodeIndex = reader.readCompactSize();
        const signature = reader.readVarSlice();
        nodes[nodeIndex] = signature;
      }

      if (Object.keys(nodes).length > 0) {
        this.mmr = new CMerkleMountainRange().fromBuffer(reader.buffer);
      }
    }

    return reader.offset;
  }

  createMMR() {

    if (!this.mmr) {
      this.mmr = new CMerkleMountainRange();
    } else {
      return this.mmr;
    }

    for (const [key, item] of this.data.components) {

      this.mmr.add(new CMMRNode(this.getHash(key)))

    }

    return this.mmr;
  }

  rootHash() {

    if (!this.mmr) {
      this.createMMR();
    }
    const view = new CMerkleMountainView(this.mmr)

    return view.GetRoot();
  }

  // returns an attestation with a sparse MMR containing the leaves specified
  getProof(keys: Array<number>): CPartialAttestationProof {

    const view = new CMerkleMountainView(this.mmr);
    const attestationItems = new AttestationData()
    const localCMMR = new CMMRProof();

    keys.forEach((key, index) => {
      view.GetProof(localCMMR, key);
      attestationItems.components.set(key, this.data.components.get(key));
    });

    const attestationAndProof = new CPartialAttestationProof({ 
      proof: localCMMR, 
      componentsArray: attestationItems,
      system_id: this.system_id,
      signing_id: this.signing_id,});

    return attestationAndProof;

  }

  async checkProof() {

    try {

      for (const [key, item] of this.data.components) {

        const hash = this.getHash(key);
        const proof = null//await this.mmr.getProof([key], null);

        if (hash !== proof) {
          throw new Error("Attestation not found in MMR");
        }
      }
    } catch (e) {
      throw new Error("Error checking MMR");
    }
  }

  getHash(key): Buffer {

    let returnBuffer: Buffer;

    returnBuffer = this.data.components.get(key).toBuffer();

    return createHash("sha256").update(returnBuffer).digest();
  }

}

export class CPartialAttestationProof extends VDXFObject {

  private EType = {
    TYPE_INVALID: 0,
    TYPE_ATTESTATION: 1,
    TYPE_LAST: 1
  }

  type: number;                         // this may represent differnt types of attestations
  proof: CMMRProof;          // proof of the attestation in the MMR
  componentsArray: AttestationData;
  system_id: string;
  signing_id: string;
  signature?: VerusIDSignature;

  constructor(data?: {
    proof?: CMMRProof;
    componentsArray?: AttestationData;
    system_id: string,
    signing_id: string,
  }, vdxfkey: string = ATTESTATION_VIEW_RESPONSE.vdxfid) {
    super(vdxfkey);
    this.type = this.EType.TYPE_ATTESTATION;
    if (data) {
      this.proof = data.proof || new CMMRProof();
      this.componentsArray = data.componentsArray || new AttestationData();
      this.system_id = data.system_id;
      this.signing_id = data.signing_id;
    }
  }

  dataByteLength(): number {

    let byteLength = 0;

    byteLength += varuint.encodingLength(this.type);
    byteLength += this.proof.dataByteLength();
    byteLength += this.componentsArray.dataByteLength();

    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
        { signature: "" },
      );

    byteLength += _system_id.byteLength();
    byteLength += _signing_id.byteLength();
    byteLength += _signature.byteLength();

    return byteLength;

  }

  toDataBuffer(): Buffer {
    const bufferWriter = new BufferWriter(Buffer.alloc(this.dataByteLength()));

    bufferWriter.writeCompactSize(this.type);
    bufferWriter.writeSlice(this.proof.toBuffer());
    bufferWriter.writeSlice(this.componentsArray.toDataBuffer());

    const _system_id = Hash160.fromAddress(this.system_id);
    const _signing_id = Hash160.fromAddress(this.signing_id);
    const _signature = this.signature
      ? this.signature
      : new VerusIDSignature(
        { signature: "" },
      );

    bufferWriter.writeSlice(_system_id.toBuffer());
    bufferWriter.writeSlice(_signing_id.toBuffer());
    bufferWriter.writeSlice(_signature.toBuffer());

    return bufferWriter.buffer;
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {

    const reader = new bufferutils.BufferReader(buffer, offset);
    const lengthOfBuffer = reader.readCompactSize(); //dummy read
    this.type = reader.readCompactSize(); 
    
    this.proof = new CMMRProof();
    reader.offset = this.proof.fromDataBuffer(reader.buffer, reader.offset);

    this.componentsArray = new AttestationData();
    reader.offset =this.componentsArray.fromDataBuffer(reader.buffer, reader.offset);

    this.system_id = toBase58Check(
      reader.readSlice(HASH160_BYTE_LENGTH),
      I_ADDR_VERSION
    );

    this.signing_id = toBase58Check(
      reader.readSlice(HASH160_BYTE_LENGTH),
      I_ADDR_VERSION
    );

    const _sig = new VerusIDSignature();
    reader.offset = _sig.fromBuffer(reader.buffer, reader.offset);
    this.signature = _sig;

    return reader.offset;
  }

  checkProof(item: number): Buffer {

    const dataHash = this.componentsArray.getHash(item)
    let currentIndex = 0;
    const component = this.componentsArray.components.get(item);

    for (let value of this.componentsArray.components.values()) {
      if (component == value) {
        return this.proof.proofSequence[currentIndex].safeCheck(dataHash);
      }
      currentIndex++;
    }

    return Buffer.allocUnsafe(32);
  }
}
