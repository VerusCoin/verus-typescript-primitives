import { SerializableEntityBase } from '../../utils/types/SerializableEntityBase';
import { BN } from "bn.js";
import { BigNumber } from "../../utils/types/BigNumber";
import { SerializableEntity } from "../../utils/types/SerializableEntity";
import varint from "../../utils/varint";
import varuint from "../../utils/varuint";
import bufferutils from "../../utils/bufferutils";

export type ResponseURIJson = {
  type: string;
  uri: string;
}

export class ResponseURI extends SerializableEntityBase implements SerializableEntity {
  uri: Buffer;      // utf8 uri string
  type: BigNumber;  // type of place to send response

  static TYPE_INVALID = new BN(0, 10);
  static TYPE_POST = new BN(1, 10);
  static TYPE_REDIRECT = new BN(2, 10);
  // TODO: Add TYPE_Z_ADDR_REF where response is encrypted and sent to encoded sapling address, 
  // with optional amount specified

  constructor(data?: {
    uri?: Buffer,
    type?: BigNumber
  }) {
    super();
    if (data) {
      if (data.uri != null) {
        this.uri = data.uri;
      }
  
      if (data.type != null) {
        this.type = data.type;
      }
    }
  }

  getUriString(): string {
    return this.uri.toString('utf-8');
  }

  static fromUriString(str: string, type: BigNumber = ResponseURI.TYPE_REDIRECT): ResponseURI {
    return new ResponseURI({ uri: Buffer.from(str, 'utf-8'), type });
  }

  getByteLength(): number {
    let length = 0;
    
    length += varuint.encodingLength(this.type.toNumber());

    let uriBufLen = this.uri.length;

    length += varuint.encodingLength(uriBufLen);
    length += uriBufLen;

    return length;
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.type.toNumber());
    
    writer.writeVarSlice(this.uri);

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.type = new BN(reader.readCompactSize());

    this.uri = reader.readVarSlice();

    return reader.offset;
  }

  toJson(): ResponseURIJson {
    return {
      type: this.type.toString(10),
      uri: this.getUriString()
    };
  }

  static fromJson(json: ResponseURIJson): ResponseURI {
    return new ResponseURI({
      type: new BN(json.type, 10),
      uri: Buffer.from(json.uri, 'utf-8')
    });
  }
}