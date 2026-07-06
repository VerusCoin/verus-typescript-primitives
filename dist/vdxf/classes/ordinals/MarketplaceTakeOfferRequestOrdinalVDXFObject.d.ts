import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { MarketplaceTakeOfferRequestDetails, MarketplaceTakeOfferRequestDetailsJson } from "../request/MarketplaceTakeOfferRequestDetails";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";
export declare class MarketplaceTakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
    data: MarketplaceTakeOfferRequestDetails;
    constructor(request?: OrdinalVDXFObjectInterfaceTemplate<MarketplaceTakeOfferRequestDetails>);
    fromDataBuffer(buffer: Buffer, rootSystemName?: string): void;
    static fromJson(details: OrdinalVDXFObjectJsonTemplate<MarketplaceTakeOfferRequestDetailsJson>): MarketplaceTakeOfferRequestOrdinalVDXFObject;
}
