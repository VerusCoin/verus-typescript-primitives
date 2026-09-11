import { HexDataVdxfObject, VDXFObject } from "../..";
import bufferutils, { reverseBuffer } from "../../../utils/bufferutils";
import varuint from "../../../utils/varuint";
import { LOGIN_CONSENT_PROVISIONING_RESULT_VDXF_KEY } from "../../keys";
import { Hash160 } from "../Hash160";

export interface ProvisioningResultInterface {
  // Vdxfkey representing the result state
  state: string;

  // VDXF key of error type
  error_key?: string;

  // Error description
  error_desc?: string;

  // Identity address provisioned (if applicable)
  identity_address?: string;

  // System ID that the ID was created on
  system_id?: string;

  // Fully qualified name of created ID
  fully_qualified_name?: string;

  // Parent of created ID
  parent?: string;

  // Uri used to fetch more info about result (if applicable)
  info_uri?: string;

  // Txid of ID creation or ID transfer (if applicable)
  provisioning_txids?: Array<ProvisioningTxid>;
}

export class ProvisioningTxid extends HexDataVdxfObject {
  toDataBuffer(): Buffer {
    return reverseBuffer(super.toDataBuffer())
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    const provisioningTxidSlice = reader.readVarSlice()
    const provisioningTxidBuf = Buffer.alloc(provisioningTxidSlice.length)
    const provisioningTxidWriter = new bufferutils.BufferWriter(provisioningTxidBuf)
    provisioningTxidWriter.writeSlice(provisioningTxidSlice)
    this.data = reverseBuffer(provisioningTxidWriter.buffer).toString('hex')

    return reader.offset;
  }
}

export class ProvisioningResult extends VDXFObject {
  state: string;
  error_key?: string;
  error_desc?: string;
  identity_address?: string;
  info_uri?: string;
  provisioning_txids?: Array<ProvisioningTxid>;
  system_id?: string;
  fully_qualified_name?: string;
  parent?: string;

  constructor(
    result: ProvisioningResultInterface = { state: "" }
  ) {
    super(LOGIN_CONSENT_PROVISIONING_RESULT_VDXF_KEY.vdxfid);

    this.state = result.state
    this.error_desc = result.error_desc
    this.error_key = result.error_key
    this.identity_address = result.identity_address
    this.info_uri = result.info_uri
    this.provisioning_txids = result.provisioning_txids
      ? result.provisioning_txids.map((x) => new ProvisioningTxid(x.data, x.vdxfkey))
      : result.provisioning_txids;
    this.system_id = result.system_id
    this.fully_qualified_name = result.fully_qualified_name
    this.parent = result.parent
  }

  dataByteLength(): number {
    const stateLength = Hash160.fromAddress(this.state).byteLength()

    const errorKeyLength = this.error_key
      ? Hash160.fromAddress(this.error_key, true).byteLength()
      : Hash160.getEmpty().byteLength();

    const errorDescBuf =
      this.error_desc == null
        ? Buffer.alloc(0)
        : Buffer.from(this.error_desc, "utf-8");
    const errorDescLength =
      errorDescBuf.length + varuint.encodingLength(errorDescBuf.length);

    const idAddrLength = this.identity_address
      ? Hash160.fromAddress(this.identity_address, true).byteLength()
      : Hash160.getEmpty().byteLength();
  
    const systemIdLength = this.system_id
      ? Hash160.fromAddress(this.system_id, true).byteLength()
      : Hash160.getEmpty().byteLength();

    const nameBuf =
      this.fully_qualified_name == null
        ? Buffer.alloc(0)
        : Buffer.from(this.fully_qualified_name, "utf-8");
    const nameLength = nameBuf.length + varuint.encodingLength(nameBuf.length);

    const parentLength = this.parent
      ? Hash160.fromAddress(this.parent, true).byteLength()
      : Hash160.getEmpty().byteLength();

    const infoUriBuf = this.info_uri == null ? Buffer.alloc(0) : Buffer.from(this.info_uri, "utf-8");
    const infoUriLength =
      infoUriBuf.length + varuint.encodingLength(infoUriBuf.length);

    const _provisioning_txids = this.provisioning_txids ? this.provisioning_txids : [];

    let length = (
      stateLength +
      errorKeyLength +
      errorDescLength +
      idAddrLength +
      systemIdLength +
      nameLength +
      parentLength +
      infoUriLength
    );

    length += varuint.encodingLength(_provisioning_txids.length);
    length += _provisioning_txids.reduce(
      (sum, current) => sum + current.byteLength(),
      0
    );

    return length
  }

  toDataBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.dataByteLength()))

    writer.writeSlice(Hash160.fromAddress(this.state).toBuffer());
    
    writer.writeSlice(
      this.error_key
        ? Hash160.fromAddress(this.error_key, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );
  
    writer.writeVarSlice(this.error_desc == null ? Buffer.alloc(0) : Buffer.from(this.error_desc, "utf-8"));

    writer.writeSlice(
      this.identity_address
        ? Hash160.fromAddress(this.identity_address, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );

    writer.writeSlice(
      this.system_id
        ? Hash160.fromAddress(this.system_id, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );

    writer.writeVarSlice(this.fully_qualified_name == null ? Buffer.alloc(0) : Buffer.from(this.fully_qualified_name, "utf-8"));

    writer.writeSlice(
      this.parent
        ? Hash160.fromAddress(this.parent, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );

    writer.writeVarSlice(this.info_uri == null ? Buffer.alloc(0) : Buffer.from(this.info_uri, "utf-8"));

    const _provisioning_txids = this.provisioning_txids ? this.provisioning_txids : [];

    writer.writeArray(_provisioning_txids.map((x) => x.toBuffer()));

    return writer.buffer
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);
    const resultLength = reader.readCompactSize();

    if (resultLength == 0) {
      throw new Error("Cannot create provisioning result from empty buffer");
    } else {
      const _state = new Hash160();
      reader.offset = _state.fromBuffer(
        reader.buffer,
        false,
        reader.offset
      );
      this.state = _state.toAddress();

      const _error_key = new Hash160();
      reader.offset = _error_key.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.error_key = _error_key.toAddress();

      this.error_desc = reader.readVarSlice().toString('utf8')

      const _identity_address = new Hash160();
      reader.offset = _identity_address.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.identity_address = _identity_address.toAddress();

      const _system_id = new Hash160();
      reader.offset = _system_id.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.system_id = _system_id.toAddress();

      this.fully_qualified_name = reader.readVarSlice().toString('utf8')

      const _parent = new Hash160();
      reader.offset = _parent.fromBuffer(
        reader.buffer,
        true,
        reader.offset
      );
      this.parent = _parent.toAddress();

      this.info_uri = reader.readVarSlice().toString('utf8')

      this.provisioning_txids = [];
      const provisioningTxidLength = reader.readCompactSize();

      for (let i = 0; i < provisioningTxidLength; i++) {
        const _provisioning_txid = new ProvisioningTxid();
        reader.offset = _provisioning_txid.fromBuffer(reader.buffer, reader.offset);
        this.provisioning_txids.push(_provisioning_txid);
      }
    }

    return reader.offset;
  }

  toJson(): {} {
    return {
      vdxfkey: this.vdxfkey,
      state: this.state,
      error_key: this.error_key,
      error_desc: this.error_desc,
      identity_address: this.identity_address,
      info_uri: this.info_uri,
      provisioning_txids: this.provisioning_txids,
      system_id: this.system_id,
      parent: this.parent,
      fully_qualified_name: this.fully_qualified_name
    }
  }
}
