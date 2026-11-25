"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthorizationRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
const AppAuthorizationRequestDetails_1 = require("../appauthorization/AppAuthorizationRequestDetails");
class AppAuthorizationRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new AppAuthorizationRequestDetails_1.AppAuthorizationRequestDetails(),
    }) {
        super({
            type: ordinals_1.APP_AUTHORIZATION_REQUEST_VDXF_ORDINAL,
            data: request.data,
        }, AppAuthorizationRequestDetails_1.AppAuthorizationRequestDetails);
    }
    static fromJson(details) {
        return new AppAuthorizationRequestOrdinalVDXFObject({
            data: AppAuthorizationRequestDetails_1.AppAuthorizationRequestDetails.fromJson(details.data),
        });
    }
}
exports.AppAuthorizationRequestOrdinalVDXFObject = AppAuthorizationRequestOrdinalVDXFObject;
