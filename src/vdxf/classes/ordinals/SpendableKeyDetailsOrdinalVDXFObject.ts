import { SPENDABLE_KEY_DETAILS_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { SpendableKeyDetails, SpendableKeyDetailsJson } from "../backup/SpendableKeyDetails";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class SpendableKeyDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: SpendableKeyDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<SpendableKeyDetails> = {
      data: new SpendableKeyDetails()
    }
  ) {
    super(
      {
        type: SPENDABLE_KEY_DETAILS_VDXF_ORDINAL,
        data: request.data
      },
      SpendableKeyDetails
    );
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<SpendableKeyDetailsJson>): SpendableKeyDetailsOrdinalVDXFObject {
    return new SpendableKeyDetailsOrdinalVDXFObject({
      data: SpendableKeyDetails.fromJson(details.data)
    });
  }
}
