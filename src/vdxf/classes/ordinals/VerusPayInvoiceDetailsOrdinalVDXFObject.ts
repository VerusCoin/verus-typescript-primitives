import { VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL } from "../../../constants/ordinals/ordinals";
import { VERUSPAY_VERSION_CURRENT } from "../../../constants/vdxf/veruspay";
import { SerializableDataEntity } from "../../../utils/types/SerializableEntity";
import { VerusPayInvoiceDetails, VerusPayInvoiceDetailsJson } from "../payment/VerusPayInvoiceDetails";
import { OrdinalVDXFObjectInterfaceTemplate, OrdinalVDXFObjectJsonTemplate } from "./OrdinalVDXFObject";
import { SerializableEntityOrdinalVDXFObject } from "./SerializableEntityOrdinalVDXFObject";

export class VerusPayInvoiceDetailsOrdinalVDXFObject extends SerializableEntityOrdinalVDXFObject implements SerializableDataEntity {
  data: VerusPayInvoiceDetails;

  constructor(
    request: OrdinalVDXFObjectInterfaceTemplate<VerusPayInvoiceDetails> = {
      data: new VerusPayInvoiceDetails()
    }
  ) {
    super(
      {
        type: VERUSPAY_INVOICE_DETAILS_VDXF_ORDINAL,
        data: request.data
      },
      VerusPayInvoiceDetails
    );
  }

  fromDataBuffer(buffer: Buffer, rootSystemName?: string): void {
    this.data = new VerusPayInvoiceDetails();
    // VerusPayInvoiceDetails.fromBuffer has verusPayVersion as 3rd parameter, rootSystemName as 4th
    const consumed = this.data.fromBuffer(buffer, 0, VERUSPAY_VERSION_CURRENT, rootSystemName || 'VRSC');
    if (consumed !== buffer.length) {
      throw new Error("Ordinal payload length mismatch");
    }
  }

  static fromJson(details: OrdinalVDXFObjectJsonTemplate<VerusPayInvoiceDetailsJson>): VerusPayInvoiceDetailsOrdinalVDXFObject {
    return new VerusPayInvoiceDetailsOrdinalVDXFObject({
      data: VerusPayInvoiceDetails.fromJson(details.data)
    })
  }
}
