import { APP_AUTHORIZATION_RESPONSE_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import {
  OrdinalVDXFObjectInterfaceTemplate,
  OrdinalVDXFObjectJsonTemplate,
} from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
import {
  AppAuthorizationResponseDetails,
  AppAuthorizationResponseDetailsJson,
} from "../appauthorization/AppAuthorizationResponseDetails";

export class AppAuthorizationResponseOrdinalVDXFObject
  extends SerializableEntityOrdinalVDXFObject
  implements SerializableDataEntity
{
  data: AppAuthorizationResponseDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<AppAuthorizationResponseDetails> = {
      data: new AppAuthorizationResponseDetails(),
    }
  ) {
    super(
      {
        type: APP_AUTHORIZATION_RESPONSE_VDXF_ORDINAL,
        data: request.data,
      },
      AppAuthorizationResponseDetails
    );
  }

  static fromJson(
    details: OrdinalVDXFObjectJsonTemplate<AppAuthorizationResponseDetailsJson>
  ): AppAuthorizationResponseOrdinalVDXFObject {
    return new AppAuthorizationResponseOrdinalVDXFObject({
      data: AppAuthorizationResponseDetails.fromJson(details.data),
    });
  }
}
