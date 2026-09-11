"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerusPayInvoiceDetailsOrdinalVDXFObject = void 0;
const ordinals_1 = require("../../../constants/ordinals/ordinals");
const veruspay_1 = require("../../../constants/vdxf/veruspay");
const VerusPayInvoiceDetails_1 = require("../payment/VerusPayInvoiceDetails");
const SerializableEntityOrdinalVDXFObject_1 = require("./SerializableEntityOrdinalVDXFObject");
class VerusPayInvoiceDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject_1.SerializableEntityOrdinalVDXFObject {
    constructor(request = {
        data: new VerusPayInvoiceDetails_1.VerusPayInvoiceDetails()
    }) {
        super({
            type: ordinals_1.VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL,
            data: request.data
        }, VerusPayInvoiceDetails_1.VerusPayInvoiceDetails);
    }
    fromDataBuffer(buffer, rootSystemName) {
        this.data = new VerusPayInvoiceDetails_1.VerusPayInvoiceDetails();
        // VerusPayInvoiceDetails.fromBuffer has verusPayVersion as 3rd parameter, rootSystemName as 4th
        const consumed = this.data.fromBuffer(buffer, 0, veruspay_1.VERUSPAY_VERSION_CURRENT, rootSystemName || 'VRSC');
        if (consumed !== buffer.length) {
            throw new Error("Ordinal payload length mismatch");
        }
    }
    static fromJson(details) {
        return new VerusPayInvoiceDetailsOrdinalVDXFObject({
            data: VerusPayInvoiceDetails_1.VerusPayInvoiceDetails.fromJson(details.data)
        });
    }
}
exports.VerusPayInvoiceDetailsOrdinalVDXFObject = VerusPayInvoiceDetailsOrdinalVDXFObject;
