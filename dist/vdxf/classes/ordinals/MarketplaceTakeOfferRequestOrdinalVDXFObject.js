"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceTakeOfferRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const MarketplaceTakeOfferRequestDetails_1 = require("../request/MarketplaceTakeOfferRequestDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class MarketplaceTakeOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new MarketplaceTakeOfferRequestDetails_1.MarketplaceTakeOfferRequestDetails()
    }) {
        super({
            type: ordinals_1.MARKETPLACE_TAKEOFFER_REQUEST_VDXF_ORDINAL,
            data: request.data
        }, MarketplaceTakeOfferRequestDetails_1.MarketplaceTakeOfferRequestDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new MarketplaceTakeOfferRequestDetails_1.MarketplaceTakeOfferRequestDetails();
        this.data.fromBuffer(buffer, 0);
    }
    static fromJson(details) {
        return new MarketplaceTakeOfferRequestOrdinalVDXFObject({
            data: MarketplaceTakeOfferRequestDetails_1.MarketplaceTakeOfferRequestDetails.fromJson(details.data)
        });
    }
}
exports.MarketplaceTakeOfferRequestOrdinalVDXFObject = MarketplaceTakeOfferRequestOrdinalVDXFObject;
