"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppAuthorizationResponseOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
const AppAuthorizationResponseDetails_1 = require("../appauthorization/AppAuthorizationResponseDetails");
class AppAuthorizationResponseOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new AppAuthorizationResponseDetails_1.AppAuthorizationResponseDetails(),
    }) {
        super({
            type: ordinals_1.APP_AUTHORIZATION_RESPONSE_VDXF_ORDINAL,
            data: request.data,
        }, AppAuthorizationResponseDetails_1.AppAuthorizationResponseDetails);
    }
    static fromJson(details) {
        return new AppAuthorizationResponseOrdinalVDXFObject({
            data: AppAuthorizationResponseDetails_1.AppAuthorizationResponseDetails.fromJson(details.data),
        });
    }
}
exports.AppAuthorizationResponseOrdinalVDXFObject = AppAuthorizationResponseOrdinalVDXFObject;
