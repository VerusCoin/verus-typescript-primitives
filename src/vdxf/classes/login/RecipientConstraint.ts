import { SerializableEntityBase } from '../../../utils/types/SerializableEntityBase';
import bufferutils from "../../../utils/bufferutils";
import { SerializableEntity } from "../../../utils/types/SerializableEntity";
import varuint from "../../../utils/varuint";
import { CompactAddressObject, CompactAddressObjectJson, CompactIAddressObject } from "../CompactAddressObject";

export interface RecipientConstraintJson {
  type: number;
  identity: CompactAddressObjectJson;
}

export interface RecipientConstraintInterface {
  type: number;
  identity: CompactIAddressObject;
}

export class RecipientConstraint extends SerializableEntityBase implements SerializableEntity {
  type: number;
  identity: CompactIAddressObject;

  // Recipient Constraint Types - What types of Identity can login, e.g. REQUIRED_SYSTEM and "VRSC" means only identities on the Verus chain can login
  static REQUIRED_ID = 1;
  static REQUIRED_SYSTEM = 2;
  static REQUIRED_PARENT = 3;

  constructor(data?: RecipientConstraintInterface) {
    super();
    this.type = data?.type ?? 0;
    this.identity = data?.identity || new CompactIAddressObject();
  }

  static fromData(data: RecipientConstraint | RecipientConstraintInterface): RecipientConstraint {
    if (data instanceof RecipientConstraint) {
      return data;
    }

    return new RecipientConstraint({
      type: data.type,
      identity: data.identity,
    });
  }

  getByteLength(): number {
    return varuint.encodingLength(this.type) + this.identity.getByteLength();
  }

  toBuffer(): Buffer {
    const writer = new bufferutils.BufferWriter(Buffer.alloc(this.getByteLength()));

    writer.writeCompactSize(this.type);
    writer.writeSlice(this.identity.toBuffer());

    return writer.buffer;
  }

  fromBuffer(buffer: Buffer, offset?: number, rootSystemName: string = 'VRSC'): number {
    const reader = new bufferutils.BufferReader(buffer, offset);

    this.type = reader.readCompactSize();
    this.identity = new CompactIAddressObject({ type: CompactIAddressObject.TYPE_I_ADDRESS, address: '', rootSystemName });
    reader.offset = this.identity.fromBuffer(reader.buffer, reader.offset);

    return reader.offset;
  }

  toJson(): RecipientConstraintJson {
    return {
      type: this.type,
      identity: this.identity.toJson(),
    };
  }

  static fromJson(data: RecipientConstraintJson): RecipientConstraint {
    return new RecipientConstraint({
      type: data.type,
      identity: CompactIAddressObject.fromCompactAddressObjectJson(data.identity),
    });
  }

  static requiredIDFromAddress(iaddr: string): RecipientConstraint {
    return new RecipientConstraint({
      type: RecipientConstraint.REQUIRED_ID,
      identity: CompactIAddressObject.fromAddress(iaddr),
    });
  }

  static requiredSystemFromAddress(iaddr: string): RecipientConstraint {
    return new RecipientConstraint({
      type: RecipientConstraint.REQUIRED_SYSTEM,
      identity: CompactIAddressObject.fromAddress(iaddr),
    });
  }

  static requiredParentFromAddress(iaddr: string): RecipientConstraint {
    return new RecipientConstraint({
      type: RecipientConstraint.REQUIRED_PARENT,
      identity: CompactIAddressObject.fromAddress(iaddr),
    });
  }

  static requiredSystemFromFQN(fqn: string, rootSystemName: string = "VRSC"): RecipientConstraint {
    return new RecipientConstraint({
      type: RecipientConstraint.REQUIRED_SYSTEM,
      identity: new CompactIAddressObject({
        type: CompactAddressObject.TYPE_FQN,
        address: fqn,
        rootSystemName: rootSystemName
      }),
    });
  }

  static requiredParentFromFQN(fqn: string, rootSystemName: string = "VRSC"): RecipientConstraint {
    return new RecipientConstraint({
      type: RecipientConstraint.REQUIRED_PARENT,
      identity: new CompactIAddressObject({
        type: CompactAddressObject.TYPE_FQN,
        address: fqn,
        rootSystemName: rootSystemName
      }),
    });
  }
}
