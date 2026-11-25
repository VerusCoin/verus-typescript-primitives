import { APP_AUTHORIZATION_REQUEST_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import {
  OrdinalVDXFObjectInterfaceTemplate,
  OrdinalVDXFObjectJsonTemplate,
} from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
import {
  AppAuthorizationRequestDetails,
  AppAuthorizationRequestDetailsJson,
} from "../appauthorization/AppAuthorizationRequestDetails";

export class AppAuthorizationRequestOrdinalVDXFObject
  extends SerializableEntityOrdinalVDXFObject
  implements SerializableDataEntity
{
  data: AppAuthorizationRequestDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<AppAuthorizationRequestDetails> = {
      data: new AppAuthorizationRequestDetails(),
    }
  ) {
    super(
      {
        type: APP_AUTHORIZATION_REQUEST_VDXF_ORDINAL,
        data: request.data,
      },
      AppAuthorizationRequestDetails
    );
  }

  static fromJson(
    details: OrdinalVDXFObjectJsonTemplate<AppAuthorizationRequestDetailsJson>
  ): AppAuthorizationRequestOrdinalVDXFObject {
    return new AppAuthorizationRequestOrdinalVDXFObject({
      data: AppAuthorizationRequestDetails.fromJson(details.data),
    });
  }
}
