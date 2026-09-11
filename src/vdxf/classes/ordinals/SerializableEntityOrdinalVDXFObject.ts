import { OrdinalVDXFObjectReservedData } from "../../../constants/ordinals/types";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObject, OrdinalVDXFObjectDataClass, OrdinalVDXFObjectInterfaceTemplate } from "./OrdinalVDXFObject";

export class SerializableEntityOrdinalVDXFObject extends OrdinalVDXFObject implements SerializableDataEntity {
  data: OrdinalVDXFObjectReservedData;
  entity: OrdinalVDXFObjectDataClass;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<OrdinalVDXFObjectReservedData>,
    entity: OrdinalVDXFObjectDataClass
  ) {
    if (!request || !request.type) throw new Error("Expected request with data and type")

    super({
      type: request.type
    });

    this.entity = entity;
    this.data = request.data ? request.data : new entity();
  }

  getDataByteLength(): number {
    return this.data.getByteLength()
  }

  toDataBuffer(): Buffer {
    return this.data.toBuffer();
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new this.entity();
    // Type cast needed because different Details classes have rootSystemName in different parameter positions
    const consumed = (this.data as any).fromBuffer(buffer, 0, rootSystemName);
    if (consumed !== buffer.length) {
      throw new Error("Ordinal payload length mismatch");
    }
  }
}
