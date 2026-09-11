"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityUpdateRequestOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const IdentityUpdateRequestDetails_1 = require("../identity/IdentityUpdateRequestDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class IdentityUpdateRequestOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new IdentityUpdateRequestDetails_1.IdentityUpdateRequestDetails()
    }) {
        super({
            type: ordinals_1.IDENTITY_UPDATE_REQUEST_VDXF_ORDINAL,
            data: request.data
        }, IdentityUpdateRequestDetails_1.IdentityUpdateRequestDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new IdentityUpdateRequestDetails_1.IdentityUpdateRequestDetails();
        // IdentityUpdateRequestDetails.fromBuffer has parseVdxfObjects as 3rd parameter, rootSystemName as 4th
        const consumed = this.data.fromBuffer(buffer, 0, true, rootSystemName || 'VRSC');
        if (consumed !== buffer.length) {
            throw new Error("Ordinal payload length mismatch");
        }
    }
    static fromJson(details) {
        return new IdentityUpdateRequestOrdinalVDXFObject({
            data: IdentityUpdateRequestDetails_1.IdentityUpdateRequestDetails.fromJson(details.data)
        });
    }
}
exports.IdentityUpdateRequestOrdinalVDXFObject = IdentityUpdateRequestOrdinalVDXFObject;
