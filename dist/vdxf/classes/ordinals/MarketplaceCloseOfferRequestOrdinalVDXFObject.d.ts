import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceCloseOfferRequestDetails, MarketplaceCloseOfferRequestDetailsJson } from "../request/MarketplaceCloseOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class MarketplaceCloseOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: MarketplaceCloseOfferRequestDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<MarketplaceCloseOfferRequestDetails>);
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceCloseOfferRequestDetailsJson>): MarketplaceCloseOfferRequestOrdinalVDXFObject;
}
