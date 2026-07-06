"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceMakeOfferRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const MarketplaceMakeOfferRequestDetails_1 = require("../request/MarketplaceMakeOfferRequestDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class MarketplaceMakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new MarketplaceMakeOfferRequestDetails_1.MarketplaceMakeOfferRequestDetails()
    }) {
        super({
            type: ordinals_1.MARKETPLACE_MAKEOFFER_REQUEST_VDXF_ORDINAL,
            data: request.data
        }, MarketplaceMakeOfferRequestDetails_1.MarketplaceMakeOfferRequestDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new MarketplaceMakeOfferRequestDetails_1.MarketplaceMakeOfferRequestDetails();
        this.data.fromBuffer(buffer, 0);
    }
    static fromJson(details) {
        return new MarketplaceMakeOfferRequestOrdinalVDXFObject({
            data: MarketplaceMakeOfferRequestDetails_1.MarketplaceMakeOfferRequestDetails.fromJson(details.data)
        });
    }
}
exports.MarketplaceMakeOfferRequestOrdinalVDXFObject = MarketplaceMakeOfferRequestOrdinalVDXFObject;
