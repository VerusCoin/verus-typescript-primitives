"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterIdentityRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const RegisterIdentityRequestDetails_1 = require("../request/RegisterIdentityRequestDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class RegisterIdentityRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new RegisterIdentityRequestDetails_1.RegisterIdentityRequestDetails()
    }) {
        super({
            type: ordinals_1.REGISTER_IDENTITY_REQUEST_VDXF_ORDINAL,
            data: request.data
        }, RegisterIdentityRequestDetails_1.RegisterIdentityRequestDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new RegisterIdentityRequestDetails_1.RegisterIdentityRequestDetails();
        this.data.fromBuffer(buffer, 0);
    }
    static fromJson(details) {
        return new RegisterIdentityRequestOrdinalVDXFObject({
            data: RegisterIdentityRequestDetails_1.RegisterIdentityRequestDetails.fromJson(details.data)
        });
    }
}
exports.RegisterIdentityRequestOrdinalVDXFObject = RegisterIdentityRequestOrdinalVDXFObject;
