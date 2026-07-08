import { MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceCloseOfferRequestDetails, MarketplaceCloseOfferRequestDetailsJson } from "../request/MarketplaceCloseOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class MarketplaceCloseOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: MarketplaceCloseOfferRequestDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<MarketplaceCloseOfferRequestDetails> = {
      data: new MarketplaceCloseOfferRequestDetails()
    }
  ) {
    super(
      {
        type: MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL,
        data: request.data
      },
      MarketplaceCloseOfferRequestDetails
    );
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new MarketplaceCloseOfferRequestDetails();
    this.data.fromBuffer(buffer, 0);
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceCloseOfferRequestDetailsJson>): MarketplaceCloseOfferRequestOrdinalVDXFObject {
    return new MarketplaceCloseOfferRequestOrdinalVDXFObject({
      data: MarketplaceCloseOfferRequestDetails.fromJson(details.data)
    })
  }
}
