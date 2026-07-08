"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketplaceCloseOfferRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const MarketplaceCloseOfferRequestDetails_1 = require("../request/MarketplaceCloseOfferRequestDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class MarketplaceCloseOfferRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new MarketplaceCloseOfferRequestDetails_1.MarketplaceCloseOfferRequestDetails()
    }) {
        super({
            type: ordinals_1.MARKETPLACE_CLOSEOFFER_REQUEST_VDXF_ORDINAL,
            data: request.data
        }, MarketplaceCloseOfferRequestDetails_1.MarketplaceCloseOfferRequestDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new MarketplaceCloseOfferRequestDetails_1.MarketplaceCloseOfferRequestDetails();
        this.data.fromBuffer(buffer, 0);
    }
    static fromJson(details) {
        return new MarketplaceCloseOfferRequestOrdinalVDXFObject({
            data: MarketplaceCloseOfferRequestDetails_1.MarketplaceCloseOfferRequestDetails.fromJson(details.data)
        });
    }
}
exports.MarketplaceCloseOfferRequestOrdinalVDXFObject = MarketplaceCloseOfferRequestOrdinalVDXFObject;
