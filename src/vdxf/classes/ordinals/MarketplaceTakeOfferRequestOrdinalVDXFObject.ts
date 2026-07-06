import { MARKETPLACE_TAKEOFFER_REQUEST_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceTakeOfferRequestDetails, MarketplaceTakeOfferRequestDetailsJson } from "../request/MarketplaceTakeOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class MarketplaceTakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: MarketplaceTakeOfferRequestDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<MarketplaceTakeOfferRequestDetails> = {
      data: new MarketplaceTakeOfferRequestDetails()
    }
  ) {
    super(
      {
        type: MARKETPLACE_TAKEOFFER_REQUEST_VDXF_ORDINAL,
        data: request.data
      },
      MarketplaceTakeOfferRequestDetails
    );
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new MarketplaceTakeOfferRequestDetails();
    this.data.fromBuffer(buffer, 0);
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceTakeOfferRequestDetailsJson>): MarketplaceTakeOfferRequestOrdinalVDXFObject {
    return new MarketplaceTakeOfferRequestOrdinalVDXFObject({
      data: MarketplaceTakeOfferRequestDetails.fromJson(details.data)
    })
  }
}
