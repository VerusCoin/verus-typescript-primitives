import { REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { RegisterIdentityRequestDetails, RegisterIdentityRequestDetailsJson } from "../request/RegisterIdentityRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class RegisterIdentityRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: RegisterIdentityRequestDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<RegisterIdentityRequestDetails> = {
      data: new RegisterIdentityRequestDetails()
    }
  ) {
    super(
      {
        type: REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL,
        data: request.data
      },
      RegisterIdentityRequestDetails
    );
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new RegisterIdentityRequestDetails();
    this.data.fromBuffer(buffer, 0);
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<RegisterIdentityRequestDetailsJson>): RegisterIdentityRequestOrdinalVDXFObject {
    return new RegisterIdentityRequestOrdinalVDXFObject({
      data: RegisterIdentityRequestDetails.fromJson(details.data)
    })
  }
}
