import { MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceMakeOfferRequestDetails, MarketplaceMakeOfferRequestDetailsJson } from "../request/MarketplaceMakeOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class MarketplaceMakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: MarketplaceMakeOfferRequestDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<MarketplaceMakeOfferRequestDetails> = {
      data: new MarketplaceMakeOfferRequestDetails()
    }
  ) {
    super(
      {
        type: MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL,
        data: request.data
      },
      MarketplaceMakeOfferRequestDetails
    );
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new MarketplaceMakeOfferRequestDetails();
    this.data.fromBuffer(buffer, 0);
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceMakeOfferRequestDetailsJson>): MarketplaceMakeOfferRequestOrdinalVDXFObject {
    return new MarketplaceMakeOfferRequestOrdinalVDXFObject({
      data: MarketplaceMakeOfferRequestDetails.fromJson(details.data)
    })
  }
}
