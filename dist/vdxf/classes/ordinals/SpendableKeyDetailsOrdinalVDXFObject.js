"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpendableKeyDetailsOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const SpendableKeyDetails_1 = require("../backup/SpendableKeyDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class SpendableKeyDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new SpendableKeyDetails_1.SpendableKeyDetails()
    }) {
        super({
            type: ordinals_1.SPENDABLE_KEY_DETAILS_VDXF_ORDINAL,
            data: request.data
        }, SpendableKeyDetails_1.SpendableKeyDetails);
    }
    static fromJson(details) {
        return new SpendableKeyDetailsOrdinalVDXFObject({
            data: SpendableKeyDetails_1.SpendableKeyDetails.fromJson(details.data)
        });
    }
}
exports.SpendableKeyDetailsOrdinalVDXFObject = SpendableKeyDetailsOrdinalVDXFObject;
