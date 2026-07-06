import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceMakeOfferRequestDetails, MarketplaceMakeOfferRequestDetailsJson } from "../request/MarketplaceMakeOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class MarketplaceMakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: MarketplaceMakeOfferRequestDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<MarketplaceMakeOfferRequestDetails>);
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceMakeOfferRequestDetailsJson>): MarketplaceMakeOfferRequestOrdinalVDXFObject;
}
