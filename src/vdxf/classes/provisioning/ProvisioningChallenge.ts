import bufferutils from "../../../utils/bufferutils";
import varuint from "../../../utils/varuint";
import { LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY } from "../../keys";
import { Challenge } from "../Challenge";
import { Context } from "../Context";
import { Hash160 } from "../Hash160";

export interface ProvisioningChallengeInterface {
  // Challenge specific VDXF key
  challenge_id: string;

  // String of unix representation of date string
  created_at: number;

  // Random hash string
  salt?: string;

  // Optional name of verusid to provision
  name?: string;

  // I Address of system ID is to be created on
  system_id?: string;

  // Parent of ID to be created (I Address)
  parent?: string;

  context?: Context;
}

export class ProvisioningChallenge extends Challenge {
  name?: string;
  system_id?: string;
  parent?: string;

  constructor(
    challenge: ProvisioningChallengeInterface = { challenge_id: "", created_at: 0 }
  ) {
    super(
      {
        challenge_id: challenge.challenge_id,
        created_at: challenge.created_at,
        salt: challenge.salt,
        context: challenge.context,
      },
      LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY.vdxfid
    );

    this.name = challenge.name
    this.system_id = challenge.system_id
    this.parent = challenge.parent
  }

  dataByteLength(): number {
    const nameBuf = Buffer.from(this.name, 'utf-8')
    let length = 0

    length += nameBuf.length
    length += varuint.encodingLength(nameBuf.length)

    length += this.system_id ? Hash160.fromAddress(this.system_id, true).byteLength()
      : Hash160.getEmpty().byteLength();
    
    length += this.parent ? Hash160.fromAddress(this.parent, true).byteLength()
    : Hash160.getEmpty().byteLength();

    return super.dataByteLength() + length
  }

  toDataBuffer(): Buffer {
    const superBuf = super.toDataBuffer()
    const writer = new bufferutils.BufferWriter(superBuf, super.dataByteLength())

    writer.writeVarSlice(Buffer.from(this.name, 'utf-8'))

    writer.writeSlice(
      this.system_id
        ? Hash160.fromAddress(this.system_id, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );

    writer.writeSlice(
      this.parent
        ? Hash160.fromAddress(this.parent, true).toBuffer()
        : Hash160.getEmpty().toBuffer()
    );

    return writer.buffer
  }

  fromDataBuffer(buffer: Buffer, offset?: number): number {
    const frameReader = new bufferutils.BufferReader(buffer, offset);
    frameReader.readVarSlice();
    const bodyEnd = frameReader.offset;
    const boundedBuffer = buffer.subarray(0, bodyEnd);
    const challenge = new Challenge(undefined, LOGIN_CONSENT_PROVISIONING_CHALLENGE_VDXF_KEY.vdxfid)
    let _offset = challenge.fromDataBuffer(boundedBuffer, offset);
    const reader = new bufferutils.BufferReader(boundedBuffer, _offset)

    this.name = reader.readVarSlice().toString('utf-8')

    const _system_id = new Hash160();
    reader.offset = _system_id.fromBuffer(
      reader.buffer,
      true,
      reader.offset
    );
    this.system_id = _system_id.toAddress();

    const _parent = new Hash160();
    reader.offset = _parent.fromBuffer(
      reader.buffer,
      true,
      reader.offset
    );
    this.parent = _parent.toAddress();

    this.challenge_id = challenge.challenge_id
    this.created_at = challenge.created_at
    this.salt = challenge.salt
    this.context = challenge.context

    if (reader.offset !== bodyEnd) throw new Error("Provisioning challenge body length mismatch");
    return reader.offset
  }

  // toJson
  toJson() {
    this.validateSupportedFields();
    return {
      vdxfkey: this.vdxfkey,
      challenge_id: this.challenge_id,
      created_at: this.created_at,
      salt: this.salt,
      name: this.name,
      system_id: this.system_id,
      parent: this.parent,
      context: this.context,
      
      requested_access: undefined,
      requested_access_audience: undefined,
      subject: undefined,
      provisioning_info: undefined,
      alt_auth_factors: undefined,
      session_id: undefined,
      attestations: undefined,
      skip: undefined,
      redirect_uris: undefined
    };
  }
}
